const express = require('express')
const path = require('path')
const http = require('http') 
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/message')
const {addUser, removeUser, getUser, getUserInRoom} = require('./utils/users')

const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000

const app = new express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket)=>{
    console.log('Connection established.')
    
    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({
            id : socket.id,
            username,
            room
        })

        if(error)
        {
            return callback(error)
        }
        
        socket.join(user.room)
        io.to(user.room).emit('roomData', {
            room : user.room,
            users: getUserInRoom(user.room)
        })
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has entered the chat`))
        callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const filter = new Filter()

        if(filter.isProfane(message))
        {
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id)
        if(user)
        {
            io.to(user.room).emit('message', generateMessage(user.username, message))
        }
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user)
        {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the chat.`))
            io.to(user.room).emit('roomData', {
                room : user.room,
                users: getUserInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', (coords, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})

server.listen(port, ()=>{
    console.log(`Service is running at port ${port}`)
})