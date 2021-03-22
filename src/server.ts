import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { Server } from 'socket.io'
import cors from 'cors'
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
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Serving static
app.use(express.static(path.join(__dirname, 'public')))

// Socket
io.on('connection', (socket) => {
  socket.on('create_room', async (data) => {
    // Leaves initial room
    socket.leave(socket.id)

    // Checks room member count
    const members = await socket.to(data.room_ID).allSockets()
    if (members.size < 2) {
      // Connects to slug based room
      socket.join(data.room_ID)
    } else if (members.size >= 2) {
      // Emits event to redirect to random room and reload on client side.
      socket.emit('roomFullRedirect')
    }

    // socket.room = data.room_ID

    // socket.to(socket.room).emit('message', {
    //   //Works, but send msg to everyone :(
    //   username: 'Bot',
    //   message: 'A user has connected.',
    //   encrypted: false,
    //   event: 'partner connected',
    //   id: 5002,
    // })
  })

  // Confirmation message for self on successful connection
  socket.emit('message', {
    username: 'Bot',
    message: 'Connected!',
    encrypted: false,
    id: 5001,
    event: 'connected',
  })

  // Sends message to partner on user disconnect
  socket.on('disconnecting', () => {
    const room = socket.rooms.values().next().value
    io.to(room).emit('message', {
      username: 'Bot',
      message: 'A user has disconnected.',
      encrypted: false,
      event: 'partner disconnected',
      id: 5003,
    })
  })

  // Listens for incoming messages
  socket.on('message', (data: Message) => {
    //Sends error message if user emits a message to a room which they are not in.
    if (socket.rooms.values().next().value != data.room) {
      socket.emit('message', {
        username: 'Bot',
        message: 'Message not sent, please close the tab.',
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
