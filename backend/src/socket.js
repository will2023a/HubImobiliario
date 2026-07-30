const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:1234',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Auth middleware — validate JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    // Join personal room
    socket.join(`user:${user.id}`);

    // Join imobiliaria room
    if (user.imobiliariaId) {
      socket.join(`imobiliaria:${user.imobiliariaId}`);
      socket.join(`pipeline:${user.imobiliariaId}`);
    }

    // Handle conversation room joins
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('conversation:typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('conversation:typing', {
        userId: user.id,
        userName: user.name
      });
    });

    socket.on('pipeline:subscribe', () => {
      if (user.imobiliariaId) {
        socket.join(`pipeline:${user.imobiliariaId}`);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by socket.io
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io não foi inicializado. Chame initSocket primeiro.');
  }
  return io;
}

// Helper to emit notification to a specific user
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper to emit to all users of an imobiliaria
function emitToImobiliaria(imobiliariaId, event, data) {
  if (io) {
    io.to(`imobiliaria:${imobiliariaId}`).emit(event, data);
  }
}

// Helper to emit pipeline update
function emitPipelineUpdate(imobiliariaId, data) {
  if (io) {
    io.to(`pipeline:${imobiliariaId}`).emit('pipeline:lead-moved', data);
  }
}

module.exports = { initSocket, getIO, emitToUser, emitToImobiliaria, emitPipelineUpdate };
