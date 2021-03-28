import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import http from 'http'
import { Message } from './types/interfaces'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve('.env') })

// Declare servers
const app = express()
const server = http.createServer(app)
const io = new Server(server)

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Serving static
app.use(express.static(path.join(__dirname, 'public')))

// Socket
io.on('connection', (socket) => {
  socket.on('create_room', async (data) => {
    // Leaves initial room
    socket.leave(socket.id)

    // Gets new room member count
    const members = await socket.to(data.room_ID).allSockets()

    if (members.size < 2) {
      // Connects to slug based room
      socket.join(data.room_ID)

      socket.broadcast.to(data.room_ID).emit('message', {
        username: data.username,
        message: 'A user has connected.',
        encrypted: false,
        verified: true,
        event: 'partner connected',
        id: 5002,
      })
    } else if (members.size >= 2) {
      // Emits event to redirect to random room and reload on client side.
      socket.emit('roomFullRedirect')
    }
    // Emit room member count
    io.to(data.room_ID).emit('changeCount', {
      count: io.sockets.adapter.rooms.get(data.room_ID)?.size,
    })
  })

  // Confirmation message for self on successful connection
  socket.emit('message', {
    username: 'Bot',
    message: 'Connected!',
    encrypted: false,
    verified: true,
    id: 5001,
    event: 'connected',
  })

  // Sends message and updates count on user disconnect
  socket.on('disconnecting', () => {
    const room = socket.rooms.values().next().value

    io.to(room).emit('message', {
      username: 'Bot',
      message: 'A user has disconnected.',
      encrypted: false,
      event: 'partner disconnected',
      id: 5003,
    })

    // Get room member count and emit
    const roomMembers: any = io.sockets.adapter.rooms.get(room)?.size

    io.to(room).emit('changeCount', { count: roomMembers - 1 })
  })

  // Listens for incoming messages
  socket.on('message', (data: Message) => {
    //Sends error message if user emits a message to a room which they are not in.
    if (socket.rooms.values().next().value != data.room) {
      socket.emit('message', {
        username: 'Bot',
        message: 'Message not sent, reload or close the page.',
        encrypted: false,
        event: 'partner disconnected',
        id: 5004,
      })
      return
    }

    io.to(data.room).emit('message', data)
  })
})

// Server listening
server.listen(process.env.PORT, () => {
  console.log('Listening on port: ' + process.env.PORT)
})
