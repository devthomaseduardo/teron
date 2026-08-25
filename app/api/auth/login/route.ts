import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { db, safeUser, seedUsers, type UserRole } from '@/lib/mongodb'

export async function POST(request: Request) {
  const { email, password, role } = await request.json() as { email?: string; password?: string; role?: UserRole }
  if (!email || !password || !role) return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  await seedUsers(); const database = await db()
  const user = await database.collection<any>('users').findOne({ email: email.toLowerCase().trim(), role })
  if (!user || user.passwordHash !== password) return NextResponse.json({ error: 'E-mail, senha ou perfil inválido.' }, { status: 401 })
  const token = crypto.randomBytes(32).toString('hex')
  await database.collection('sessions').insertOne({ token, userId: String(user._id), createdAt: new Date() })
  const response = NextResponse.json({ user: safeUser({ ...user, _id: String(user._id) }) })
  response.cookies.set('teron_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/' })
  return response
}

export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.delete('teron_session'); return response }
