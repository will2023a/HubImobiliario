const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { sign } = require('../utils/jwt');

const router = express.Router();
const { getUserAccess } = require('../middlewares/access');

// Register user (admin/corretor). For imobiliaria registration use /imobiliarias endpoint.
router.post('/register', async (req, res) => {
  return res.status(403).json({ error: 'Cadastro de usuário é feito por um administrador em Gestão de Equipe.' });
});

// Solicitação pública de um usuário para entrar em uma imobiliária existente.
router.post('/register-request', async (req, res) => {
  const { name, email, password, cnpj } = req.body;
  const { validateEmail, validatePassword } = require('../utils/validators');
  if (!name?.trim() || !validateEmail(email) || !validatePassword(password) || !cnpj?.trim()) {
    return res.status(400).json({ error: 'Informe nome, e-mail, senha válida e CNPJ da imobiliária' });
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [existing, imobiliaria] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.imobiliaria.findFirst({ where: { cnpj: cnpj.trim() } })
    ]);
    if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' });
    if (!imobiliaria || imobiliaria.status !== 'ativa') {
      return res.status(404).json({ error: 'Imobiliária não encontrada ou ainda não aprovada' });
    }
    const user = await prisma.user.create({ data: {
      name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12),
      role: 'corretor', imobiliariaId: imobiliaria.id, isApproved: false
    } });
    res.status(201).json({ id: user.id, status: 'aguardando_aprovacao' });
  } catch (err) {
    res.status(400).json({ error: 'Não foi possível enviar a solicitação de cadastro' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try{
    const user = await prisma.user.findUnique({ where: { email }, include: { imobiliaria: true, managedImobiliarias: { where: { active: true }, include: { imobiliaria: true } } } });
    if(!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    if (user.isApproved === false && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Seu cadastro está aguardando aprovação do administrador geral', code: 'ACCOUNT_PENDING' });
    }
    if (user.imobiliaria && user.imobiliaria.status !== 'ativa') {
      return res.status(403).json({ error: 'Imobiliária ainda não está ativa' });
    }
    const token = sign({ id: user.id });
    const access = await getUserAccess(user);
    const imobiliarias = user.role === 'super_admin' ? [] : (user.managedImobiliarias || []).map(item => ({ id: item.imobiliaria.id, nome: item.imobiliaria.nome, status: item.imobiliaria.status }));
    if (user.role !== 'super_admin' && user.imobiliaria && !imobiliarias.some(item => item.id === user.imobiliaria.id)) {
      imobiliarias.unshift({ id: user.imobiliaria.id, nome: user.imobiliaria.nome, status: user.imobiliaria.status });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, imobiliariaId: user.imobiliariaId, isApproved: user.isApproved, imobiliarias, access }, token });
  }catch(err){
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

module.exports = router;
