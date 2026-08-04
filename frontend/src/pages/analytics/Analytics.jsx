import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner, Badge } from '../../components/ui'
import Card from '../../components/ui/Card'
import KPICard from '../../components/shared/KPICard'
import './Analytics.css'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [ranking, setRanking] = useState([])
  const [origins, setOrigins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [dashRes, funnelRes, rankingRes, originsRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/funnel'),
        api.get('/analytics/ranking'),
        api.get('/analytics/leads-by-origin'),
      ])
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data)
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value.data)
      if (rankingRes.status === 'fulfilled') setRanking(rankingRes.value.data)
      if (originsRes.status === 'fulfilled') setOrigins(originsRes.value.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <Spinner fullPage label="Carregando analytics..." />

  const maxFunnel = Math.max(...funnel.map(f => f.count), 1)

  return (
    <div className="analytics-page">
      <h2 className="analytics-title">Analytics</h2>

      {/* KPIs */}
      <div className="analytics-kpis">
        <KPICard icon="users" title="Total Leads" value={data?.totalLeads || 0} subtitle="Cadastrados" />
        <KPICard icon="document" title="Propostas" value={data?.totalPropostas || 0} subtitle="Total criadas" />
        <KPICard icon="check" title="Vendas" value={data?.propostasAprovadas || 0} subtitle="Aprovadas" />
        <KPICard icon="chart" title="Conversão" value={`${data?.conversao || 0}%`} subtitle="Leads → Vendas" />
        <KPICard icon="building" title="Unidades Vendidas" value={data?.totalUnidadesVendidas || 0} subtitle="Total" />
      </div>

      <div className="analytics-grid">
        {/* Funil */}
        <Card title="Funil de Vendas" subtitle="Leads por estágio">
          <div className="funnel-chart">
            {funnel.map(stage => (
              <div key={stage.stage} className="funnel-row">
                <span className="funnel-label">{stage.stage}</span>
                <div className="funnel-bar-container">
                  <div
                    className="funnel-bar"
                    style={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                  />
                </div>
                <span className="funnel-count">{stage.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Ranking */}
        <Card title="Ranking de Corretores" subtitle="Por vendas aprovadas">
          {ranking.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Sem dados</p>
          ) : (
            <div className="ranking-list">
              {ranking.slice(0, 10).map((c, idx) => (
                <div key={c.id} className="ranking-item">
                  <span className="ranking-pos">{idx + 1}º</span>
                  <span className="ranking-name">{c.name}</span>
                  <div className="ranking-stats">
                    <Badge variant="success" size="sm">{c.vendas} vendas</Badge>
                    <Badge variant="default" size="sm">{c.leads} leads</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Origens */}
        <Card title="Leads por Origem" subtitle="Distribuição de canais">
          {origins.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Sem dados</p>
          ) : (
            <div className="origins-chart">
              {origins.map(o => (
                <div key={o.origem} className="origin-row">
                  <span className="origin-label">{o.origem}</span>
                  <div className="origin-bar-container">
                    <div className="origin-bar" style={{ width: `${(o.count / Math.max(...origins.map(x => x.count), 1)) * 100}%` }} />
                  </div>
                  <span className="origin-count">{o.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
