import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { ObjectId } from 'mongodb'
import { db, getSessionUser, serializeId, type Project } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const projects = new Hono<{ Variables: AppVariables }>()

const STATUSES = ['briefing', 'design', 'build', 'qa', 'delivered', 'paused'] as const

projects.get('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const database = await db()
  const filter = user.role === 'admin' ? {} : { clientEmail: user.email }
  const items = await database
    .collection('projects')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  return c.json(items.map((item) => serializeId(item)))
})

projects.post('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user || user.role !== 'admin') return c.json({ error: 'Nao autorizado.' }, 403)

  const body = await c.req.json<{
    proposalId?: string
    clientEmail?: string
    title?: string
    timeline?: string
    notes?: string
    status?: Project['status']
  }>()

  if (!body.clientEmail || !body.title) {
    return c.json({ error: 'clientEmail e title sao obrigatorios.' }, 400)
  }

  const status = body.status && STATUSES.includes(body.status) ? body.status : 'briefing'
  const database = await db()
  const doc: Project = {
    proposalId: body.proposalId || '',
    clientEmail: body.clientEmail.toLowerCase().trim(),
    title: body.title.slice(0, 200),
    status,
    timeline: body.timeline?.slice(0, 200),
    notes: body.notes?.slice(0, 2000),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await database.collection('projects').insertOne(doc as never)
  return c.json({ id: String(result.insertedId), ...doc }, 201)
})

projects.patch('/:id', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user || user.role !== 'admin') return c.json({ error: 'Nao autorizado.' }, 403)

  const body = await c.req.json<{
    status?: Project['status']
    timeline?: string
    notes?: string
    title?: string
  }>()

  const $set: Record<string, unknown> = { updatedAt: new Date() }
  if (body.status) {
    if (!STATUSES.includes(body.status)) return c.json({ error: 'Status invalido.' }, 400)
    $set.status = body.status
  }
  if (body.timeline !== undefined) $set.timeline = body.timeline
  if (body.notes !== undefined) $set.notes = body.notes
  if (body.title !== undefined) $set.title = body.title.slice(0, 200)

  const id = c.req.param('id')
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as never }
  const database = await db()
  const result = await database.collection('projects').findOneAndUpdate(
    filter,
    { $set },
    { returnDocument: 'after' }
  )
  if (!result) return c.json({ error: 'Projeto nao encontrado.' }, 404)
  return c.json(serializeId(result))
})

projects.get('/:id', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const id = c.req.param('id')
  const database = await db()
  let doc: Record<string, unknown> | null = null
  try {
    doc = await database.collection('projects').findOne({ _id: new ObjectId(id) })
  } catch {
    doc = await database.collection('projects').findOne({ _id: id as never })
  }
  if (!doc) return c.json({ error: 'Projeto nao encontrado.' }, 404)
  if (user.role !== 'admin' && doc.clientEmail !== user.email) {
    return c.json({ error: 'Sem permissao.' }, 403)
  }
  return c.json(serializeId(doc))
})

export default projects
