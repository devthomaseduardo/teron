import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomBytes } from 'node:crypto'
import { db, safeUser, seedUsers, type UserRole } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const auth = new Hono<{ Variables: AppVariables }>()

/** POST /auth/login */
auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; role?: UserRole }>()
  const { email, password, role } = body
  if (!email || !password || !role) {
    return c.json({ error: 'Preencha todos os campos.' }, 400)
  }

  await seedUsers()
  const database = await db()
  const user = await database.collection('users').findOne({
    email: email.toLowerCase().trim(),
    role,
  })

  if (!user || (user as { passwordHash: string }).passwordHash !== password) {
    return c.json({ error: 'E-mail, senha ou perfil invalido.' }, 401)
  }

  const token = randomBytes(32).toString('hex')
  await database.collection('sessions').insertOne({
    token,
    userId: String((user as { _id: unknown })._id),
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
      ...(user as object),
      _id: String((user as { _id: unknown })._id),
    } as Parameters<typeof safeUser>[0]),
  })
})

/** DELETE /auth/login — logout */
auth.delete('/login', (c) => {
  deleteCookie(c, 'teron_session', { path: '/' })
  return c.json({ ok: true })
})

/** GET /auth/me */
auth.get('/me', async (c) => {
  const token = getCookie(c, 'teron_session')
  const { getSessionUser, safeUser: su } = await import('../lib/mongodb.js')
  const user = await getSessionUser(token)
  if (!user) return c.json({ error: 'Nao autenticado.' }, 401)
  return c.json({ user: su(user) })
})

export default auth
