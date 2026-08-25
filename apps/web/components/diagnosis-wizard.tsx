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
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-primary font-mono text-[11px] uppercase tracking-widest animate-pulse">Preparando diagnóstico...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full max-w-7xl mx-auto px-6 md:px-8 h-[82px] flex items-center justify-between border-b border-border/50">
        <a href="/" className="flex items-center gap-2.5 font-bold tracking-[0.18em] text-[15px] hover:opacity-80 transition-opacity">
          <span className="flex items-center justify-center w-7 h-7 border border-primary text-primary rounded-tr-sm rounded-bl-sm rounded-tl-xl rounded-br-xl -rotate-6 text-lg font-light leading-none pt-0.5">+</span> TERON
        </a>
        <div className="flex items-center gap-6">
          {user ? (
            <a className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" href="/">Voltar ao portal</a>
          ) : (
            <>
              <a className="text-xs font-medium text-muted-foreground hover:text-foreground hidden sm:block transition-colors" href="/cliente/login">Portal do cliente</a>
              <a className="text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-lg transition-colors" href="/admin/login">Equipe</a>
            </>
          )}
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-[0.8fr_1fr] gap-12 lg:gap-24 items-start">
        <aside className="flex flex-col items-start pt-4">
          <p className="text-primary font-mono text-[11px] uppercase tracking-[0.15em] mb-6 inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-primary"></span>
            TERON / DIAGNÓSTICO
          </p>
          <h1 className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.04em] font-medium mb-8 text-foreground">
            Clareza antes<br />
            <em className="text-muted-foreground italic font-serif">da proposta.</em>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-sm">
            Cinco perguntas por nicho. A equipe TERON usa suas respostas para montar escopo, investimento e próximos passos.
          </p>
          <div className="mt-8 flex items-center gap-3 text-muted-foreground font-mono text-[11px] bg-secondary/50 px-4 py-2 rounded-lg border border-border uppercase tracking-wider">
            <ClipboardList size={16} className="text-primary" />
            <span>~3 minutos · sem compromisso</span>
          </div>
        </aside>

        <section className="relative w-full bg-card border border-border rounded-2xl shadow-xl p-6 md:p-10 min-h-[500px] flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>

          {done ? (
            <div className="flex flex-col items-start pt-8 h-full">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 border border-primary/20">
                <Check size={36} />
              </div>
              <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">Diagnóstico enviado</p>
              <h2 className="text-3xl font-medium mb-4">Recebemos suas respostas.</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-10">
                A equipe TERON vai analisar o nicho <strong className="text-foreground">{niche}</strong> e montar uma proposta vinculada a <strong className="text-foreground">{email}</strong>.
              </p>
              <div className="flex flex-wrap gap-4 mt-auto">
                <a className="inline-flex items-center justify-center gap-3 px-5 py-3.5 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 transition-all" href={user ? '/' : '/cliente/login'}>
                  {user ? 'Ir ao portal' : 'Acessar portal do cliente'} <ArrowRight size={15} />
                </a>
                <button type="button" className="inline-flex items-center justify-center gap-3 px-5 py-3.5 text-xs font-bold rounded-full bg-transparent text-foreground border border-border hover:bg-secondary hover:border-muted transition-all" onClick={restart}>
                  Enviar outro
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {step === 0 && (
                <div className="flex-1">
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider mb-4">01 / {String(totalSteps).padStart(2, '0')}</p>
                  <h2 className="text-2xl font-medium mb-3">Qual é o seu contexto?</h2>
                  <p className="text-muted-foreground text-sm mb-8">Escolha o nicho para carregar as perguntas certas.</p>
                  
                  <div className="flex flex-col gap-3">
                    {NICHE_KEYS.map((key, i) => (
                      <button
                        key={key}
                        type="button"
                        className={`text-left flex items-center p-4 rounded-xl border transition-all ${niche === key ? 'border-primary bg-primary/5 text-primary shadow-[0_0_0_1px_rgba(200,241,105,1)]' : 'border-border bg-secondary/30 hover:border-primary/50 text-foreground'}`}
                        onClick={() => setNiche(key)}
                      >
                        <span className="text-muted-foreground font-mono text-[10px] mr-4">{String(i + 1).padStart(2, '0')}</span>
                        <span className="font-medium text-sm flex-1">{key}</span>
                        {niche === key && <Check size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step >= 1 && step <= questions.length && (
                <div className="flex-1">
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider mb-4">
                    {String(step + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')} · {niche}
                  </p>
                  <h2 className="text-2xl font-medium mb-8 leading-snug max-w-md">{questions[step - 1]}</h2>
                  
                  <label className="flex flex-col gap-3">
                    <span className="text-primary font-mono text-[11px] uppercase tracking-wider">Sua resposta</span>
                    <textarea
                      required
                      rows={5}
                      value={answers[step - 1] || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setAnswers((prev) => prev.map((a, i) => (i === step - 1 ? value : a)))
                      }}
                      placeholder="Seja direto — contexto, números e restrições ajudam."
                      className="bg-secondary/50 border border-border text-foreground text-sm font-sans rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[140px]"
                    />
                  </label>
                </div>
              )}

              {needsEmail && step === totalSteps - 1 && !done && (
                <div className="flex-1">
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider mb-4">
                    {String(totalSteps).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
                  </p>
                  <h2 className="text-2xl font-medium mb-3">Para onde enviamos o retorno?</h2>
                  <p className="text-muted-foreground text-sm mb-8">Usamos o e-mail para vincular a proposta ao portal do cliente.</p>
                  
                  <label className="flex flex-col gap-3">
                    <span className="text-primary font-mono text-[11px] uppercase tracking-wider">E-mail corporativo</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      className="bg-secondary/50 border border-border text-foreground text-sm font-sans rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </label>
                </div>
              )}

              {error && (
                <p className="text-sm text-[#f0a39b] bg-[#f0a39b]/10 border border-[#f0a39b]/20 p-3 rounded-xl mt-4" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-between items-center mt-10 pt-6 border-t border-border/50">
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={goBack}
                  disabled={step === 0 || pending}
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <small className="text-muted-foreground font-mono text-[10px] uppercase hidden sm:block">
                  {done ? '100%' : `${progress}%`} · {niche}
                </small>
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={goNext} 
                  disabled={pending}
                >
                  {pending
                    ? 'Enviando...'
                    : step === totalSteps - 1 || (step === questions.length && !needsEmail)
                      ? 'Enviar diagnóstico'
                      : 'Continuar'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
