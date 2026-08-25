import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { db, getSessionUser } from '@/lib/mongodb'

export async function GET() {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientEmail: user.email }
  const items = await database.collection('proposals').find(filter).sort({ createdAt: -1 }).toArray()
  return NextResponse.json(items.map((item) => ({ ...item, _id: String(item._id) })))
}

export async function POST(request: Request) {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  const body = await request.json() as { diagnosisId: string; clientEmail: string; title: string; investment: string; scope: string }
  if (!body.clientEmail || !body.title || !body.scope) return NextResponse.json({ error: 'Preencha a proposta.' }, { status: 400 })
  const database = await db()
  const proposal = { ...body, status: 'draft', createdAt: new Date() }
  await database.collection('proposals').insertOne(proposal)
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY não configurada. A proposta foi salva como rascunho.', saved: true }, { status: 503 })
  const resend = new Resend(key)
  const email = await resend.emails.send({ from: process.env.RESEND_FROM || 'TERON <onboarding@resend.dev>', to: body.clientEmail, subject: body.title, html: `<h1>${body.title}</h1><p>${body.scope}</p><p><strong>Investimento:</strong> ${body.investment}</p>` })
  if (email.error) return NextResponse.json({ error: 'Proposta salva, mas o envio falhou.' }, { status: 502 })
  await database.collection('proposals').updateOne({ diagnosisId: body.diagnosisId }, { $set: { status: 'sent', sentAt: new Date() } })
  return NextResponse.json({ sent: true })
}
