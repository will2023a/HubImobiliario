const prisma = require('../prisma/client');

function empreendimentoScope(user) {
  if (user.role === 'super_admin') return {};
  return {
    OR: [
      { imobiliariaId: user.imobiliariaId },
      { equipes: { some: { imobiliariaId: user.imobiliariaId, ativa: true } } }
    ]
  };
}

async function getAccessibleEmpreendimento(user, id, options = {}) {
  return prisma.empreendimento.findFirst({
    where: { id: Number(id), ...empreendimentoScope(user) },
    ...options
  });
}

async function getManageableEmpreendimento(user, id, options = {}) {
  return prisma.empreendimento.findFirst({
    where: { id: Number(id), ...(user.role === 'super_admin' ? {} : { imobiliariaId: user.imobiliariaId }) },
    ...options
  });
}

module.exports = { empreendimentoScope, getAccessibleEmpreendimento, getManageableEmpreendimento };
