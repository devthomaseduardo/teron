import type { Project } from '@teron/shared'
import { db } from './mongodb.js'
import { logActivity } from './activity.js'

/** Cria projeto a partir de proposta aprovada (idempotente por proposalId). */
export async function ensureProjectFromProposal(proposal: {
  _id: unknown
  clientEmail: string
  title: string
  timeline?: string
}) {
  const database = await db()
  const proposalId = String(proposal._id)
  const existing = await database.collection('projects').findOne({ proposalId })
  if (existing) return { projectId: String(existing._id), created: false }

  const doc: Project = {
    proposalId,
    clientEmail: proposal.clientEmail,
    title: String(proposal.title),
    status: 'briefing',
    timeline: proposal.timeline,
    notes: 'Projeto criado automaticamente apos aprovacao da proposta.',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await database.collection('projects').insertOne(doc as never)
  await logActivity({
    type: 'project_created',
    entityType: 'project',
    entityId: String(result.insertedId),
    meta: { proposalId, auto: true },
  })
  return { projectId: String(result.insertedId), created: true }
}
