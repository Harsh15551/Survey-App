const { Router } = require('express')
const prisma = require('../../config/database')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()
router.use(authenticate, requireRoles(['admin']))

router.get('/households/csv', async (req, res, next) => {
  try {
    const where = {}
    if (req.query.district) where.district = req.query.district.toUpperCase()
    if (req.query.status) where.status = req.query.status.toUpperCase()

    const households = await prisma.household.findMany({
      where,
      include: { fieldAgent: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const headers = [
      'House Code', 'Head Name', 'Phone', 'Email', 'State', 'District', 'Taluk',
      'Village', 'Ward/Panchayat', 'House Number', 'Property Type',
      'Head Age', 'Family Size Band', 'Occupation', 'Income Bracket',
      'Facilities', 'Latitude', 'Longitude',
      'Problems', 'Grievance', 'Govt Schemes', 'Status',
      'Field Agent', 'Surveyed On'
    ]

    const rows = households.map(h => [
      h.houseCode, h.headName, h.phone, h.email || '', h.state || '',
      h.district, h.taluk, h.villageName || '', h.wardPanchayat || '',
      h.houseNumber || '', h.propertyType || '', h.headAge ?? '',
      h.familySizeBand || '', h.occupation || '', h.incomeBracket || '',
      (h.facilities || []).join('; '), h.latitude ?? '', h.longitude ?? '',
      (h.problems || []).join('; '), h.grievanceDescription || '',
      (h.govtSchemesAvailed || []).join('; '), h.status,
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

router.get('/households/pdf', async (req, res) => {
  res.status(501).json({ error: 'PDF export not yet implemented. Use CSV export instead.' })
})

module.exports = router
