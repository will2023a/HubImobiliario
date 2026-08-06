require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const auth = require('./middlewares/auth');
const { requirePageAccess } = require('./middlewares/access');
const { securityHeaders, rateLimit } = require('./middlewares/security');

const authRoutes = require('./routes/auth');
const superRoutes = require('./routes/super');
const imobiliariasRoutes = require('./routes/imobiliarias');
const usersRoutes = require('./routes/users');
const imoveisRoutes = require('./routes/imoveis');
const leadsRoutes = require('./routes/leads');
const atendimentosRoutes = require('./routes/atendimentos');
const permissoesRoutes = require('./routes/permissoes');
const empreendimentosRoutes = require('./routes/empreendimentos');
const unidadesRoutes = require('./routes/unidades');
const propostasRoutes = require('./routes/propostas');
const visitasRoutes = require('./routes/visitas');
const marketingRoutes = require('./routes/marketing');
const pipelineRoutes = require('./routes/pipeline');
const tasksRoutes = require('./routes/tasks');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const configRoutes = require('./routes/config');
const equipesEmpreendimentoRoutes = require('./routes/equipes-empreendimento');
const tabelaPrecoRoutes = require('./routes/tabela-preco');
const conversationsRoutes = require('./routes/conversations');
const templatesRoutes = require('./routes/templates');
const webhooksReceiverRoutes = require('./routes/webhooks-receiver');
const aiRoutes = require('./routes/ai');
const agendaRoutes = require('./routes/agenda');
const analyticsRoutes = require('./routes/analytics');
const comissoesRoutes = require('./routes/comissoes');
const automationsRoutes = require('./routes/automations');
const auditRoutes = require('./routes/audit');
const webhooksConfigRoutes = require('./routes/webhooks-config');
const catalogoPublicoRoutes = require('./routes/catalogo-publico');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:1234,http://localhost:3000')
  .split(',').map(origin => origin.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origem não autorizada'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 180 }));

app.use('/auth', rateLimit({ windowMs: 15 * 60_000, max: 20 }), authRoutes);
app.use('/catalogo-publico', catalogoPublicoRoutes);
app.use('/super', superRoutes);
app.use('/imobiliarias', imobiliariasRoutes);
app.use('/users', auth, requirePageAccess('users'), usersRoutes);
app.use('/imoveis', auth, requirePageAccess('imoveis'), imoveisRoutes);
app.use('/leads', auth, requirePageAccess('leads'), leadsRoutes);
app.use('/atendimentos', auth, requirePageAccess('leads'), atendimentosRoutes);
app.use('/permissoes', permissoesRoutes);
app.use('/empreendimentos', auth, requirePageAccess('empreendimentos'), empreendimentosRoutes);
app.use('/unidades', auth, requirePageAccess('empreendimentos'), unidadesRoutes);
app.use('/propostas', auth, requirePageAccess('propostas'), propostasRoutes);
app.use('/visitas', auth, requirePageAccess('visitas'), visitasRoutes);
app.use('/marketing', auth, requirePageAccess('marketing'), marketingRoutes);
app.use('/pipeline', auth, requirePageAccess('pipeline'), pipelineRoutes);
app.use('/tasks', auth, requirePageAccess('tasks'), tasksRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/search', auth, searchRoutes);
app.use('/config', auth, requirePageAccess('settings'), configRoutes);
app.use('/equipes-empreendimento', auth, requirePageAccess('empreendimentos'), equipesEmpreendimentoRoutes);
app.use('/tabela-preco', auth, requirePageAccess('empreendimentos'), tabelaPrecoRoutes);
app.use('/conversations', auth, requirePageAccess('inbox'), conversationsRoutes);
app.use('/templates', auth, requirePageAccess('templates'), templatesRoutes);
app.use('/webhooks', rateLimit({ windowMs: 60_000, max: 60 }), webhooksReceiverRoutes);
app.use('/ai', auth, rateLimit({ windowMs: 60_000, max: 30 }), aiRoutes);
app.use('/agenda', auth, requirePageAccess('agenda'), agendaRoutes);
app.use('/analytics', auth, requirePageAccess('analytics'), analyticsRoutes);
app.use('/comissoes', auth, requirePageAccess('comissoes'), comissoesRoutes);
app.use('/automations', auth, requirePageAccess('automations'), automationsRoutes);
app.use('/audit', auth, requirePageAccess('audit'), auditRoutes);
app.use('/webhooks-config', auth, requirePageAccess('webhooks'), webhooksConfigRoutes);

app.get('/', (req, res) => res.json({ ok: true, message: 'Gestor Pro 360 API' }));

app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Origem não autorizada') return res.status(403).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Corpo da requisição muito grande' });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
