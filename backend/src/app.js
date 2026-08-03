require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

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

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/super', superRoutes);
app.use('/imobiliarias', imobiliariasRoutes);
app.use('/users', usersRoutes);
app.use('/imoveis', imoveisRoutes);
app.use('/leads', leadsRoutes);
app.use('/atendimentos', atendimentosRoutes);
app.use('/permissoes', permissoesRoutes);
app.use('/empreendimentos', empreendimentosRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/propostas', propostasRoutes);
app.use('/visitas', visitasRoutes);
app.use('/marketing', marketingRoutes);
app.use('/pipeline', pipelineRoutes);
app.use('/tasks', tasksRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/search', searchRoutes);
app.use('/config', configRoutes);
app.use('/equipes-empreendimento', equipesEmpreendimentoRoutes);
app.use('/tabela-preco', tabelaPrecoRoutes);
app.use('/conversations', conversationsRoutes);

app.get('/', (req, res) => res.json({ ok: true, message: 'Gestor Pro 360 API' }));

module.exports = app;
