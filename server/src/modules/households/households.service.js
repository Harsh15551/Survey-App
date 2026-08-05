const bcrypt = require('bcryptjs')
const prisma = require('../../config/database')
const { parsePagination, paginatedResponse } = require('../../utils/pagination')

const FAMILY_SIZE_FROM_BAND = {
  ONE_TO_THREE: 2,
  FOUR_TO_SIX: 5,
  SEVEN_TO_TEN: 8,
  ABOVE_TEN: 11
}

function sanitizeHousehold(household) {
  if (!household) return household
  const { citizenPasswordHash, ...rest } = household
  return rest
}

function normalizeDistrict(district) {
  if (!district) return district
  const upper = district.toUpperCase()
  if (upper === 'GULBARGA' || upper === 'GULBARGA ') return 'GULBARGA'
  return upper
}

async function checkHouseCode(houseCode) {
  const existing = await prisma.household.findUnique({ where: { houseCode } })
  if (existing) {
    return { available: false, error: 'House code already registered.' }
  }
  return { available: true }
}

async function createHousehold(data, fieldAgentId) {
  const existing = await prisma.household.findUnique({ where: { houseCode: data.houseCode } })
  if (existing) {
    throw { status: 409, expose: true, message: 'House code already registered.' }
  }

  const citizenPassword = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  const citizenPasswordHash = await bcrypt.hash(citizenPassword, 10)

  const household = await prisma.household.create({
    data: {
      houseCode: data.houseCode,
      headName: data.headName,
      phone: data.phone,
      email: data.email || null,
      alternatePhone: data.alternatePhone || null,
      state: data.state || 'Karnataka',
      propertyType: data.propertyType,
      district: normalizeDistrict(data.district),
      taluk: data.taluk,
      villageName: data.villageName,
      wardPanchayat: data.wardPanchayat,
      houseNumber: data.houseNumber,
      headAge: data.headAge,
      familySizeBand: data.familySizeBand,
      familySize: FAMILY_SIZE_FROM_BAND[data.familySizeBand] || null,
      occupation: data.occupation,
      incomeBracket: data.incomeBracket,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      photoUrl: data.photoUrl || null,
      fieldAgentId,
      facilities: data.facilities || [],
      problems: data.problems || [],
      grievanceDescription: data.grievanceDescription || null,
      govtSchemesAvailed: data.govtSchemesAvailed || [],
      citizenPasswordHash,
      status: 'VERIFIED'
    },
    include: {
      fieldAgent: { select: { id: true, name: true } }
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: fieldAgentId,
      action: 'household.create',
      entity: 'household',
      entityId: data.houseCode,
      after: JSON.parse(JSON.stringify(sanitizeHousehold(household)))
    }
  })

  return { ...sanitizeHousehold(household), citizenPassword }
}

async function getHouseholds(query, userRole, userId) {
  const { page, limit, skip } = parsePagination(query)
  const where = {}

  if (query.district && query.district !== 'all') where.district = normalizeDistrict(query.district)
  if (query.taluk && query.taluk !== 'all') where.taluk = query.taluk
  if (query.wardPanchayat && query.wardPanchayat !== 'all') where.wardPanchayat = { contains: query.wardPanchayat, mode: 'insensitive' }
  if (query.status && query.status !== 'all') where.status = query.status.toUpperCase()
  if (query.fieldAgentId && query.fieldAgentId !== 'all') where.fieldAgentId = query.fieldAgentId
  if (query.search) {
    where.OR = [
      { houseCode: { contains: query.search } },
      { headName: { contains: query.search, mode: 'insensitive' } },
      { villageName: { contains: query.search, mode: 'insensitive' } }
    ]
  }

  if (userRole === 'SUPERVISOR') {
    const agents = await prisma.user.findMany({
      where: { supervisorId: userId },
      select: { id: true }
    })
    where.fieldAgentId = { in: agents.map(a => a.id) }
  } else if ((userRole === 'ADMIN' || userRole === 'ADMINISTRATOR') && query.supervisorId && query.supervisorId !== 'all') {
    const agents = await prisma.user.findMany({
      where: { supervisorId: query.supervisorId },
      select: { id: true }
    })
    where.fieldAgentId = { in: agents.map(a => a.id) }
  }

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

  return paginatedResponse(data.map(sanitizeHousehold), total, page, limit)
}

async function getHouseholdByCode(houseCode) {
  const household = await prisma.household.findUnique({
    where: { houseCode },
    include: {
      fieldAgent: { select: { id: true, name: true, phone: true } },
      grievances: { orderBy: { createdAt: 'desc' } }
    }
  })
  if (!household) throw { status: 404, expose: true, message: 'Household not found.' }
  return sanitizeHousehold(household)
}

async function updateHousehold(houseCode, data, actorId) {
  const before = await prisma.household.findUnique({ where: { houseCode } })
  if (!before) throw { status: 404, expose: true, message: 'Household not found.' }

  const updateData = {}
  const allowedFields = [
    'headName', 'phone', 'email', 'alternatePhone', 'state', 'propertyType',
    'district', 'taluk', 'villageName', 'wardPanchayat', 'houseNumber',
    'headAge', 'familySizeBand', 'occupation', 'incomeBracket',
    'latitude', 'longitude', 'photoUrl', 'facilities', 'problems',
    'grievanceDescription', 'govtSchemesAvailed', 'status'
  ]
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }
  if (updateData.status) updateData.status = updateData.status.toUpperCase()
  if (updateData.district) updateData.district = normalizeDistrict(updateData.district)
  if (updateData.familySizeBand) {
    updateData.familySize = FAMILY_SIZE_FROM_BAND[updateData.familySizeBand] || null
  }

  const household = await prisma.household.update({
    where: { houseCode },
    data: updateData
  })

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'household.edit',
      entity: 'household',
      entityId: houseCode,
      before: JSON.parse(JSON.stringify(sanitizeHousehold(before))),
      after: JSON.parse(JSON.stringify(sanitizeHousehold(household)))
    }
  })

  return sanitizeHousehold(household)
}

async function getHouseholdsByAgent(agentId, query) {
  const { page, limit, skip } = parsePagination(query || {})
  const where = { fieldAgentId: agentId }

  if (query?.search) {
    where.OR = [
      { houseCode: { contains: query.search } },
      { headName: { contains: query.search, mode: 'insensitive' } },
      { villageName: { contains: query.search, mode: 'insensitive' } }
    ]
  }

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

  return paginatedResponse(data.map(sanitizeHousehold), total, page, limit)
}

async function getHouseholdsBySupervisor(supervisorId, query) {
  const agents = await prisma.user.findMany({
    where: { supervisorId },
    select: { id: true }
  })
  const agentIds = agents.map(a => a.id)
  const { page, limit, skip } = parsePagination(query || {})
  const where = {}

  if (query?.fieldAgentId && query.fieldAgentId !== 'all') {
    where.fieldAgentId = query.fieldAgentId
  } else {
    where.fieldAgentId = { in: agentIds }
  }

  if (query?.district && query.district !== 'all') where.district = normalizeDistrict(query.district)
  if (query?.taluk && query.taluk !== 'all') where.taluk = query.taluk
  if (query?.status && query.status !== 'all') where.status = query.status.toUpperCase()

  if (query?.search) {
    where.OR = [
      { houseCode: { contains: query.search } },
      { headName: { contains: query.search, mode: 'insensitive' } },
      { villageName: { contains: query.search, mode: 'insensitive' } }
    ]
  }

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

  return paginatedResponse(data.map(sanitizeHousehold), total, page, limit)
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
