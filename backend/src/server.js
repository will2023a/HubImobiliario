const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { expireReservations } = require('./services/reservation-expiry.service');
const { processarAgendados } = require('./services/price-update.service');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);
const reservationTimer = setInterval(() => expireReservations().catch(error => console.error('Falha ao expirar reservas:', error.message)), 60_000);
reservationTimer.unref();
expireReservations().catch(error => console.error('Falha na verificação inicial de reservas:', error.message));

const priceUpdateTimer = setInterval(() => processarAgendados().catch(error => console.error('Falha ao processar atualizações de preço:', error.message)), 60_000);
priceUpdateTimer.unref();
processarAgendados().catch(error => console.error('Falha na verificação inicial de atualizações de preço:', error.message));

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
