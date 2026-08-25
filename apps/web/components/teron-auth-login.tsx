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
    <main className="auth-shell">
      <header className="topbar"><a href="/" className="logo"><span className="logo-mark">+</span> TERON</a></header>
      <div className="auth-card panel">
        <div className="auth-icon"><LockKeyhole size={20} /></div>
        <p className="eyebrow">TERON / {isAdmin ? 'EQUIPE' : 'CLIENTE'}</p>
        <h1>{isAdmin ? 'Acesso administrativo' : 'Portal do cliente'}</h1>
        <p className="body-copy">{isAdmin ? 'Acompanhe diagnosticos, propostas e a operacao da TERON.' : 'Acesse seu diagnostico, proposta e evolucao do projeto.'}</p>
        <form onSubmit={submit} className="auth-form">
          <label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={isAdmin ? 'equipe@teron.studio' : 'voce@empresa.com'} autoComplete="email" /></label>
          <label>Senha<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" autoComplete="current-password" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={pending}>{pending ? 'Validando acesso…' : 'Entrar'} <ArrowRight size={15} /></button>
        </form>
        <div className="auth-switch"><span>{isAdmin ? 'E cliente?' : 'Faz parte da equipe?'}</span><a href={isAdmin ? '/cliente/login' : '/admin/login'}>{isAdmin ? 'Ir para portal do cliente' : 'Ir para acesso administrativo'}</a></div>
      </div>
    </main>
  )
}
