import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { ObjectId } from 'mongodb'
import { db, getSessionUser } from '../lib/mongodb.js'
import {
  createCheckoutPreference,
  getPayment,
  mapPaymentStatus,
  parseInvestmentBRL,
} from '../lib/mercadopago.js'
import type { AppVariables } from '../middleware/session.js'

const mercadopago = new Hono<{ Variables: AppVariables }>()

mercadopago.post('/checkout', async (c) => {
  try {
    const user = await getSessionUser(getCookie(c, 'teron_session'))
    if (!user) return c.json({ error: 'Nao autorizado.' }, 403)
    const body = await c.req.json<{ proposalId?: string; signalRatio?: number }>()
    if (!body.proposalId) return c.json({ error: 'proposalId e obrigatorio.' }, 400)
    const database = await db()
    let proposal: Record<string, unknown> | null = null
    try {
      proposal = await database.collection('proposals').findOne({ _id: new ObjectId(body.proposalId) })
    } catch {
      proposal = await database.collection('proposals').findOne({ _id: body.proposalId as unknown as ObjectId })
    }
    if (!proposal) return c.json({ error: 'Proposta nao encontrada.' }, 404)
    const isAdmin = user.role === 'admin'
    const isOwner = proposal.clientEmail === user.email
    if (!isAdmin && !isOwner) return c.json({ error: 'Sem permissao para esta proposta.' }, 403)
    if (proposal.paymentStatus === 'approved') {
      return c.json({ error: 'Esta proposta ja possui pagamento aprovado.', paymentStatus: 'approved' }, 409)
    }
    const amount = parseInvestmentBRL(String(proposal.investment || '0'))
    const preference = await createCheckoutPreference({
      proposalId: String(proposal._id),
      title: String(proposal.title || 'Sinal — proposta TERON'),
      description: String(proposal.scope || 'Sinal de fechamento'),
      amount,
      payerEmail: String(proposal.clientEmail),
      signalRatio: body.signalRatio,
    })
    await database.collection('proposals').updateOne(
      { _id: proposal._id as ObjectId },
      {
        $set: {
          paymentStatus: 'pending',
          mpPreferenceId: preference.id,
          signalAmount: preference.signalAmount,
          checkoutCreatedAt: new Date(),
        },
      }
    )
    const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-')
    const checkoutUrl = isTest ? preference.sandbox_init_point : preference.init_point
    return c.json({
      preferenceId: preference.id,
      checkoutUrl,
      signalAmount: preference.signalAmount,
      currency: 'BRL',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar checkout.'
    const status = message.includes('nao configurada') ? 503 : 500
    return c.json({ error: message }, status as 500 | 503)
  }
})

mercadopago.get('/status', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)
  const proposalId = c.req.query('proposalId')
  if (!proposalId) return c.json({ error: 'proposalId e obrigatorio.' }, 400)
  const database = await db()
  let proposal: Record<string, unknown> | null = null
  try {
    proposal = await database.collection('proposals').findOne({ _id: new ObjectId(proposalId) })
  } catch {
    proposal = await database.collection('proposals').findOne({ _id: proposalId as unknown as ObjectId })
  }
  if (!proposal) return c.json({ error: 'Proposta nao encontrada.' }, 404)
  if (user.role !== 'admin' && proposal.clientEmail !== user.email) {
    return c.json({ error: 'Sem permissao.' }, 403)
  }
  return c.json({
    proposalId: String(proposal._id),
    status: proposal.status,
    paymentStatus: proposal.paymentStatus || null,
    signalAmount: proposal.signalAmount || null,
    paidAmount: proposal.paidAmount || null,
    paidAt: proposal.paidAt || null,
    mpPaymentId: proposal.mpPaymentId || null,
  })
})

mercadopago.post('/webhook', async (c) => {
  try {
    const topic = c.req.query('topic') || c.req.query('type')
    let paymentId = c.req.query('id') || c.req.query('data.id') || null
    try {
      const body = await c.req.json<{ data?: { id?: string | number }; id?: string | number; type?: string }>()
      if (body?.data?.id) paymentId = String(body.data.id)
      else if (body?.id && (body.type === 'payment' || topic === 'payment')) paymentId = String(body.id)
    } catch {
      /* query-only */
    }
    if (!paymentId || (topic && topic !== 'payment')) return c.json({ ok: true, skipped: true })
    const payment = await getPayment(paymentId)
    const proposalId = payment.external_reference
    if (!proposalId) return c.json({ ok: true, skipped: true, reason: 'no external_reference' })
    const status = mapPaymentStatus(payment.status)
    const database = await db()
    const filter = ObjectId.isValid(proposalId)
      ? { _id: new ObjectId(proposalId) }
      : { _id: proposalId as unknown as ObjectId }
    const update: Record<string, unknown> = {
      paymentStatus: status,
      mpPaymentId: String(payment.id),
      mpStatusDetail: payment.status_detail,
      paymentUpdatedAt: new Date(),
    }
    if (status === 'approved') {
      update.paidAmount = payment.transaction_amount
      update.paidAt = new Date()
      update.status = 'approved'
    }
    await database.collection('proposals').updateOne(filter, { $set: update })
    return c.json({ ok: true, status })
  } catch (err) {
    console.error('[mercadopago/webhook]', err)
    return c.json({ ok: false }, 200)
  }
})

export default mercadopago
