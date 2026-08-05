const { Router } = require('express')
const { z } = require('zod')
const controller = require('./users.controller')
const { validate } = require('../../middleware/validate')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()

// All user routes require admin auth
router.use(authenticate, requireRoles(['admin']))

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  role: z.enum(['SUPERVISOR', 'FIELD_AGENT', 'supervisor', 'field_agent']),
  region: z.string().optional(),
  supervisorId: z.string().optional().nullable(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional().nullable().or(z.literal(''))
})

const updateUserSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'active', 'inactive']).optional(),
  region: z.string().optional(),
  supervisorId: z.string().optional().nullable()
})

router.get('/', controller.list)
router.get('/supervisors', controller.listSupervisors)
router.post('/', validate(createUserSchema), controller.create)
router.get('/:id', controller.getById)
router.patch('/:id', validate(updateUserSchema), controller.update)

module.exports = router
