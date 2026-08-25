import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomBytes } from 'node:crypto'
import { db, safeUser, seedUsers, type TeronUser, type UserRole } from '../lib/mongodb.js'
import { verifyPassword, hashPassword, isHashed } from '../lib/password.js'
import type { AppVariables } from '../middleware/session.js'

const auth = new Hono<{ Variables: AppVariables }>()

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; role?: UserRole }>()
  const { email, password, role } = body
  if (!email || !password || !role) {
    return c.json({ error: 'Preencha todos os campos.' }, 400)
  }
  if (role !== 'admin' && role !== 'client') {
    return c.json({ error: 'Perfil invalido.' }, 400)
  }

  await seedUsers()
  const database = await db()
  const user = await database.collection<TeronUser>('users').findOne({
    email: email.toLowerCase().trim(),
    role,
  })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return c.json({ error: 'E-mail, senha ou perfil invalido.' }, 401)
  }

  // Migra senha legado para hash no primeiro login bem-sucedido
  if (!isHashed(user.passwordHash)) {
    await database.collection('users').updateOne(
      { _id: user._id as unknown as string },
      { $set: { passwordHash: hashPassword(password) } }
    )
  }

  const token = randomBytes(32).toString('hex')
  await database.collection('sessions').insertOne({
    token,
    userId: String(user._id),
    createdAt: new Date(),
  })

  const isProd = process.env.NODE_ENV === 'production'
  setCookie(c, 'teron_session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return c.json({
    user: safeUser({
      ...user,
      _id: String(user._id),
    }),
  })
})

auth.delete('/login', (c) => {
  deleteCookie(c, 'teron_session', { path: '/' })
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  const token = getCookie(c, 'teron_session')
  const { getSessionUser, safeUser: su } = await import('../lib/mongodb.js')
  const user = await getSessionUser(token)
  if (!user) return c.json({ error: 'Nao autenticado.' }, 401)
  return c.json({ user: su(user) })
})

export default auth
