// import express from 'express'
// import http from 'http'
// import { Server } from 'socket.io'
// import cors from 'cors'

// const app = express()
// const server = http.createServer(app)
// app.use(cors())

// const io = new Server(server, {
//     cors:{
//         origin: "http://localhost:5173",
//         methods: ["GET", "POST"]
//     }
// })

// io.on('connection', (socket) => {
//     // socket.id = socket.handshake.query.user
//     console.log(`User connected ${socket.id}`);

//     socket.on('sendMessage', ({message}) => {
//         socket.broadcast.emit('receiveMessage', message)
//     })

//     socket.on('joinRoom', (data) => {
//         socket.join(data);
//     })

//     socket.on('sendMessageToRoom', (data) => {
//         socket.to(data.room).emit('receiveMessage', data)
//     })
// })


// server.listen(3000, ()=> {
//     console.log('server is running on port 3000');
// })


import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Users from './model/user.js';
import generateOtp from './middlewares/generateOtp.js';


const app = express();
const server = http.createServer(app);
app.use(cors())

const users = {}

const io = new Server(server, {
    cors:{
        origin: "http://localhost:6969",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    socket.id = socket.handshake.query.userNo;
    console.log(`a new user just connected ${socket.id}`);
    if(!users[socket.id]){
        users[socket.id] = socket.id;
    }

    socket.emit("yourID", socket.id)
    socket.emit("allUsers", users)

    socket.on('disconnect', () => {
        delete users[socket.id]
    })

    socket.on('callUser', ({ userToCall, signal, from }) => {
        console.log(`user ${from} is calling ${userToCall}`);
        io.to(userToCall).emit('incomingCall', { signal: signal, from: from });
    });

    socket.on('ringing', ({caller, status}) => {
      io.to(caller).emit('ringing', status);
    });

    socket.on('answerCall', ({ signal, to }) => {
      io.to(to).emit('callAccepted', signal);
    });

  socket.on('endCall', (to)=>{
    console.log('ending call'+ to);
    io.to(to).emit('endCall')
  });

});

app.post('/nexa/acc/signin/checkno', async (req,res) => {
  let { phoneNo } = req.body;
  
  //a. check if user exists
  //ai if true generate login otp and send to the number and return the isUserExist to true
  // aii if not generate login otp and send to the number and return the isUserExist to false

  try {
    let user = await Users.findOne({phoneNo});
    let isUserExist = !user ? false : true;
    let otp = generateOtp();
    // function to send otp to users phone

    res.status(200).json({isUserExist})
    
  } catch (err) {
    console.log(err.message);
  }
})


server.listen(5000, () => {
  console.log('Server running on port 5000');
});
