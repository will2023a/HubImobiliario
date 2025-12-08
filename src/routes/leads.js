const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');

const router = express.Router();

router.use(auth);
router.use(multitenant);

router.post('/', async (req, res) => {
  const data = { ...req.body, imobiliariaId: req.body.imobiliariaId || req.imobiliariaId };
  try{
    const lead = await prisma.lead.create({ data });
    res.json(lead);
  }catch(err){
    res.status(400).json({ error: 'Create failed', details: err.message });
  }
});

router.get('/', async (req, res) => {
  const where = {};
  if(req.user.role !== 'super_admin') where.imobiliariaId = req.imobiliariaId;
  if(req.user.role === 'corretor') where.corretorId = req.user.id;
  const list = await prisma.lead.findMany({ where, include: { corretor: true } });
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: Number(req.params.id) }, include: { atendimentos: true } });
  if(!lead) return res.status(404).json({ error: 'Not found' });
  // security: ensure same imobiliaria
  if(req.user.role !== 'super_admin' && lead.imobiliariaId !== req.imobiliariaId) return res.status(403).json({ error: 'Forbidden' });
  res.json(lead);
});

router.patch('/:id', async (req, res) => {
  try{
    const updated = await prisma.lead.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try{
    await prisma.lead.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
