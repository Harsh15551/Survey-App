const { Router } = require('express')
const { z } = require('zod')
const controller = require('./grievances.controller')
const { validate } = require('../../middleware/validate')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()

const submitSchema = z.object({ message: z.string().min(10, 'Message must be at least 10 characters') })
const statusSchema = z.object({ status: z.enum(['OPEN', 'RESOLVED', 'open', 'resolved']) })

router.use(authenticate)

// Citizen submits grievance (houseCode from their JWT)
router.post('/', requireRoles(['citizen']), validate(submitSchema), controller.submit)

// Admin/Supervisor list and manage
router.get('/', requireRoles(['admin', 'supervisor']), controller.list)
router.get('/:id', requireRoles(['admin', 'supervisor']), controller.getById)
router.patch('/:id', requireRoles(['admin', 'supervisor']), validate(statusSchema), controller.updateStatus)

module.exports = router
