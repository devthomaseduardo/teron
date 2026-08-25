/**
 * Inicializa o banco TERON no MongoDB.
 *
 * Uso:
 *   pnpm --filter @teron/api init-db
 *
 * Requer MONGODB_URI em apps/api/.env
 *
 * Cria:
 *   - database: teron (ou MONGODB_DB)
 *   - collections: users, sessions, diagnoses, proposals, projects, activity
 *   - indexes
 *   - usuarios demo
 */
import { DEMO_USERS, db, mongo, seedUsers } from '../lib/mongodb.js'

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING
  if (!uri) {
    console.error('\n[erro] MONGODB_URI nao definida.\n')
    console.error('Opcao A — Mongo local (Docker):')
    console.error('  docker compose -f docker-compose.dev.yml up -d')
    console.error('  # apps/api/.env → MONGODB_URI=mongodb://127.0.0.1:27017')
    console.error('')
    console.error('Opcao B — MongoDB Atlas (gratis):')
    console.error('  1. https://cloud.mongodb.com → Create → Free M0')
    console.error('  2. Database → Connect → Drivers → copie a URI')
    console.error('  3. Cole em apps/api/.env como MONGODB_URI=mongodb+srv://...')
    console.error('  4. Network Access → Allow from Anywhere (0.0.0.0/0) para demos')
    console.error('')
    process.exit(1)
  }

  console.log('Conectando...')
  const database = await db()
  const name = database.databaseName
  console.log(`Database: ${name}`)

  const collections = ['users', 'sessions', 'diagnoses', 'proposals', 'projects', 'activity']
  const existing = await database.listCollections().toArray()
  const existingNames = new Set(existing.map((c) => c.name))

  for (const col of collections) {
    if (!existingNames.has(col)) {
      await database.createCollection(col)
      console.log(`  + collection ${col}`)
    } else {
      console.log(`  · collection ${col} (ja existe)`)
    }
  }

  // Indexes (idempotente)
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
    database.collection('activity').createIndex({ createdAt: -1 }),
  ])
  console.log('  indexes OK')

  await seedUsers()
  console.log('\nUsuarios demo:')
  for (const u of DEMO_USERS) {
    console.log(`  [${u.role}] ${u.email}  /  ${u.password}`)
  }

  const counts = Object.fromEntries(
    await Promise.all(
      collections.map(async (col) => {
        const n = await database.collection(col).countDocuments()
        return [col, n] as const
      })
    )
  )
  console.log('\nDocumentos:', counts)
  console.log('\nBanco TERON pronto.\n')

  const client = await mongo()
  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
