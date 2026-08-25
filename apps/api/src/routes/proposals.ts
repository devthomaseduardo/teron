import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { Resend } from 'resend'
import { db, getSessionUser } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const proposals = new Hono<{ Variables: AppVariables }>()

/** GET /proposals */
proposals.get('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientEmail: user.email }
  const items = await database
    .collection('proposals')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  return c.json(items.map((item) => ({ ...item, _id: String(item._id) })))
})

/** POST /proposals */
proposals.post('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Nao autorizado.' }, 403)
  }

  const body = await c.req.json<{
    diagnosisId: string
    clientEmail: string
    title: string
    investment: string
    scope: string
  }>()

  if (!body.clientEmail || !body.title || !body.scope) {
    return c.json({ error: 'Preencha a proposta.' }, 400)
  }

  const database = await db()
  const proposal = { ...body, status: 'draft', createdAt: new Date() }
  await database.collection('proposals').insertOne(proposal)

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return c.json(
      {
        error: 'RESEND_API_KEY nao configurada. A proposta foi salva como rascunho.',
        saved: true,
      },
      503
    )
  }

  const resend = new Resend(key)
  const email = await resend.emails.send({
    from: process.env.RESEND_FROM || 'TERON <onboarding@resend.dev>',
    to: body.clientEmail,
    subject: body.title,
    html: `<h1>${body.title}</h1><p>${body.scope}</p><p><strong>Investimento:</strong> ${body.investment}</p>`,
  })

  if (email.error) {
    return c.json({ error: 'Proposta salva, mas o envio falhou.' }, 502)
  }

  await database
    .collection('proposals')
    .updateOne({ diagnosisId: body.diagnosisId }, { $set: { status: 'sent', sentAt: new Date() } })

  return c.json({ sent: true })
})

export default proposals
