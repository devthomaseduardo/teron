import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { db, getSessionUser } from '../lib/mongodb.js'
import type { AppVariables } from '../middleware/session.js'

const stats = new Hono<{ Variables: AppVariables }>()

/** GET /stats — KPIs do painel (admin = global, client = proprio) */
stats.get('/', async (c) => {
  const user = await getSessionUser(getCookie(c, 'teron_session'))
  if (!user) return c.json({ error: 'Nao autorizado.' }, 403)

  const database = await db()
  const isAdmin = user.role === 'admin'
  const emailFilter = isAdmin ? {} : { clientEmail: user.email }
  const diagnosisFilter = isAdmin ? {} : { clientId: String(user._id) }

  const [
    diagnosesTotal,
    diagnosesNew,
    proposalsTotal,
    proposalsSent,
    proposalsApproved,
    projectsTotal,
    projectsActive,
    recentActivity,
  ] = await Promise.all([
    database.collection('diagnoses').countDocuments(diagnosisFilter),
    database.collection('diagnoses').countDocuments({ ...diagnosisFilter, status: 'new' }),
    database.collection('proposals').countDocuments(emailFilter),
    database.collection('proposals').countDocuments({ ...emailFilter, status: 'sent' }),
    database.collection('proposals').countDocuments({ ...emailFilter, status: 'approved' }),
    database.collection('projects').countDocuments(emailFilter),
    database.collection('projects').countDocuments({
      ...emailFilter,
      status: { $in: ['briefing', 'design', 'build', 'qa'] },
    }),
    database
      .collection('activity')
      .find(isAdmin ? {} : { actorEmail: user.email })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray(),
  ])

  return c.json({
    role: user.role,
    diagnoses: { total: diagnosesTotal, new: diagnosesNew },
    proposals: {
      total: proposalsTotal,
      sent: proposalsSent,
      approved: proposalsApproved,
    },
    projects: { total: projectsTotal, active: projectsActive },
    activity: recentActivity.map((a) => ({
      ...a,
      _id: String(a._id),
    })),
  })
})

export default stats
