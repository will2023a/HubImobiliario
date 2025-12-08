const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');

const router = express.Router();

// Only super_admins should access these endpoints
function ensureSuper(req, res, next){
  if(req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.get('/imobiliarias/pendentes', auth, ensureSuper, async (req, res) => {
  const pend = await prisma.imobiliaria.findMany({ where: { status: 'aguardando_aprovacao' } });
  res.json(pend);
});

router.patch('/imobiliarias/:id/aprovar', auth, ensureSuper, async (req, res) => {
  const { id } = req.params;
  try{
    const updated = await prisma.imobiliaria.update({ where: { id: Number(id) }, data: { status: 'ativa' } });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Approval failed', details: err.message });
  }
});

module.exports = router;
