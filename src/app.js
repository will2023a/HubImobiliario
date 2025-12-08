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

app.get('/', (req, res) => res.json({ ok: true, message: 'CRM Imobiliário API' }));

module.exports = app;
