import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis as unknown as { mongo?: Promise<MongoClient> }

export async function mongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING
  if (!uri) {
    throw new Error(
      'MONGODB_URI (ou MONGODB_CONNECTION_STRING) não configurada. Copie .env.example para .env.local e preencha a connection string.'
    )
  }
  globalForMongo.mongo ??= new MongoClient(uri).connect()
  return globalForMongo.mongo
}

export async function db() {
  return (await mongo()).db(process.env.MONGODB_DB || 'teron')
}

export type UserRole = 'admin' | 'client'

export type TeronUser = {
  _id?: string | ObjectId
  email: string
  name: string
  role: UserRole
  /** Demo: texto simples. Produção: trocar por hash (bcrypt/argon2). */
  passwordHash: string
  createdAt: Date
}

export type Diagnosis = {
  _id?: string | ObjectId
  clientId: string
  clientEmail: string
  niche: string
  answers: { question: string; answer: string }[]
  status: 'new' | 'reviewed' | 'proposal_sent'
  createdAt: Date
}

export type Proposal = {
  _id?: string | ObjectId
  diagnosisId: string
  clientEmail: string
  title: string
  scope: string
  investment: string
  timeline?: string
  status: 'draft' | 'sent' | 'approved'
  createdAt: Date
  sentAt?: Date
  /** Pagamento (Mercado Pago) */
  paymentStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'unknown'
  mpPreferenceId?: string
  mpPaymentId?: string
  mpStatusDetail?: string
  signalAmount?: number
  paidAmount?: number
  paidAt?: Date
  checkoutCreatedAt?: Date
  paymentUpdatedAt?: Date
}

export type Session = {
  token: string
  userId: string
  createdAt: Date
}

export function safeUser(user: TeronUser | null) {
  if (!user) return null
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

/** Seed de usuários demo — só roda se a collection estiver vazia. */
export async function seedUsers() {
  const database = await db()
  const users = database.collection<TeronUser>('users')
  const count = await users.countDocuments()
  if (count > 0) return

  await users.insertMany([
    {
      _id: 'demo-admin' as unknown as ObjectId,
      email: 'admin@teron.studio',
      name: 'Marina Costa',
      role: 'admin',
      passwordHash: 'teron-admin',
      createdAt: new Date(),
    },
    {
      _id: 'demo-client' as unknown as ObjectId,
      email: 'cliente@orbita.com',
      name: 'Lucas Mendes',
      role: 'client',
      passwordHash: 'teron-client',
      createdAt: new Date(),
    },
  ])
}

export async function getSessionUser(cookie?: string): Promise<TeronUser | null> {
  if (!cookie) return null
  const database = await db()
  const session = await database.collection<Session>('sessions').findOne({ token: cookie })
  if (!session) return null
  return database.collection<TeronUser>('users').findOne({ _id: session.userId as unknown as ObjectId })
}
