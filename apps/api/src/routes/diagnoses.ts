import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { ObjectId } from 'mongodb'
import { db, getSessionUser, serializeId, type Diagnosis } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const diagnoses = new Hono<{ Variables: AppVariables }>()

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
    body.answers.length === 0 ||
    body.answers.length > 10
  ) {
    return c.json({ error: 'Diagnostico invalido.' }, 400)
  }

  const email = body.clientEmail.toLowerCase().trim()
  if (!email.includes('@')) return c.json({ error: 'E-mail invalido.' }, 400)

  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  const database = await db()
  const doc: Diagnosis = {
    clientId: user ? String(user._id) : 'public',
    clientEmail: email,
    niche: body.niche.slice(0, 80),
    answers: body.answers.slice(0, 10).map((a) => ({
      question: String(a.question || '').slice(0, 300),
      answer: String(a.answer || '').slice(0, 2000),
    })),
    status: 'new',
    createdAt: new Date(),
  }
  const result = await database.collection('diagnoses').insertOne(doc as never)

  return c.json({ id: String(result.insertedId) }, 201)
})

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
    .limit(100)
    .toArray()

  return c.json(items.map((item) => serializeId(item)))
})

diagnoses.get('/:id', async (c) => {
  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const id = c.req.param('id')
  const database = await db()
  let doc: Record<string, unknown> | null = null
  try {
    doc = await database.collection('diagnoses').findOne({ _id: new ObjectId(id) })
  } catch {
    doc = await database.collection('diagnoses').findOne({ _id: id as never })
  }
  if (!doc) return c.json({ error: 'Diagnostico nao encontrado.' }, 404)

  if (user.role !== 'admin' && String(doc.clientId) !== String(user._id)) {
    return c.json({ error: 'Sem permissao.' }, 403)
  }

  return c.json(serializeId(doc))
})

/** PATCH /diagnoses/:id — admin marca reviewed / proposal_sent */
diagnoses.patch('/:id', async (c) => {
  const token = getCookie(c, 'teron_session')
  const user = await getSessionUser(token)
  if (!user || user.role !== 'admin') return c.json({ error: 'Nao autorizado.' }, 403)

  const body = await c.req.json<{ status?: 'new' | 'reviewed' | 'proposal_sent' }>()
  if (!body.status || !['new', 'reviewed', 'proposal_sent'].includes(body.status)) {
    return c.json({ error: 'Status invalido.' }, 400)
  }

  const id = c.req.param('id')
  const database = await db()
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as never }
  const update: Record<string, unknown> = { status: body.status }
  if (body.status === 'reviewed') {
    update.reviewedAt = new Date()
    update.reviewedBy = String(user._id)
  }

  const result = await database.collection('diagnoses').findOneAndUpdate(
    filter,
    { $set: update },
    { returnDocument: 'after' }
  )
  if (!result) return c.json({ error: 'Diagnostico nao encontrado.' }, 404)
  return c.json(serializeId(result))
})

export default diagnoses
