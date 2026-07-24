const prisma = require('../../config/database')

// Label maps for enum values (enum → human-readable)
const PROBLEM_LABELS = {
  WATER_SUPPLY: 'Water supply',
  POWER_SUPPLY: 'Power supply',
  ROAD_INFRA: 'Road infrastructure',
  HEALTHCARE: 'Healthcare access',
  EDUCATION: 'Schooling & education',
  DRAINAGE: 'Drainage & sanitation',
  UNEMPLOYMENT: 'Unemployment',
  CONNECTIVITY: 'Internet / connectivity',
  OTHERS: 'Others'
}

async function getAdminStats() {
  const [totalHouseholds, flaggedCount, activeAgents, openGrievances] = await Promise.all([
    prisma.household.count(),
    prisma.household.count({ where: { status: 'FLAGGED' } }),
    prisma.user.count({ where: { role: 'FIELD_AGENT', status: 'ACTIVE' } }),
    prisma.grievance.count({ where: { status: 'OPEN' } })
  ])

  // By district
  const byDistrict = await prisma.household.groupBy({
    by: ['district'],
    _count: { houseCode: true }
  })

  // By problem (problems is now an enum array)
  const allHouseholds = await prisma.household.findMany({
    select: { problems: true }
  })
  const problemCounts = {}
  for (const h of allHouseholds) {
    if (Array.isArray(h.problems)) {
      for (const p of h.problems) {
        problemCounts[p] = (problemCounts[p] || 0) + 1
      }
    }
  }

  const byProblem = Object.entries(problemCounts)
    .map(([id, count]) => ({ id, label: PROBLEM_LABELS[id] || id, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalHouseholds,
    flaggedHouseholds: flaggedCount,
    activeAgents,
    openGrievances,
    byDistrict: byDistrict.map(d => ({ district: d.district, count: d._count.houseCode })),
    byProblem
  }
}

async function getSupervisorHierarchy() {
  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    include: {
      agents: {
        select: {
          id: true, name: true, phone: true, region: true, status: true,
          _count: { select: { households: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return supervisors.map(s => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    region: s.region,
    status: s.status.toLowerCase(),
    agentCount: s.agents.length,
    activeAgentCount: s.agents.filter(a => a.status === 'ACTIVE').length,
    totalHouseholds: s.agents.reduce((sum, a) => sum + (a._count?.households || 0), 0),
    agents: s.agents.map(a => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      region: a.region,
      status: a.status.toLowerCase(),
      householdCount: a._count?.households || 0
    }))
  }))
}

async function getTeamStats(supervisorId) {
  const agents = await prisma.user.findMany({
    where: { supervisorId },
    select: { id: true }
  })
  const agentIds = agents.map(a => a.id)

  const [totalHouseholds, todayCount] = await Promise.all([
    prisma.household.count({ where: { fieldAgentId: { in: agentIds } } }),
    prisma.household.count({
      where: {
        fieldAgentId: { in: agentIds },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })
  ])

  const agentDetails = await prisma.user.findMany({
    where: { supervisorId },
    include: {
      _count: { select: { households: true } }
    }
  })

  return {
    agentCount: agents.length,
    totalHouseholds,
    todayCount,
    agents: agentDetails.map(a => ({
      id: a.id,
      name: a.name,
      region: a.region,
      status: a.status.toLowerCase(),
      householdCount: a._count?.households || 0
    }))
  }
}

module.exports = { getAdminStats, getSupervisorHierarchy, getTeamStats }
