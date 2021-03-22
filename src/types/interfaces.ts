import { Socket } from 'socket.io'

export interface Message {
  message: string
  username: string
  encrypted: boolean
  room: string
  id: string
}

export interface ExtendedSocket extends Socket {
  room: string
}
