const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const USERS = [
  { id: 'u1', name: 'A. R. Deshmukh', phone: '9900011122', role: 'ADMIN', region: 'All districts', supervisorId: null },
  { id: 'u2', name: 'Praveen Kulkarni', phone: '9900022233', role: 'SUPERVISOR', region: 'Gulbarga North, Chittapur', supervisorId: null },
  { id: 'u3', name: 'Shalini Patil', phone: '9900033344', role: 'SUPERVISOR', region: 'Bidar, Humnabad', supervisorId: null },
  { id: 'u4', name: 'Iqbal Ahmed', phone: '9900044455', role: 'FIELD_AGENT', region: 'Gulbarga North', supervisorId: 'u2' },
  { id: 'u5', name: 'Lakshmi Bai', phone: '9900055566', role: 'FIELD_AGENT', region: 'Chittapur', supervisorId: 'u2' },
  { id: 'u6', name: 'Mohan Rathod', phone: '9900066677', role: 'FIELD_AGENT', region: 'Bidar', supervisorId: 'u3' },
  { id: 'u7', name: 'Ayesha Sultana', phone: '9900077788', role: 'FIELD_AGENT', region: 'Humnabad', supervisorId: 'u3' }
]

const FAMILY_SIZE_FROM_BAND = {
  ONE_TO_THREE: 2,
  FOUR_TO_SIX: 5,
  SEVEN_TO_TEN: 8,
  ABOVE_TEN: 11
}

function H(overrides) {
  return {
    email: null,
    alternatePhone: null,
    photoUrl: null,
    problems: [],
    grievanceDescription: null,
    govtSchemesAvailed: [],
    state: 'Karnataka',
    citizenPassword: '12345678',
    ...overrides
  }
}

const HOUSEHOLDS = [
  H({
    houseCode: '100001', headName: 'Basappa Reddy', phone: '9845011111',
    wardPanchayat: 'Ward 4', propertyType: 'OWN_HOUSE', district: 'GULBARGA', taluk: 'Gulbarga North',
    villageName: 'Aiwan-E-Shahi', houseNumber: '12-45', familySizeBand: 'FOUR_TO_SIX', headAge: 58,
    facilities: ['DRINKING_WATER', 'ELECTRICITY'], occupation: 'AGRICULTURE', incomeBracket: 'BETWEEN_10_20K',
    problems: ['WATER_SUPPLY', 'ROAD_INFRA'],
    grievanceDescription: 'Road to the village floods every monsoon.',
    govtSchemesAvailed: ['RATION_CARD'], latitude: 17.3297, longitude: 76.8343,
    fieldAgentId: 'u4', status: 'VERIFIED'
  }),
  H({
    houseCode: '100002', headName: 'Fatima Bi', phone: '9845022222',
    wardPanchayat: 'Ward 7', propertyType: 'RENTED_HOUSE', district: 'GULBARGA', taluk: 'Gulbarga South',
    villageName: 'Sultanpur', houseNumber: '3-11', familySizeBand: 'ONE_TO_THREE', headAge: 41,
    facilities: ['ELECTRICITY', 'LPG_GAS'], occupation: 'DAILY_WAGE', incomeBracket: 'BELOW_5000',
    problems: ['POWER_SUPPLY'], govtSchemesAvailed: ['PENSION_SCHEME'],
    latitude: 17.3350, longitude: 76.8410, fieldAgentId: 'u4', status: 'FLAGGED'
  }),
  H({
    houseCode: '100003', headName: 'Shankar Rao', phone: '9845033333',
    wardPanchayat: 'Gram Panchayat Chittapur', propertyType: 'OWN_HOUSE', district: 'GULBARGA', taluk: 'Chittapur',
    villageName: 'Kollur', houseNumber: '56', familySizeBand: 'SEVEN_TO_TEN', headAge: 52,
    facilities: ['DRINKING_WATER', 'ELECTRICITY', 'DRAINAGE_SEWAGE'], occupation: 'AGRICULTURE', incomeBracket: 'BETWEEN_10_20K',
    problems: ['DRAINAGE', 'HEALTHCARE'], govtSchemesAvailed: ['HOUSING_SCHEME', 'HEALTH_INSURANCE'],
    latitude: 17.1167, longitude: 77.0500, fieldAgentId: 'u5', status: 'VERIFIED'
  }),
  H({
    houseCode: '200001', headName: 'Gurunath Swamy', phone: '9845077777',
    wardPanchayat: 'Ward 3', propertyType: 'OWN_HOUSE', district: 'BIDAR', taluk: 'Bidar',
    villageName: 'Chidri', houseNumber: '18', familySizeBand: 'FOUR_TO_SIX', headAge: 44,
    facilities: ['DRINKING_WATER', 'ELECTRICITY', 'LPG_GAS', 'DRAINAGE_SEWAGE'], occupation: 'GOVT_SERVICE', incomeBracket: 'BETWEEN_50_100K',
    govtSchemesAvailed: ['HOUSING_SCHEME'], latitude: 17.9104, longitude: 77.5199,
    fieldAgentId: 'u6', status: 'VERIFIED'
  })
]

const GRIEVANCES = [
  { houseCode: '100001', message: 'Streetlight near our house has not worked for a month.', status: 'OPEN' },
  { houseCode: '100002', message: 'Requesting update on housing scheme application status.', status: 'RESOLVED' }
]

async function main() {
  console.log('Seeding database...\n')

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
        plainPassword: 'demo1234',
        role: u.role,
        region: u.region,
        supervisorId: u.supervisorId,
        status: u.id === 'u7' ? 'INACTIVE' : 'ACTIVE'
      }
    })
  }

  console.log('[2/4] Households...')
  for (const h of HOUSEHOLDS) {
    const { citizenPassword, ...rest } = h
    const citizenPasswordHash = await bcrypt.hash(citizenPassword, 10)
    await prisma.household.create({
      data: {
        ...rest,
        familySize: FAMILY_SIZE_FROM_BAND[rest.familySizeBand],
        citizenPasswordHash
      }
    })
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
  console.log('\nCitizen login: houseCode=100001, password=12345678')
}

main()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
