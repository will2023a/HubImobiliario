const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { ensureRole, ensureSameImobiliaria } = require('../middlewares/roles');

const router = express.Router();

// Create imobiliaria (registration by imobiliaria) -> status aguardando_aprovacao
router.post('/', async (req, res) => {
  const { nome, cnpj, email, telefone, plan } = req.body;
  const { validateImobiliariaData } = require('../utils/validators');
  const v = validateImobiliariaData({ nome, cnpj, email, telefone });
  if(!v.ok) return res.status(400).json({ error: v.message });
  try{
    const imob = await prisma.imobiliaria.create({ data: { nome, cnpj, email, telefone, status: 'aguardando_aprovacao', plan: plan || 'basic' } });
    res.json(imob);
  }catch(err){
    res.status(400).json({ error: 'Error creating imobiliaria', details: err.message });
  }
});

router.get('/', auth, ensureRole('super_admin'), async (req, res) => {
  const list = await prisma.imobiliaria.findMany();
  res.json(list);
});

router.get('/:id', auth, ensureSameImobiliaria, async (req, res) => {
  const { id } = req.params;
  const imob = await prisma.imobiliaria.findUnique({ where: { id: Number(id) } });
  if(!imob) return res.status(404).json({ error: 'Not found' });
  res.json(imob);
});

router.patch('/:id', auth, ensureRole('super_admin'), async (req, res) => {
  const { id } = req.params;
  try{
    const updated = await prisma.imobiliaria.update({ where: { id: Number(id) }, data: req.body });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', auth, ensureRole('super_admin'), async (req, res) => {
  const { id } = req.params;
  try{
    await prisma.imobiliaria.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
