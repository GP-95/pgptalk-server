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
  // Send message to client on connection.
  socket.emit('message', { username: 'Bot', message: 'Connected!' })
})

// Server listening
server.listen(process.env.PORT, () => {
  console.log('Listening on port: ' + process.env.PORT)
})
