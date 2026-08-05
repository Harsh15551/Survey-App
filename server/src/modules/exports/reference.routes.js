const { Router } = require('express')

const router = Router()

const OCCUPATIONS = [
  { id: 'AGRICULTURE', label: 'Farmer' },
  { id: 'DAILY_WAGE', label: 'Daily wage worker' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'GOVT_SERVICE', label: 'Government Job' },
  { id: 'PRIVATE_SERVICE', label: 'Private Job' },
  { id: 'UNEMPLOYED', label: 'Unemployed' },
  { id: 'OTHER', label: 'Other' }
]

const INCOME_BRACKETS = [
  { id: 'BELOW_5000', label: 'Below Rs. 5,000' },
  { id: 'BETWEEN_5_10K', label: 'Rs. 5,001 - Rs. 10,000' },
  { id: 'BETWEEN_10_20K', label: 'Rs. 10,001 - Rs. 20,000' },
  { id: 'BETWEEN_20_50K', label: 'Rs. 20,001 - Rs. 50,000' },
  { id: 'BETWEEN_50_100K', label: 'Rs. 50,001 - Rs. 1,00,000' },
  { id: 'ABOVE_100K', label: 'Above Rs. 1,00,000' }
]

const PROBLEMS = [
  { id: 'WATER_SUPPLY', label: 'Water Scarcity' },
  { id: 'POWER_SUPPLY', label: 'Electricity Issue' },
  { id: 'ROAD_INFRA', label: 'Road/connectivity issue' },
  { id: 'HEALTHCARE', label: 'Hospital Connectivity Issues' },
  { id: 'EDUCATION', label: 'School No Provision' },
  { id: 'UNEMPLOYMENT', label: 'Unemployment' },
  { id: 'DRAINAGE', label: 'Drainage/Sewage Issues' },
  { id: 'OTHERS', label: 'Others' }
]

const PROPERTY_TYPES = [
  { id: 'OWN_HOUSE', label: 'Own House' },
  { id: 'RENTED_HOUSE', label: 'Rented House' },
  { id: 'GOVERNMENT_PROVIDED_HOUSE', label: 'Government Provided House' },
  { id: 'OTHERS', label: 'Others' }
]

const FAMILY_SIZE_BANDS = [
  { id: 'ONE_TO_THREE', label: '1-3' },
  { id: 'FOUR_TO_SIX', label: '4-6' },
  { id: 'SEVEN_TO_TEN', label: '7-10' },
  { id: 'ABOVE_TEN', label: '10 or more' }
]

const FACILITIES = [
  { id: 'DRINKING_WATER', label: 'Drinking Water' },
  { id: 'ELECTRICITY', label: 'Electricity' },
  { id: 'LPG_GAS', label: 'LPG Gas' },
  { id: 'DRAINAGE_SEWAGE', label: 'Drainage/Sewage Facility' },
  { id: 'NONE', label: 'Nothing' }
]

const GOVT_SCHEMES = [
  { id: 'HOUSING_SCHEME', label: 'Housing Facility/Scheme' },
  { id: 'PENSION_SCHEME', label: 'Pension Scheme' },
  { id: 'RATION_CARD', label: 'Ration Card Facility' },
  { id: 'SCHOLARSHIP', label: 'Scholarship' },
  { id: 'HEALTH_INSURANCE', label: 'Health Insurance Scheme' },
  { id: 'OTHERS', label: 'Others' }
]

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
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

router.get('/options', (req, res) => {
  res.json({
    problems: PROBLEMS,
    occupations: OCCUPATIONS,
    incomeBrackets: INCOME_BRACKETS,
    propertyTypes: PROPERTY_TYPES,
    familySizeBands: FAMILY_SIZE_BANDS,
    facilities: FACILITIES,
    govtSchemes: GOVT_SCHEMES,
    states: STATES
  })
})

router.get('/locations', (req, res) => {
  res.json({ districts: DISTRICTS })
})

router.get('/emergency', (req, res) => {
  res.json({ data: EMERGENCY_NUMBERS })
})

module.exports = router
