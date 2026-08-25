import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis as unknown as { mongo?: Promise<MongoClient> }

export function mongoDbName() {
  const raw = (process.env.MONGODB_DB || 'teron').trim().replace(/\s+/g, '')
  if (!raw || !/^[a-zA-Z0-9_-]+$/.test(raw)) return 'teron'
  return raw
}

export async function mongo() {
  const uri = (process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING || '').trim()
  if (!uri) {
    throw new Error(
      'MONGODB_URI nao configurada. Defina na Vercel (Environment Variables).'
    )
  }
  globalForMongo.mongo ??= new MongoClient(uri).connect()
  return globalForMongo.mongo
}

export async function db() {
  return (await mongo()).db(mongoDbName())
}

export type UserRole = 'admin' | 'client'

export type TeronUser = {
  _id?: string | ObjectId
  email: string
  name: string
  role: UserRole
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
}

export type Session = {
  token: string
  userId: string
  createdAt: Date
}

export const DEMO_USERS = [
  {
    _id: 'demo-admin',
    email: 'admin@teron.studio',
    name: 'Marina Costa',
    role: 'admin' as const,
    password: 'teron-admin',
  },
  {
    _id: 'demo-client',
    email: 'cliente@orbita.com',
    name: 'Lucas Mendes',
    role: 'client' as const,
    password: 'teron-client',
  },
] as const

export function safeUser(user: TeronUser | null) {
  if (!user) return null
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

/** Sempre garante usuarios demo com senha conhecida (texto plano para demo). */
export async function seedUsers() {
  const database = await db()
  const users = database.collection<TeronUser>('users')

  for (const demo of DEMO_USERS) {
    await users.updateOne(
      { email: demo.email, role: demo.role },
      {
        $set: {
          name: demo.name,
          passwordHash: demo.password,
          email: demo.email,
          role: demo.role,
        },
        $setOnInsert: {
          _id: demo._id as unknown as ObjectId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )
  }
}

export async function getSessionUser(cookie?: string): Promise<TeronUser | null> {
  if (!cookie) return null
  const database = await db()
  const session = await database.collection<Session>('sessions').findOne({ token: cookie })
  if (!session) return null
  return database.collection<TeronUser>('users').findOne({ _id: session.userId as unknown as ObjectId })
}
