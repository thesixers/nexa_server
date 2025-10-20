import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Users from "./model/user.js";
import generateOtp from "./middlewares/generateOtp.js";
import Temp from "./model/tempUser.js";
import { sendOtp, sendPhoneOtp } from "./middlewares/mail.js";
import {
  createToken,
  getFutureTime,
  isCurrentTimeGreater,
  tokenVeryifyMiddleware,
  verifyToken,
} from "./middlewares/all.js";
import { dbConnect } from "./mongodb.js";
import PhoneOTP from "./model/phoneOtp.js";
import { connectedUsers, disconnectUser, signalHandler } from "./controllers/ws_controller.js";
import { connect } from "http2";

const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = new Map(); 
const users = new Map();
const phones = new Map(); //phone number to nexaId map
/* remember to check and authenticate user token for each request */
/* also note the person is not calling his/her self */

dbConnect();

app.use(express.json());

io.on("connection", (socket) => {
  socket.on("register", async ({ nexaId }) => {
    connectedUsers(socket, onlineUsers, Users, nexaId);
  });

  socket.on("signal", ({ to, from, signal, streamType }) => {
   signalHandler(to, from, signal, streamType, io, onlineUsers, phones);
  });

  socket.on("disconnect", () => {
    disconnectUser(socket, onlineUsers);
  });
}); 

// SIGN IN WITH GOOGLE
app.post("/nexa/api/google/signin", async (req, res) => {
  console.log("req came in");
  let { username, fullName, nexaId, avatar } = req.body;
  try {
    let user = await Users.findOne({ nexaId });

    if (!user)
      user = await Users.create({ username, fullName, nexaId, avatar });

    const token = createToken(user.id);
    return res.status(200).json({ user, token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ E: error.message });
  }
});

app.post("/nexa/api/email/otp", async (req, res) => {
  console.log(req.body);
  let { email } = req.body;

  try {
    // generate otp
    let otp = generateOtp();
    let otpExpiry = getFutureTime();
    let tempUser = await Temp.findOne({ email });
    if (!tempUser) {
      await Temp.create({ email, otp, otpexp: otpExpiry });
    } else {
      tempUser.otp = otp;
      tempUser.otpexp = otpExpiry;
      await tempUser.save();
    }
    console.log(otp);
    sendOtp({ email, otp });
    return res.status(200).json({ M: "OTP sent to your email" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ E: error.message });
  }
});

app.post("/nexa/api/email/signin", async (req, res) => {
  let { otp, username, fullName, nexaId, avatar } = req.body;

  try {
    let tempUser = await Temp.findOne({ email: nexaId });

    if (!tempUser) return res.status(404).json({ E: "User not found" });

    if (tempUser.otp !== otp)
      return res.status(401).json({ E: "Incorrect OTP" });

    if (isCurrentTimeGreater(tempUser.otpexp))
      return res.status(401).json({ E: "OTP expired" });

    // generate auth token
    let token = createToken(tempUser.id);
    await Temp.deleteOne({ email: nexaId });
    let user = await Users.findOne({ nexaId });
    if (!user) {
      user = await Users.create({ username, fullName, nexaId, avatar });
    }
    return res.status(200).json({ user, token });
  } catch (error) {
    console.log(error.message);
  }
}); 

// GET USER  DATA
app.get("/nexa/api/user/:nexaId", tokenVeryifyMiddleware, async (req, res) => {
  const nexaId = req.params.nexaId;

  let user = await Users.findOne({ nexaId });
  if (!user) return res.status(404).json({ E: "User not found" });

  res.status(200).json({ user });
});

// ADDING NEW NUMBER
// OTP
app.post("/nexa/api/number/otp", tokenVeryifyMiddleware, async (req, res) => {
  let { fullNumber: phoneNumber, nexaId } = req.body;

  try {
    // generate otp
    let otp = generateOtp();
    let otpExpiry = getFutureTime();

    // store otp for confirmation
    let tempUser = await PhoneOTP.findOne({ phoneNumber, nexaId });
    if (!tempUser) {
      await PhoneOTP.create({ phoneNumber, otp, otpexp: otpExpiry, nexaId });
    } else {
      await PhoneOTP.updateOne(
        { phoneNumber, nexaId },
        { otp, otpexp: otpExpiry }
      );
    }
    // send otp to user
    sendPhoneOtp({ phoneNumber, otp });

    // send response back to user
    return res.status(200).json({ M: "OTP sent to your number" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ E: "Something went wrong, request for otp again" });
  }
});

// ADD NUMBER
app.post("/nexa/api/number/add", tokenVeryifyMiddleware, async (req, res) => {
  let { fullNumber, nexaId, otp } = req.body;
  
  //  verify otp
  try {
    let OTP = await PhoneOTP.findOne({ phoneNumber: fullNumber, nexaId });
    if (!OTP) return res.status(404).json({ E: "OTP not found" });
    if (OTP?.otp !== otp) return res.status(400).json({ E: "Incorrect otp" });
    // get current date
    let currentDate = new Date();
    if (OTP.otpexp > currentDate)
      return res.status(401).json({ E: "OTP expired" });

     let user = await Users.findOneAndUpdate(
      { nexaId },
      { $push: { phones: fullNumber } },
      { new: true }
    );

    if (!user) return res.status(404).json({ E: "User not found" });

    // delete otp after successful verification
    await PhoneOTP.deleteOne({ phoneNumber: fullNumber, nexaId, otp });

    // send response.
    return res.status(200).json({ user, M: "Number added successfully" });
  } catch (error) {
    console.log(error);
  }
});

// REMOVE NUMBER
app.put("/nexa/api/number/remove", tokenVeryifyMiddleware, async (req, res) => {
  let { phoneNumber, nexaId } = req.body;
  try {
    let user = await Users.findOneAndUpdate(
      { nexaId },
      { $pull: { phones: phoneNumber } },
      { new: true }
    );
    if (!user) return res.status(404).json({ E: "User not found" });
    return res.status(200).json({ user, M: "Number removed successfully" });
  } catch (error) {
    return res.status(500).json({ E: "Internal Server Error" });
  }
})


app.put("/nexa/api/user/update/:nexaId", tokenVeryifyMiddleware, async (req, res) => {
  let { nexaId } = req.params;
  try {
    let updatedUser = await Users.findOneAndUpdate(
      { nexaId },
      { ...req.body },
      { new: true }
    )

    if(!updatedUser) return res.status(404).json({ E: "User not found" });
    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    return res.status(500).json({ E: "Internal Server Error" });
  }
});


server.listen(5000, () => {
  console.log("Server running on port 5000");
});
