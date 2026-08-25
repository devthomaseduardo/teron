import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { db, getSessionUser } from '@/lib/mongodb'

/**
 * GET /api/mercadopago/status?proposalId=...
 * Retorna status de pagamento da proposta (admin ou dono).
 */
export async function GET(request: Request) {
  const user = await getSessionUser((await cookies()).get('teron_session')?.value)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const proposalId = new URL(request.url).searchParams.get('proposalId')
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId é obrigatório.' }, { status: 400 })
  }

  const database = await db()
  let proposal = null as any
  try {
    proposal = await database.collection('proposals').findOne({ _id: new ObjectId(proposalId) })
  } catch {
    proposal = await database.collection('proposals').findOne({ _id: proposalId as any })
  }

  if (!proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
  }

  if (user.role !== 'admin' && proposal.clientEmail !== user.email) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  return NextResponse.json({
    proposalId: String(proposal._id),
    status: proposal.status,
    paymentStatus: proposal.paymentStatus || null,
    signalAmount: proposal.signalAmount || null,
    paidAmount: proposal.paidAmount || null,
    paidAt: proposal.paidAt || null,
    mpPaymentId: proposal.mpPaymentId || null,
  })
}
