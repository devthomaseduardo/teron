import { Hono } from 'hono'

/** Pagamentos desativados no deploy demo. */
const mercadopago = new Hono()

mercadopago.all('*', (c) =>
  c.json(
    {
      error: 'Pagamentos / Mercado Pago desativados neste deploy.',
      disabled: true,
    },
    410
  )
)

export default mercadopago
