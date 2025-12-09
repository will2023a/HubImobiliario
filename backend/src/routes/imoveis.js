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
    const imovel = await prisma.imovel.create({ data });
    res.json(imovel);
  }catch(err){
    res.status(400).json({ error: 'Create failed', details: err.message });
  }
});

router.get('/', async (req, res) => {
  const where = {};
  if(req.user.role !== 'super_admin') where.imobiliariaId = req.imobiliariaId;
  const list = await prisma.imovel.findMany({ where });
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const imovel = await prisma.imovel.findUnique({ where: { id: Number(req.params.id) } });
  if(!imovel) return res.status(404).json({ error: 'Not found' });
  res.json(imovel);
});

router.patch('/:id', async (req, res) => {
  try{
    const updated = await prisma.imovel.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try{
    await prisma.imovel.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
