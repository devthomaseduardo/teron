import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      error: 'Pagamentos / Mercado Pago desativados neste deploy.',
      disabled: true,
    },
    { status: 410 }
  )
}
