/**
 * Testes de smoke para credenciais demo (recrutador).
 * Roda sem Mongo: valida contrato dos usuarios demo.
 * Com MONGODB_URI: valida seed + login no banco.
 *
 *   pnpm --filter @teron/api test
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS } from '../lib/mongodb.js'

describe('DEMO_USERS (contrato para recrutador)', () => {
  it('tem exatamente 1 admin e 1 client', () => {
    const admins = DEMO_USERS.filter((u) => u.role === 'admin')
    const clients = DEMO_USERS.filter((u) => u.role === 'client')
    assert.equal(admins.length, 1)
    assert.equal(clients.length, 1)
  })

  it('admin: admin@teron.studio / teron-admin', () => {
    const admin = DEMO_USERS.find((u) => u.role === 'admin')!
    assert.equal(admin.email, 'admin@teron.studio')
    assert.equal(admin.password, 'teron-admin')
    assert.ok(admin.name.length > 0)
  })

  it('cliente: cliente@orbita.com / teron-client', () => {
    const client = DEMO_USERS.find((u) => u.role === 'client')!
    assert.equal(client.email, 'cliente@orbita.com')
    assert.equal(client.password, 'teron-client')
    assert.ok(client.name.length > 0)
  })

  it('e-mails sao unicos', () => {
    const emails = DEMO_USERS.map((u) => u.email)
    assert.equal(new Set(emails).size, emails.length)
  })
})

describe('seed + login (requer MONGODB_URI)', { skip: !process.env.MONGODB_URI }, () => {
  it('seedUsers cria/atualiza admin e client', async () => {
    const { seedUsers, db, mongo } = await import('../lib/mongodb.js')
    await seedUsers()
    const database = await db()
    const users = database.collection('users')

    for (const demo of DEMO_USERS) {
      const found = await users.findOne({ email: demo.email, role: demo.role })
      assert.ok(found, `usuario ${demo.email} nao encontrado`)
      assert.equal(found!.passwordHash, demo.password)
      assert.equal(found!.name, demo.name)
    }

    const client = await mongo()
    await client.close()
  })
})
