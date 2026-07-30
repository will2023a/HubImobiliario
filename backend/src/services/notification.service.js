const prisma = require('../prisma/client');
const { emitToUser } = require('../socket');

/**
 * Create a notification and emit via WebSocket
 */
async function createNotification({ userId, tipo, titulo, mensagem, link, imobiliariaId }) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        tipo,
        titulo,
        mensagem,
        link: link || null,
        imobiliariaId
      }
    });

    // Emit real-time notification via WebSocket
    emitToUser(userId, 'notification:new', notification);

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

/**
 * Notify when a new proposta is created
 */
async function notifyNewProposta(proposta, imobiliariaId) {
  // Notify gerentes and admin about new proposta
  const gestores = await prisma.user.findMany({
    where: {
      imobiliariaId,
      role: { in: ['admin_imobiliaria', 'gerente', 'diretor'] }
    },
    select: { id: true }
  });

  for (const gestor of gestores) {
    await createNotification({
      userId: gestor.id,
      tipo: 'nova_proposta',
      titulo: 'Nova Proposta',
      mensagem: `${proposta.clienteNome} - proposta criada`,
      link: '/dashboard/propostas',
      imobiliariaId
    });
  }
}

/**
 * Notify when a proposta is approved/rejected
 */
async function notifyPropostaStatus(proposta, status, imobiliariaId) {
  await createNotification({
    userId: proposta.corretorId,
    tipo: status === 'aprovada' ? 'proposta_aprovada' : 'proposta_rejeitada',
    titulo: `Proposta ${status}`,
    mensagem: `Proposta de ${proposta.clienteNome} foi ${status}`,
    link: '/dashboard/propostas',
    imobiliariaId
  });
}

/**
 * Notify when a lead is assigned to a corretor
 */
async function notifyLeadAtribuido(lead, corretorId, imobiliariaId) {
  await createNotification({
    userId: corretorId,
    tipo: 'lead_atribuido',
    titulo: 'Novo Lead Atribuído',
    mensagem: `Lead ${lead.nome} foi atribuído a você`,
    link: `/dashboard/leads/${lead.id}`,
    imobiliariaId
  });
}

module.exports = {
  createNotification,
  notifyNewProposta,
  notifyPropostaStatus,
  notifyLeadAtribuido
};
