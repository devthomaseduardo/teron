'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  LogOut,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'

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
    'Quem e o cliente ideal?',
    'Qual o principal diferencial?',
    'Em que estagio esta o produto?',
    'Qual objetivo quer atingir agora?',
  ],
  Ecom: [
    'O que voce vende?',
    'Quem compra de voce?',
    'Como vende hoje?',
    'Qual desafio de conversao?',
    'Qual meta para os proximos meses?',
  ],
  Servicos: [
    'Qual servico voce oferece?',
    'Quem e seu publico?',
    'Como chegam novos clientes?',
    'O que precisa melhorar?',
    'Qual resultado espera?',
  ],
}

function Logo() {
  return (
    <a href="/" className="logo">
      <span className="logo-mark">+</span> TERON
    </a>
  )
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
        <Logo />
        <div className="workspace-label">
          TERON / {user.role === 'admin' ? 'OPERATIONS' : 'CLIENT'}
        </div>
        <nav className="side-nav">
          <a className="side-active" href="/">
            Visao geral
          </a>
          <a href="/diagnostico">Diagnosticos</a>
          <a href="/">Propostas</a>
        </nav>
        <div className="side-bottom">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <span>
            {user.name}
            <br />
            <small>{user.role === 'admin' ? 'Administrador' : 'Cliente'}</small>
          </span>
        </div>
      </aside>
      <section className="workspace-main">
        <div className="workspace-top">
          <span className="back">TERON / {user.role === 'admin' ? 'ADMIN' : 'CLIENTE'}</span>
          <button className="logout" type="button" onClick={onLogout}>
            <LogOut size={16} /> Sair
          </button>
        </div>
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Workspace conectado</p>
            <h1>{user.role === 'admin' ? 'Operacao TERON' : 'Seu proximo movimento'}</h1>
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
      <div className="kpi-grid">
        <div className="kpi">
          <span>Diagnosticos enviados</span>
          <strong>{diagnoses.length}</strong>
          <small>visivel para a equipe TERON</small>
        </div>
        <div className="kpi">
          <span>Propostas recebidas</span>
          <strong>{proposals.length}</strong>
          <small>geradas pelo admin</small>
        </div>
        <div className="kpi">
          <span>Status atual</span>
          <strong>{proposals.some((p) => p.status === 'sent') ? 'Proposta' : 'Analise'}</strong>
          <small>atualizado em tempo real</small>
        </div>
      </div>
      <div className="portal-grid">
        <section className="panel diagnosis-form">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Novo diagnostico</p>
              <h2>Conte-nos sobre seu negocio.</h2>
            </div>
            <ClipboardList size={22} />
          </div>
          <p className="body-copy" style={{ marginBottom: 16 }}>
            Prefere o fluxo guiado?{' '}
            <a href="/diagnostico" style={{ color: 'var(--primary)' }}>
              Abrir pagina de diagnostico
            </a>
          </p>
          {sent ? (
            <div className="success-state">
              <Check size={32} />
              <h3>Diagnostico conectado ao painel.</h3>
              <p>A equipe ja recebeu suas respostas.</p>
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
              <Button type="submit">Enviar diagnostico</Button>
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
            <p className="body-copy">Sincronizando...</p>
          ) : proposals.length ? (
            proposals.map((p) => (
              <article className="proposal-card" key={p._id}>
                <FileText size={18} />
                <div>
                  <b>{p.title}</b>
                  <p>{p.scope}</p>
                  <strong>{p.investment}</strong>
                  <span className="badge">{p.status}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <ShieldCheck size={22} />
              <p>Sua proposta aparecera aqui apos a analise do diagnostico.</p>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  )
}

function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [selected, setSelected] = useState<Diagnosis | null>(null)
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [investment, setInvestment] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    try {
      const response = await fetch('/api/diagnoses')
      if (response.ok) setDiagnoses(await response.json())
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const response = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosisId: selected._id,
        clientEmail: selected.clientEmail,
        title,
        scope,
        investment,
      }),
    })
    setMessage(
      response.ok || response.status === 503
        ? 'Proposta salva e vinculada ao cliente.'
        : 'Nao foi possivel salvar a proposta.'
    )
    if (response.ok || response.status === 503) void load()
  }

  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="kpi-grid">
        <div className="kpi">
          <span>Diagnosticos recebidos</span>
          <strong>{diagnoses.length}</strong>
          <small>sincronizados do cliente</small>
        </div>
        <div className="kpi">
          <span>Aguardando analise</span>
          <strong>{diagnoses.filter((d) => d.status === 'new').length}</strong>
          <small>prioridade operacional</small>
        </div>
        <div className="kpi">
          <span>Limite por nicho</span>
          <strong>10</strong>
          <small>perguntas configuraveis</small>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Entrada conectada</p>
              <h2>Diagnosticos</h2>
            </div>
            <button className="panel-button" type="button" onClick={() => void load()}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
          {diagnoses.length ? (
            diagnoses.map((d) => (
              <button
                className="diagnosis-row"
                type="button"
                key={d._id}
                onClick={() => {
                  setSelected(d)
                  setTitle(`Proposta personalizada · ${d.niche}`)
                  setScope(
                    `Estrategia e construcao para ${d.niche}, com base nas respostas enviadas.`
                  )
                  setInvestment('R$ 48.000')
                  setMessage('')
                }}
              >
                <div className="avatar">{d.clientEmail.slice(0, 2).toUpperCase()}</div>
                <div>
                  <b>{d.clientEmail}</b>
                  <span>
                    {d.niche} · {d.answers.length} respostas
                  </span>
                </div>
                <span className="badge">{d.status}</span>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <ShieldCheck size={22} />
              <p>Nenhum diagnostico recebido.</p>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Proposal builder</p>
              <h2>{selected ? 'Criar proposta' : 'Selecione um diagnostico'}</h2>
            </div>
            <Send size={20} />
          </div>
          {selected ? (
            <form onSubmit={send}>
              <div className="selected-lead">
                <b>{selected.clientEmail}</b>
                <span>{selected.niche} · analise das respostas</span>
                {selected.answers.map((a) => (
                  <small key={a.question}>
                    <strong>{a.question}</strong>
                    {a.answer}
                  </small>
                ))}
              </div>
              <label>
                Titulo
                <input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                Escopo
                <textarea required rows={4} value={scope} onChange={(e) => setScope(e.target.value)} />
              </label>
              <label>
                Investimento
                <input required value={investment} onChange={(e) => setInvestment(e.target.value)} />
              </label>
              {message && <p className="success-copy">{message}</p>}
              <Button type="submit">Salvar e enviar ao cliente</Button>
            </form>
          ) : (
            <div className="empty-state">
              <FileText size={22} />
              <p>Escolha um diagnostico para gerar uma proposta.</p>
            </div>
          )}
        </section>
      </div>
    </Shell>
  )
}

function Landing() {
  return (
    <main>
      <header className="topbar">
        <Logo />
        <div className="top-actions">
          <a className="text-link" href="/diagnostico">
            Diagnostico
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
          <p className="eyebrow">TERON / DIGITAL PARTNER</p>
          <h1>Clareza para construir o que vem depois.</h1>
          <p className="hero-sub">
            Diagnosticos, propostas e acompanhamento de projeto em um so lugar.
          </p>
          <div className="hero-actions">
            <a className="btn" href="/diagnostico">
              Fazer diagnostico <ArrowRight size={15} />
            </a>
            <a className="btn btn-secondary" href="/cliente/login">
              Portal do cliente <ArrowRight size={15} />
            </a>
            <a className="btn btn-secondary" href="/admin/login">
              Painel administrativo <ArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="orbital orbital-one" />
          <div className="orbital orbital-two" />
          <div className="hero-card">
            <div className="mini-label">SIGNAL / LIVE</div>
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
              <span>PIPELINE</span>
              <b>READY</b>
            </div>
          </div>
        </div>
      </section>
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

  // Nunca trava a tela inteira: no maximo 2.5s de loading
  if (booting && !user) {
    return (
      <main className="auth-shell">
        <p className="eyebrow">Carregando TERON…</p>
        <div className="hero-actions" style={{ marginTop: 24 }}>
          <a className="btn" href="/cliente/login">
            Portal do cliente
          </a>
          <a className="btn btn-secondary" href="/admin/login">
            Admin
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
