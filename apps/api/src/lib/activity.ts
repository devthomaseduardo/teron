import { db } from './mongodb.js'

export type ActivityType =
  | 'login'
  | 'diagnosis_created'
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'project_created'
  | 'project_updated'
  | 'payment_updated'

export async function logActivity(input: {
  type: ActivityType
  actorId?: string
  actorEmail?: string
  entityType?: string
  entityId?: string
  meta?: Record<string, unknown>
}) {
  try {
    const database = await db()
    await database.collection('activity').insertOne({
      ...input,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[activity]', err)
  }
}
