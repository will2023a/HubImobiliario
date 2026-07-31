const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);
router.use(multitenant);

// Criar empreendimento
router.post('/', requirePermission('empreendimentos', 'criar'), async (req, res) => {
  try {
    // Permitir que super_admin ou usuário envie imobiliariaId
    // Se usuário tem imobiliariaId, usar o dele (exceto se for super_admin)
    let imobiliariaId;
    
    if (req.user.role === 'super_admin') {
      // Super admin pode criar para qualquer imobiliária
      imobiliariaId = req.body.imobiliariaId || req.user.imobiliariaId;
    } else if (req.user.imobiliariaId) {
      // Usuário com imobiliária usa a dele
      imobiliariaId = req.user.imobiliariaId;
    } else {
      // Usuário sem imobiliária precisa informar
      imobiliariaId = req.body.imobiliariaId;
    }

    if (!imobiliariaId) {
      return res.status(400).json({ 
        error: 'imobiliariaId é obrigatório. Usuário não possui imobiliária associada e nenhuma foi informada.' 
      });
    }

    // Dados extras opcionais para fluxo de cadastro avançado
    const additionalImobiliariaIds = Array.isArray(req.body.additionalImobiliariaIds)
      ? req.body.additionalImobiliariaIds
      : [];
    const configuracaoApartamento = req.body.configuracaoApartamento || null;
    const galeria = Array.isArray(req.body.galeria) ? req.body.galeria : [];
    const tabelaPreco = req.body.tabelaPreco || null;

    // Preparar dados removendo campos vazios
    const cleanData = { ...req.body };
    delete cleanData.imobiliariaId; // Remover para adicionar depois tratado
    delete cleanData.additionalImobiliariaIds;
    delete cleanData.configuracaoApartamento;
    delete cleanData.galeria;
    delete cleanData.tabelaPreco;
    
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    const data = {
      ...cleanData, 
      imobiliariaId: parseInt(imobiliariaId),
      quantidadeUnidades: parseInt(req.body.quantidadeUnidades),
      // Converter datas string para Date se fornecidas
      dataLancamento: req.body.dataLancamento ? new Date(req.body.dataLancamento) : undefined,
      dataPrevisaoConstrucao: req.body.dataPrevisaoConstrucao ? new Date(req.body.dataPrevisaoConstrucao) : undefined
    };

    if (data.tipoUnidade === 'apartamento' && configuracaoApartamento) {
      const blocos = parseInt(configuracaoApartamento.blocosCount || 0);
      const andares = parseInt(configuracaoApartamento.andaresPorBloco || 0);
      const aptos = parseInt(configuracaoApartamento.apartamentosPorAndar || 0);

      if (blocos > 0 && andares > 0 && aptos > 0) {
        data.blocosCount = blocos;
        data.andaresPorBloco = andares;
        data.apartamentosPorAndar = aptos;
        data.quantidadeUnidades = blocos * andares * aptos;
      }
    }

    console.log('Criando empreendimento com dados:', JSON.stringify(data, null, 2));

    const empreendimento = await prisma.$transaction(async (tx) => {
      const created = await tx.empreendimento.create({ data });

      const equipeIds = Array.from(new Set([
        parseInt(imobiliariaId),
        ...additionalImobiliariaIds
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id))
      ]));

      if (equipeIds.length > 0) {
        await tx.empreendimentoEquipe.createMany({
          data: equipeIds.map((id) => ({
            empreendimentoId: created.id,
            imobiliariaId: id,
            comissaoPercent: 5.0,
            ativa: true
          })),
          skipDuplicates: true
        });
      }

      if (galeria.length > 0) {
        const galeriaData = galeria
          .filter((img) => img && typeof img.url === 'string' && img.url.trim().length > 0)
          .map((img, idx) => ({
            empreendimentoId: created.id,
            url: img.url,
            categoria: img.categoria || 'outros',
            titulo: img.titulo || null,
            isCapa: Boolean(img.isCapa),
            ordem: idx
          }));

        if (galeriaData.length > 0) {
          await tx.galeriaImagem.createMany({ data: galeriaData });
          const capa = galeriaData.find((img) => img.isCapa) || galeriaData[0];
          if (capa?.url) {
            await tx.empreendimento.update({
              where: { id: created.id },
              data: { imagemUrl: capa.url }
            });
          }
        }
      }

      if (data.tipoUnidade === 'apartamento' && data.blocosCount && data.andaresPorBloco && data.apartamentosPorAndar) {
        const valorBasePadrao = parseFloat(configuracaoApartamento?.valorBasePadrao || 0);
        const jurosPadrao = parseFloat(configuracaoApartamento?.jurosPadrao || 0);
        const unidades = [];

        for (let bloco = 1; bloco <= data.blocosCount; bloco += 1) {
          for (let andar = 1; andar <= data.andaresPorBloco; andar += 1) {
            for (let apto = 1; apto <= data.apartamentosPorAndar; apto += 1) {
              const numero = `B${String(bloco).padStart(2, '0')}-A${String(andar).padStart(2, '0')}-AP${String(apto).padStart(2, '0')}`;
              unidades.push({
                empreendimentoId: created.id,
                numero,
                bloco: `Bloco ${bloco}`,
                valorBase: valorBasePadrao,
                juros: jurosPadrao,
                valorTotal: valorBasePadrao + jurosPadrao
              });
            }
          }
        }

        if (unidades.length > 0) {
          await tx.unidade.createMany({ data: unidades });
        }
      }

      if (tabelaPreco && tabelaPreco.nome) {
        const itens = Array.isArray(tabelaPreco.itens) ? tabelaPreco.itens : [];

        await tx.tabelaPreco.create({
          data: {
            empreendimentoId: created.id,
            nome: tabelaPreco.nome,
            grupo: tabelaPreco.grupo || 'padrao',
            modelo: tabelaPreco.modelo || 'modelo_1',
            incluirDesconto: Boolean(tabelaPreco.incluirDesconto),
            incluirJuros: Boolean(tabelaPreco.incluirJuros),
            itens: itens.length > 0
              ? {
                  create: itens.map((item, idx) => ({
                    descricao: item.descricao || `Item ${idx + 1}`,
                    valor: parseFloat(item.valor) || 0,
                    parcelas: item.parcelas ? parseInt(item.parcelas) : null,
                    valorParcela: item.valorParcela ? parseFloat(item.valorParcela) : null,
                    desconto: item.desconto ? parseFloat(item.desconto) : null,
                    juros: item.juros ? parseFloat(item.juros) : null,
                    observacao: item.observacao || null,
                    ordem: idx
                  }))
                }
              : undefined
          }
        });
      }

      return created;
    });

    res.json(empreendimento);
  } catch (err) {
    console.error('Erro ao criar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao criar empreendimento', details: err.message });
  }
});

// Listar empreendimentos
router.get('/', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const where = {};
  if (req.user.role !== 'super_admin') {
    where.imobiliariaId = req.imobiliariaId;
  }
  
  const list = await prisma.empreendimento.findMany({ 
    where,
    include: {
      _count: {
        select: { unidades: true, propostas: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

// Buscar empreendimento por ID (dashboard)
router.get('/:id', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const empreendimento = await prisma.empreendimento.findUnique({ 
      where: { id },
      include: {
        galeria: {
          orderBy: { ordem: 'asc' }
        },
        equipes: {
          include: {
            imobiliaria: { select: { id: true, nome: true, status: true } }
          }
        },
        tabelasPreco: {
          include: {
            itens: {
              orderBy: { ordem: 'asc' }
            }
          }
        },
        unidades: {
          include: {
            _count: { select: { propostas: true } }
          }
        },
        propostas: {
          include: { corretor: true, unidade: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!empreendimento) {
      return res.status(404).json({ error: 'Empreendimento não encontrado' });
    }
    
    // Verificar se pertence à mesma imobiliária
    if (req.user.role !== 'super_admin' && empreendimento.imobiliariaId !== req.imobiliariaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(empreendimento);
  } catch (err) {
    console.error('Erro ao buscar empreendimento:', err);
    res.status(500).json({ error: 'Erro ao buscar empreendimento', details: err.message });
  }
});

// Atualizar empreendimento
router.patch('/:id', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const updated = await prisma.empreendimento.update({ 
      where: { id }, 
      data: req.body 
    });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao atualizar', details: err.message });
  }
});

// Deletar empreendimento
router.delete('/:id', requirePermission('empreendimentos', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    await prisma.empreendimento.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

module.exports = router;
