const { Router } = require('express')
const { z } = require('zod')
const {
  District, Occupation, IncomeBracket, ProblemOption,
  PropertyType, FamilySizeBand, FacilityOption, GovtSchemeOption
} = require('@prisma/client')
const controller = require('./households.controller')
const { validate } = require('../../middleware/validate')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()

const checkCodeSchema = z.object({
  houseCode: z.string().min(1, 'House code is required').max(20)
})

const createSchema = z.object({
  houseCode: z.string().min(1).max(20),
  headName: z.string().min(2, 'Head name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  state: z.string().min(1),
  propertyType: z.nativeEnum(PropertyType),
  district: z.nativeEnum(District).or(z.enum(['Gulbarga', 'Bidar', 'GULBARGA', 'BIDAR'])),
  taluk: z.string().min(1),
  villageName: z.string().min(1),
  wardPanchayat: z.string().min(1),
  houseNumber: z.string().min(1),
  alternatePhone: z.string().regex(/^\d{10}$/).optional().nullable().or(z.literal('')),
  familySizeBand: z.nativeEnum(FamilySizeBand),
  headAge: z.number().int().min(18).max(120),
  incomeBracket: z.nativeEnum(IncomeBracket),
  facilities: z.array(z.nativeEnum(FacilityOption)).min(1),
  occupation: z.nativeEnum(Occupation),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  problems: z.array(z.nativeEnum(ProblemOption)).default([]),
  grievanceDescription: z.string().optional().nullable(),
  govtSchemesAvailed: z.array(z.nativeEnum(GovtSchemeOption)).default([])
})

const updateSchema = z.object({
  headName: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  state: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  district: z.nativeEnum(District).or(z.enum(['Gulbarga', 'Bidar', 'GULBARGA', 'BIDAR'])).optional(),
  taluk: z.string().optional(),
  villageName: z.string().optional(),
  wardPanchayat: z.string().optional(),
  houseNumber: z.string().optional(),
  alternatePhone: z.string().regex(/^\d{10}$/).optional().nullable().or(z.literal('')),
  familySizeBand: z.nativeEnum(FamilySizeBand).optional(),
  headAge: z.number().int().min(18).max(120).optional(),
  incomeBracket: z.nativeEnum(IncomeBracket).optional(),
  facilities: z.array(z.nativeEnum(FacilityOption)).optional(),
  occupation: z.nativeEnum(Occupation).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  problems: z.array(z.nativeEnum(ProblemOption)).optional(),
  grievanceDescription: z.string().optional().nullable(),
  govtSchemesAvailed: z.array(z.nativeEnum(GovtSchemeOption)).optional(),
  status: z.enum(['VERIFIED', 'FLAGGED', 'verified', 'flagged']).optional()
})

router.use(authenticate)

router.post(
  '/check-house-code',
  requireRoles(['field_agent', 'admin', 'supervisor']),
  validate(checkCodeSchema),
  controller.checkHouseCode
)

router.post(
  '/',
  requireRoles(['field_agent']),
  validate(createSchema),
  controller.create
)

router.get(
  '/',
  requireRoles(['admin', 'supervisor', 'field_agent']),
  controller.list
)

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

router.get('/:houseCode', controller.getByCode)

router.patch(
  '/:houseCode',
  requireRoles(['admin', 'field_agent']),
  validate(updateSchema),
  controller.update
)

module.exports = router
