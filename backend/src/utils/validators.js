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

// Valida CPF (11 dígitos + dígitos verificadores). Aceita com ou sem máscara.
function validateCpf(value){
  const cpf = String(value || '').replace(/\D/g, '');
  if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base) => {
    let soma = 0;
    for(let i = 0; i < base; i++) soma += Number(cpf[i]) * (base + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

module.exports = { validateEmail, validatePassword, validateImobiliariaData, validateCpf };
