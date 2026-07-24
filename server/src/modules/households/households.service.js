const prisma = require('../../config/database')
const { parsePagination, paginatedResponse } = require('../../utils/pagination')

/**
 * Check if a house code is available (doesn't exist yet)
 */
async function checkHouseCode(houseCode) {
  const existing = await prisma.household.findUnique({ where: { houseCode } })
  if (existing) {
    return { available: false, error: 'House code already registered.' }
  }
  return { available: true }
}

/**
 * Create a new household survey
 */
async function createHousehold(data, fieldAgentId) {
  // Double-check house code uniqueness
  const existing = await prisma.household.findUnique({ where: { houseCode: data.houseCode } })
  if (existing) {
    throw { status: 409, expose: true, message: 'House code already registered.' }
  }

  const household = await prisma.household.create({
    data: {
      houseCode: data.houseCode,
      headName: data.headName,
      phone: data.phone,
      age: data.age,
      gender: data.gender.toUpperCase(),
      familySize: data.familySize,
      occupation: data.occupation,
      incomeBracket: data.incomeBracket,
      district: data.district,
      taluk: data.taluk,
      latitude: data.latitude,
      longitude: data.longitude,
      photoUrl: data.photoUrl || null,
      fieldAgentId,
      problems: data.problems || [],
      grievanceDescription: data.grievanceDescription || null,
      schemes: data.schemes || [],
      schemeFeedback: data.schemeFeedback || null,
      status: 'VERIFIED'
    },
    include: {
      fieldAgent: { select: { id: true, name: true } }
    }
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: fieldAgentId,
      action: 'household.create',
      entity: 'household',
      entityId: data.houseCode,
      after: JSON.parse(JSON.stringify(household))
    }
  })

  return household
}

/**
 * List households with filters and pagination
 */
async function getHouseholds(query, userRole, userId) {
  const { page, limit, skip } = parsePagination(query)
  const where = {}

  // Filters
  if (query.district) where.district = query.district
  if (query.taluk) where.taluk = query.taluk
  if (query.status) where.status = query.status.toUpperCase()
  if (query.fieldAgentId) where.fieldAgentId = query.fieldAgentId
  if (query.search) {
    where.OR = [
      { houseCode: { contains: query.search } },
      { headName: { contains: query.search, mode: 'insensitive' } }
    ]
  }

  // Supervisor: only see their team's households
  if (userRole === 'SUPERVISOR') {
    const agents = await prisma.user.findMany({
      where: { supervisorId: userId },
      select: { id: true }
    })
    where.fieldAgentId = { in: agents.map(a => a.id) }
  }

  // Field agent: only see their own
  if (userRole === 'FIELD_AGENT' || userRole === 'field_agent') {
    where.fieldAgentId = userId
  }

  const [data, total] = await Promise.all([
    prisma.household.findMany({
      where,
      include: {
        fieldAgent: { select: { id: true, name: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.household.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

/**
 * Get single household by house code
 */
async function getHouseholdByCode(houseCode) {
  const household = await prisma.household.findUnique({
    where: { houseCode },
    include: {
      fieldAgent: { select: { id: true, name: true, phone: true } },
      grievances: { orderBy: { createdAt: 'desc' } }
    }
  })
  if (!household) throw { status: 404, expose: true, message: 'Household not found.' }
  return household
}

/**
 * Update household (admin only)
 */
async function updateHousehold(houseCode, data, actorId) {
  const before = await prisma.household.findUnique({ where: { houseCode } })
  if (!before) throw { status: 404, expose: true, message: 'Household not found.' }

  const updateData = {}
  const allowedFields = [
    'headName', 'phone', 'age', 'gender', 'familySize', 'occupation', 'incomeBracket',
    'district', 'taluk', 'latitude', 'longitude', 'photoUrl', 'problems', 'grievanceDescription',
    'schemes', 'schemeFeedback', 'status'
  ]
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }
  if (updateData.status) updateData.status = updateData.status.toUpperCase()
  if (updateData.gender) updateData.gender = updateData.gender.toUpperCase()

  const household = await prisma.household.update({
    where: { houseCode },
    data: updateData
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'household.edit',
      entity: 'household',
      entityId: houseCode,
      before: JSON.parse(JSON.stringify(before)),
      after: JSON.parse(JSON.stringify(household))
    }
  })

  return household
}

/**
 * Get households by field agent
 */
async function getHouseholdsByAgent(agentId, query) {
  const { page, limit, skip } = parsePagination(query || {})
  const where = { fieldAgentId: agentId }

  const [data, total] = await Promise.all([
    prisma.household.findMany({
      where,
      include: { fieldAgent: { select: { id: true, name: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.household.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

/**
 * Get all households for a supervisor's team
 */
async function getHouseholdsBySupervisor(supervisorId, query) {
  const agents = await prisma.user.findMany({
    where: { supervisorId },
    select: { id: true }
  })
  const agentIds = agents.map(a => a.id)
  const { page, limit, skip } = parsePagination(query)
  const where = { fieldAgentId: { in: agentIds } }

  const [data, total] = await Promise.all([
    prisma.household.findMany({
      where,
      include: { fieldAgent: { select: { id: true, name: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.household.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

module.exports = {
  checkHouseCode,
  createHousehold,
  getHouseholds,
  getHouseholdByCode,
  updateHousehold,
  getHouseholdsByAgent,
  getHouseholdsBySupervisor
}
