import { NextResponse } from 'next/server'

/** Pagamentos desativados para o deploy demo. */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Pagamentos / Mercado Pago desativados neste deploy.',
      disabled: true,
    },
    { status: 410 }
  )
}
