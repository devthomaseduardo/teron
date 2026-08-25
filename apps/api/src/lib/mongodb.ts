/**
 * MongoDB + sessao + seed
 */
import { MongoClient, ObjectId } from 'mongodb'
import type { Diagnosis, Proposal, Project, Session, TeronUser, UserRole } from '@teron/shared'
import { toSafeUser } from '@teron/shared'
import { hashPassword, isHashed } from './password.js'

export type { Diagnosis, Proposal, Project, Session, TeronUser, UserRole }
export { toSafeUser as safeUser }

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

const globalForMongo = globalThis as unknown as {
  mongo?: Promise<MongoClient>
  teronIndexes?: boolean
}

export async function mongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING
  if (!uri) {
    throw new Error(
      'MONGODB_URI (ou MONGODB_CONNECTION_STRING) nao configurada. Copie .env.example para .env e preencha a connection string.'
    )
  }
  globalForMongo.mongo ??= new MongoClient(uri).connect()
  return globalForMongo.mongo
}

export async function db() {
  const database = (await mongo()).db(process.env.MONGODB_DB || 'teron')
  if (!globalForMongo.teronIndexes) {
    globalForMongo.teronIndexes = true
    void ensureIndexes(database).catch((err) => console.error('[mongo] indexes', err))
  }
  return database
}

async function ensureIndexes(database: Awaited<ReturnType<typeof db>>) {
  await Promise.all([
    database.collection('users').createIndex({ email: 1, role: 1 }, { unique: true }),
    database.collection('sessions').createIndex({ token: 1 }, { unique: true }),
    database.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 }),
    database.collection('diagnoses').createIndex({ clientEmail: 1, createdAt: -1 }),
    database.collection('diagnoses').createIndex({ status: 1, createdAt: -1 }),
    database.collection('proposals').createIndex({ clientEmail: 1, createdAt: -1 }),
    database.collection('proposals').createIndex({ publicToken: 1 }, { unique: true, sparse: true }),
    database.collection('projects').createIndex({ clientEmail: 1, createdAt: -1 }),
    database.collection('projects').createIndex({ proposalId: 1 }),
  ])
}

/** Garante usuarios demo com hash (migra texto plano se existir). */
export async function seedUsers() {
  const database = await db()
  const users = database.collection<TeronUser>('users')

  for (const demo of DEMO_USERS) {
    const existing = await users.findOne({ email: demo.email, role: demo.role })
    const passwordHash =
      existing && isHashed(existing.passwordHash)
        ? existing.passwordHash
        : hashPassword(demo.password)

    await users.updateOne(
      { email: demo.email, role: demo.role },
      {
        $set: {
          name: demo.name,
          passwordHash,
        },
        $setOnInsert: {
          _id: demo._id as unknown as string,
          email: demo.email,
          role: demo.role,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )
  }
}

export async function getSessionUser(cookie?: string | null): Promise<TeronUser | null> {
  if (!cookie) return null
  const database = await db()
  const session = await database.collection<Session>('sessions').findOne({ token: cookie })
  if (!session) return null
  return database
    .collection<TeronUser>('users')
    .findOne({ _id: session.userId as unknown as string })
}

export function serializeId<T extends { _id?: unknown }>(doc: T) {
  return { ...doc, _id: String(doc._id) }
}

export { ObjectId }
