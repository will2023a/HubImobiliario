function validateEmail(email){
  if(!email) return false;
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  return re.test(String(email).toLowerCase());
}

function validatePassword(pw){
  if(!pw) return false;
  return pw.length >= 6;
}

function validateImobiliariaData(data){
  const { nome, cnpj, email, telefone } = data || {};
  if(!nome || !cnpj || !email) return { ok: false, message: 'nome, cnpj e email são obrigatórios' };
  if(!validateEmail(email)) return { ok: false, message: 'email inválido' };
  return { ok: true };
}

module.exports = { validateEmail, validatePassword, validateImobiliariaData };
