const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');
const { requirePermission } = require('../middlewares/permissions');
const crypto = require('crypto');
const { empreendimentoScope, getAccessibleEmpreendimento, getManageableEmpreendimento } = require('../utils/empreendimento-access');

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
    for (const field of ['quartosMin', 'quartosMax', 'suitesMin', 'suitesMax', 'vagasMin', 'vagasMax']) {
      if (data[field] !== undefined) data[field] = parseInt(data[field]);
    }
    for (const field of ['areaMin', 'areaMax', 'latitude', 'longitude']) {
      if (data[field] !== undefined) data[field] = parseFloat(data[field]);
    }

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
                identificacao: numero,
                tipo: 'apartamento',
                andar,
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
  const where = { ...empreendimentoScope(req.user) };
  const q = String(req.query.q || '').trim();
  if (q) where.AND = [{ OR: [{ nome: { contains: q } }, { cidade: { contains: q } }, { bairro: { contains: q } }] }];
  if (req.query.estado) where.estado = String(req.query.estado);
  if (req.query.cidade) where.cidade = String(req.query.cidade);
  if (req.query.bairro) where.bairro = String(req.query.bairro);
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.destaque === 'true') where.destaque = true;
  if (req.query.entregaAte) where.dataPrevisaoConstrucao = { lte: new Date(req.query.entregaAte) };
  if (req.query.somenteDisponiveis === 'true') where.unidades = { some: { status: 'disponivel' } };
  
  const list = await prisma.empreendimento.findMany({ 
    where,
    include: {
      unidades: { select: { status: true, valorTotal: true } },
      _count: { select: { unidades: true, propostas: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list.map(item => {
    const disponibilidade = item.unidades.reduce((acc, unidade) => {
      acc[unidade.status] = (acc[unidade.status] || 0) + 1;
      return acc;
    }, {});
    const { unidades, ...empreendimento } = item;
    return { ...empreendimento, disponibilidade };
  }));
});

// Buscar empreendimento por ID (dashboard)
router.get('/:id', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const empreendimento = await getAccessibleEmpreendimento(req.user, id, {
      include: {
        galeria: {
          orderBy: { ordem: 'asc' }
        },
        documentos: { orderBy: { createdAt: 'desc' } },
        compartilhamentos: { where: { ativo: true }, orderBy: { createdAt: 'desc' } },
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
    
    if (req.user.role !== 'super_admin' && empreendimento.imobiliariaId !== req.user.imobiliariaId) {
      empreendimento.compartilhamentos = empreendimento.compartilhamentos.filter(item => item.createdById === req.user.id);
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
    
    if (!await getManageableEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });
    const allowed = ['nome', 'tipoUnidade', 'quantidadeUnidades', 'imagemUrl', 'bairro', 'cidade', 'estado', 'endereco', 'latitude', 'longitude', 'dataLancamento', 'dataPrevisaoConstrucao', 'descricao', 'status', 'destaque', 'videoUrl', 'quartosMin', 'quartosMax', 'suitesMin', 'suitesMax', 'vagasMin', 'vagasMax', 'areaMin', 'areaMax'];
    const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    for (const field of ['quantidadeUnidades', 'quartosMin', 'quartosMax', 'suitesMin', 'suitesMax', 'vagasMin', 'vagasMax']) if (data[field] !== undefined) data[field] = data[field] === '' ? null : parseInt(data[field]);
    for (const field of ['areaMin', 'areaMax', 'latitude', 'longitude']) if (data[field] !== undefined) data[field] = data[field] === '' ? null : parseFloat(data[field]);
    if (data.dataLancamento) data.dataLancamento = new Date(data.dataLancamento);
    if (data.dataPrevisaoConstrucao) data.dataPrevisaoConstrucao = new Date(data.dataPrevisaoConstrucao);
    const updated = await prisma.empreendimento.update({ 
      where: { id }, 
      data
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
    
    if (!await getManageableEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });
    await prisma.empreendimento.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

router.post('/:id/documentos', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await getManageableEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  const { nome, tipo = 'outro', url, publico = false } = req.body;
  if (!nome?.trim() || !/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'Informe nome e URL válida do documento' });
  res.status(201).json(await prisma.documentoEmpreendimento.create({ data: { empreendimentoId: id, nome: nome.trim(), tipo, url, publico: Boolean(publico) } }));
});

router.delete('/:id/documentos/:documentoId', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await getManageableEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  const result = await prisma.documentoEmpreendimento.deleteMany({ where: { id: Number(req.params.documentoId), empreendimentoId: id } });
  if (!result.count) return res.status(404).json({ error: 'Documento não encontrado' });
  res.json({ ok: true });
});

router.post('/:id/compartilhamentos', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await getAccessibleEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) return res.status(400).json({ error: 'Validade inválida' });
  const share = await prisma.compartilhamentoEmpreendimento.create({ data: {
    token: crypto.randomBytes(24).toString('hex'), empreendimentoId: id, createdById: req.user.id,
    clienteNome: req.body.clienteNome?.trim() || null, clienteEmail: req.body.clienteEmail?.trim().toLowerCase() || null,
    permitirPrecos: Boolean(req.body.permitirPrecos), permitirUnidades: req.body.permitirUnidades !== false, expiresAt
  } });
  res.status(201).json(share);
});

router.patch('/:id/compartilhamentos/:shareId/revogar', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await getAccessibleEmpreendimento(req.user, id)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  const isOwner = req.user.role === 'super_admin' || Boolean(await getManageableEmpreendimento(req.user, id));
  const result = await prisma.compartilhamentoEmpreendimento.updateMany({ where: { id: Number(req.params.shareId), empreendimentoId: id, ...(isOwner ? {} : { createdById: req.user.id }) }, data: { ativo: false } });
  if (!result.count) return res.status(404).json({ error: 'Compartilhamento não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
