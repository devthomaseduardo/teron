'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { ArrowRight, Check, ClipboardList, FileText, LogOut, RefreshCw, Send, ShieldCheck } from 'lucide-react'

type User = { id: string; email: string; name: string; role: 'admin' | 'client' }
type Diagnosis = { _id: string; clientEmail: string; niche: string; answers: { question: string; answer: string }[]; status: string; createdAt: string }
type Proposal = { _id: string; diagnosisId: string; clientEmail: string; title: string; scope: string; investment: string; timeline?: string; status: string; createdAt: string }
const niches: Record<string, string[]> = { SaaS: ['Qual problema seu produto resolve?', 'Quem é o cliente ideal?', 'Qual o principal diferencial?', 'Em que estágio está o produto?', 'Qual objetivo quer atingir agora?'], Ecom: ['O que você vende?', 'Quem compra de você?', 'Como vende hoje?', 'Qual desafio de conversão?', 'Qual meta para os próximos meses?'], Servicos: ['Qual serviço você oferece?', 'Quem é seu público?', 'Como chegam novos clientes?', 'O que precisa melhorar?', 'Qual resultado espera?'] }

function Logo() { 
  return (
    <a href="/" className="flex items-center gap-2.5 font-bold tracking-[0.18em] text-[15px] hover:opacity-80 transition-opacity">
      <span className="flex items-center justify-center w-7 h-7 border border-primary text-primary rounded-tr-sm rounded-bl-sm rounded-tl-xl rounded-br-xl -rotate-6 text-lg font-light leading-none pt-0.5">
        +
      </span>
      TERON
    </a>
  );
}

function Button({ children, type = 'button', disabled = false, variant = 'primary', onClick }: { children: React.ReactNode; type?: 'button' | 'submit'; disabled?: boolean; variant?: 'primary' | 'secondary'; onClick?: () => void }) { 
  return (
    <button 
      className={`inline-flex items-center justify-center gap-3 px-5 py-3.5 text-xs font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5' : 'bg-transparent text-foreground border border-border hover:bg-secondary hover:border-muted'}`}
      type={type} 
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Shell({ user, onLogout, children }: { user: User; onLogout: () => void; children: React.ReactNode }) { 
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-[240px] flex-col border-r border-border p-6 gap-2 shrink-0">
        <div className="mb-8 pl-3">
          <Logo />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 pl-3 font-mono">
          TERON / {user.role === 'admin' ? 'OPERATIONS' : 'CLIENT'}
        </div>
        <nav className="flex flex-col gap-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 text-xs text-foreground bg-secondary rounded-xl font-medium">
            <span className="text-primary">Visão geral</span>
          </a>
          <a href="/diagnostico" className="flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
            Diagnósticos
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
            Propostas
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
            Projetos
          </a>
        </nav>
        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-secondary text-primary text-[10px] font-mono shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium truncate">{user.name}</span>
            <span className="text-[10px] text-muted-foreground truncate">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 w-full max-w-[1500px] mx-auto p-5 md:p-10 md:pb-24 overflow-x-hidden">
        <header className="flex justify-between items-center mb-10 md:mb-16">
          <span className="text-muted-foreground font-mono text-[11px] md:hidden">TERON / {user.role === 'admin' ? 'ADMIN' : 'CLIENTE'}</span>
          <span className="text-muted-foreground font-mono text-[11px] hidden md:block tracking-wider uppercase">Workspace Integrado</span>
          
          <button onClick={onLogout} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors p-2 md:border md:border-border md:rounded-lg">
            <LogOut size={16} /> <span className="hidden md:inline">Sair</span>
          </button>
        </header>
        
        <div className="mb-10">
          <p className="text-primary font-mono text-[11px] uppercase tracking-[0.15em] mb-4">Dashboard Conectado</p>
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
            {user.role === 'admin' ? 'Operação TERON' : 'Seu próximo movimento'}
          </h1>
        </div>
        
        {children}
      </main>
    </div>
  );
}

function ClientPanel({ user, onLogout }: { user: User; onLogout: () => void }) { 
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]); 
  const [proposals, setProposals] = useState<Proposal[]>([]); 
  const [niche, setNiche] = useState('SaaS'); 
  const [answers, setAnswers] = useState<string[]>(Array(5).fill('')); 
  const [sent, setSent] = useState(false); 
  const [loading, setLoading] = useState(true); 

  async function load() { 
    setLoading(true); 
    const [d, p] = await Promise.all([apiFetch('/api/diagnoses'), apiFetch('/api/proposals')]); 
    setDiagnoses(d.ok ? await d.json() : []); 
    setProposals(p.ok ? await p.json() : []); 
    setLoading(false);
  } 

  useEffect(() => { load() }, []); 

  async function submit(e: React.FormEvent) { 
    e.preventDefault(); 
    const response = await apiFetch('/api/diagnoses', { method: 'POST', body: JSON.stringify({ clientEmail: user.email, niche, answers: niches[niche].map((question, i) => ({ question, answer: answers[i] })) }) }); 
    if (response.ok) { setSent(true); await load() } 
  } 

  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm">
          <span className="block text-muted-foreground font-mono text-[10px] uppercase">Diagnósticos enviados</span>
          <strong className="block text-3xl font-medium mt-4 mb-1">{diagnoses.length}</strong>
          <small className="text-primary font-mono text-[10px]">visível para a equipe</small>
        </div>
        <div className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm">
          <span className="block text-muted-foreground font-mono text-[10px] uppercase">Propostas recebidas</span>
          <strong className="block text-3xl font-medium mt-4 mb-1">{proposals.length}</strong>
          <small className="text-primary font-mono text-[10px]">geradas pelo admin</small>
        </div>
        <div className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm col-span-2 lg:col-span-2 flex flex-col justify-between">
          <span className="block text-muted-foreground font-mono text-[10px] uppercase">Status atual</span>
          <div className="flex items-center gap-3">
             <strong className="block text-3xl font-medium mt-4 mb-1">{proposals.some(p => p.status === 'sent') ? 'Proposta Liberada' : 'Em Análise'}</strong>
             <div className="mt-4 flex h-3 w-3 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
             </div>
          </div>
          <small className="text-muted-foreground font-mono text-[10px]">atualizado em tempo real</small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <section className="bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6">
            <div>
              <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">Novo diagnóstico</p>
              <h2 className="text-2xl font-medium">Conte-nos sobre seu negócio.</h2>
            </div>
            <ClipboardList className="text-muted-foreground hidden sm:block" size={24} />
          </div>
          
          <p className="text-sm text-muted-foreground mb-8">Prefere o fluxo guiado? <a href="/diagnostico" className="text-primary hover:underline underline-offset-4">Abrir página de diagnóstico</a></p>
          
          {sent ? (
            <div className="bg-secondary/50 border border-border rounded-xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-medium mb-3">Diagnóstico conectado ao painel.</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-8">A equipe já recebeu suas respostas e poderá preparar uma proposta personalizada.</p>
              <Button onClick={() => { setSent(false); setAnswers(Array(5).fill('')) }} variant="secondary">Enviar outro</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase">
                Nicho de Mercado
                <select 
                  className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={niche} 
                  onChange={e => { setNiche(e.target.value); setAnswers(Array(5).fill('')) }}
                >
                  {Object.keys(niches).map(n => <option key={n}>{n}</option>)}
                </select>
              </label>
              
              <div className="space-y-6 mt-2">
                {niches[niche].map((question, i) => (
                  <label key={question} className="flex flex-col gap-3 text-sm font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <span className="text-primary font-mono text-xs">{String(i + 1).padStart(2, '0')} —</span> {question}
                    </span>
                    <textarea 
                      required 
                      rows={2} 
                      className="bg-secondary/50 border border-border text-foreground text-sm rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[80px]"
                      value={answers[i]} 
                      onChange={e => setAnswers(a => a.map((x, j) => j === i ? e.target.value : x))} 
                    />
                  </label>
                ))}
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <Button type="submit">
                  <span>Enviar diagnóstico</span>
                  <ArrowRight size={15} />
                </Button>
              </div>
            </form>
          )}
        </section>

        <aside className="bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm h-fit">
          <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6">
            <div>
              <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">Retorno da equipe</p>
              <h3 className="text-xl font-medium">Propostas</h3>
            </div>
            <button className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors" onClick={load}>
              <RefreshCw size={12} /> Atualizar
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Sincronizando com a TERON...</p>
          ) : proposals.length ? (
            <div className="flex flex-col gap-4">
              {proposals.map(p => (
                <article className="border border-border bg-secondary/30 rounded-xl p-5 hover:border-primary/50 transition-colors" key={p._id}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <FileText size={16} className="text-primary" />
                      {p.title}
                    </div>
                    <span className="text-[9px] font-mono uppercase text-primary border border-primary/30 px-2 py-1 rounded bg-primary/5">{p.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.scope}</p>
                  <strong className="block text-lg font-medium">{p.investment}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
              <ShieldCheck size={32} className="opacity-20 mb-4" />
              <p className="text-sm">Sua proposta aparecerá aqui após a análise do diagnóstico.</p>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  )
}

function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) { 
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]); 
  const [selected, setSelected] = useState<Diagnosis | null>(null); 
  const [title, setTitle] = useState(''); 
  const [scope, setScope] = useState(''); 
  const [investment, setInvestment] = useState(''); 
  const [message, setMessage] = useState(''); 

  async function load() { 
    const response = await apiFetch('/api/diagnoses'); 
    if (response.ok) setDiagnoses(await response.json()) 
  } 

  useEffect(() => { load() }, []); 

  async function send(e: React.FormEvent) { 
    e.preventDefault(); 
    if (!selected) return; 
    const response = await apiFetch('/api/proposals', { method: 'POST', body: JSON.stringify({ diagnosisId: selected._id, clientEmail: selected.clientEmail, title, scope, investment }) }); 
    setMessage(response.ok || response.status === 503 ? 'Proposta salva e vinculada ao cliente.' : 'Não foi possível salvar a proposta.'); 
    if (response.ok || response.status === 503) load() 
  } 

  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm">
          <span className="block text-muted-foreground font-mono text-[10px] uppercase">Diagnósticos</span>
          <strong className="block text-3xl font-medium mt-4 mb-1">{diagnoses.length}</strong>
          <small className="text-primary font-mono text-[10px]">sincronizados da base</small>
        </div>
        <div className="bg-card border border-border p-5 md:p-6 rounded-2xl shadow-sm">
          <span className="block text-muted-foreground font-mono text-[10px] uppercase">Aguardando análise</span>
          <strong className="block text-3xl font-medium mt-4 mb-1">{diagnoses.filter(d => d.status === 'new').length}</strong>
          <small className="text-primary font-mono text-[10px]">prioridade operacional</small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        <section className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col h-[700px]">
          <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6 shrink-0">
            <div>
              <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">Entrada Conectada</p>
              <h2 className="text-2xl font-medium">Leads</h2>
            </div>
            <button className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors" onClick={load}>
              <RefreshCw size={12} /> Atualizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {diagnoses.length ? diagnoses.map(d => (
              <button 
                className={`w-full text-left bg-secondary/30 border p-4 rounded-xl transition-all ${selected?._id === d._id ? 'border-primary shadow-[0_0_0_1px_rgba(200,241,105,1)]' : 'border-border hover:border-primary/50'}`} 
                key={d._id} 
                onClick={() => { setSelected(d); setTitle(`Proposta Personalizada · ${d.niche}`); setScope(`Estratégia e construção para ${d.niche}, com base nas respostas enviadas.`); setInvestment('R$ 48.000'); setMessage('')}}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background text-primary text-[10px] font-mono border border-border/50">
                      {d.clientEmail.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <b className="text-sm font-medium">{d.clientEmail}</b>
                      <span className="text-[10px] text-muted-foreground font-mono">{d.niche} · {d.answers.length} resps</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono uppercase border px-2 py-1 rounded ${d.status === 'new' ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground border-border'}`}>{d.status}</span>
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                <ShieldCheck size={32} className="opacity-20 mb-4" />
                <p className="text-sm">Nenhum diagnóstico na fila.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm flex flex-col h-[700px] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-6 shrink-0">
            <div>
              <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">Proposal Builder</p>
              <h2 className="text-2xl font-medium">{selected ? 'Gerar Proposta' : 'Aguardando seleção'}</h2>
            </div>
            <Send className="text-muted-foreground hidden sm:block" size={24} />
          </div>

          {selected ? (
            <div className="flex flex-col gap-8">
              <div className="bg-secondary/30 border border-border rounded-xl p-5">
                <div className="flex flex-col border-b border-border/50 pb-4 mb-4">
                  <b className="text-sm font-medium">{selected.clientEmail}</b>
                  <span className="text-[10px] text-muted-foreground font-mono">{selected.niche} · Análise base</span>
                </div>
                <div className="space-y-4">
                  {selected.answers.map(a => (
                    <div key={a.question} className="flex flex-col gap-1">
                      <strong className="text-xs text-foreground font-medium flex items-start gap-2">
                         <span className="text-primary mt-0.5">•</span> {a.question}
                      </strong>
                      <span className="text-xs text-muted-foreground pl-3">{a.answer}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={send} className="flex flex-col gap-5">
                <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase">
                  Título da Proposta
                  <input required className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={title} onChange={e => setTitle(e.target.value)} />
                </label>
                
                <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase">
                  Escopo e Entregáveis
                  <textarea required rows={4} className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[100px]" value={scope} onChange={e => setScope(e.target.value)} />
                </label>
                
                <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase">
                  Investimento Estimado
                  <input required className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={investment} onChange={e => setInvestment(e.target.value)} />
                </label>
                
                {message && <p className="text-sm text-primary bg-primary/10 border border-primary/20 p-3 rounded-xl">{message}</p>}
                
                <div className="pt-2">
                  <Button type="submit">
                    <span>Salvar e enviar ao cliente</span>
                    <Send size={15} />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
              <FileText size={32} className="opacity-20 mb-4" />
              <p className="text-sm max-w-xs">Escolha um diagnóstico na fila para analisar as respostas e estruturar a proposta.</p>
            </div>
          )}
        </section>
      </div>
    </Shell>
  )
}

export default function Page() { 
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => { 
    apiFetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { 
        setUser(data?.user ?? null); 
        setLoading(false);
      });
  }, []); 

  async function logout() { 
    await apiFetch('/api/auth/login', { method: 'DELETE' }); 
    setUser(null);
  } 

  if (loading) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-mono text-[11px] uppercase tracking-widest animate-pulse">Sincronizando workspace...</p>
      </div>
    </main>
  ); 

  if (!user) return (
    <main className="min-h-screen bg-background overflow-hidden flex flex-col">
      <header className="flex items-center justify-between h-[82px] w-full max-w-7xl mx-auto px-6 md:px-8 border-b border-border">
        <Logo />
        <div className="flex items-center gap-8">
          <a className="text-xs font-medium text-muted-foreground hover:text-foreground hidden md:block transition-colors" href="/diagnostico">Diagnóstico</a>
          <a className="text-xs font-medium text-muted-foreground hover:text-foreground hidden md:block transition-colors" href="/cliente/login">Portal do Cliente</a>
          <a className="text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-lg transition-colors" href="/admin/login">Admin</a>
        </div>
      </header>

      <section className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 md:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
        <div className="z-10">
          <p className="text-primary font-mono text-[11px] uppercase tracking-[0.15em] mb-6 inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-primary"></span>
            TERON / Digital Partner
          </p>
          <h1 className="text-[clamp(40px,5vw,72px)] leading-[1.05] tracking-[-0.04em] font-normal mb-8 max-w-2xl text-foreground">
            Clareza para construir o que <span className="text-muted-foreground italic font-serif">vem depois.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-10">
            Entre no portal correto para acompanhar os diagnósticos, aprovar propostas e observar o desenvolvimento dos projetos.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <a href="/diagnostico">
              <Button>
                <span>Fazer diagnóstico</span>
                <ArrowRight size={15} />
              </Button>
            </a>
            <a href="/cliente/login">
              <Button variant="secondary">
                <span>Portal do cliente</span>
              </Button>
            </a>
          </div>
        </div>

        <div className="hidden lg:flex justify-center items-center relative w-full h-[500px]">
          {/* Visual Decorators - Orbitals */}
          <div className="absolute w-[440px] h-[440px] border border-border rounded-full flex items-center justify-center opacity-30 animate-[spin_40s_linear_infinite]">
            <div className="w-3 h-3 bg-primary rounded-full absolute -top-1.5 shadow-[0_0_15px_rgba(200,241,105,0.8)]"></div>
          </div>
          <div className="absolute w-[300px] h-[300px] border border-border border-dashed rounded-full flex items-center justify-center opacity-30 animate-[spin_25s_linear_infinite_reverse]">
            <div className="w-2 h-2 bg-muted-foreground rounded-full absolute -bottom-1"></div>
          </div>

          {/* Central Card */}
          <div className="relative bg-[#101312] border border-border p-8 rounded-2xl w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-10">
              <span className="text-[10px] font-mono text-muted-foreground">ANÁLISE DE <br/> DADOS</span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              </div>
            </div>

            {/* Signal Bars */}
            <div className="flex items-end gap-2.5 h-[120px] mb-8 w-full">
               <div className="w-full bg-primary/30 h-[25%] rounded-t-sm hover:bg-primary transition-colors"></div>
               <div className="w-full bg-primary/50 h-[45%] rounded-t-sm hover:bg-primary transition-colors"></div>
               <div className="w-full bg-primary/70 h-[75%] rounded-t-sm hover:bg-primary transition-colors"></div>
               <div className="w-full bg-primary h-[95%] rounded-t-sm shadow-[0_0_10px_rgba(200,241,105,0.3)]"></div>
               <div className="w-full bg-primary/80 h-[65%] rounded-t-sm hover:bg-primary transition-colors"></div>
               <div className="w-full bg-primary/40 h-[35%] rounded-t-sm hover:bg-primary transition-colors"></div>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
               <span>SYS_STATUS</span>
               <span className="text-primary tracking-widest bg-primary/10 px-2 py-1 rounded">ONLINE</span>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 text-[9px] font-mono text-muted-foreground tracking-widest rotate-90 origin-bottom-right opacity-50">
            [ TRN-CORE-V2 ]
          </div>
        </div>
      </section>
    </main>
  ); 

  return user.role === 'admin' ? <AdminPanel user={user} onLogout={logout} /> : <ClientPanel user={user} onLogout={logout} /> 
}

