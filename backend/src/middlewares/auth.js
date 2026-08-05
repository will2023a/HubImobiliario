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
    if (user.isApproved === false && user.role !== 'super_admin') return res.status(403).json({ error: 'Cadastro aguardando aprovação', code: 'ACCOUNT_PENDING' });
    const requestedImobiliariaId = Number(req.get('x-imobiliaria-id')) || user.imobiliariaId;
    if (requestedImobiliariaId && requestedImobiliariaId !== user.imobiliariaId && user.role !== 'super_admin') {
      const membership = await prisma.imobiliariaAdmin.findUnique({
        where: { userId_imobiliariaId: { userId: user.id, imobiliariaId: requestedImobiliariaId } }
      });
      if (!membership?.active) return res.status(403).json({ error: 'Imobiliária não autorizada' });
    }
    if (requestedImobiliariaId) user.imobiliariaId = requestedImobiliariaId;
    req.imobiliariaId = requestedImobiliariaId || null;
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
    req.user = user;
    next();
  }catch(err){
    return res.status(401).json({ error: 'Token invalid' });
  }
}

module.exports = authMiddleware;
