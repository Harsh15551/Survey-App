const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Label maps (enum value → human-readable label)
// Used by frontend to display friendly names
// ---------------------------------------------------------------------------

const DISTRICT_LABELS = {
  GULBARGA: 'Gulbarga',
  BIDAR: 'Bidar'
}

const TALUKS = {
  GULBARGA: ['Gulbarga North', 'Gulbarga South', 'Chittapur', 'Sedam', 'Aland', 'Jevargi'],
  BIDAR: ['Bidar', 'Basavakalyan', 'Humnabad', 'Aurad', 'Bhalki']
}

const OCCUPATION_LABELS = {
  AGRICULTURE: 'Agriculture / farming',
  DAILY_WAGE: 'Daily wage labour',
  GOVT_SERVICE: 'Government service',
  PRIVATE_SERVICE: 'Private service',
  BUSINESS: 'Business / self-employed',
  UNEMPLOYED: 'Unemployed',
  OTHER: 'Other'
}

const INCOME_LABELS = {
  BELOW_1_2L: 'Below ₹1,20,000 per annum',
  BETWEEN_1_2L_3L: '₹1,20,000 – ₹3,00,000 per annum',
  BETWEEN_3L_6L: '₹3,00,000 – ₹6,00,000 per annum',
  ABOVE_6L: 'Above ₹6,00,000 per annum'
}

const PROBLEM_LABELS = {
  WATER_SUPPLY: 'Water supply',
  POWER_SUPPLY: 'Power supply',
  ROAD_INFRA: 'Road infrastructure',
  HEALTHCARE: 'Healthcare access',
  EDUCATION: 'Schooling & education',
  DRAINAGE: 'Drainage & sanitation',
  UNEMPLOYMENT: 'Unemployment',
  CONNECTIVITY: 'Internet / connectivity',
  OTHERS: 'Others'
}

const SCHEME_LABELS = {
  PDS: 'PDS ration card',
  UJJWALA: 'Free cooking gas (Ujjwala)',
  OLD_AGE_PENSION: 'Old age pension',
  DRINKING_WATER: 'Drinking water supply',
  HEALTH_SUBCENTRE: 'Primary health sub-centre',
  STREET_LIGHTING: 'Street lighting',
  HOUSING: 'Housing scheme (AWAS)',
  SCHOLARSHIPS: 'Scholarships',
  OTHERS: 'Others'
}

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

// Keys for cycling in seed data
const OCCUPATION_KEYS = Object.keys(OCCUPATION_LABELS)
const INCOME_KEYS = Object.keys(INCOME_LABELS)
const PROBLEM_KEYS = Object.keys(PROBLEM_LABELS)
const SCHEME_KEYS = Object.keys(SCHEME_LABELS)
const DISTRICT_KEYS = Object.keys(DISTRICT_LABELS)

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const USERS = [
  { id: 'u1', name: 'A. R. Deshmukh', phone: '9900011122', role: 'ADMIN', region: 'All districts', supervisorId: null },
  { id: 'u2', name: 'Praveen Kulkarni', phone: '9900022233', role: 'SUPERVISOR', region: 'Gulbarga North, Chittapur', supervisorId: null },
  { id: 'u3', name: 'Shalini Patil', phone: '9900033344', role: 'SUPERVISOR', region: 'Bidar, Humnabad', supervisorId: null },
  { id: 'u4', name: 'Iqbal Ahmed', phone: '9900044455', role: 'FIELD_AGENT', region: 'Gulbarga North', supervisorId: 'u2' },
  { id: 'u5', name: 'Lakshmi Bai', phone: '9900055566', role: 'FIELD_AGENT', region: 'Chittapur', supervisorId: 'u2' },
  { id: 'u6', name: 'Mohan Rathod', phone: '9900066677', role: 'FIELD_AGENT', region: 'Bidar', supervisorId: 'u3' },
  { id: 'u7', name: 'Ayesha Sultana', phone: '9900077788', role: 'FIELD_AGENT', region: 'Humnabad', supervisorId: 'u3' }
]

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

const HEADS = ['Ramesh Rathod', 'Fatima Bi', 'Basavaraj Patil', 'Sunanda Bai', 'Yusuf Khan', 'Gangamma', 'Vittal Deshmukh', 'Noor Jahan', 'Shivappa Kamble', 'Rukmini Bai']

function genHouseCode(n) { return String(100000 + n) }

const HOUSEHOLDS = Array.from({ length: 24 }).map((_, i) => {
  const districtKey = DISTRICT_KEYS[i % 2]
  const talukList = TALUKS[districtKey]
  return {
    houseCode: genHouseCode(i + 1),
    headName: HEADS[i % HEADS.length],
    phone: `98${(10000000 + i * 137).toString().slice(0, 8)}`,
    age: 32 + (i % 40),
    gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
    familySize: 2 + (i % 6),
    occupation: OCCUPATION_KEYS[i % OCCUPATION_KEYS.length],
    incomeBracket: INCOME_KEYS[i % INCOME_KEYS.length],
    district: districtKey,
    taluk: talukList[i % talukList.length],
    latitude: (17.33 + (i % 10) * 0.01).toFixed(7),
    longitude: (76.83 + (i % 10) * 0.01).toFixed(7),
    fieldAgentId: i % 3 === 0 ? 'u4' : i % 3 === 1 ? 'u5' : 'u6',
    problems: [PROBLEM_KEYS[i % PROBLEM_KEYS.length], PROBLEM_KEYS[(i + 3) % PROBLEM_KEYS.length]],
    grievanceDescription: i % 4 === 0 ? 'Water tanker has not arrived in the last two weeks.' : null,
    schemes: [SCHEME_KEYS[i % SCHEME_KEYS.length], SCHEME_KEYS[(i + 2) % SCHEME_KEYS.length]],
    schemeFeedback: i % 5 === 0 ? 'Ration card not yet linked to Aadhaar.' : null,
    status: i % 7 === 0 ? 'FLAGGED' : 'VERIFIED'
  }
})

// ---------------------------------------------------------------------------
// Grievances
// ---------------------------------------------------------------------------

const GRIEVANCES = [
  { houseCode: genHouseCode(1), message: 'Streetlight near our house has not worked for a month.', status: 'OPEN' },
  { houseCode: genHouseCode(5), message: 'Requesting update on housing scheme application status.', status: 'RESOLVED' }
]

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding database...\n')

  // Clean existing data
  await prisma.grievance.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.household.deleteMany()
  await prisma.user.deleteMany()

  console.log('[1/4] Users...')
  const defaultHash = await bcrypt.hash('demo1234', 10)
  for (const u of USERS) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        phone: u.phone,
        passwordHash: defaultHash,
        role: u.role,
        region: u.region,
        supervisorId: u.supervisorId,
        status: u.id === 'u7' ? 'INACTIVE' : 'ACTIVE'
      }
    })
  }

  console.log('[2/4] Households...')
  for (const h of HOUSEHOLDS) {
    await prisma.household.create({ data: h })
  }

  console.log('[3/4] Grievances...')
  for (const g of GRIEVANCES) {
    await prisma.grievance.create({ data: g })
  }

  console.log('[4/4] Done!\n')
  console.log('Demo credentials:')
  console.log('  Admin:        phone=9900011122  password=demo1234')
  console.log('  Supervisor:   phone=9900022233  password=demo1234')
  console.log('  Field Agent:  phone=9900044455  password=demo1234')
  console.log('\nCitizen login: houseCode=100001, phone=9810000000')
}

main()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
