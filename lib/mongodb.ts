import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as { mongo?: Promise<MongoClient> }

export const mongo = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING
  if (!uri) throw new Error('MONGODB_URI ou MONGODB_CONNECTION_STRING não configurada')
  globalForMongo.mongo ??= new MongoClient(uri).connect()
  return globalForMongo.mongo
}
export const db = async () => (await mongo()).db(process.env.MONGODB_DB || 'teron')

export type UserRole = 'admin' | 'client'
export type TeronUser = { _id?: string; email: string; name: string; role: UserRole; passwordHash: string; createdAt: Date }
export type Diagnosis = { _id?: string; clientId: string; clientEmail: string; niche: string; answers: { question: string; answer: string }[]; status: 'new' | 'reviewed' | 'proposal_sent'; createdAt: Date }
export type Proposal = { _id?: string; diagnosisId: string; clientEmail: string; title: string; scope: string; investment: string; timeline: string; status: 'draft' | 'sent' | 'approved'; createdAt: Date }

export function safeUser(user: TeronUser | null) {
  if (!user) return null
  return { id: user._id, email: user.email, name: user.name, role: user.role }
}

export async function seedUsers() {
  const database = await db(); const users = database.collection<TeronUser>('users')
  const count = await users.countDocuments()
  if (!count) await users.insertMany([
    { _id: 'demo-admin', email: 'admin@teron.studio', name: 'Marina Costa', role: 'admin', passwordHash: 'teron-admin', createdAt: new Date() },
    { _id: 'demo-client', email: 'cliente@orbita.com', name: 'Lucas Mendes', role: 'client', passwordHash: 'teron-client', createdAt: new Date() },
  ])
}

export async function getSessionUser(cookie?: string) {
  if (!cookie) return null
  const database = await db(); const session = await database.collection<{token: string; userId: string}>('sessions').findOne({ token: cookie })
  if (!session) return null
  return database.collection<TeronUser>('users').findOne({ _id: session.userId })
} 
