// Attach imobiliariaId to request based on user (logical multitenancy)
function multitenant(req, res, next){
  if(req.user && req.user.imobiliariaId) {
    req.imobiliariaId = req.user.imobiliariaId;
  }
  next();
}

module.exports = multitenant;
