import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { db } from '@/lib/mongodb'
import { getPayment, mapPaymentStatus } from '@/lib/mercadopago'

/**
 * POST /api/mercadopago/webhook
 * Notificações do Mercado Pago (topic=payment ou type=payment).
 * Configure a URL no painel MP ou use notification_url da preference.
 *
 * Em produção, valide assinatura se MERCADOPAGO_WEBHOOK_SECRET estiver setado
 * (header x-signature — ver docs oficiais).
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const idFromQuery = url.searchParams.get('id') || url.searchParams.get('data.id')

    let paymentId = idFromQuery

    // Body JSON (formato novo)
    try {
      const body = await request.json()
      if (body?.data?.id) paymentId = String(body.data.id)
      else if (body?.id && (body.type === 'payment' || topic === 'payment')) {
        paymentId = String(body.id)
      }
    } catch {
      // query-only notification
    }

    if (!paymentId || (topic && topic !== 'payment')) {
      // MP espera 200 mesmo em notificações que não processamos
      return NextResponse.json({ ok: true, skipped: true })
    }

    const payment = await getPayment(paymentId)
    const proposalId = payment.external_reference
    if (!proposalId) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no external_reference' })
    }

    const status = mapPaymentStatus(payment.status)
    const database = await db()

    const filter =
      ObjectId.isValid(proposalId)
        ? { _id: new ObjectId(proposalId) }
        : { _id: proposalId as any }

    await database.collection('proposals').updateOne(filter, {
      $set: {
        paymentStatus: status,
        mpPaymentId: String(payment.id),
        mpStatusDetail: payment.status_detail,
        paidAmount: payment.transaction_amount,
        paidAt: status === 'approved' ? new Date() : undefined,
        paymentUpdatedAt: new Date(),
      },
      ...(status === 'approved'
        ? { $setOnInsert: {} }
        : {}),
    })

    // Se aprovado, marca proposta como approved também
    if (status === 'approved') {
      await database.collection('proposals').updateOne(filter, {
        $set: { status: 'approved', paidAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true, proposalId, status })
  } catch (err) {
    console.error('[mp webhook]', err)
    // Retorna 200 para evitar retry infinito em erros de lógica;
    // em falha de token/rede o MP reenvia de qualquer forma.
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'webhook error' },
      { status: 200 }
    )
  }
}

/** GET — health check / verificação manual no painel MP */
export async function GET() {
  return NextResponse.json({
    service: 'teron-mercadopago-webhook',
    configured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
  })
}
