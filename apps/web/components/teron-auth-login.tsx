'use client'

import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export type LoginRole = 'client' | 'admin'

export function TeronAuthLogin({ role }: { role: LoginRole }) {
  const isAdmin = role === 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Nao foi possivel entrar.')
      window.location.href = '/'
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Nao foi possivel entrar.')
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center">
      <header className="w-full max-w-7xl mx-auto px-6 md:px-8 h-[82px] flex items-center justify-start border-b border-border/50">
        <a href="/" className="flex items-center gap-2.5 font-bold tracking-[0.18em] text-[15px] hover:opacity-80 transition-opacity">
          <span className="flex items-center justify-center w-7 h-7 border border-primary text-primary rounded-tr-sm rounded-bl-sm rounded-tl-xl rounded-br-xl -rotate-6 text-lg font-light leading-none pt-0.5">
            +
          </span>
          TERON
        </a>
      </header>
      
      <div className="w-full max-w-[480px] mx-auto mt-12 md:mt-24 p-8 md:p-10 bg-card border border-border rounded-2xl shadow-xl flex flex-col items-start mx-4">
        <div className="w-12 h-12 rounded-xl border border-primary text-primary flex items-center justify-center mb-8 bg-primary/5">
          <LockKeyhole size={20} />
        </div>
        
        <p className="text-primary font-mono text-[11px] uppercase tracking-wider mb-2">TERON / {isAdmin ? 'EQUIPE' : 'CLIENTE'}</p>
        <h1 className="text-3xl font-medium mb-3 tracking-tight">{isAdmin ? 'Acesso administrativo' : 'Portal do cliente'}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">{isAdmin ? 'Acompanhe diagnósticos, propostas e a operação da TERON.' : 'Acesse seu diagnóstico, proposta e evolução do projeto.'}</p>
        
        <form onSubmit={submit} className="w-full flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            E-mail
            <input 
              type="email" 
              required 
              className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              placeholder={isAdmin ? 'equipe@teron.studio' : 'voce@empresa.com'} 
              autoComplete="email" 
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Senha
            <input 
              type="password" 
              required 
              className="bg-secondary border border-border text-foreground text-sm font-sans rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              placeholder="Sua senha" 
              autoComplete="current-password" 
            />
          </label>
          
          {error && <p className="text-sm text-[#f0a39b] bg-[#f0a39b]/10 border border-[#f0a39b]/20 p-3 rounded-xl mt-1" role="alert">{error}</p>}
          
          <button 
            className="mt-2 w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
            type="submit" 
            disabled={pending}
          >
            {pending ? 'Validando acesso…' : 'Entrar'} <ArrowRight size={15} />
          </button>
        </form>
        
        <div className="w-full mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-muted-foreground">
          <span>{isAdmin ? 'É cliente?' : 'Faz parte da equipe?'}</span>
          <a className="text-primary hover:underline underline-offset-4" href={isAdmin ? '/cliente/login' : '/admin/login'}>
            {isAdmin ? 'Ir para portal do cliente' : 'Ir para acesso administrativo'}
          </a>
        </div>
      </div>
    </main>
  )
}
