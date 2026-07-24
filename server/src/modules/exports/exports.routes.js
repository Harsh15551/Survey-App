const { Router } = require('express')
const prisma = require('../../config/database')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()
router.use(authenticate, requireRoles(['admin']))

router.get('/households/csv', async (req, res, next) => {
  try {
    const where = {}
    if (req.query.district) where.district = req.query.district
    if (req.query.status) where.status = req.query.status.toUpperCase()

    const households = await prisma.household.findMany({
      where,
      include: { fieldAgent: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const headers = [
      'House Code', 'Head Name', 'Phone', 'District', 'Taluk', 'Age', 'Gender',
      'Family Size', 'Occupation', 'Income Bracket', 'Latitude', 'Longitude',
      'Problems', 'Grievance', 'Schemes', 'Scheme Feedback', 'Status',
      'Field Agent', 'Surveyed On'
    ]

    const rows = households.map(h => [
      h.houseCode, h.headName, h.phone, h.district, h.taluk, h.age, h.gender,
      h.familySize, h.occupation, h.incomeBracket, h.latitude, h.longitude,
      (h.problems || []).join('; '), h.grievanceDescription || '',
      (h.schemes || []).join('; '), h.schemeFeedback || '', h.status,
      h.fieldAgent?.name || '', new Date(h.createdAt).toLocaleDateString()
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="households-${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

// PDF export placeholder (would use puppeteer or pdfkit in production)
router.get('/households/pdf', async (req, res) => {
  res.status(501).json({ error: 'PDF export not yet implemented. Use CSV export instead.' })
})

module.exports = router
