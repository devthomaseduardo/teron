import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { db, getSessionUser } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const diagnoses = new Hono<{ Variables: AppVariables }>()

/** POST /diagnoses */
diagnoses.post('/', async (c) => {
  const body = await c.req.json<{
    clientEmail?: string
    niche?: string
    answers?: { question: string; answer: string }[]
  }>()

  if (
    !body.clientEmail ||
    !body.niche ||
    !Array.isArray(body.answers) ||
    body.answers.length > 10
  ) {
    return c.json({ error: 'Diagnostico invalido.' }, 400)
  }

  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  const database = await db()
  const result = await database.collection('diagnoses').insertOne({
    clientId: user ? String(user._id) : 'public',
    clientEmail: body.clientEmail,
    niche: body.niche,
    answers: body.answers.slice(0, 10),
    status: 'new',
    createdAt: new Date(),
  })

  return c.json({ id: String(result.insertedId) }, 201)
})

/** GET /diagnoses */
diagnoses.get('/', async (c) => {
  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientId: String(user._id) }
  const items = await database
    .collection('diagnoses')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  return c.json(items.map((item) => ({ ...item, _id: String(item._id) })))
})

export default diagnoses
