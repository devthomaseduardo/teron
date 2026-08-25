/**
 * Integracao Mercado Pago (Checkout Pro + Webhooks)
 * Docs: https://www.mercadopago.com.br/developers
 */

const MP_API = 'https://api.mercadopago.com'

export function getMpAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN nao configurada. Adicione no .env (Access Token de teste ou producao).'
    )
  }
  return token
}

export function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

/** Converte string tipo "R$ 48.000" ou "48000" em numero (BRL). */
export function parseInvestmentBRL(value: string): number {
  const cleaned = value
    .replace(/R\$\s?/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Valor de investimento invalido: ${value}`)
  }
  return Math.round(n * 100) / 100
}

export type CreatePreferenceInput = {
  proposalId: string
  title: string
  description: string
  amount: number
  payerEmail: string
  /** Fracao do total cobrada como sinal (0-1). Default 0.3 (30%). */
  signalRatio?: number
}

export type PreferenceResult = {
  id: string
  init_point: string
  sandbox_init_point: string
  signalAmount: number
}

export async function createCheckoutPreference(
  input: CreatePreferenceInput
): Promise<PreferenceResult> {
  const token = getMpAccessToken()
  const site = getSiteUrl()
  const ratio = input.signalRatio ?? 0.3
  const signalAmount = Math.round(input.amount * ratio * 100) / 100

  const body = {
    items: [
      {
        id: input.proposalId,
        title: input.title.slice(0, 256),
        description: (input.description || 'Sinal da proposta TERON').slice(0, 600),
        quantity: 1,
        currency_id: 'BRL',
        unit_price: signalAmount,
      },
    ],
    payer: {
      email: input.payerEmail,
    },
    external_reference: input.proposalId,
    metadata: {
      proposal_id: input.proposalId,
      full_amount: input.amount,
      signal_ratio: ratio,
    },
    back_urls: {
      success: `${site}/?payment=success&proposal=${input.proposalId}`,
      failure: `${site}/?payment=failure&proposal=${input.proposalId}`,
      pending: `${site}/?payment=pending&proposal=${input.proposalId}`,
    },
    auto_return: 'approved',
    notification_url: `${site}/api/mercadopago/webhook`,
    statement_descriptor: 'TERON',
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data?.message || data?.error || JSON.stringify(data)
    throw new Error(`Mercado Pago preference error: ${msg}`)
  }

  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
    signalAmount,
  }
}

export async function getPayment(paymentId: string) {
  const token = getMpAccessToken()
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Mercado Pago payment fetch error: ${data?.message || res.status}`)
  }
  return data as {
    id: number
    status: string
    status_detail: string
    external_reference?: string
    transaction_amount: number
    payer?: { email?: string }
    metadata?: Record<string, unknown>
  }
}

/** Mapeia status do MP para status interno da proposta. */
export function mapPaymentStatus(
  mpStatus: string
): 'approved' | 'pending' | 'rejected' | 'cancelled' | 'unknown' {
  switch (mpStatus) {
    case 'approved':
      return 'approved'
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pending'
    case 'rejected':
    case 'cancelled':
      return mpStatus as 'rejected' | 'cancelled'
    default:
      return 'unknown'
  }
}
