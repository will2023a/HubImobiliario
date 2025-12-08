function ensureRole(...allowed){
  return (req, res, next) => {
    if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if(!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function ensureSameImobiliaria(req, res, next){
  // If super_admin skip check
  if(req.user.role === 'super_admin') return next();
  const targetImobiliaria = req.body.imobiliariaId ?? req.params.imobiliariaId ?? req.imobiliariaId;
  if(targetImobiliaria && req.user.imobiliariaId && Number(targetImobiliaria) !== Number(req.user.imobiliariaId)){
    return res.status(403).json({ error: 'Operação não permitida para esta imobiliária' });
  }
  next();
}

module.exports = { ensureRole, ensureSameImobiliaria };
