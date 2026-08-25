import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser, safeUser } from '@/lib/mongodb'

export async function GET() {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  return NextResponse.json({ user: safeUser(user) })
}
