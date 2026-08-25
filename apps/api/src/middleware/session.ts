import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { getSessionUser, type TeronUser } from '../lib/mongodb.js'

export type AppVariables = {
  user: TeronUser | null
}

export async function sessionMiddleware(c: Context<{ Variables: AppVariables }>, next: Next) {
  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  c.set('user', user)
  await next()
}

export function requireAuth(c: Context<{ Variables: AppVariables }>) {
  const user = c.get('user')
  if (!user) return null
  return user
}

export function requireAdmin(c: Context<{ Variables: AppVariables }>) {
  const user = c.get('user')
  if (!user || user.role !== 'admin') return null
  return user
}
