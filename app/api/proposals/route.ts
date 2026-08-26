import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'
import { db, getSessionUser } from '@/lib/mongodb'

export async function GET() {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientEmail: user.email }
  const items = await database
    .collection('proposals')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()
  return NextResponse.json(items.map((item) => ({ ...item, _id: String(item._id) })))
}

export async function POST(request: Request) {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }
  const body = (await request.json()) as {
    diagnosisId: string
    clientEmail: string
    title: string
    investment: string
    scope: string
    timeline?: string
  }
  if (!body.clientEmail || !body.title || !body.scope) {
    return NextResponse.json({ error: 'Preencha a proposta.' }, { status: 400 })
  }
  const database = await db()
  const proposal = {
    diagnosisId: body.diagnosisId,
    clientEmail: body.clientEmail,
    title: body.title,
    scope: body.scope,
    investment: body.investment,
    timeline: body.timeline || '',
    status: 'sent',
    createdAt: new Date(),
    sentAt: new Date(),
  }
  await database.collection('proposals').insertOne(proposal)

  // Marca diagnóstico como proposal_sent
  if (body.diagnosisId) {
    try {
      await database.collection('diagnoses').updateOne(
        { _id: new ObjectId(body.diagnosisId) },
        { $set: { status: 'proposal_sent', updatedAt: new Date() } }
      )
    } catch {
      await database.collection('diagnoses').updateOne(
        { _id: body.diagnosisId as unknown as ObjectId },
        { $set: { status: 'proposal_sent', updatedAt: new Date() } }
      )
    }
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({
      saved: true,
      sent: false,
      message: 'Proposta salva e vinculada ao cliente (e-mail não configurado).',
    })
  }
  try {
    const resend = new Resend(key)
    const email = await resend.emails.send({
      from: process.env.RESEND_FROM || 'TERON <onboarding@resend.dev>',
      to: body.clientEmail,
      subject: body.title,
      html: `<h1>${body.title}</h1><p>${body.scope}</p><p><strong>Investimento:</strong> ${body.investment}</p>${body.timeline ? `<p><strong>Prazo:</strong> ${body.timeline}</p>` : ''}`,
    })
    if (email.error) {
      return NextResponse.json({
        saved: true,
        sent: false,
        message: 'Proposta salva; envio de e-mail falhou.',
      })
    }
  } catch {
    return NextResponse.json({
      saved: true,
      sent: false,
      message: 'Proposta salva; envio de e-mail falhou.',
    })
  }
  return NextResponse.json({ saved: true, sent: true, message: 'Proposta salva e e-mail enviado.' })
}
