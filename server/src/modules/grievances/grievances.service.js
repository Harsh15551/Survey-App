const prisma = require('../../config/database')
const { parsePagination, paginatedResponse } = require('../../utils/pagination')

async function submitGrievance(houseCode, message) {
  const household = await prisma.household.findUnique({ where: { houseCode } })
  if (!household) throw { status: 404, expose: true, message: 'Household not found.' }

  return prisma.grievance.create({
    data: { houseCode, message, status: 'OPEN' }
  })
}

async function getGrievances(query) {
  const { page, limit, skip } = parsePagination(query)
  const where = {}
  
  if (query.status && query.status !== 'all' && query.status !== 'ALL') {
    where.status = query.status.toUpperCase()
  }
  if (query.houseCode) where.houseCode = query.houseCode

  // Nested household location and relationship filters
  if (query.district && query.district !== 'all') {
    const formattedDistrict = query.district.toUpperCase().replace('_', ' ')
    where.household = { 
      ...where.household, 
      district: { equals: formattedDistrict, mode: 'insensitive' } 
    }
  }
  if (query.taluk && query.taluk !== 'all') {
    where.household = { 
      ...where.household, 
      taluk: query.taluk 
    }
  }
  if (query.wardPanchayat && query.wardPanchayat !== 'all') {
    where.household = { 
      ...where.household, 
      wardPanchayat: { contains: query.wardPanchayat, mode: 'insensitive' } 
    }
  }
  
  // Filter for team access (Supervisor context)
  if (query.supervisorId && query.supervisorId !== 'all') {
    const agents = await prisma.user.findMany({
      where: { supervisorId: query.supervisorId },
      select: { id: true }
    })
    const agentIds = agents.map(a => a.id)
    where.household = { 
      ...where.household, 
      fieldAgentId: { in: agentIds } 
    }
  }

  // Text search on house code, message, or head name
  if (query.search) {
    where.OR = [
      { houseCode: { contains: query.search } },
      { message: { contains: query.search, mode: 'insensitive' } },
      { household: { headName: { contains: query.search, mode: 'insensitive' } } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      include: { 
        household: { 
          select: { 
            houseCode: true, 
            headName: true, 
            phone: true, 
            district: true, 
            taluk: true, 
            wardPanchayat: true,
            fieldAgent: { select: { name: true } }
          } 
        } 
      },
      skip, 
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.grievance.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

async function getGrievanceById(id) {
  const g = await prisma.grievance.findUnique({
    where: { id },
    include: { household: { select: { houseCode: true, headName: true, phone: true, district: true, taluk: true, wardPanchayat: true, fieldAgent: { select: { name: true } } } } }
  })
  if (!g) throw { status: 404, expose: true, message: 'Grievance not found.' }
  return g
}

async function updateGrievanceStatus(id, status) {
  return prisma.grievance.update({
    where: { id },
    data: { status: status.toUpperCase() }
  })
}

module.exports = { submitGrievance, getGrievances, getGrievanceById, updateGrievanceStatus }
