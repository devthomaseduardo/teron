/**
 * MongoDB + sessao + seed
 * Portado de lib/mongodb.ts do monolito Next.js.
 */
import { MongoClient, ObjectId } from 'mongodb'
import type { Diagnosis, Proposal, Session, TeronUser, UserRole } from '@teron/shared'
import { toSafeUser } from '@teron/shared'

export type { Diagnosis, Proposal, Session, TeronUser, UserRole }
export { toSafeUser as safeUser }

/** Credenciais demo para recrutadores / demos publicas */
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

/**
 * Garante usuarios demo (upsert por e-mail + role).
 * Seguro chamar em todo login — nao apaga outros usuarios.
 */
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

export { ObjectId }
