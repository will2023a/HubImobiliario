const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /tabela-preco/:empreendimentoId - Listar tabelas de preço do empreendimento
router.get('/:empreendimentoId', authenticate, async (req, res) => {
  try {
    const tabelas = await prisma.tabelaPreco.findMany({
      where: { empreendimentoId: parseInt(req.params.empreendimentoId) },
      include: {
        itens: { orderBy: { ordem: 'asc' } },
        _count: { select: { itens: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tabelas);
  } catch (error) {
    console.error('Erro tabelas:', error);
    res.status(500).json({ error: 'Erro ao buscar tabelas' });
  }
});

// POST /tabela-preco - Criar tabela de preço
router.post('/', authenticate, async (req, res) => {
  try {
    const { empreendimentoId, nome, grupo, modelo, incluirDesconto, incluirJuros, itens } = req.body;

    if (!empreendimentoId || !nome) {
      return res.status(400).json({ error: 'empreendimentoId e nome são obrigatórios' });
    }

    const tabela = await prisma.tabelaPreco.create({
      data: {
        empreendimentoId: parseInt(empreendimentoId),
        nome,
        grupo: grupo || 'padrao',
        modelo: modelo || 'modelo_1',
        incluirDesconto: incluirDesconto || false,
        incluirJuros: incluirJuros || false,
        itens: itens ? {
          create: itens.map((item, idx) => ({
            descricao: item.descricao,
            valor: parseFloat(item.valor) || 0,
            parcelas: item.parcelas ? parseInt(item.parcelas) : null,
            valorParcela: item.valorParcela ? parseFloat(item.valorParcela) : null,
            desconto: item.desconto ? parseFloat(item.desconto) : null,
            juros: item.juros ? parseFloat(item.juros) : null,
            observacao: item.observacao || null,
            unidadeId: item.unidadeId ? parseInt(item.unidadeId) : null,
            ordem: idx
          }))
        } : undefined
      },
      include: { itens: true }
    });

    res.status(201).json(tabela);
  } catch (error) {
    console.error('Erro criar tabela:', error);
    res.status(500).json({ error: 'Erro ao criar tabela' });
  }
});

// PUT /tabela-preco/:id - Atualizar tabela
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nome, grupo, modelo, incluirDesconto, incluirJuros, ativa } = req.body;

    const tabela = await prisma.tabelaPreco.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome && { nome }),
        ...(grupo && { grupo }),
        ...(modelo && { modelo }),
        ...(incluirDesconto !== undefined && { incluirDesconto }),
        ...(incluirJuros !== undefined && { incluirJuros }),
        ...(ativa !== undefined && { ativa }),
      }
    });

    res.json(tabela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tabela' });
  }
});

// POST /tabela-preco/:id/itens - Adicionar item à tabela
router.post('/:id/itens', authenticate, async (req, res) => {
  try {
    const { descricao, valor, parcelas, valorParcela, desconto, juros, unidadeId, observacao } = req.body;

    if (!descricao || valor === undefined) {
      return res.status(400).json({ error: 'descricao e valor são obrigatórios' });
    }

    const lastItem = await prisma.tabelaPrecoItem.findFirst({
      where: { tabelaId: parseInt(req.params.id) },
      orderBy: { ordem: 'desc' }
    });

    const item = await prisma.tabelaPrecoItem.create({
      data: {
        tabelaId: parseInt(req.params.id),
        descricao,
        valor: parseFloat(valor),
        parcelas: parcelas ? parseInt(parcelas) : null,
        valorParcela: valorParcela ? parseFloat(valorParcela) : null,
        desconto: desconto ? parseFloat(desconto) : null,
        juros: juros ? parseFloat(juros) : null,
        unidadeId: unidadeId ? parseInt(unidadeId) : null,
        observacao: observacao || null,
        ordem: (lastItem?.ordem || 0) + 1
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Erro criar item:', error);
    res.status(500).json({ error: 'Erro ao criar item' });
  }
});

// PUT /tabela-preco/itens/:itemId - Atualizar item
router.put('/itens/:itemId', authenticate, async (req, res) => {
  try {
    const { descricao, valor, parcelas, valorParcela, desconto, juros, observacao } = req.body;

    const item = await prisma.tabelaPrecoItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: {
        ...(descricao && { descricao }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(parcelas !== undefined && { parcelas: parcelas ? parseInt(parcelas) : null }),
        ...(valorParcela !== undefined && { valorParcela: valorParcela ? parseFloat(valorParcela) : null }),
        ...(desconto !== undefined && { desconto: desconto ? parseFloat(desconto) : null }),
        ...(juros !== undefined && { juros: juros ? parseFloat(juros) : null }),
        ...(observacao !== undefined && { observacao }),
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// DELETE /tabela-preco/:id - Deletar tabela
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.tabelaPreco.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Tabela removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tabela' });
  }
});

// DELETE /tabela-preco/itens/:itemId - Deletar item
router.delete('/itens/:itemId', authenticate, async (req, res) => {
  try {
    await prisma.tabelaPrecoItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.json({ message: 'Item removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

module.exports = router;
