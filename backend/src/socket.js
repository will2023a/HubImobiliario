const { Server } = require('socket.io');
const { verify } = require('./utils/jwt');
const prisma = require('./prisma/client');

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
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }
    try {
      const decoded = verify(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true, imobiliariaId: true }
      });
      if (!user) return next(new Error('Usuário inválido'));
      socket.user = user;
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
    socket.on('conversation:join', async (conversationId, acknowledge) => {
      const conversation = await prisma.conversation.findUnique({ where: { id: Number(conversationId) } });
      const allowed = conversation && (user.role === 'super_admin' || conversation.imobiliariaId === user.imobiliariaId);
      if (allowed) socket.join(`conversation:${conversationId}`);
      if (typeof acknowledge === 'function') acknowledge({ ok: Boolean(allowed) });
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('conversation:typing', (data) => {
      const room = `conversation:${Number(data?.conversationId)}`;
      if (!socket.rooms.has(room)) return;
      socket.to(room).emit('conversation:typing', {
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
