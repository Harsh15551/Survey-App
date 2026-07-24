const bcrypt = require('bcryptjs')
const prisma = require('../../config/database')
const { parsePagination, paginatedResponse } = require('../../utils/pagination')

async function getUsers(query) {
  const { page, limit, skip } = parsePagination(query)
  const where = {}

  if (query.role) where.role = query.role.toUpperCase()
  if (query.status) where.status = query.status.toUpperCase()
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } }
    ]
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, phone: true, role: true, region: true, status: true,
        supervisorId: true, createdAt: true,
        supervisor: { select: { id: true, name: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return paginatedResponse(data, total, page, limit)
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      supervisor: { select: { id: true, name: true } },
      agents: { select: { id: true, name: true, phone: true, status: true } }
    }
  })
  if (!user) throw { status: 404, expose: true, message: 'User not found.' }
  return user
}

async function createUser(data) {
  // Generate a temporary password (phone last 4 digits + year)
  const tempPassword = data.phone.slice(-4) + new Date().getFullYear()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      passwordHash,
      role: data.role.toUpperCase().replace(' ', '_'),
      region: data.region || '',
      supervisorId: data.supervisorId || null
    },
    select: {
      id: true, name: true, phone: true, role: true, region: true, status: true, createdAt: true
    }
  })

  // In production: send temp password via SMS
  return { ...user, tempPassword }
}

async function updateUser(id, data, actorId) {
  const before = await prisma.user.findUnique({ where: { id } })
  if (!before) throw { status: 404, expose: true, message: 'User not found.' }

  const updateData = {}
  if (data.status) updateData.status = data.status.toUpperCase()
  if (data.region) updateData.region = data.region
  if (data.supervisorId !== undefined) updateData.supervisorId = data.supervisorId || null

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true, name: true, phone: true, role: true, region: true, status: true, supervisorId: true
    }
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'user.update',
      entity: 'user',
      entityId: id,
      before: JSON.parse(JSON.stringify(before)),
      after: JSON.parse(JSON.stringify(user))
    }
  })

  return user
}

async function getSupervisors() {
  return prisma.user.findMany({
    where: { role: 'SUPERVISOR', status: 'ACTIVE' },
    select: { id: true, name: true, phone: true, region: true },
    orderBy: { name: 'asc' }
  })
}

module.exports = { getUsers, getUserById, createUser, updateUser, getSupervisors }
