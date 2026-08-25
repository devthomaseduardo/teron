import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { db, safeUser, seedUsers, type UserRole, type TeronUser } from '@/lib/mongodb'
import { verifyPassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      role?: UserRole
    }
    const email = body.email?.toLowerCase().trim()
    const password = body.password ?? ''
    const role = body.role

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Preencha e-mail e senha.' }, { status: 400 })
    }
    if (role !== 'admin' && role !== 'client') {
      return NextResponse.json({ error: 'Perfil invalido.' }, { status: 400 })
    }

    await seedUsers()
    const database = await db()
    const user = await database.collection<TeronUser>('users').findOne({ email, role })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        {
          error: 'E-mail, senha ou perfil invalido.',
          hint:
            role === 'client'
              ? 'Demo cliente: cliente@orbita.com / teron-client'
              : 'Demo admin: admin@teron.studio / teron-admin',
        },
        { status: 401 }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    await database.collection('sessions').insertOne({
      token,
      userId: String(user._id),
      createdAt: new Date(),
    })

    const response = NextResponse.json({
      user: safeUser({ ...user, _id: String(user._id) }),
    })
    response.cookies.set('teron_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro no login.'
    console.error('[auth/login]', err)
    const isMongo =
      message.includes('MONGODB') ||
      message.includes('Mongo') ||
      message.includes('ENOTFOUND') ||
      message.includes('authentication')
    return NextResponse.json(
      {
        error: isMongo
          ? 'Banco de dados indisponivel. Confira MONGODB_URI na Vercel.'
          : message,
      },
      { status: 503 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('teron_session')
  return response
}
