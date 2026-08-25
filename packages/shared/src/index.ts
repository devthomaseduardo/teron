/**
 * Tipos compartilhados entre @teron/api e @teron/web
 */

export type UserRole = 'admin' | 'client'

export type TeronUser = {
  _id?: string
  email: string
  name: string
  role: UserRole
  /** Hash bcrypt (ou texto plano legado no seed demo ate migrar). */
  passwordHash: string
  createdAt: Date | string
}

export type SafeUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type DiagnosisStatus = 'new' | 'reviewed' | 'proposal_sent'

export type Diagnosis = {
  _id?: string
  clientId: string
  clientEmail: string
  niche: string
  answers: { question: string; answer: string }[]
  status: DiagnosisStatus
  createdAt: Date | string
  reviewedAt?: Date | string
  reviewedBy?: string
}

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export type Proposal = {
  _id?: string
  diagnosisId: string
  clientEmail: string
  title: string
  scope: string
  investment: string
  timeline?: string
  status: ProposalStatus
  /** Token publico para Proposal Room (share link). */
  publicToken?: string
  createdAt: Date | string
  sentAt?: Date | string
  approvedAt?: Date | string
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

export type ProjectStatus = 'briefing' | 'design' | 'build' | 'qa' | 'delivered' | 'paused'

export type Project = {
  _id?: string
  proposalId: string
  clientEmail: string
  title: string
  status: ProjectStatus
  timeline?: string
  notes?: string
  createdAt: Date | string
  updatedAt?: Date | string
}

export type Session = {
  token: string
  userId: string
  createdAt: Date | string
  expiresAt?: Date | string
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
