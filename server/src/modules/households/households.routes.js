const { Router } = require('express')
const { z } = require('zod')
const { District, Occupation, IncomeBracket, ProblemOption, SchemeOption } = require('@prisma/client')
const controller = require('./households.controller')
const { validate } = require('../../middleware/validate')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()

// Zod schemas
const checkCodeSchema = z.object({
  houseCode: z.string().min(1, 'House code is required').max(20)
})

const createSchema = z.object({
  houseCode: z.string().min(1).max(20),
  headName: z.string().min(2, 'Head name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']),
  familySize: z.number().int().min(1).max(50),
  occupation: z.nativeEnum(Occupation),
  incomeBracket: z.nativeEnum(IncomeBracket),
  district: z.nativeEnum(District),
  taluk: z.string().min(1),
  latitude: z.number().or(z.string()),
  longitude: z.number().or(z.string()),
  photoUrl: z.string().optional().nullable(),
  problems: z.array(z.nativeEnum(ProblemOption)).default([]),
  grievanceDescription: z.string().optional().nullable(),
  schemes: z.array(z.nativeEnum(SchemeOption)).default([]),
  schemeFeedback: z.string().optional().nullable()
})

const updateSchema = z.object({
  headName: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']).optional(),
  familySize: z.number().int().min(1).max(50).optional(),
  occupation: z.nativeEnum(Occupation).optional(),
  incomeBracket: z.nativeEnum(IncomeBracket).optional(),
  district: z.nativeEnum(District).optional(),
  taluk: z.string().optional(),
  latitude: z.number().or(z.string()).optional(),
  longitude: z.number().or(z.string()).optional(),
  photoUrl: z.string().optional().nullable(),
  problems: z.array(z.nativeEnum(ProblemOption)).optional(),
  grievanceDescription: z.string().optional().nullable(),
  schemes: z.array(z.nativeEnum(SchemeOption)).optional(),
  schemeFeedback: z.string().optional().nullable(),
  status: z.enum(['VERIFIED', 'FLAGGED', 'verified', 'flagged']).optional()
})

// All routes require authentication
router.use(authenticate)

// Check house code availability (field agents use this before creating)
router.post(
  '/check-house-code',
  requireRoles(['field_agent', 'admin', 'supervisor']),
  validate(checkCodeSchema),
  controller.checkHouseCode
)

// Create household (field agents only)
router.post(
  '/',
  requireRoles(['field_agent']),
  validate(createSchema),
  controller.create
)

// List with filters (admin/supervisor)
router.get(
  '/',
  requireRoles(['admin', 'supervisor', 'field_agent']),
  controller.list
)

// By agent / supervisor (field_agent can view own, supervisor/admin can view any)
router.get(
  '/by-agent/:agentId',
  requireRoles(['admin', 'supervisor', 'field_agent']),
  controller.byAgent
)
router.get(
  '/by-supervisor/:supervisorId',
  requireRoles(['admin', 'supervisor']),
  controller.bySupervisor
)

// Get by house code (any authenticated user)
router.get('/:houseCode', controller.getByCode)

// Update (admin can update any; field_agent can update own)
router.patch(
  '/:houseCode',
  requireRoles(['admin', 'field_agent']),
  validate(updateSchema),
  controller.update
)

module.exports = router
