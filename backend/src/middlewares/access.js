const prisma = require('../prisma/client');
const { defaultAccess, PAGES } = require('../constants/access');

async function getUserAccess(user) {
  if (user.role === 'super_admin') {
    return PAGES.map(page => ({ page, canView: true, canEdit: true }));
  }
  const defaults = defaultAccess(user.role);
  const overrides = await prisma.userAccess.findMany({ where: { userId: user.id } });
  const byPage = new Map(overrides.map(rule => [rule.page, rule]));
  return defaults.map(rule => {
    const override = byPage.get(rule.page);
    return override ? { page: rule.page, canView: override.canView, canEdit: override.canEdit } : rule;
  });
}

function requirePageAccess(page) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'super_admin') return next();
      const access = await getUserAccess(req.user);
      const rule = access.find(item => item.page === page);
      const needsEdit = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (!rule?.canView || (needsEdit && !rule.canEdit)) {
        return res.status(403).json({ error: 'Acesso negado', page, action: needsEdit ? 'edit' : 'view' });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { getUserAccess, requirePageAccess };
