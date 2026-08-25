'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, FileText, ShieldCheck, X } from 'lucide-react'

type PublicProposal = {
  id: string
  title: string
  scope: string
  investment: string
  timeline: string | null
  status: string
  paymentStatus: string | null
  signalAmount: number | null
  clientEmail: string
  createdAt: string
  sentAt: string | null
  approvedAt?: string | null
}

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}

export function ProposalRoom({ token }: { token: string }) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`/api/proposals/public/${token}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Proposta nao encontrada.')
      setProposal(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.')
      setProposal(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function respond(action: 'approve' | 'reject') {
    setPending(true)
    setMessage('')
    setError('')
    try {
      const res = await apiFetch(`/api/proposals/public/${token}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Nao foi possivel responder.')
      setMessage(
        action === 'approve'
          ? data.project?.created
            ? 'Proposta aprovada. Projeto criado na TERON.'
            : 'Proposta aprovada.'
          : 'Proposta recusada. A equipe foi notificada.'
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao responder.')
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <main className="auth-shell">
        <p className="eyebrow">Abrindo Proposal Room...</p>
      </main>
    )
  }

  if (error && !proposal) {
    return (
      <main className="auth-shell">
        <a href="/" className="logo" style={{ marginBottom: 32 }}>
          <span className="logo-mark">+</span> TERON
        </a>
        <div className="panel" style={{ maxWidth: 420, width: '100%', padding: 28 }}>
          <ShieldCheck size={28} />
          <h2 style={{ marginTop: 16 }}>Link invalido ou expirado</h2>
          <p className="body-copy" style={{ marginTop: 12 }}>
            {error}
          </p>
          <a className="btn" href="/" style={{ marginTop: 24 }}>
            Voltar ao inicio
          </a>
        </div>
      </main>
    )
  }

  if (!proposal) return null

  const closed = proposal.status === 'approved' || proposal.status === 'rejected'
  const canRespond = proposal.status === 'sent' || proposal.status === 'draft'

  return (
    <main className="diagnosis">
      <header className="topbar" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <a href="/" className="logo">
          <span className="logo-mark">+</span> TERON
        </a>
        <div className="top-actions">
          <span className="badge">{proposal.status}</span>
          <a className="text-link" href="/cliente/login">
            Portal do cliente
          </a>
        </div>
      </header>

      <div
        className="diagnosis"
        style={{
          paddingTop: 40,
          gridTemplateColumns: '1fr',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <section className="panel" style={{ padding: 32 }}>
          <p className="eyebrow">TERON / PROPOSAL ROOM</p>
          <h1 style={{ marginTop: 12, fontSize: 'clamp(28px, 4vw, 40px)' }}>{proposal.title}</h1>
          <p className="body-copy" style={{ marginTop: 8 }}>
            Preparada para <strong>{proposal.clientEmail}</strong>
          </p>

          <div className="kpi-grid" style={{ marginTop: 28 }}>
            <div className="kpi">
              <span>Investimento</span>
              <strong style={{ fontSize: 22 }}>{proposal.investment}</strong>
            </div>
            <div className="kpi">
              <span>Timeline</span>
              <strong style={{ fontSize: 18 }}>{proposal.timeline || 'A definir'}</strong>
            </div>
            <div className="kpi">
              <span>Status</span>
              <strong style={{ fontSize: 18 }}>{proposal.status}</strong>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Escopo</p>
                <h3>O que esta incluso</h3>
              </div>
              <FileText size={20} />
            </div>
            <p className="body-copy" style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {proposal.scope}
            </p>
          </div>

          {message && (
            <div className="success-state" style={{ marginTop: 28 }}>
              <Check size={28} />
              <p>{message}</p>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </p>
          )}

          {closed && (
            <div className="empty-state" style={{ marginTop: 28 }}>
              <ShieldCheck size={22} />
              <p>
                {proposal.status === 'approved'
                  ? 'Voce ja aprovou esta proposta. A equipe TERON dara sequencia ao projeto.'
                  : 'Esta proposta foi recusada.'}
              </p>
            </div>
          )}

          {canRespond && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => void respond('approve')}
              >
                {pending ? 'Processando...' : 'Aprovar proposta'} <Check size={15} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pending}
                onClick={() => void respond('reject')}
              >
                Recusar <X size={15} />
              </button>
            </div>
          )}

          <p className="body-copy" style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
            Link seguro da Proposal Room. Nao e necessario login para responder.
          </p>
        </section>
      </div>
    </main>
  )
}
