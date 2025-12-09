const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log(`   CRM Imobiliário - Backend Iniciado`);
  console.log('🚀 ============================================');
  console.log(`📡 API rodando em: http://localhost:${PORT}`);
  console.log(`📊 Prisma Studio: npx prisma studio`);
  console.log('✅ Pronto para receber requisições!');
  console.log('');
});
