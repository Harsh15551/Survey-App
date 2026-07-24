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
  if (query.status) where.status = query.status.toUpperCase()
  if (query.houseCode) where.houseCode = query.houseCode

  const [data, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      include: { household: { select: { houseCode: true, headName: true, district: true } } },
      skip, take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.grievance.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

async function getGrievanceById(id) {
  const g = await prisma.grievance.findUnique({
    where: { id },
    include: { household: { select: { houseCode: true, headName: true, phone: true, district: true, taluk: true } } }
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
