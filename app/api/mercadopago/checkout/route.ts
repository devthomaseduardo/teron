import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { db, getSessionUser } from '@/lib/mongodb'
import {
  createCheckoutPreference,
  parseInvestmentBRL,
} from '@/lib/mercadopago'

/**
 * POST /api/mercadopago/checkout
 * Body: { proposalId: string }
 * Cria preferência de pagamento (sinal) e devolve o link do Checkout Pro.
 * Admin ou o próprio cliente da proposta podem gerar o link.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser((await cookies()).get('teron_session')?.value)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const body = (await request.json()) as { proposalId?: string; signalRatio?: number }
    if (!body.proposalId) {
      return NextResponse.json({ error: 'proposalId é obrigatório.' }, { status: 400 })
    }

    const database = await db()
    let proposal = null as any

    // Tenta por ObjectId e por string (seed / ids custom)
    try {
      proposal = await database.collection('proposals').findOne({
        _id: new ObjectId(body.proposalId),
      })
    } catch {
      proposal = await database.collection('proposals').findOne({ _id: body.proposalId as any })
    }

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'
    const isOwner = proposal.clientEmail === user.email
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para esta proposta.' }, { status: 403 })
    }

    if (proposal.paymentStatus === 'approved') {
      return NextResponse.json(
        { error: 'Esta proposta já possui pagamento aprovado.', paymentStatus: 'approved' },
        { status: 409 }
      )
    }

    const amount = parseInvestmentBRL(String(proposal.investment || '0'))
    const preference = await createCheckoutPreference({
      proposalId: String(proposal._id),
      title: proposal.title || 'Sinal — proposta TERON',
      description: proposal.scope || 'Sinal de fechamento',
      amount,
      payerEmail: proposal.clientEmail,
      signalRatio: body.signalRatio,
    })

    await database.collection('proposals').updateOne(
      { _id: proposal._id },
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

    return NextResponse.json({
      preferenceId: preference.id,
      checkoutUrl,
      signalAmount: preference.signalAmount,
      currency: 'BRL',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar checkout.'
    const status = message.includes('não configurada') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
