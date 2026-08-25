/**
 * Tipos compartilhados entre @teron/api e @teron/web
 * Extraidos de lib/mongodb.ts do monolitо original.
 */

export type UserRole = 'admin' | 'client'

export type TeronUser = {
  _id?: string
  email: string
  name: string
  role: UserRole
  /** Demo: texto simples. Producao: hash (bcrypt/argon2). */
  passwordHash: string
  createdAt: Date | string
}

export type SafeUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type Diagnosis = {
  _id?: string
  clientId: string
  clientEmail: string
  niche: string
  answers: { question: string; answer: string }[]
  status: 'new' | 'reviewed' | 'proposal_sent'
  createdAt: Date | string
}

export type Proposal = {
  _id?: string
  diagnosisId: string
  clientEmail: string
  title: string
  scope: string
  investment: string
  timeline?: string
  status: 'draft' | 'sent' | 'approved'
  createdAt: Date | string
  sentAt?: Date | string
  paymentStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'unknown'
  mpPreferenceId?: string
  mpPaymentId?: string
  mpStatusDetail?: string
  signalAmount?: number
  paidAmount?: number
  paidAt?: Date | string
  checkoutCreatedAt?: Date | string
  paymentUpdatedAt?: Date | string
}

export type Session = {
  token: string
  userId: string
  createdAt: Date | string
}

export function toSafeUser(user: TeronUser | null): SafeUser | null {
  if (!user) return null
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
