import React, { useState, useEffect, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Leads from './Leads'
import Imoveis from './Imoveis'
import Users from './Users'
import CreateLead from './CreateLead'
import CreateImovel from './CreateImovel'
import CreateUser from './CreateUser'
import LeadDetail from './LeadDetail'
import EmpreendimentosList from './Empreendimentos/EmpreendimentosList'
import EmpreendimentoDashboard from './Empreendimentos/EmpreendimentoDashboard'
import EmpreendimentoForm from './Empreendimentos/EmpreendimentoForm'
import PropostasList from './Propostas/PropostasList'
import PropostaForm from './Propostas/PropostaForm'
import Equipe from './Equipe/Equipe'
import Permissoes from './Permissoes/Permissoes'
import VisitasList from './Visitas/VisitasList'
import VisitaForm from './Visitas/VisitaForm'
import MarketingList from './Marketing/MarketingList'
import MarketingForm from './Marketing/MarketingForm'
import DispensarMaterial from './Marketing/DispensarMaterial'
import RequireAuth from '../components/RequireAuth'
import KPICard from '../components/shared/KPICard'
import { AuthContext } from '../contexts/AuthContext'
import api from '../services/api'
import Perfil from './Perfil'
import Pipeline from './crm/Pipeline'
import Tarefas from './crm/Tarefas'
import Configuracoes from './admin/Configuracoes'
import Inbox from './inbox/Inbox'
import Templates from './inbox/Templates'
import Agenda from './agenda/Agenda'
import Analytics from './analytics/Analytics'
import Comissoes from './financeiro/Comissoes'
import AutomacoesList from './automations/AutomacoesList'
import AutomacaoEditor from './automations/AutomacaoEditor'
import Auditoria from './admin/Auditoria'
import Webhooks from './admin/Webhooks'
import PageAccess from '../components/PageAccess'
import './Dashboard.css'

export default function Dashboard(){
  const allowed = (page, element, edit = false) => <PageAccess page={page} edit={edit}>{element}</PageAccess>
  return (
    <RequireAuth>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardHome/>} />
          <Route path="pipeline" element={allowed('pipeline', <Pipeline/>)} />
          <Route path="tarefas" element={allowed('tasks', <Tarefas/>)} />
          <Route path="empreendimentos" element={allowed('empreendimentos', <EmpreendimentosList/>)} />
          <Route path="empreendimentos/novo" element={allowed('empreendimentos', <EmpreendimentoForm/>, true)} />
          <Route path="empreendimentos/:id" element={allowed('empreendimentos', <EmpreendimentoDashboard/>)} />
          <Route path="empreendimentos/:id/editar" element={allowed('empreendimentos', <EmpreendimentoForm/>, true)} />
          <Route path="empreendimentos/:id/visitas/nova" element={<VisitaForm/>} />
          <Route path="empreendimentos/:id/marketing/novo" element={<MarketingForm/>} />
          <Route path="propostas" element={allowed('propostas', <PropostasList/>)} />
          <Route path="propostas/nova" element={allowed('propostas', <PropostaForm/>, true)} />
          <Route path="visitas" element={allowed('visitas', <VisitasList/>)} />
          <Route path="visitas/nova" element={allowed('visitas', <VisitaForm/>, true)} />
          <Route path="marketing" element={allowed('marketing', <MarketingList/>)} />
          <Route path="marketing/novo" element={allowed('marketing', <MarketingForm/>, true)} />
          <Route path="marketing/:id/dispensar" element={<DispensarMaterial/>} />
          <Route path="equipe" element={allowed('users', <Equipe/>)} />
          <Route path="permissoes" element={allowed('permissions', <Permissoes/>)} />
          <Route path="leads" element={allowed('leads', <Leads/>)} />
          <Route path="leads/:id" element={allowed('leads', <LeadDetail/>)} />
          <Route path="imoveis" element={allowed('imoveis', <Imoveis/>)} />
          <Route path="users" element={allowed('users', <Users/>)} />
          <Route path="users/novo" element={<CreateUser/>} />
          <Route path="create/lead" element={<CreateLead/>} />
          <Route path="create/imovel" element={<CreateImovel/>} />
          <Route path="create/user" element={<CreateUser/>} />
          <Route path="perfil" element={<Perfil/>} />
          <Route path="configuracoes" element={allowed('settings', <Configuracoes/>)} />
          <Route path="inbox" element={allowed('inbox', <Inbox/>)} />
          <Route path="templates" element={allowed('templates', <Templates/>)} />
          <Route path="agenda" element={allowed('agenda', <Agenda/>)} />
          <Route path="analytics" element={allowed('analytics', <Analytics/>)} />
          <Route path="financeiro/comissoes" element={allowed('comissoes', <Comissoes/>)} />
          <Route path="automacoes" element={allowed('automations', <AutomacoesList/>)} />
          <Route path="automacoes/editor/:id" element={<AutomacaoEditor/>} />
          <Route path="auditoria" element={allowed('audit', <Auditoria/>)} />
          <Route path="webhooks" element={allowed('webhooks', <Webhooks/>)} />
        </Routes>
      </Layout>
    </RequireAuth>
  )
}

function DashboardHome() {
  const { user } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [leadsRes, propostasRes, empreendimentosRes] = await Promise.allSettled([
        api.get('/leads'),
        api.get('/propostas'),
        api.get('/empreendimentos'),
      ])

      const leads = leadsRes.status === 'fulfilled' ? leadsRes.value.data : []
      const propostas = propostasRes.status === 'fulfilled' ? propostasRes.value.data : []
      const empreendimentos = empreendimentosRes.status === 'fulfilled' ? empreendimentosRes.value.data : []

      const leadsArray = Array.isArray(leads) ? leads : leads.leads || []
      const propostasArray = Array.isArray(propostas) ? propostas : propostas.propostas || []

      const pendentes = propostasArray.filter(p => p.status === 'pendente')
      const aprovadas = propostasArray.filter(p => p.status === 'aprovada')

      setStats({
        totalLeads: leadsArray.length,
        propostasPendentes: pendentes.length,
        vendasFechadas: aprovadas.length,
        empreendimentos: Array.isArray(empreendimentos) ? empreendimentos.length : 0,
      })

      // Recent activity from propostas
      const recent = propostasArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      setRecentActivity(recent)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--gray-200)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }}></div>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-home">
      <div className="dashboard-greeting">
        <h2>Olá, {user?.name?.split(' ')[0]} 👋</h2>
        <p>Aqui está o resumo do seu dia.</p>
      </div>

      <div className="dashboard-kpis">
        <KPICard
          icon="👤"
          title="Leads"
          value={stats?.totalLeads || 0}
          subtitle="Total cadastrados"
        />
        <KPICard
          icon="📄"
          title="Propostas Pendentes"
          value={stats?.propostasPendentes || 0}
          subtitle="Aguardando aprovação"
          variant={stats?.propostasPendentes > 0 ? 'warning' : 'default'}
        />
        <KPICard
          icon="✅"
          title="Vendas Fechadas"
          value={stats?.vendasFechadas || 0}
          subtitle="Propostas aprovadas"
        />
        <KPICard
          icon="🏗️"
          title="Empreendimentos"
          value={stats?.empreendimentos || 0}
          subtitle="Ativos no sistema"
        />
      </div>

      {recentActivity.length > 0 && (
        <div className="dashboard-recent">
          <h3 className="dashboard-section-title">Atividade Recente</h3>
          <div className="dashboard-activity-list">
            {recentActivity.map(proposta => (
              <div key={proposta.id} className="dashboard-activity-item">
                <span className="activity-icon">📄</span>
                <div className="activity-info">
                  <span className="activity-title">
                    Proposta para {proposta.clienteNome} {proposta.clienteSobrenome}
                  </span>
                  <span className="activity-meta">
                    {proposta.status} • {new Date(proposta.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className={`activity-status status-${proposta.status}`}>
                  {proposta.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
