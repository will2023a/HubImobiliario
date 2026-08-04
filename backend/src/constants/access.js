const PAGES = [
  'dashboard', 'pipeline', 'leads', 'tasks', 'empreendimentos', 'imoveis',
  'propostas', 'visitas', 'inbox', 'templates', 'marketing', 'agenda',
  'analytics', 'automations', 'comissoes', 'users', 'permissions',
  'settings', 'audit', 'webhooks'
];

const ROLE_DEFAULTS = {
  admin_imobiliaria: PAGES,
  diretor: PAGES.filter(page => !['permissions', 'settings', 'webhooks'].includes(page)),
  gerente: PAGES.filter(page => !['permissions', 'settings', 'audit', 'webhooks', 'automations'].includes(page)),
  corretor: ['dashboard', 'pipeline', 'leads', 'tasks', 'empreendimentos', 'imoveis', 'propostas', 'visitas', 'inbox', 'templates', 'agenda', 'comissoes']
};

function defaultAccess(role) {
  const visible = new Set(ROLE_DEFAULTS[role] || []);
  return PAGES.map(page => ({
    page,
    canView: visible.has(page),
    canEdit: visible.has(page) && !['analytics', 'audit', 'dashboard'].includes(page)
  }));
}

module.exports = { PAGES, defaultAccess };
