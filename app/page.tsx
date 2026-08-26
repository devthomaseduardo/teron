'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { TeronLogo } from '@/components/teron-logo'
import { AdminPanel } from '@/components/admin-panel'

type User = { id: string; email: string; name: string; role: 'admin' | 'client' }
type Diagnosis = {
  _id: string
  clientEmail: string
  niche: string
  answers: { question: string; answer: string }[]
  status: string
  createdAt: string
}
type Proposal = {
  _id: string
  diagnosisId: string
  clientEmail: string
  title: string
  scope: string
  investment: string
  timeline?: string
  status: string
  createdAt: string
}

const niches: Record<string, string[]> = {
  SaaS: [
    'Qual problema seu produto resolve?',
    'Quem é o cliente ideal?',
    'Qual o principal diferencial?',
    'Em que estágio está o produto?',
    'Qual objetivo quer atingir agora?',
  ],
  Ecom: [
    'O que você vende?',
    'Quem compra de você?',
    'Como vende hoje?',
    'Qual desafio de conversão?',
    'Qual meta para os próximos meses?',
  ],
  Serviços: [
    'Qual serviço você oferece?',
    'Quem é seu público?',
    'Como chegam novos clientes?',
    'O que precisa melhorar?',
    'Qual resultado espera?',
  ],
}

function Button({
  children,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button className="btn" type={type} disabled={disabled}>
      {children}
      <ArrowRight size={15} />
    </button>
  )
}

function Shell({
  user,
  onLogout,
  children,
}: {
  user: User
  onLogout: () => void
  children: React.ReactNode
}) {
  return (
    <main className="workspace">
      <aside>
        <TeronLogo height={26} />
        <div className="workspace-label">TERON · CLIENTE</div>
        <nav className="side-nav">
          <a className="side-active" href="/">
            Visão geral
          </a>
          <a href="/diagnostico">Diagnóstico</a>
        </nav>
        <div className="side-bottom">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <span>
            {user.name}
            <br />
            <small>Cliente</small>
          </span>
        </div>
      </aside>
      <section className="workspace-main">
        <div className="workspace-top">
          <span className="back">Área do cliente</span>
          <button className="logout" type="button" onClick={onLogout}>
            <LogOut size={16} /> Sair
          </button>
        </div>
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Workspace ativo</p>
            <h1>Seu próximo movimento</h1>
          </div>
        </div>
        {children}
      </section>
    </main>
  )
}

function ClientPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [niche, setNiche] = useState('SaaS')
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [d, p] = await Promise.all([fetch('/api/diagnoses'), fetch('/api/proposals')])
      setDiagnoses(d.ok ? await d.json() : [])
      setProposals(p.ok ? await p.json() : [])
    } catch {
      setDiagnoses([])
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const response = await fetch('/api/diagnoses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientEmail: user.email,
        niche,
        answers: niches[niche].map((question, i) => ({ question, answer: answers[i] })),
      }),
    })
    if (response.ok) {
      setSent(true)
      await load()
    }
  }

  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="kpi-grid admin-kpi">
        <div className="kpi">
          <span>Diagnósticos enviados</span>
          <strong>{diagnoses.length}</strong>
          <small>visível para a equipe</small>
        </div>
        <div className="kpi">
          <span>Propostas recebidas</span>
          <strong>{proposals.length}</strong>
          <small>geradas pelo admin</small>
        </div>
        <div className="kpi">
          <span>Status atual</span>
          <strong>{proposals.length ? 'Proposta' : 'Análise'}</strong>
          <small>atualizado em tempo real</small>
        </div>
      </div>
      <div className="portal-grid">
        <section className="panel diagnosis-form">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Novo diagnóstico</p>
              <h2>Conte-nos sobre seu negócio.</h2>
            </div>
            <ClipboardList size={22} />
          </div>
          <p className="body-copy" style={{ marginBottom: 16 }}>
            Prefere o fluxo guiado?{' '}
            <a href="/diagnostico" style={{ color: 'var(--primary)' }}>
              Abrir página de diagnóstico
            </a>
          </p>
          {sent ? (
            <div className="success-state empty-state">
              <Check size={32} />
              <h3>Diagnóstico enviado.</h3>
              <p>A equipe TERON já pode analisar e responder com uma proposta.</p>
              <button
                className="panel-button"
                type="button"
                onClick={() => {
                  setSent(false)
                  setAnswers(Array(5).fill(''))
                }}
              >
                Enviar outro
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label>
                Nicho
                <select
                  value={niche}
                  onChange={(e) => {
                    setNiche(e.target.value)
                    setAnswers(Array(5).fill(''))
                  }}
                >
                  {Object.keys(niches).map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              {niches[niche].map((question, i) => (
                <label key={question}>
                  {String(i + 1).padStart(2, '0')} — {question}
                  <textarea
                    required
                    rows={2}
                    value={answers[i]}
                    onChange={(e) =>
                      setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                </label>
              ))}
              <Button type="submit">Enviar diagnóstico</Button>
            </form>
          )}
        </section>
        <aside className="panel client-status">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Retorno da equipe</p>
              <h3>Propostas</h3>
            </div>
            <button className="panel-button" type="button" onClick={() => void load()}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
          {loading ? (
            <p className="body-copy">Sincronizando…</p>
          ) : proposals.length ? (
            proposals.map((p) => (
              <article className="proposal-card admin-proposal" key={p._id}>
                <FileText size={18} />
                <div>
                  <b>{p.title}</b>
                  <p>{p.scope}</p>
                  <div className="proposal-foot">
                    <strong>{p.investment}</strong>
                    {p.timeline && <em>{p.timeline}</em>}
                    <span className="badge">{p.status}</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <ShieldCheck size={22} />
              <p>Sua proposta aparecerá aqui após a análise do diagnóstico.</p>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  )
}

function Landing() {
  return (
    <main>
      <header className="topbar">
        <TeronLogo height={30} />
        <div className="top-actions">
          <a className="text-link" href="/diagnostico">
            Diagnóstico
          </a>
          <a className="text-link" href="/cliente/login">
            Portal do cliente
          </a>
          <a className="text-link" href="/admin/login">
            Acesso da equipe
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Estúdio de produto digital</p>
          <h1>
            Clareza para construir
            <br />
            o que vem depois.
          </h1>
          <p className="hero-sub">
            Diagnóstico, proposta e acompanhamento em um só fluxo — com a postura de uma agência e a
            precisão de produto.
          </p>
          <div className="hero-actions">
            <a className="btn" href="/diagnostico">
              Fazer diagnóstico <ArrowRight size={15} />
            </a>
            <a className="btn btn-secondary" href="/cliente/login">
              Portal do cliente <ArrowRight size={15} />
            </a>
            <a className="btn btn-secondary" href="/admin/login">
              Painel da equipe <ArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="orbital orbital-one" />
          <div className="orbital orbital-two" />
          <div className="hero-card">
            <div className="mini-label">SINAL · AO VIVO</div>
            <div className="signal-line">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="hero-card-footer">
              <span>FUNIL</span>
              <b>PRONTO</b>
            </div>
          </div>
        </div>
      </section>

      <section className="flow" aria-label="Como funciona">
        <div className="flow-item">
          <span>01</span>
          <strong>Diagnóstico</strong>
        </div>
        <div className="flow-item">
          <span>02</span>
          <strong>Proposta</strong>
        </div>
        <div className="flow-item">
          <span>03</span>
          <strong>Aprovação</strong>
        </div>
        <div className="flow-item">
          <span>04</span>
          <strong>Entrega</strong>
        </div>
      </section>

      <section className="intro-grid">
        <div>
          <p className="eyebrow">Por que TERON</p>
          <h2>Direção de agência. Execução de produto.</h2>
        </div>
        <div>
          <p className="body-copy">
            Unimos estratégia, design e engenharia para transformar uma necessidade real em sistema
            claro, conectado e pronto para produção — sem ruído e sem promessa vazia.
          </p>
          <a className="inline-link" href="/diagnostico">
            Começar pelo diagnóstico <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <section className="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Frentes</p>
            <h2 style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 400, letterSpacing: '-0.04em' }}>
              Três linhas de trabalho
            </h2>
          </div>
          <span>01 — 03</span>
        </div>
        <div className="service-list">
          <div className="service-row">
            <span>01</span>
            <h3>Marca e web</h3>
            <p className="body-copy" style={{ margin: 0, maxWidth: 280 }}>
              Sites, landing pages e experiências com foco em conversão.
            </p>
          </div>
          <div className="service-row">
            <span>02</span>
            <h3>Produto e plataformas</h3>
            <p className="body-copy" style={{ margin: 0, maxWidth: 280 }}>
              Portais, dashboards e sistemas para uso recorrente.
            </p>
          </div>
          <div className="service-row">
            <span>03</span>
            <h3>Operação e automação</h3>
            <p className="body-copy" style={{ margin: 0, maxWidth: 280 }}>
              APIs, integrações e fluxos que reduzem trabalho manual.
            </p>
          </div>
        </div>
      </section>

      <section className="proof">
        <div>
          <p className="eyebrow">Processo</p>
          <h2>
            Entender → Definir
            <br />
            <em>→ Construir → Evoluir</em>
          </h2>
        </div>
        <div className="metrics">
          <div>
            <strong>1</strong>
            <span>fluxo do lead à entrega</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>retorno típico do diagnóstico</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>contexto preservado no portal</span>
          </div>
        </div>
      </section>

      <footer>
        <span>TERON · São Paulo</span>
        <span>Critério · processo · entrega</span>
      </footer>
    </main>
  )
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setBooting(false)
    }, 2500)

    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) {
          setBooting(false)
          window.clearTimeout(timer)
        }
      })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  async function logout() {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
    } catch {
      /* ignore */
    }
    setUser(null)
  }

  if (booting && !user) {
    return (
      <main className="auth-shell">
        <TeronLogo height={32} href={null} />
        <p className="eyebrow" style={{ marginTop: 24 }}>
          Carregando TERON…
        </p>
        <div className="hero-actions" style={{ marginTop: 24 }}>
          <a className="btn" href="/cliente/login">
            Portal do cliente
          </a>
          <a className="btn btn-secondary" href="/admin/login">
            Equipe
          </a>
        </div>
      </main>
    )
  }

  if (!user) return <Landing />
  return user.role === 'admin' ? (
    <AdminPanel user={user} onLogout={logout} />
  ) : (
    <ClientPanel user={user} onLogout={logout} />
  )
}
