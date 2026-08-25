import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { randomBytes } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'
import { db, getSessionUser, serializeId } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const proposals = new Hono<{ Variables: AppVariables }>()

function makePublicToken() {
  return randomBytes(24).toString('hex')
}

proposals.get('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientEmail: user.email }
  const items = await database
    .collection('proposals')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  return c.json(items.map((item) => serializeId(item)))
})

/** GET /proposals/public/:token — Proposal Room (sem auth) */
proposals.get('/public/:token', async (c) => {
  const token = c.req.param('token')
  if (!token || token.length < 16) return c.json({ error: 'Token invalido.' }, 400)

  const database = await db()
  const proposal = await database.collection('proposals').findOne({ publicToken: token })
  if (!proposal) return c.json({ error: 'Proposta nao encontrada.' }, 404)

  // Nao expor dados internos desnecessarios
  return c.json({
    id: String(proposal._id),
    title: proposal.title,
    scope: proposal.scope,
    investment: proposal.investment,
    timeline: proposal.timeline || null,
    status: proposal.status,
    paymentStatus: proposal.paymentStatus || null,
    signalAmount: proposal.signalAmount || null,
    clientEmail: proposal.clientEmail,
    createdAt: proposal.createdAt,
    sentAt: proposal.sentAt || null,
  })
})

proposals.get('/:id', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const id = c.req.param('id')
  const database = await db()
  let proposal: Record<string, unknown> | null = null
  try {
    proposal = await database.collection('proposals').findOne({ _id: new ObjectId(id) })
  } catch {
    proposal = await database.collection('proposals').findOne({ _id: id as never })
  }
  if (!proposal) return c.json({ error: 'Proposta nao encontrada.' }, 404)

  if (user.role !== 'admin' && proposal.clientEmail !== user.email) {
    return c.json({ error: 'Sem permissao.' }, 403)
  }

  return c.json(serializeId(proposal))
})

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
    timeline?: string
    sendEmail?: boolean
  }>()

  if (!body.clientEmail || !body.title || !body.scope) {
    return c.json({ error: 'Preencha a proposta.' }, 400)
  }

  const database = await db()
  const publicToken = makePublicToken()
  const proposal = {
    diagnosisId: body.diagnosisId || '',
    clientEmail: body.clientEmail.toLowerCase().trim(),
    title: body.title.slice(0, 200),
    scope: body.scope.slice(0, 5000),
    investment: body.investment.slice(0, 80),
    timeline: body.timeline?.slice(0, 200),
    status: 'draft' as const,
    publicToken,
    createdAt: new Date(),
  }
  const inserted = await database.collection('proposals').insertOne(proposal)

  if (body.diagnosisId) {
    const dFilter = ObjectId.isValid(body.diagnosisId)
      ? { _id: new ObjectId(body.diagnosisId) }
      : { _id: body.diagnosisId as never }
    await database.collection('diagnoses').updateOne(dFilter, {
      $set: { status: 'proposal_sent' },
    })
  }

  const shouldEmail = body.sendEmail !== false
  const key = process.env.RESEND_API_KEY
  if (shouldEmail && key) {
    const site = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    const roomUrl = `${site.replace(/\/$/, '')}/proposta/${publicToken}`
    const resend = new Resend(key)
    const email = await resend.emails.send({
      from: process.env.RESEND_FROM || 'TERON <onboarding@resend.dev>',
      to: proposal.clientEmail,
      subject: proposal.title,
      html: `<h1>${proposal.title}</h1><p>${proposal.scope}</p><p><strong>Investimento:</strong> ${proposal.investment}</p><p><a href="${roomUrl}">Abrir Proposal Room</a></p>`,
    })
    if (!email.error) {
      await database.collection('proposals').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'sent', sentAt: new Date() } }
      )
      return c.json({
        id: String(inserted.insertedId),
        sent: true,
        publicToken,
        roomUrl,
      })
    }
    return c.json(
      {
        id: String(inserted.insertedId),
        sent: false,
        publicToken,
        error: 'Proposta salva, mas o envio de e-mail falhou.',
      },
      502
    )
  }

  if (shouldEmail && !key) {
    return c.json(
      {
        id: String(inserted.insertedId),
        saved: true,
        publicToken,
        error: 'RESEND_API_KEY nao configurada. Proposta salva como rascunho.',
      },
      503
    )
  }

  return c.json({
    id: String(inserted.insertedId),
    publicToken,
    status: 'draft',
  }, 201)
})

/** PATCH /proposals/:id — status approve/reject/sent (admin ou dono para approve) */
proposals.patch('/:id', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const body = await c.req.json<{ status?: 'draft' | 'sent' | 'approved' | 'rejected'; timeline?: string }>()
  const id = c.req.param('id')
  const database = await db()
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as never }
  const existing = await database.collection('proposals').findOne(filter)
  if (!existing) return c.json({ error: 'Proposta nao encontrada.' }, 404)

  const isAdmin = user.role === 'admin'
  const isOwner = existing.clientEmail === user.email
  if (!isAdmin && !isOwner) return c.json({ error: 'Sem permissao.' }, 403)

  if (body.status === 'approved' && !isAdmin && !isOwner) {
    return c.json({ error: 'Sem permissao.' }, 403)
  }
  if ((body.status === 'sent' || body.status === 'draft') && !isAdmin) {
    return c.json({ error: 'Apenas admin pode alterar este status.' }, 403)
  }

  const $set: Record<string, unknown> = {}
  if (body.status) {
    $set.status = body.status
    if (body.status === 'approved') $set.approvedAt = new Date()
    if (body.status === 'sent') $set.sentAt = new Date()
  }
  if (body.timeline !== undefined && isAdmin) $set.timeline = body.timeline

  if (Object.keys($set).length === 0) return c.json({ error: 'Nada para atualizar.' }, 400)

  const result = await database.collection('proposals').findOneAndUpdate(
    filter,
    { $set },
    { returnDocument: 'after' }
  )
  return c.json(serializeId(result!))
})

export default proposals
