import express from "express"
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Users from './model/user.js';
import generateOtp from './middlewares/generateOtp.js';
import Temp from './model/tempUser.js';
import { sendOtp } from './middlewares/mail.js';
import { createToken, getFutureTime, isCurrentTimeGreater, verifyToken } from './middlewares/all.js';
import { dbConnect } from './mongodb.js';

const app = express()
const server = http.createServer(app);
app.use(cors()) 


const io = new Server(server, {
    cors:{
        origin: "*"
    }
}); 


const users = new Map()

dbConnect()


app.use(express.json()); 

io.on('connection', (socket) => {
    socket.on("register", ({phoneNumber}) => {
      console.log(socket.id + " is connected with phonenumber: " + phoneNumber);
        let isUserOnline = users.has(phoneNumber)
        if(!isUserOnline) users.set(phoneNumber, socket.id);
        console.log(users);
    })


    socket.on('disconnect', () => {
      console.log(`user ${socket.id} has gone offline`);
      users.keys().forEach(key => {
        if(users.get(key) === socket.id) users.delete(key);
      })
    })

    socket.on('signal', ({ to, from, signal, calltype }) => {
        console.log(`user ${from} is calling ${to}`);
        let isCalleOnline = users.get(to);
        if(isCalleOnline){
          // let {phoneNo, name} = Users.findOne({phoneNo: from});
          io.to(isCalleOnline).emit('signal', { signal, from: users.get(from), calltype, callerDetails: {} });
        }
        // else
        // io.to(users.get(from)).emit('callernotonline', { signal, from: users.get(from), calltype });
    });

    socket.on('endcall', ({ to, from }) => {
      io.to(users.get(to)).emit("endcall", {from: users.get(from)});
    });

  socket.on('holdcall', ({to, from})=>{
    io.to(users.get(to)).emit('holdcall', {from: users.get(from)})
  });

  socket.on('resumecall', ({to, from})=>{
    io.to(users.get(to)).emit('resumecall', {from: users.get(from)})
  });


});

// SIGN IN WITH EMAIL
app.post('/nexa/api/email/signin', async (req,res) => {
  console.log("req came in");
  let {username, fullName, nexaId, avatar} = req.body;
  try {
    
    const User = await Users.findOne({nexaId});
    
    if(!User){
      const user = await Users.create({username, fullName, nexaId, avatar})
      let { contact, callHistory, blockedUsers, nexaId, avatar, username } = user;
      console.log({ contact, callHistory, blockedUsers, nexaId, avatar, username }); 
      // create a jwt for the user
      const token = createToken(user.id)
      
      res.status(200).json({user: {nexaId, avatar, username}, token, contact, callHistory, blockedUsers})
    }else{
      let { contact, callHistory, blockedUsers, nexaId, avatar, username } = User;
      console.log({ contact, callHistory, blockedUsers, nexaId, avatar, username }); 

      // create a jwt for the user
      const token = createToken(User.id)
      res.status(200).json({user: {nexaId, avatar, username}, token, contact, callHistory, blockedUsers})
    }
  } catch (error) {
    console.log(error);
  }
  
});

// GET USER  DATA
app.get('/nexa/api/user/:id', async (req,res) => {
  let nexaId = req.params.id;
  let token = req.headers['authorization'];
  
  let isTokenValid = verifyToken(token);
  if(!isTokenValid) return res.status(401).json({E: 'Invalid token'});
  
  let user = await Users.findOne({nexaId});
  if(!user) return res.status(404).json({E: 'User not found'});
  
  res.status(200).json({user})
})


server.listen(5000, () => {
  console.log('Server running on port 5000');
});
