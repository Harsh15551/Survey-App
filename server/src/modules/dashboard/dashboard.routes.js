const { Router } = require('express')
const controller = require('./dashboard.controller')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()
router.use(authenticate)

router.get('/stats', requireRoles(['admin']), controller.stats)
router.get('/supervisors', requireRoles(['admin']), controller.supervisors)
router.get('/team-stats', requireRoles(['supervisor']), controller.teamStats)

module.exports = router
