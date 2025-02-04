import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const server = http.createServer(app)
app.use(cors())

const io = new Server(server, {
    cors:{
        origin: "https://web-chat-app-o7f3.onrender.com",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    // socket.id = socket.handshake.query.user
    console.log(`User connected ${socket.id}`);

    socket.on('sendMessage', ({message}) => {
        socket.broadcast.emit('receiveMessage', message)
    })

    socket.on('joinRoom', (data) => {
        socket.join(data);
    })

    socket.on('sendMessageToRoom', (data) => {
        socket.to(data.room).emit('receiveMessage', data)
    })
})


server.listen(3000, ()=> {
    console.log('server is running on port 3000');
})