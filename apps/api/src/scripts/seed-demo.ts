/**
 * Garante usuarios demo no MongoDB.
 * Uso: pnpm --filter @teron/api seed
 */
import { DEMO_USERS, seedUsers, db, mongo } from '../lib/mongodb.js'

async function main() {
  console.log('Seeding demo users...')
  await seedUsers()
  const database = await db()
  const users = await database
    .collection('users')
    .find({ email: { $in: DEMO_USERS.map((u) => u.email) } })
    .toArray()

  console.log('\nUsuarios demo prontos:\n')
  for (const demo of DEMO_USERS) {
    const found = users.find((u) => u.email === demo.email && u.role === demo.role)
    console.log(
      `  [${demo.role.padEnd(6)}] ${demo.email}  /  ${demo.password}  ${found ? 'OK' : 'FALHOU'}`
    )
  }
  console.log('\nLogin admin:   /admin/login')
  console.log('Login cliente: /cliente/login\n')

  const client = await mongo()
  await client.close()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
