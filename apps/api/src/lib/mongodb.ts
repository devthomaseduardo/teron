/**
 * MongoDB + sessao + seed
 * Portado de lib/mongodb.ts do monolito Next.js.
 */
import { MongoClient, ObjectId } from 'mongodb'
import type { Diagnosis, Proposal, Session, TeronUser, UserRole } from '@teron/shared'
import { toSafeUser } from '@teron/shared'

export type { Diagnosis, Proposal, Session, TeronUser, UserRole }
export { toSafeUser as safeUser }

const globalForMongo = globalThis as unknown as { mongo?: Promise<MongoClient> }

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
  return (await mongo()).db(process.env.MONGODB_DB || 'teron')
}

/** Seed de usuarios demo — so roda se a collection estiver vazia. */
export async function seedUsers() {
  const database = await db()
  const users = database.collection<TeronUser>('users')
  const count = await users.countDocuments()
  if (count > 0) return

  await users.insertMany([
    {
      _id: 'demo-admin' as unknown as string,
      email: 'admin@teron.studio',
      name: 'Marina Costa',
      role: 'admin',
      passwordHash: 'teron-admin',
      createdAt: new Date(),
    },
    {
      _id: 'demo-client' as unknown as string,
      email: 'cliente@orbita.com',
      name: 'Lucas Mendes',
      role: 'client',
      passwordHash: 'teron-client',
      createdAt: new Date(),
    },
  ] as TeronUser[])
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

export { ObjectId }
