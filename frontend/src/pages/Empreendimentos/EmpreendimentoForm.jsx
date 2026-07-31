import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { AuthContext } from '../../contexts/AuthContext'
import './EmpreendimentoForm.css'

const MODELOS_TABELA = [
  { value: 'modelo_1', label: 'Modelo 1' },
  { value: 'modelo_2', label: 'Modelo 2' },
  { value: 'modelo_3', label: 'Modelo 3' },
  { value: 'modelo_4', label: 'Modelo 4' },
  { value: 'modelo_5', label: 'Modelo 5' },
  { value: 'flex_01', label: 'Flex 01' },
  { value: 'flex_02', label: 'Flex 02' }
]

const CATEGORIAS_GALERIA = [
  { value: 'fachada', label: 'Fachada' },
  { value: 'areas_comuns', label: 'Áreas comuns' },
  { value: 'decorados', label: 'Decorados' },
  { value: 'plantas', label: 'Plantas' },
  { value: 'outros', label: 'Outros' }
]

export default function EmpreendimentoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const { user } = useContext(AuthContext)
  const csvInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imobiliarias, setImobiliarias] = useState([])
  const [extraImobiliariaIds, setExtraImobiliariaIds] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [galeria, setGaleria] = useState([])
  const [useTabelaPreco, setUseTabelaPreco] = useState(false)
  const [importingTabelaCsv, setImportingTabelaCsv] = useState(false)
  const [csvResumo, setCsvResumo] = useState(null)
  const [tabelaPrecoForm, setTabelaPrecoForm] = useState({
    nome: 'Tabela Padrão',
    grupo: 'padrao',
    modelo: 'modelo_1',
    incluirDesconto: false,
    incluirJuros: false,
    itens: [
      { descricao: 'Entrada', valor: '', parcelas: '', valorParcela: '', desconto: '', juros: '' }
    ]
  })
  const [apartamentoConfig, setApartamentoConfig] = useState({
    blocosCount: '1',
    andaresPorBloco: '1',
    apartamentosPorAndar: '1',
    valorBasePadrao: '',
    jurosPadrao: ''
  })
  const [formData, setFormData] = useState({
    nome: '',
    tipoUnidade: 'lote',
    quantidadeUnidades: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    imagemUrl: '',
    dataLancamento: '',
    dataPrevisaoConstrucao: '',
    contatoGerente1: '',
    nomeGerente1: '',
    contatoGerente2: '',
    nomeGerente2: '',
    contatoGerente3: '',
    nomeGerente3: '',
    descricao: '',
    imobiliariaId: ''
  })

  useEffect(() => {
    loadImobiliarias()
    if (isEdit) {
      loadEmpreendimento()
    } else if (user?.imobiliariaId) {
      // Se o usuário já tem imobiliária, preencher automaticamente
      setFormData(prev => ({ ...prev, imobiliariaId: user.imobiliariaId.toString() }))
    }
  }, [id, user])

  const loadImobiliarias = async () => {
    try {
      const response = await api.get('/imobiliarias')
      setImobiliarias(response.data)
    } catch (error) {
      console.error('Erro ao carregar imobiliárias:', error)
    }
  }

  const loadEmpreendimento = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/empreendimentos/${id}`)
      const emp = response.data

      setFormData(prev => ({
        ...prev,
        ...emp,
        dataLancamento: emp.dataLancamento ? String(emp.dataLancamento).slice(0, 10) : '',
        dataPrevisaoConstrucao: emp.dataPrevisaoConstrucao ? String(emp.dataPrevisaoConstrucao).slice(0, 10) : '',
        quantidadeUnidades: emp.quantidadeUnidades?.toString() || '',
        imobiliariaId: emp.imobiliariaId ? String(emp.imobiliariaId) : ''
      }))

      if (Array.isArray(emp.equipes)) {
        const extras = emp.equipes
          .map((e) => String(e.imobiliariaId))
          .filter((idEquipe) => idEquipe !== String(emp.imobiliariaId))
        setExtraImobiliariaIds(extras)
      }

      if (Array.isArray(emp.galeria)) {
        setGaleria(emp.galeria.map((img, idx) => ({
          id: img.id || `exist-${idx}`,
          url: img.url,
          titulo: img.titulo || '',
          categoria: img.categoria || 'outros',
          isCapa: Boolean(img.isCapa)
        })))
      }

      if (emp.tipoUnidade === 'apartamento') {
        setApartamentoConfig({
          blocosCount: emp.blocosCount ? String(emp.blocosCount) : '1',
          andaresPorBloco: emp.andaresPorBloco ? String(emp.andaresPorBloco) : '1',
          apartamentosPorAndar: emp.apartamentosPorAndar ? String(emp.apartamentosPorAndar) : '1',
          valorBasePadrao: '',
          jurosPadrao: ''
        })
      }

      if (Array.isArray(emp.tabelasPreco) && emp.tabelasPreco.length > 0) {
        const tabela = emp.tabelasPreco[0]
        setUseTabelaPreco(true)
        setTabelaPrecoForm({
          nome: tabela.nome || 'Tabela Padrão',
          grupo: tabela.grupo || 'padrao',
          modelo: tabela.modelo || 'modelo_1',
          incluirDesconto: Boolean(tabela.incluirDesconto),
          incluirJuros: Boolean(tabela.incluirJuros),
          itens: Array.isArray(tabela.itens) && tabela.itens.length > 0
            ? tabela.itens.map((item) => ({
                descricao: item.descricao || '',
                valor: item.valor?.toString() || '',
                parcelas: item.parcelas?.toString() || '',
                valorParcela: item.valorParcela?.toString() || '',
                desconto: item.desconto?.toString() || '',
                juros: item.juros?.toString() || ''
              }))
            : [{ descricao: 'Entrada', valor: '', parcelas: '', valorParcela: '', desconto: '', juros: '' }]
        })
      }
    } catch (error) {
      console.error('Erro ao carregar empreendimento:', error)
      alert('Erro ao carregar empreendimento')
      navigate('/dashboard/empreendimentos')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleExtraImobiliariaToggle = (imobiliariaId) => {
    setExtraImobiliariaIds(prev => (
      prev.includes(imobiliariaId)
        ? prev.filter(idSelecionado => idSelecionado !== imobiliariaId)
        : [...prev, imobiliariaId]
    ))
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleGaleriaFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploadingImages(true)
      const base64Files = await Promise.all(
        files.map(async (file, index) => ({
          id: `${Date.now()}-${index}`,
          url: await fileToBase64(file),
          titulo: file.name,
          categoria: 'outros',
          isCapa: false
        }))
      )

      setGaleria(prev => {
        const merged = [...prev, ...base64Files]
        if (!merged.some(img => img.isCapa) && merged.length > 0) {
          merged[0].isCapa = true
        }
        return merged
      })

      e.target.value = ''
    } catch (error) {
      console.error('Erro ao converter imagens para base64:', error)
      alert('Não foi possível processar as imagens selecionadas.')
    } finally {
      setUploadingImages(false)
    }
  }

  const updateGaleriaItem = (idImagem, updates) => {
    setGaleria(prev => prev.map(img => (
      img.id === idImagem ? { ...img, ...updates } : img
    )))
  }

  const setCapaImagem = (idImagem) => {
    setGaleria(prev => prev.map(img => ({ ...img, isCapa: img.id === idImagem })))
  }

  const removeImagem = (idImagem) => {
    setGaleria(prev => {
      const filtered = prev.filter(img => img.id !== idImagem)
      if (filtered.length > 0 && !filtered.some(img => img.isCapa)) {
        filtered[0].isCapa = true
      }
      return filtered
    })
  }

  const updateTabelaItem = (index, field, value) => {
    setTabelaPrecoForm(prev => ({
      ...prev,
      itens: prev.itens.map((item, idx) => (
        idx === index ? { ...item, [field]: value } : item
      ))
    }))
  }

  const addTabelaItem = () => {
    setTabelaPrecoForm(prev => ({
      ...prev,
      itens: [...prev.itens, { descricao: '', valor: '', parcelas: '', valorParcela: '', desconto: '', juros: '' }]
    }))
  }

  const removeTabelaItem = (index) => {
    setTabelaPrecoForm(prev => {
      if (prev.itens.length === 1) return prev
      return {
        ...prev,
        itens: prev.itens.filter((_, idx) => idx !== index)
      }
    })
  }

  const normalizeHeader = (value) => (
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim()
  )

  const parseCurrencyValue = (raw) => {
    if (raw === undefined || raw === null) return NaN
    const cleaned = String(raw)
      .replace(/\s/g, '')
      .replace(/R\$/gi, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '')

    if (!cleaned) return NaN
    return Number(cleaned)
  }

  const splitCsvLine = (line, delimiter) => {
    const values = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  }

  const parseTabelaCsvText = (csvText) => {
    const lines = String(csvText)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length < 2) {
      throw new Error('CSV sem dados suficientes para importação.')
    }

    const delimiter = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ','
    const rawHeaders = splitCsvLine(lines[0], delimiter)
    const headers = rawHeaders.map(normalizeHeader)

    const keyMap = {
      descricao: ['descricao', 'produto', 'item', 'nome', 'unidade', 'descricao_produto'],
      valor: ['valor', 'preco', 'preco_total', 'valor_total', 'total', 'valor_unidade'],
      parcelas: ['parcelas', 'qtd_parcelas', 'numero_parcelas'],
      valorParcela: ['valor_parcela', 'parcela_valor', 'vl_parcela'],
      desconto: ['desconto', 'percentual_desconto', 'perc_desconto'],
      juros: ['juros', 'percentual_juros', 'perc_juros']
    }

    const findColumn = (aliases) => {
      const index = headers.findIndex((header) => aliases.includes(header))
      return index
    }

    const descricaoCol = findColumn(keyMap.descricao)
    const valorCol = findColumn(keyMap.valor)
    const parcelasCol = findColumn(keyMap.parcelas)
    const valorParcelaCol = findColumn(keyMap.valorParcela)
    const descontoCol = findColumn(keyMap.desconto)
    const jurosCol = findColumn(keyMap.juros)

    if (descricaoCol < 0 || valorCol < 0) {
      throw new Error('CSV precisa ter colunas de descrição/produto e valor/preço.')
    }

    const itens = []
    let invalidRows = 0

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
      const cols = splitCsvLine(lines[lineIndex], delimiter)
      const descricao = cols[descricaoCol] || ''
      const valorNum = parseCurrencyValue(cols[valorCol])

      if (!descricao || Number.isNaN(valorNum)) {
        invalidRows += 1
        continue
      }

      const parcelasRaw = parcelasCol >= 0 ? cols[parcelasCol] : ''
      const valorParcelaNum = valorParcelaCol >= 0 ? parseCurrencyValue(cols[valorParcelaCol]) : NaN
      const descontoNum = descontoCol >= 0 ? parseCurrencyValue(cols[descontoCol]) : NaN
      const jurosNum = jurosCol >= 0 ? parseCurrencyValue(cols[jurosCol]) : NaN

      itens.push({
        descricao,
        valor: String(valorNum),
        parcelas: parcelasRaw || '',
        valorParcela: Number.isNaN(valorParcelaNum) ? '' : String(valorParcelaNum),
        desconto: Number.isNaN(descontoNum) ? '' : String(descontoNum),
        juros: Number.isNaN(jurosNum) ? '' : String(jurosNum)
      })
    }

    if (itens.length === 0) {
      throw new Error('Nenhuma linha válida encontrada no CSV.')
    }

    const valorTotal = itens.reduce((sum, item) => sum + (Number(item.valor) || 0), 0)

    return {
      itens,
      totalUnidades: itens.length,
      valorTotal,
      invalidRows
    }
  }

  const handleImportTabelaCsv = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImportingTabelaCsv(true)
      const content = await file.text()
      const parsed = parseTabelaCsvText(content)

      setUseTabelaPreco(true)
      setTabelaPrecoForm((prev) => ({
        ...prev,
        itens: parsed.itens
      }))
      setCsvResumo({
        fileName: file.name,
        totalUnidades: parsed.totalUnidades,
        valorTotal: parsed.valorTotal,
        invalidRows: parsed.invalidRows
      })

      if (formData.tipoUnidade !== 'apartamento') {
        setFormData((prev) => ({
          ...prev,
          quantidadeUnidades: String(parsed.totalUnidades)
        }))
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error)
      alert(error.message || 'Não foi possível importar o CSV da tabela de preço.')
    } finally {
      setImportingTabelaCsv(false)
      e.target.value = ''
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.tipoUnidade) {
      newErrors.tipoUnidade = 'Tipo de unidade é obrigatório'
    }

    if (formData.tipoUnidade !== 'apartamento' && (!formData.quantidadeUnidades || formData.quantidadeUnidades <= 0)) {
      newErrors.quantidadeUnidades = 'Quantidade de unidades deve ser maior que 0'
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório'
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória'
    }

    if (!formData.estado.trim()) {
      newErrors.estado = 'Estado é obrigatório'
    }

    if (!formData.imobiliariaId) {
      newErrors.imobiliariaId = 'Imobiliária é obrigatória'
    }

    if (formData.tipoUnidade === 'apartamento') {
      const blocos = parseInt(apartamentoConfig.blocosCount)
      const andares = parseInt(apartamentoConfig.andaresPorBloco)
      const aptos = parseInt(apartamentoConfig.apartamentosPorAndar)

      if (!blocos || blocos <= 0) {
        newErrors.blocosCount = 'Informe a quantidade de blocos'
      }
      if (!andares || andares <= 0) {
        newErrors.andaresPorBloco = 'Informe os andares por bloco'
      }
      if (!aptos || aptos <= 0) {
        newErrors.apartamentosPorAndar = 'Informe os apartamentos por andar'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      if (isEdit) {
        await api.patch(`/empreendimentos/${id}`, formData)
        alert('Empreendimento atualizado com sucesso!')
      } else {
        const payload = {
          ...formData,
          quantidadeUnidades: parseInt(formData.quantidadeUnidades),
          dataLancamento: formData.dataLancamento || undefined,
          dataPrevisaoConstrucao: formData.dataPrevisaoConstrucao || undefined
        }

        payload.additionalImobiliariaIds = extraImobiliariaIds.map((item) => parseInt(item))

        if (formData.tipoUnidade === 'apartamento') {
          const blocos = parseInt(apartamentoConfig.blocosCount)
          const andares = parseInt(apartamentoConfig.andaresPorBloco)
          const aptos = parseInt(apartamentoConfig.apartamentosPorAndar)

          payload.configuracaoApartamento = {
            blocosCount: blocos,
            andaresPorBloco: andares,
            apartamentosPorAndar: aptos,
            valorBasePadrao: apartamentoConfig.valorBasePadrao ? parseFloat(apartamentoConfig.valorBasePadrao) : 0,
            jurosPadrao: apartamentoConfig.jurosPadrao ? parseFloat(apartamentoConfig.jurosPadrao) : 0
          }

          payload.quantidadeUnidades = blocos * andares * aptos
        }

        if (galeria.length > 0) {
          payload.galeria = galeria.map((img) => ({
            url: img.url,
            categoria: img.categoria || 'outros',
            titulo: img.titulo || '',
            isCapa: Boolean(img.isCapa)
          }))
        }

        if (useTabelaPreco && tabelaPrecoForm.nome.trim()) {
          payload.tabelaPreco = {
            nome: tabelaPrecoForm.nome,
            grupo: tabelaPrecoForm.grupo,
            modelo: tabelaPrecoForm.modelo,
            incluirDesconto: Boolean(tabelaPrecoForm.incluirDesconto),
            incluirJuros: Boolean(tabelaPrecoForm.incluirJuros),
            itens: tabelaPrecoForm.itens
              .filter((item) => item.descricao && item.valor !== '')
              .map((item) => ({
                descricao: item.descricao,
                valor: parseFloat(item.valor),
                parcelas: item.parcelas ? parseInt(item.parcelas) : null,
                valorParcela: item.valorParcela ? parseFloat(item.valorParcela) : null,
                desconto: item.desconto ? parseFloat(item.desconto) : null,
                juros: item.juros ? parseFloat(item.juros) : null
              }))
          }
        }
        
        // Remover campos vazios
        Object.keys(payload).forEach(key => {
          if (payload[key] === '' || payload[key] === null) {
            delete payload[key]
          }
        })

        console.log('Enviando payload:', payload)
        const response = await api.post('/empreendimentos', payload)
        alert('Empreendimento criado com sucesso!')
        navigate(`/dashboard/empreendimentos/${response.data.id}`)
        return
      }

      navigate(`/dashboard/empreendimentos/${id}`)
    } catch (error) {
      console.error('Erro ao salvar empreendimento:', error)
      alert(error.response?.data?.error || 'Erro ao salvar empreendimento')
    } finally {
      setLoading(false)
    }
  }

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]
  const apartamentosTotalCalculado =
    parseInt(apartamentoConfig.blocosCount || 0) *
    parseInt(apartamentoConfig.andaresPorBloco || 0) *
    parseInt(apartamentoConfig.apartamentosPorAndar || 0)
  const canChangeTabelaModelo = ['super_admin', 'admin_imobiliaria'].includes(user?.role)

  return (
    <div className="empreendimento-form-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? '✏️ Editar Empreendimento' : '➕ Novo Empreendimento'}
          </h1>
          <p className="page-subtitle">
            {isEdit 
              ? 'Atualize as informações do empreendimento' 
              : 'Preencha os dados para criar um novo empreendimento'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="empreendimento-form">
        <Card padding="lg">
          <div className="form-section">
            <h2 className="section-title">📋 Informações Básicas</h2>
            
            <div className="form-grid">
              <div className="form-field-full">
                <Input
                  label="Nome do Empreendimento *"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  error={errors.nome}
                  placeholder="Ex: Residencial Jardim das Flores"
                  disabled={loading}
                />
              </div>

              <div className="form-field-full">
                <Select
                  label="Imobiliária *"
                  name="imobiliariaId"
                  value={formData.imobiliariaId}
                  onChange={handleChange}
                  error={errors.imobiliariaId}
                  disabled={loading || (user?.imobiliariaId && !isEdit)}
                >
                  <option value="">Selecione a imobiliária</option>
                  {imobiliarias.map(imob => (
                    <option key={imob.id} value={imob.id}>
                      {imob.nome}
                    </option>
                  ))}
                </Select>
                {user?.imobiliariaId && !isEdit && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Imobiliária preenchida automaticamente do seu cadastro
                  </p>
                )}

                <div className="extra-imobiliarias-box">
                  <p className="extra-imobiliarias-title">Vincular outras imobiliárias neste empreendimento</p>
                  <div className="extra-imobiliarias-grid">
                    {imobiliarias
                      .filter((imob) => String(imob.id) !== String(formData.imobiliariaId))
                      .map((imob) => (
                        <label key={imob.id} className="extra-imob-item">
                          <input
                            type="checkbox"
                            checked={extraImobiliariaIds.includes(String(imob.id))}
                            onChange={() => handleExtraImobiliariaToggle(String(imob.id))}
                            disabled={loading}
                          />
                          <span>{imob.nome}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              <div className="form-field">
                <Select
                  label="Tipo de Unidade *"
                  name="tipoUnidade"
                  value={formData.tipoUnidade}
                  onChange={handleChange}
                  error={errors.tipoUnidade}
                  disabled={loading}
                >
                  <option value="lote">Lote</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                </Select>
              </div>

              <div className="form-field">
                <Input
                  label="Quantidade de Unidades *"
                  type="number"
                  name="quantidadeUnidades"
                  value={formData.tipoUnidade === 'apartamento' ? String(apartamentosTotalCalculado || '') : formData.quantidadeUnidades}
                  onChange={handleChange}
                  error={errors.quantidadeUnidades}
                  placeholder="Ex: 100"
                  min="1"
                  disabled={loading || formData.tipoUnidade === 'apartamento'}
                />
              </div>

              {formData.tipoUnidade === 'apartamento' && (
                <>
                  <div className="form-field">
                    <Input
                      label="Quantidade de blocos *"
                      type="number"
                      value={apartamentoConfig.blocosCount}
                      onChange={(e) => setApartamentoConfig(prev => ({ ...prev, blocosCount: e.target.value }))}
                      error={errors.blocosCount}
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Andares por bloco *"
                      type="number"
                      value={apartamentoConfig.andaresPorBloco}
                      onChange={(e) => setApartamentoConfig(prev => ({ ...prev, andaresPorBloco: e.target.value }))}
                      error={errors.andaresPorBloco}
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Apartamentos por andar *"
                      type="number"
                      value={apartamentoConfig.apartamentosPorAndar}
                      onChange={(e) => setApartamentoConfig(prev => ({ ...prev, apartamentosPorAndar: e.target.value }))}
                      error={errors.apartamentosPorAndar}
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Valor base padrão por unidade"
                      type="number"
                      step="0.01"
                      value={apartamentoConfig.valorBasePadrao}
                      onChange={(e) => setApartamentoConfig(prev => ({ ...prev, valorBasePadrao: e.target.value }))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Juros padrão por unidade"
                      type="number"
                      step="0.01"
                      value={apartamentoConfig.jurosPadrao}
                      onChange={(e) => setApartamentoConfig(prev => ({ ...prev, jurosPadrao: e.target.value }))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field-full">
                    <p className="helper-line">
                      Para apartamento, as unidades serão geradas automaticamente no formato B01-A01-AP01.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">📍 Localização</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Bairro *"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  error={errors.bairro}
                  placeholder="Ex: Jardim Europa"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Cidade *"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  error={errors.cidade}
                  placeholder="Ex: São Paulo"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Select
                  label="Estado *"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  error={errors.estado}
                  disabled={loading}
                >
                  {estados.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">📅 Datas e Informações Adicionais</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Data de Lançamento"
                  type="date"
                  name="dataLancamento"
                  value={formData.dataLancamento}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Previsão de Construção"
                  type="date"
                  name="dataPrevisaoConstrucao"
                  value={formData.dataPrevisaoConstrucao}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-field-full">
                <Textarea
                  label="Descrição"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Resumo do empreendimento"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">👥 Contatos dos Gerentes</h2>
            
            <div className="form-grid">
              <div className="form-field">
                <Input
                  label="Nome Gerente 1"
                  name="nomeGerente1"
                  value={formData.nomeGerente1}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 1"
                  name="contatoGerente1"
                  value={formData.contatoGerente1}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Nome Gerente 2"
                  name="nomeGerente2"
                  value={formData.nomeGerente2}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 2"
                  name="contatoGerente2"
                  value={formData.contatoGerente2}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <Input
                  label="Nome Gerente 3"
                  name="nomeGerente3"
                  value={formData.nomeGerente3}
                  onChange={handleChange}
                  placeholder="Nome do gerente"
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <Input
                  label="Contato Gerente 3"
                  name="contatoGerente3"
                  onChange={handleChange}
                  value={formData.contatoGerente3}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">🖼️ Galeria de Fotos</h2>

            <div className="form-grid">
              <div className="form-field-full">
                <label className="input-label">Importar fotos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleGaleriaFiles}
                  disabled={loading || uploadingImages}
                />
                <p className="helper-line">
                  As imagens são convertidas para base64 ao enviar. Marque uma como capa do empreendimento.
                </p>
              </div>

              {galeria.length > 0 && (
                <div className="form-field-full galeria-list">
                  {galeria.map((img) => (
                    <div key={img.id} className="galeria-item">
                      <img src={img.url} alt={img.titulo || 'Imagem'} className="galeria-thumb" />
                      <div className="galeria-fields">
                        <Input
                          label="Título"
                          value={img.titulo}
                          onChange={(e) => updateGaleriaItem(img.id, { titulo: e.target.value })}
                          disabled={loading}
                        />
                        <Select
                          label="Categoria"
                          value={img.categoria}
                          onChange={(e) => updateGaleriaItem(img.id, { categoria: e.target.value })}
                          disabled={loading}
                        >
                          {CATEGORIAS_GALERIA.map((categoria) => (
                            <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
                          ))}
                        </Select>
                        <label className="capa-check">
                          <input
                            type="radio"
                            name="imagem-capa"
                            checked={Boolean(img.isCapa)}
                            onChange={() => setCapaImagem(img.id)}
                            disabled={loading}
                          />
                          <span>Usar como capa</span>
                        </label>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => removeImagem(img.id)} disabled={loading}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-section">
            <h2 className="section-title">💰 Tabela de Preço Inicial</h2>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportTabelaCsv}
              style={{ display: 'none' }}
            />

            <div className="tabela-import-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                disabled={loading || importingTabelaCsv}
              >
                {importingTabelaCsv ? 'Importando CSV...' : 'Importar tabela de preço (CSV)'}
              </Button>
              <p className="helper-line">Use CSV com colunas descrição/produto e valor/preço.</p>
            </div>

            {csvResumo && (
              <div className="csv-resumo-card">
                <strong>Resumo da importação</strong>
                <p>Arquivo: {csvResumo.fileName}</p>
                <p>Total de unidades/produtos: {csvResumo.totalUnidades}</p>
                <p>Valor total: {formatCurrency(csvResumo.valorTotal)}</p>
                {csvResumo.invalidRows > 0 && (
                  <p>Linhas ignoradas: {csvResumo.invalidRows}</p>
                )}
              </div>
            )}

            <label className="toggle-line">
              <input
                type="checkbox"
                checked={useTabelaPreco}
                onChange={(e) => setUseTabelaPreco(e.target.checked)}
                disabled={loading}
              />
              <span>Criar tabela de preço já no cadastro</span>
            </label>

            {useTabelaPreco && (
              <div className="form-grid">
                <div className="form-field">
                  <Input
                    label="Nome da tabela"
                    value={tabelaPrecoForm.nome}
                    onChange={(e) => setTabelaPrecoForm(prev => ({ ...prev, nome: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <Select
                    label="Grupo"
                    value={tabelaPrecoForm.grupo}
                    onChange={(e) => setTabelaPrecoForm(prev => ({ ...prev, grupo: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="padrao">Padrão</option>
                    <option value="promocional">Promocional</option>
                    <option value="especial">Especial</option>
                  </Select>
                </div>
                <div className="form-field">
                  <Select
                    label="Modelo"
                    value={tabelaPrecoForm.modelo}
                    onChange={(e) => setTabelaPrecoForm(prev => ({ ...prev, modelo: e.target.value }))}
                    disabled={loading || !canChangeTabelaModelo}
                  >
                    {MODELOS_TABELA.map((modelo) => (
                      <option key={modelo.value} value={modelo.value}>{modelo.label}</option>
                    ))}
                  </Select>
                  {!canChangeTabelaModelo && (
                    <p className="helper-line">Somente administradores podem alterar o modelo da tabela.</p>
                  )}
                </div>

                <div className="form-field-full toggles-row">
                  <label className="toggle-line">
                    <input
                      type="checkbox"
                      checked={Boolean(tabelaPrecoForm.incluirDesconto)}
                      onChange={(e) => setTabelaPrecoForm(prev => ({ ...prev, incluirDesconto: e.target.checked }))}
                      disabled={loading}
                    />
                    <span>Imprimir com desconto (se houver)</span>
                  </label>
                  <label className="toggle-line">
                    <input
                      type="checkbox"
                      checked={Boolean(tabelaPrecoForm.incluirJuros)}
                      onChange={(e) => setTabelaPrecoForm(prev => ({ ...prev, incluirJuros: e.target.checked }))}
                      disabled={loading}
                    />
                    <span>Imprimir com juros (se houver)</span>
                  </label>
                </div>

                <div className="form-field-full">
                  <div className="tabela-itens-header">
                    <strong>Itens da tabela</strong>
                    <Button size="sm" onClick={addTabelaItem} disabled={loading}>+ Item</Button>
                  </div>

                  <div className="tabela-itens-list">
                    {tabelaPrecoForm.itens.map((item, idx) => (
                      <div key={`tabela-item-${idx}`} className="tabela-item-card">
                        <div className="tabela-item-grid">
                          <Input
                            label="Descrição"
                            value={item.descricao}
                            onChange={(e) => updateTabelaItem(idx, 'descricao', e.target.value)}
                            disabled={loading}
                          />
                          <Input
                            label="Valor"
                            type="number"
                            step="0.01"
                            value={item.valor}
                            onChange={(e) => updateTabelaItem(idx, 'valor', e.target.value)}
                            disabled={loading}
                          />
                          <Input
                            label="Parcelas"
                            type="number"
                            value={item.parcelas}
                            onChange={(e) => updateTabelaItem(idx, 'parcelas', e.target.value)}
                            disabled={loading}
                          />
                          <Input
                            label="Valor parcela"
                            type="number"
                            step="0.01"
                            value={item.valorParcela}
                            onChange={(e) => updateTabelaItem(idx, 'valorParcela', e.target.value)}
                            disabled={loading}
                          />
                          <Input
                            label="Desconto (%)"
                            type="number"
                            step="0.01"
                            value={item.desconto}
                            onChange={(e) => updateTabelaItem(idx, 'desconto', e.target.value)}
                            disabled={loading}
                          />
                          <Input
                            label="Juros (%)"
                            type="number"
                            step="0.01"
                            value={item.juros}
                            onChange={(e) => updateTabelaItem(idx, 'juros', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeTabelaItem(idx)}
                          disabled={loading || tabelaPrecoForm.itens.length === 1}
                        >
                          Remover item
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/empreendimentos')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? '⏳ Salvando...' : isEdit ? '💾 Atualizar' : '✅ Criar Empreendimento'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
