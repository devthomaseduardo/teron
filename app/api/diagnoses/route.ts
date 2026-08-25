import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, getSessionUser } from '@/lib/mongodb'

export async function POST(request: Request) {
  const body = await request.json(); if (!body.clientEmail || !body.niche || !Array.isArray(body.answers) || body.answers.length > 10) return NextResponse.json({ error: 'Diagnóstico inválido.' }, { status: 400 })
  const cookie = (await cookies()).get('teron_session')?.value; const user = await getSessionUser(cookie)
  const database = await db(); const result = await database.collection('diagnoses').insertOne({ clientId: user ? String(user._id) : 'public', clientEmail: body.clientEmail, niche: body.niche, answers: body.answers.slice(0, 10), status: 'new', createdAt: new Date() })
  return NextResponse.json({ id: String(result.insertedId) }, { status: 201 })
}

export async function GET() {
  const cookie = (await cookies()).get('teron_session')?.value
  const user = await getSessionUser(cookie)
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientId: String(user._id) }
  const items = await database.collection('diagnoses').find(filter).sort({ createdAt: -1 }).toArray()
  return NextResponse.json(items.map(item => ({ ...item, _id: String(item._id) })))
}
