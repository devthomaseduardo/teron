import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { db, getSessionUser } from '@/lib/mongodb'

export async function POST(request: Request) {
  const body = await request.json()
  if (
    !body.clientEmail ||
    !body.niche ||
    !Array.isArray(body.answers) ||
    body.answers.length > 10
  ) {
    return NextResponse.json({ error: 'Diagnóstico inválido.' }, { status: 400 })
  }
  const cookie = (await cookies()).get('teron_session')?.value
  const user = await getSessionUser(cookie)
  const database = await db()
  const result = await database.collection('diagnoses').insertOne({
    clientId: user ? String(user._id) : 'public',
    clientEmail: body.clientEmail,
    niche: body.niche,
    answers: body.answers.slice(0, 10),
    status: 'new',
    createdAt: new Date(),
  })
  return NextResponse.json({ id: String(result.insertedId) }, { status: 201 })
}

export async function GET() {
  const cookie = (await cookies()).get('teron_session')?.value
  const user = await getSessionUser(cookie)
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  const database = await db()
  const filter =
    user.role === 'admin'
      ? {}
      : { $or: [{ clientId: String(user._id) }, { clientEmail: user.email }] }
  const items = await database
    .collection('diagnoses')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()
  return NextResponse.json(items.map((item) => ({ ...item, _id: String(item._id) })))
}

/** Admin: atualiza status do diagnóstico (new | reviewed | proposal_sent) */
export async function PATCH(request: Request) {
  const cookie = (await cookies()).get('teron_session')?.value
  const user = await getSessionUser(cookie)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }
  const body = (await request.json()) as { id?: string; status?: string }
  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id e status obrigatórios.' }, { status: 400 })
  }
  const allowed = ['new', 'reviewed', 'proposal_sent']
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }
  const database = await db()
  let filter: Record<string, unknown>
  try {
    filter = { _id: new ObjectId(body.id) }
  } catch {
    filter = { _id: body.id as unknown as ObjectId }
  }
  const result = await database
    .collection('diagnoses')
    .updateOne(filter, { $set: { status: body.status, updatedAt: new Date() } })
  if (!result.matchedCount) {
    return NextResponse.json({ error: 'Diagnóstico não encontrado.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, status: body.status })
}
