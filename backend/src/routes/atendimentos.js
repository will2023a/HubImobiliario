const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');

const router = express.Router();

router.use(auth);
router.use(multitenant);

router.post('/', async (req, res) => {
  const { leadId, mensagem } = req.body;
  try{
    // verify lead belongs to imobiliaria
    const lead = await prisma.lead.findUnique({ where: { id: Number(leadId) } });
    if(!lead) return res.status(404).json({ error: 'Lead not found' });
    if(req.user.role !== 'super_admin' && lead.imobiliariaId !== req.imobiliariaId) return res.status(403).json({ error: 'Forbidden' });
    const atendimento = await prisma.atendimento.create({ data: { leadId: Number(leadId), mensagem, corretorId: req.user.id } });
    res.json(atendimento);
  }catch(err){
    res.status(400).json({ error: 'Create failed', details: err.message });
  }
});

router.get('/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const list = await prisma.atendimento.findMany({ where: { leadId: Number(leadId) }, include: { corretor: true } });
  res.json(list);
});

module.exports = router;
