const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'change_me';

function sign(payload, expiresIn = '7d'){
  return jwt.sign(payload, secret, { expiresIn });
}

function verify(token){
  return jwt.verify(token, secret);
}

module.exports = { sign, verify };
