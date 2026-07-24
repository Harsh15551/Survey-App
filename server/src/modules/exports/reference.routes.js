const { Router } = require('express')

const router = Router()

// ---------------------------------------------------------------------------
// Label maps (enum value → human-readable label)
// ---------------------------------------------------------------------------

const OCCUPATIONS = [
  { id: 'AGRICULTURE', label: 'Agriculture / farming' },
  { id: 'DAILY_WAGE', label: 'Daily wage labour' },
  { id: 'GOVT_SERVICE', label: 'Government service' },
  { id: 'PRIVATE_SERVICE', label: 'Private service' },
  { id: 'BUSINESS', label: 'Business / self-employed' },
  { id: 'UNEMPLOYED', label: 'Unemployed' },
  { id: 'OTHER', label: 'Other' }
]

const INCOME_BRACKETS = [
  { id: 'BELOW_1_2L', label: 'Below ₹1,20,000 per annum' },
  { id: 'BETWEEN_1_2L_3L', label: '₹1,20,000 – ₹3,00,000 per annum' },
  { id: 'BETWEEN_3L_6L', label: '₹3,00,000 – ₹6,00,000 per annum' },
  { id: 'ABOVE_6L', label: 'Above ₹6,00,000 per annum' }
]

const PROBLEMS = [
  { id: 'WATER_SUPPLY', label: 'Water supply' },
  { id: 'POWER_SUPPLY', label: 'Power supply' },
  { id: 'ROAD_INFRA', label: 'Road infrastructure' },
  { id: 'HEALTHCARE', label: 'Healthcare access' },
  { id: 'EDUCATION', label: 'Schooling & education' },
  { id: 'DRAINAGE', label: 'Drainage & sanitation' },
  { id: 'UNEMPLOYMENT', label: 'Unemployment' },
  { id: 'CONNECTIVITY', label: 'Internet / connectivity' },
  { id: 'OTHERS', label: 'Others' }
]

const SCHEMES = [
  { id: 'PDS', label: 'PDS ration card' },
  { id: 'UJJWALA', label: 'Free cooking gas (Ujjwala)' },
  { id: 'OLD_AGE_PENSION', label: 'Old age pension' },
  { id: 'DRINKING_WATER', label: 'Drinking water supply' },
  { id: 'HEALTH_SUBCENTRE', label: 'Primary health sub-centre' },
  { id: 'STREET_LIGHTING', label: 'Street lighting' },
  { id: 'HOUSING', label: 'Housing scheme (AWAS)' },
  { id: 'SCHOLARSHIPS', label: 'Scholarships' },
  { id: 'OTHERS', label: 'Others' }
]

const DISTRICTS = [
  {
    name: 'Gulbarga',
    taluks: ['Gulbarga North', 'Gulbarga South', 'Chittapur', 'Sedam', 'Aland', 'Jevargi']
  },
  {
    name: 'Bidar',
    taluks: ['Bidar', 'Basavakalyan', 'Humnabad', 'Aurad', 'Bhalki']
  }
]

const EMERGENCY_NUMBERS = [
  { label: 'Police', number: '100' },
  { label: 'Ambulance', number: '108' },
  { label: 'Fire', number: '101' },
  { label: "Women's helpline", number: '181' },
  { label: 'Child helpline', number: '1098' },
  { label: 'District disaster helpline', number: '1077' },
  { label: 'Gulbarga district collectorate', number: '08472-241100' },
  { label: 'Bidar district collectorate', number: '08482-226300' },
  { label: 'National toll-free (health)', number: '1075' }
]

// All reference data is public (no auth needed)
router.get('/options', (req, res) => {
  res.json({ problems: PROBLEMS, schemes: SCHEMES, occupations: OCCUPATIONS, incomeBrackets: INCOME_BRACKETS })
})

router.get('/locations', (req, res) => {
  res.json({ districts: DISTRICTS })
})

router.get('/emergency', (req, res) => {
  res.json({ data: EMERGENCY_NUMBERS })
})

module.exports = router
