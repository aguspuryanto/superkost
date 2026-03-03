import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './db.ts';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict this
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const sendNotification = async (userId: string, type: string, title: string, message: string) => {
  try {
    // Save to DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
    });

    // Emit to user room
    if (io) {
      io.to(userId).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
