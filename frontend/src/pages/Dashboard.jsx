import React from 'react'
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

export default function Dashboard(){
  return (
    <RequireAuth>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardHome/>} />
          <Route path="empreendimentos" element={<EmpreendimentosList/>} />
          <Route path="empreendimentos/novo" element={<EmpreendimentoForm/>} />
          <Route path="empreendimentos/:id" element={<EmpreendimentoDashboard/>} />
          <Route path="empreendimentos/:id/editar" element={<EmpreendimentoForm/>} />
          <Route path="empreendimentos/:id/visitas/nova" element={<VisitaForm/>} />
          <Route path="empreendimentos/:id/marketing/novo" element={<MarketingForm/>} />
          <Route path="propostas" element={<PropostasList/>} />
          <Route path="propostas/nova" element={<PropostaForm/>} />
          <Route path="visitas" element={<VisitasList/>} />
          <Route path="visitas/nova" element={<VisitaForm/>} />
          <Route path="marketing" element={<MarketingList/>} />
          <Route path="marketing/novo" element={<MarketingForm/>} />
          <Route path="marketing/:id/dispensar" element={<DispensarMaterial/>} />
          <Route path="equipe" element={<Equipe/>} />
          <Route path="permissoes" element={<Permissoes/>} />
          <Route path="leads" element={<Leads/>} />
          <Route path="leads/:id" element={<LeadDetail/>} />
          <Route path="imoveis" element={<Imoveis/>} />
          <Route path="users" element={<Users/>} />
          <Route path="users/novo" element={<CreateUser/>} />
          <Route path="create/lead" element={<CreateLead/>} />
          <Route path="create/imovel" element={<CreateImovel/>} />
          <Route path="create/user" element={<CreateUser/>} />
        </Routes>
      </Layout>
    </RequireAuth>
  )
}

function DashboardHome() {
  return (
    <div>
      <h2>Bem-vindo ao Dashboard</h2>
      <p>Selecione uma opção no menu lateral para começar.</p>
    </div>
  )
}
