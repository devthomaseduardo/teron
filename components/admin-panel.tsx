'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import { TeronLogo } from '@/components/teron-logo'

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

type Tab = 'diagnoses' | 'proposals'

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function statusLabel(status: string) {
  if (status === 'new') return 'Novo'
  if (status === 'reviewed') return 'Revisado'
  if (status === 'proposal_sent') return 'Proposta enviada'
  if (status === 'sent') return 'Enviada'
  if (status === 'draft') return 'Rascunho'
  return status
}

export function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selected, setSelected] = useState<Diagnosis | null>(null)
  const [tab, setTab] = useState<Tab>('diagnoses')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'proposal_sent'>('all')
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [investment, setInvestment] = useState('R$ 48.000')
  const [timeline, setTimeline] = useState('6–8 semanas')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, pRes] = await Promise.all([fetch('/api/diagnoses'), fetch('/api/proposals')])
      if (dRes.ok) setDiagnoses(await dRes.json())
      if (pRes.ok) setProposals(await pRes.json())
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return diagnoses.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (!q) return true
      return (
        d.clientEmail.toLowerCase().includes(q) ||
        d.niche.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
      )
    })
  }, [diagnoses, query, statusFilter])

  function selectDiagnosis(d: Diagnosis) {
    setSelected(d)
    setTitle(`Proposta personalizada · ${d.niche}`)
    setScope(
      `Estratégia e construção digital para ${d.niche}, com base nas respostas do diagnóstico. Inclui discovery, arquitetura, interface e acompanhamento.`
    )
    setInvestment('R$ 48.000')
    setTimeline('6–8 semanas')
    setMessage('')
    setTab('diagnoses')
    setMenuOpen(false)
  }

  async function markReviewed() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/diagnoses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected._id, status: 'reviewed' }),
      })
      if (res.ok) {
        setMessage('Diagnóstico marcado como revisado.')
        setSelected({ ...selected, status: 'reviewed' })
        await load()
      } else {
        setMessage('Não foi possível atualizar o status.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId: selected._id,
          clientEmail: selected.clientEmail,
          title,
          scope,
          investment,
          timeline,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setMessage(data.message || 'Proposta salva e vinculada ao cliente.')
        setSelected({ ...selected, status: 'proposal_sent' })
        await load()
      } else {
        setMessage(data.message || data.error || 'Não foi possível salvar a proposta.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={`workspace admin-workspace${menuOpen ? ' menu-open' : ''}`}>
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className="admin-aside">
        <TeronLogo height={26} />
        <div className="workspace-label">TERON / OPERATIONS</div>
        <nav className="side-nav">
          <button
            type="button"
            className={tab === 'diagnoses' ? 'side-active' : ''}
            onClick={() => {
              setTab('diagnoses')
              setMenuOpen(false)
            }}
          >
            <ClipboardList size={16} /> Diagnósticos
          </button>
          <button
            type="button"
            className={tab === 'proposals' ? 'side-active' : ''}
            onClick={() => {
              setTab('proposals')
              setMenuOpen(false)
            }}
          >
            <FileText size={16} /> Propostas
          </button>
        </nav>
        <div className="side-bottom">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <span>
            {user.name}
            <br />
            <small>Administrador</small>
          </span>
        </div>
      </aside>

      <section className="workspace-main">
        <div className="workspace-top">
          <span className="back">TERON / ADMIN</span>
          <button className="logout" type="button" onClick={onLogout}>
            <LogOut size={16} /> Sair
          </button>
        </div>

        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Workspace conectado</p>
            <h1>Operação TERON</h1>
          </div>
          <button className="panel-button" type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : undefined} /> Atualizar
          </button>
        </div>

        <div className="kpi-grid admin-kpi">
          <div className="kpi">
            <span>Diagnósticos</span>
            <strong>{diagnoses.length}</strong>
            <small>total recebido</small>
          </div>
          <div className="kpi">
            <span>Aguardando</span>
            <strong>{diagnoses.filter((d) => d.status === 'new').length}</strong>
            <small>prioridade</small>
          </div>
          <div className="kpi">
            <span>Revisados</span>
            <strong>{diagnoses.filter((d) => d.status === 'reviewed').length}</strong>
            <small>em análise</small>
          </div>
          <div className="kpi">
            <span>Propostas</span>
            <strong>{proposals.length}</strong>
            <small>enviadas / salvas</small>
          </div>
        </div>

        {tab === 'diagnoses' && (
          <>
            <div className="admin-toolbar">
              <label className="search-field">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar e-mail, nicho…"
                />
              </label>
              <div className="filter-chips">
                {(['all', 'new', 'reviewed', 'proposal_sent'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={statusFilter === s ? 'chip active' : 'chip'}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Todos' : statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Fila</p>
                    <h2>Diagnósticos</h2>
                  </div>
                  <span className="muted-count">{filtered.length}</span>
                </div>

                {loading ? (
                  <p className="body-copy">Carregando…</p>
                ) : filtered.length ? (
                  <div className="diagnosis-list">
                    {filtered.map((d) => (
                      <button
                        className={`diagnosis-row${selected?._id === d._id ? ' selected' : ''}`}
                        type="button"
                        key={d._id}
                        onClick={() => selectDiagnosis(d)}
                      >
                        <div className="avatar">{d.clientEmail.slice(0, 2).toUpperCase()}</div>
                        <div className="diagnosis-meta">
                          <b>{d.clientEmail}</b>
                          <span>
                            {d.niche} · {d.answers?.length || 0} respostas · {formatDate(d.createdAt)}
                          </span>
                        </div>
                        <span className={`badge badge-${d.status}`}>{statusLabel(d.status)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ShieldCheck size={22} />
                    <p>Nenhum diagnóstico neste filtro.</p>
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Proposal builder</p>
                    <h2>{selected ? 'Criar proposta' : 'Selecione um diagnóstico'}</h2>
                  </div>
                  <Send size={20} />
                </div>

                {selected ? (
                  <form className="proposal-form" onSubmit={sendProposal}>
                    <div className="selected-lead">
                      <div className="selected-lead-top">
                        <div>
                          <b>{selected.clientEmail}</b>
                          <span>
                            {selected.niche} · {statusLabel(selected.status)}
                          </span>
                        </div>
                        {selected.status === 'new' && (
                          <button
                            type="button"
                            className="panel-button"
                            disabled={saving}
                            onClick={() => void markReviewed()}
                          >
                            <CheckCircle2 size={14} /> Marcar revisado
                          </button>
                        )}
                      </div>
                      <div className="answers-scroll">
                        {selected.answers?.map((a) => (
                          <small key={a.question}>
                            <strong>{a.question}</strong>
                            {a.answer}
                          </small>
                        ))}
                      </div>
                    </div>

                    <label>
                      Título
                      <input required value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label>
                      Escopo
                      <textarea required rows={4} value={scope} onChange={(e) => setScope(e.target.value)} />
                    </label>
                    <div className="form-row-2">
                      <label>
                        Investimento
                        <input
                          required
                          value={investment}
                          onChange={(e) => setInvestment(e.target.value)}
                        />
                      </label>
                      <label>
                        Prazo
                        <input value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                      </label>
                    </div>

                    {message && <p className="success-copy">{message}</p>}

                    <button className="btn" type="submit" disabled={saving}>
                      {saving ? 'Salvando…' : 'Salvar e enviar ao cliente'}
                      <ArrowRight size={15} />
                    </button>
                  </form>
                ) : (
                  <div className="empty-state">
                    <FileText size={22} />
                    <p>Escolha um diagnóstico à esquerda para analisar e gerar a proposta.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {tab === 'proposals' && (
          <section className="panel proposals-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Histórico</p>
                <h2>Propostas</h2>
              </div>
              <span className="muted-count">{proposals.length}</span>
            </div>
            {loading ? (
              <p className="body-copy">Carregando…</p>
            ) : proposals.length ? (
              <div className="proposals-table">
                {proposals.map((p) => (
                  <article className="proposal-card admin-proposal" key={p._id}>
                    <FileText size={18} />
                    <div>
                      <b>{p.title}</b>
                      <span className="proposal-sub">
                        {p.clientEmail} · {formatDate(p.createdAt)}
                      </span>
                      <p>{p.scope}</p>
                      <div className="proposal-foot">
                        <strong>{p.investment}</strong>
                        {p.timeline && <em>{p.timeline}</em>}
                        <span className="badge">{statusLabel(p.status)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={22} />
                <p>Nenhuma proposta ainda. Gere a partir de um diagnóstico.</p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
