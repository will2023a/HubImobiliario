const prisma = require('../prisma/client');

async function expireReservations() {
  const now = new Date();
  const expired = await prisma.reservaUnidade.findMany({ where: { status: 'ativa', expiresAt: { lte: now } }, select: { id: true, unidadeId: true } });
  for (const reservation of expired) {
    await prisma.$transaction(async tx => {
      const changed = await tx.reservaUnidade.updateMany({ where: { id: reservation.id, status: 'ativa', expiresAt: { lte: now } }, data: { status: 'expirada' } });
      if (!changed.count) return;
      const newerActive = await tx.reservaUnidade.findFirst({ where: { unidadeId: reservation.unidadeId, status: 'ativa', expiresAt: { gt: now } } });
      if (newerActive) return;
      const unit = await tx.unidade.findUnique({ where: { id: reservation.unidadeId } });
      if (unit && ['reservada', 'pre_reservada'].includes(unit.status)) {
        await tx.unidade.update({ where: { id: unit.id }, data: { status: 'disponivel' } });
        await tx.unidadeStatusHistorico.create({ data: { unidadeId: unit.id, statusAnterior: unit.status, statusNovo: 'disponivel', motivo: `Expiração automática da reserva #${reservation.id}` } });
      }
    });
  }
  return expired.length;
}

module.exports = { expireReservations };
