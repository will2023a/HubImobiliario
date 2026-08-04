const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET é obrigatório em produção');
}
const effectiveSecret = secret || 'development-only-change-me';

function sign(payload, expiresIn = '7d'){
  return jwt.sign(payload, effectiveSecret, { expiresIn, algorithm: 'HS256' });
}

function verify(token){
  return jwt.verify(token, effectiveSecret, { algorithms: ['HS256'] });
}

module.exports = { sign, verify };
