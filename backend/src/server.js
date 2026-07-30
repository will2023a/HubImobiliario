const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log(`   Gestor Pro 360 - Backend Iniciado`);
  console.log('🚀 ============================================');
  console.log(`📡 API rodando em: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ativo`);
  console.log(`📊 Prisma Studio: npx prisma studio`);
  console.log('✅ Pronto para receber requisições!');
  console.log('');
});
