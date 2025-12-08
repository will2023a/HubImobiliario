const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { sign } = require('../utils/jwt');

const router = express.Router();

// Register user (admin/corretor). For imobiliaria registration use /imobiliarias endpoint.
router.post('/register', async (req, res) => {
  const { name, email, password, role, imobiliariaId } = req.body;
  if(!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const { validateEmail, validatePassword } = require('../utils/validators');
  if(!validateEmail(email)) return res.status(400).json({ error: 'Email inválido' });
  if(!validatePassword(password)) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
  try{
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role, imobiliariaId } });
    const token = sign({ id: user.id });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  }catch(err){
    res.status(400).json({ error: 'Error creating user', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try{
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = sign({ id: user.id });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, imobiliariaId: user.imobiliariaId }, token });
  }catch(err){
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

module.exports = router;
