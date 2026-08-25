'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ClipboardList } from 'lucide-react'
import { apiFetch } from '@/lib/api'

type User = { id: string; email: string; name: string; role: 'admin' | 'client' }

const NICHES: Record<string, string[]> = {
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
  Marketplace: [
    'Qual tipo de oferta conecta o seu marketplace?',
    'Quem sao os dois lados da plataforma?',
    'Como gera liquidez hoje?',
    'Qual o maior gargalo operacional?',
    'Qual metricas de sucesso em 90 dias?',
  ],
}

const NICHE_KEYS = Object.keys(NICHES)

export function DiagnosisWizard() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [step, setStep] = useState(0) // 0 = nicho, 1..n = perguntas, n+1 = email se necessario, last = sucesso
  const [niche, setNiche] = useState('SaaS')
  const [answers, setAnswers] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const questions = useMemo(() => NICHES[niche] || [], [niche])
  const needsEmail = !user
  const totalSteps = 1 + questions.length + (needsEmail ? 1 : 0) // nicho + perguntas + email opcional
  const progress = done ? 100 : Math.round((step / totalSteps) * 100)

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        if (data?.user?.email) setEmail(data.user.email)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    setAnswers(Array(questions.length).fill(''))
  }, [questions.length, niche])

  function goNext() {
    setError('')
    if (step === 0) {
      setStep(1)
      return
    }
    const questionIndex = step - 1
    if (questionIndex < questions.length) {
      if (!answers[questionIndex]?.trim()) {
        setError('Responda antes de continuar.')
        return
      }
      if (questionIndex === questions.length - 1) {
        if (needsEmail) setStep(step + 1)
        else void submit()
        return
      }
      setStep(step + 1)
      return
    }
    // email step
    if (needsEmail && step === totalSteps - 1) {
      if (!email.trim() || !email.includes('@')) {
        setError('Informe um e-mail valido.')
        return
      }
      void submit()
    }
  }

  function goBack() {
    setError('')
    if (step > 0) setStep(step - 1)
  }

  async function submit() {
    setPending(true)
    setError('')
    try {
      const payload = {
        clientEmail: email.trim().toLowerCase(),
        niche,
        answers: questions.map((question, i) => ({
          question,
          answer: answers[i] || '',
        })),
      }
      const response = await apiFetch('/api/diagnoses', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Nao foi possivel enviar o diagnostico.')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar.')
    } finally {
      setPending(false)
    }
  }

  function restart() {
    setStep(0)
    setNiche('SaaS')
    setAnswers([])
    setError('')
    setDone(false)
    if (!user) setEmail('')
  }

  if (authLoading) {
    return (
      <main className="auth-shell">
        <p className="eyebrow">Preparando diagnostico...</p>
      </main>
    )
  }

  return (
    <main className="diagnosis">
      <header className="topbar" style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <a href="/" className="logo">
          <span className="logo-mark">+</span> TERON
        </a>
        <div className="top-actions">
          {user ? (
            <a className="text-link" href="/">
              Voltar ao portal
            </a>
          ) : (
            <>
              <a className="text-link" href="/cliente/login">
                Portal do cliente
              </a>
              <a className="text-link" href="/admin/login">
                Equipe
              </a>
            </>
          )}
        </div>
      </header>

      <div className="diagnosis" style={{ paddingTop: 40 }}>
        <aside className="diagnosis-intro">
          <p className="eyebrow">TERON / DIAGNOSTICO</p>
          <h1>
            Clareza antes
            <br />
            <em>da proposta.</em>
          </h1>
          <p>
            Cinco perguntas por nicho. A equipe TERON usa suas respostas para montar escopo,
            investimento e proximos passos.
          </p>
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12 }}>
            <ClipboardList size={16} />
            <span>~3 minutos · sem compromisso</span>
          </div>
        </aside>

        <section className="wizard panel">
          <div className="wizard-progress">
            <i style={{ width: `${progress}%` }} />
          </div>

          {done ? (
            <div className="diagnosis-result">
              <Check size={36} />
              <p className="eyebrow">Diagnostico enviado</p>
              <h2>Recebemos suas respostas.</h2>
              <p className="body-copy">
                A equipe TERON vai analisar o nicho <strong>{niche}</strong> e montar uma proposta
                vinculada a <strong>{email}</strong>.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
                <a className="btn" href={user ? '/' : '/cliente/login'}>
                  {user ? 'Ir ao portal' : 'Acessar portal do cliente'} <ArrowRight size={15} />
                </a>
                <button type="button" className="btn btn-secondary" onClick={restart}>
                  Enviar outro
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <>
                  <p className="question-count">01 / {String(totalSteps).padStart(2, '0')}</p>
                  <h2>Qual e o seu contexto?</h2>
                  <p className="body-copy" style={{ marginTop: 12 }}>
                    Escolha o nicho para carregar as perguntas certas.
                  </p>
                  <div className="choice-list">
                    {NICHE_KEYS.map((key, i) => (
                      <button
                        key={key}
                        type="button"
                        className={niche === key ? 'choice-selected' : ''}
                        onClick={() => setNiche(key)}
                      >
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        {key}
                        {niche === key && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step >= 1 && step <= questions.length && (
                <>
                  <p className="question-count">
                    {String(step + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')} · {niche}
                  </p>
                  <h2>{questions[step - 1]}</h2>
                  <label style={{ display: 'block', marginTop: 28 }}>
                    <span className="eyebrow">Sua resposta</span>
                    <textarea
                      required
                      rows={5}
                      value={answers[step - 1] || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setAnswers((prev) => prev.map((a, i) => (i === step - 1 ? value : a)))
                      }}
                      placeholder="Seja direto — contexto, numeros e restricoes ajudam."
                      style={{
                        width: '100%',
                        marginTop: 10,
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        background: 'var(--secondary)',
                        color: 'var(--foreground)',
                        padding: 14,
                        font: '14px/1.5 Arial, sans-serif',
                        resize: 'vertical',
                      }}
                    />
                  </label>
                </>
              )}

              {needsEmail && step === totalSteps - 1 && !done && (
                <>
                  <p className="question-count">
                    {String(totalSteps).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
                  </p>
                  <h2>Para onde enviamos o retorno?</h2>
                  <p className="body-copy" style={{ marginTop: 12 }}>
                    Usamos o e-mail para vincular a proposta ao portal do cliente.
                  </p>
                  <label style={{ display: 'block', marginTop: 28 }}>
                    <span className="eyebrow">E-mail</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      style={{
                        width: '100%',
                        marginTop: 10,
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        background: 'var(--secondary)',
                        color: 'var(--foreground)',
                        padding: 14,
                        font: '14px Arial, sans-serif',
                      }}
                    />
                  </label>
                </>
              )}

              {error && (
                <p className="form-error" role="alert" style={{ marginTop: 16 }}>
                  {error}
                </p>
              )}

              <div className="wizard-footer">
                <button
                  type="button"
                  className="panel-button"
                  onClick={goBack}
                  disabled={step === 0 || pending}
                  style={{ opacity: step === 0 ? 0.4 : 1 }}
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <small>
                  {done ? '100%' : `${progress}%`} · {niche}
                </small>
                <button type="button" className="btn" onClick={goNext} disabled={pending}>
                  {pending
                    ? 'Enviando...'
                    : step === totalSteps - 1 || (step === questions.length && !needsEmail)
                      ? 'Enviar diagnostico'
                      : 'Continuar'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
