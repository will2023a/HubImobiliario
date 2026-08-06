const { empreendimentoScope } = require('../../src/utils/empreendimento-access');

describe('escopo do catálogo de empreendimentos', () => {
  test('super admin não recebe filtro de imobiliária', () => {
    expect(empreendimentoScope({ role: 'super_admin' })).toEqual({});
  });

  test('usuário acessa proprietário ou vínculo ativo', () => {
    expect(empreendimentoScope({ role: 'corretor', imobiliariaId: 7 })).toEqual({
      OR: [
        { imobiliariaId: 7 },
        { equipes: { some: { imobiliariaId: 7, ativa: true } } }
      ]
    });
  });
});
