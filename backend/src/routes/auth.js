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

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try{
    const user = await prisma.user.findUnique({ where: { email }, include: { imobiliaria: true } });
    if(!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    if (user.imobiliaria && user.imobiliaria.status !== 'ativa') {
      return res.status(403).json({ error: 'Imobiliária ainda não está ativa' });
    }
    const token = sign({ id: user.id });
    const access = await getUserAccess(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, imobiliariaId: user.imobiliariaId, access }, token });
  }catch(err){
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

module.exports = router;
