const prisma = require('../prisma/client');

/**
 * Log an audit event
 */
async function logAudit({ userId, acao, recurso, recursoId, detalhes, ip, imobiliariaId }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        acao,
        recurso,
        recursoId: recursoId || null,
        detalhes: detalhes || null,
        ip: ip || null,
        imobiliariaId: imobiliariaId || null,
      }
    });
  } catch (error) {
    console.error('Erro ao registrar audit log:', error.message);
  }
}

module.exports = { logAudit };
