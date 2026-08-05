const prisma = require('../../config/database')

// Label maps for enum values (enum → human-readable)
const PROBLEM_LABELS = {
  WATER_SUPPLY: 'Water Scarcity',
  POWER_SUPPLY: 'Electricity Issue',
  ROAD_INFRA: 'Road/connectivity issue',
  HEALTHCARE: 'Hospital Connectivity Issues',
  EDUCATION: 'School No Provision',
  DRAINAGE: 'Drainage/Sewage Issues',
  UNEMPLOYMENT: 'Unemployment',
  OTHERS: 'Others'
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateKey(d) {
  return startOfDay(d).toISOString().slice(0, 10)
}

function buildDailyTrend(records, days = 14) {
  const buckets = []
  const today = startOfDay(new Date())
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({
      key: dateKey(d),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      fullLabel: d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' }),
      value: 0
    })
  }
  const byKey = Object.fromEntries(buckets.map(b => [b.key, b]))
  for (const r of records) {
    const bucket = byKey[dateKey(r.createdAt)]
    if (bucket) bucket.value += 1
  }
  return buckets
}

function countInWindow(records, daysAgoStart, daysAgoEnd = 0) {
  const end = Date.now() - daysAgoEnd * 86400000
  const start = Date.now() - daysAgoStart * 86400000
  return records.filter(r => {
    const t = new Date(r.createdAt).getTime()
    return t >= start && t < end
  }).length
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

async function getAdminStats() {
  const [totalHouseholds, flaggedCount, activeAgents, totalAgents, openGrievances, resolvedGrievances] = await Promise.all([
    prisma.household.count(),
    prisma.household.count({ where: { status: 'FLAGGED' } }),
    prisma.user.count({ where: { role: 'FIELD_AGENT', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'FIELD_AGENT' } }),
    prisma.grievance.count({ where: { status: 'OPEN' } }),
    prisma.grievance.count({ where: { status: 'RESOLVED' } })
  ])

  const households = await prisma.household.findMany({
    select: {
      createdAt: true,
      district: true,
      problems: true
    }
  })

  const today = startOfDay(new Date())
  const surveyedToday = households.filter(h => new Date(h.createdAt) >= today).length
  const last7Days = countInWindow(households, 7, 0)
  const prev7Days = countInWindow(households, 14, 7)

  // By district
  const byDistrictMap = {}
  for (const h of households) {
    if (h.district) {
      byDistrictMap[h.district] = (byDistrictMap[h.district] || 0) + 1
    }
  }
  const byDistrict = Object.entries(byDistrictMap)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)

  // By problem
  const problemCounts = {}
  for (const h of households) {
    if (Array.isArray(h.problems)) {
      for (const p of h.problems) {
        problemCounts[p] = (problemCounts[p] || 0) + 1
      }
    }
  }
  const byProblem = Object.entries(problemCounts)
    .map(([id, count]) => ({ id, label: PROBLEM_LABELS[id] || id, count }))
    .sort((a, b) => b.count - a.count)

  // Trend
  const trend = buildDailyTrend(households, 14)

  // Top agents leaderboard
  const agents = await prisma.user.findMany({
    where: { role: 'FIELD_AGENT' },
    select: {
      id: true,
      name: true,
      region: true,
      status: true,
      households: {
        select: { createdAt: true }
      }
    }
  })

  const topAgents = agents
    .map(a => ({
      id: a.id,
      name: a.name,
      region: a.region,
      status: a.status.toLowerCase(),
      householdCount: a.households.length,
      todayCount: a.households.filter(h => new Date(h.createdAt) >= today).length
    }))
    .sort((a, b) => b.householdCount - a.householdCount)

  // Recent activity feed
  const recent = await prisma.household.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      fieldAgent: { select: { name: true } }
    }
  })

  const recentActivity = recent.map(h => ({
    houseCode: h.houseCode,
    headName: h.headName,
    district: h.district,
    taluk: h.taluk,
    status: h.status,
    createdAt: h.createdAt,
    fieldAgentId: h.fieldAgentId,
    fieldAgentName: h.fieldAgent?.name || 'Unknown agent'
  }))

  return {
    totalHouseholds,
    flaggedHouseholds: flaggedCount,
    activeAgents,
    totalAgents,
    openGrievances,
    resolvedGrievances,
    surveyedToday,
    last7Days,
    prev7Days,
    weekOverWeekPct: pctChange(last7Days, prev7Days),
    byDistrict,
    byProblem,
    trend,
    topAgents,
    recentActivity
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
    select: {
      id: true,
      name: true,
      phone: true,
      region: true,
      status: true,
      households: {
        select: {
          createdAt: true,
          status: true
        }
      }
    }
  })
  const agentIds = agents.map(a => a.id)

  const teamHouseholds = await prisma.household.findMany({
    where: { fieldAgentId: { in: agentIds } },
    select: {
      houseCode: true,
      createdAt: true
    }
  })

  const today = startOfDay(new Date())
  const todayCount = teamHouseholds.filter(h => new Date(h.createdAt) >= today).length
  const last7Days = countInWindow(teamHouseholds, 7, 0)
  const prev7Days = countInWindow(teamHouseholds, 14, 7)

  const teamHouseCodes = teamHouseholds.map(h => h.houseCode)
  const openGrievances = await prisma.grievance.count({
    where: {
      houseCode: { in: teamHouseCodes },
      status: 'OPEN'
    }
  })

  const agentsDetailed = agents
    .map(a => {
      const sorted = [...a.households].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))
      return {
        id: a.id,
        name: a.name,
        phone: a.phone,
        region: a.region,
        status: a.status.toLowerCase(),
        householdCount: a.households.length,
        todayCount: a.households.filter(h => new Date(h.createdAt) >= today).length,
        weekCount: countInWindow(a.households, 7, 0),
        flaggedCount: a.households.filter(h => h.status === 'FLAGGED').length,
        lastSurveyAt: sorted[0]?.createdAt || null
      }
    })
    .sort((a, b) => b.householdCount - a.householdCount)

  return {
    agentCount: agents.length,
    activeAgentCount: agents.filter(a => a.status === 'ACTIVE').length,
    totalHouseholds: teamHouseholds.length,
    todayCount,
    last7Days,
    prev7Days,
    weekOverWeekPct: pctChange(last7Days, prev7Days),
    openGrievances,
    trend: buildDailyTrend(teamHouseholds, 14),
    agents: agentsDetailed
  }
}

module.exports = { getAdminStats, getSupervisorHierarchy, getTeamStats }
