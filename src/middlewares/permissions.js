const prisma = require('../prisma/client');

// Cache de permissões em memória para performance
const permissionCache = new Map();

async function checkPermission(role, recurso, acao, imobiliariaId = null) {
  const cacheKey = `${role}:${recurso}:${acao}:${imobiliariaId}`;
  
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey);
  }

  // Super admin e admin_imobiliaria têm acesso total
  if (role === 'super_admin' || role === 'admin_imobiliaria') {
    permissionCache.set(cacheKey, true);
    return true;
  }

  // Busca permissão específica da imobiliária ou global
  const permissao = await prisma.permissao.findFirst({
    where: {
      role,
      recurso,
      acao,
      OR: [
        { imobiliariaId: imobiliariaId },
        { imobiliariaId: null } // permissão global
      ]
    },
    orderBy: { imobiliariaId: 'desc' } // prioriza específica sobre global
  });

  const permitido = permissao ? permissao.permitido : false;
  permissionCache.set(cacheKey, permitido);
  return permitido;
}

function requirePermission(recurso, acao) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permitido = await checkPermission(
      req.user.role,
      recurso,
      acao,
      req.user.imobiliariaId
    );

    if (!permitido) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Você não tem permissão para ${acao} ${recurso}` 
      });
    }

    next();
  };
}

// Limpar cache quando permissões forem atualizadas
function clearPermissionCache() {
  permissionCache.clear();
}

module.exports = { checkPermission, requirePermission, clearPermissionCache };
