import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import type { IAnswerCall } from './interfaces/IAnswerCall';
import type { ICallUser } from './interfaces/ICallUser';
import type { IRegUser } from './interfaces/IRegUser';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());

app.get('/', (_, response) => {
  return response.json({
    message: 'Server is running'
  });
});

io.on('connection', socket => {
  // print socket.ip and port
  console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' + ' connection');
  socket.emit('me', { socketId: socket.id });

  socket.on('disconnect', () => {
    console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' + ' disconnected');
    // for each of socket.rooms, leave()
    socket.rooms.forEach(room => {
      socket.to(room).emit('leavecall', socket.id);
      console.log('leavecall to room: ' + room);
      socket.leave(room);
      // io.to(room).emit('leavecall', socket.id);
    });
    // socket.broadcast.emit('callended');
  });

  socket.on('reguser', ({ name }: IRegUser) => {
    console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' + ' reguser(joinroom): ' + name);
    socket.join(name);
  });

  socket.on('calluser', ({ userToCall, signalData, from, name }: ICallUser) => {
    console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' +
      ' calluser: ' + userToCall +
      ' from ' + from + ' name ' + name);
    console.log(signalData)
    // { type: 'offer', sdp: 'sdp' }
    io.to(userToCall).emit('calluser', { signal: signalData, from, name });
  });

  socket.on('answercall', (data: IAnswerCall) => {
    console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' +
      ' answercall data to: ' + data.to + ' signal: ' + data.signal);
    io.to(data.to).emit('callaccepted', { signal: data.signal });
  });

  socket.on('leavecall', ({ socketId }: { socketId: string }) => {
    console.log('[ ' + socket.id + ' ' + socket.handshake.address + ' ]' + ' leavecall: ' + socketId);
    socket.rooms.forEach(room => {
      socket.to(room).emit('leavecall', socket.id);
      console.log('leavecall to room: ' + room);
      // io.to(room).emit('leavecall', socket.id);
    });
    // socket leave all rooms
    socket.rooms.forEach(room => socket.leave(room));
    // io.to(socketId).emit('leavecall', true);
  });

  socket.on('joinroom', ({roomId}: {roomId: string}) => {
    socket.join(roomId);
  })

  socket.on('leaveroom', ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit('leaveroom', socket.id);
    socket.leave(roomId);
  })
});

export { httpServer };
