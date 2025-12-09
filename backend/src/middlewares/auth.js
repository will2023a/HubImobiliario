const { verify } = require('../utils/jwt');
const prisma = require('../prisma/client');

async function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'No token provided' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ error: 'Token error' });
  const [scheme, token] = parts;
  if(!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformatted' });
  try{
    const decoded = verify(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if(!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  }catch(err){
    return res.status(401).json({ error: 'Token invalid', details: err.message });
  }
}

module.exports = authMiddleware;
