import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import auth from './routes/auth.js'
import diagnoses from './routes/diagnoses.js'
import proposals from './routes/proposals.js'
import mercadopago from './routes/mercadopago.js'
import projects from './routes/projects.js'
import stats from './routes/stats.js'
import { sessionMiddleware, type AppVariables } from './middleware/session.js'
import { pruneRateLimits } from './lib/rate-limit.js'

const app = new Hono<{ Variables: AppVariables }>()

const frontendOrigin =
  process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

app.onError((err, c) => {
  console.error('[teron-api] unhandled error', err)
  const message = err instanceof Error ? err.message : 'Erro interno da API.'
  const isMissingConfig =
    message.includes('MONGODB_URI') ||
    message.includes('MONGODB_CONNECTION_STRING') ||
    message.includes('MERCADOPAGO_ACCESS_TOKEN')

  return c.json(
    {
      error:
        process.env.NODE_ENV === 'production' && !isMissingConfig
          ? 'Erro interno da API.'
          : message,
    },
    isMissingConfig ? 503 : 500
  )
})

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return frontendOrigin
      if (origin === frontendOrigin) return origin
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin
      return frontendOrigin
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)
app.use('*', sessionMiddleware)

app.get('/health', async (c) => {
  let mongo: 'ok' | 'error' | 'skipped' = 'skipped'
  if (process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING) {
    try {
      const { db } = await import('./lib/mongodb.js')
      await db().then((d) => d.command({ ping: 1 }))
      mongo = 'ok'
    } catch {
      mongo = 'error'
    }
  }

  return c.json({
    ok: mongo !== 'error',
    service: 'teron-api',
    version: '0.3.0',
    mongo,
    routes: ['auth', 'diagnoses', 'proposals', 'projects', 'mercadopago', 'stats'],
  }, mongo === 'error' ? 503 : 200)
})

app.route('/auth', auth)
app.route('/diagnoses', diagnoses)
app.route('/proposals', proposals)
app.route('/projects', projects)
app.route('/mercadopago', mercadopago)
app.route('/stats', stats)

app.route('/api/auth', auth)
app.route('/api/diagnoses', diagnoses)
app.route('/api/proposals', proposals)
app.route('/api/projects', projects)
app.route('/api/mercadopago', mercadopago)
app.route('/api/stats', stats)

const port = Number(process.env.PORT || 4000)

setInterval(() => pruneRateLimits(), 5 * 60_000).unref?.()

console.log(`TERON API → http://localhost:${port}`)
console.log(`CORS origin: ${frontendOrigin}`)

serve({ fetch: app.fetch, port })
