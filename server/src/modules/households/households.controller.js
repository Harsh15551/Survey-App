const householdsService = require('./households.service')

async function checkHouseCode(req, res, next) {
  try {
    const result = await householdsService.checkHouseCode(req.body.houseCode)
    res.json(result)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const household = await householdsService.createHousehold(req.body, req.user.id)
    res.status(201).json(household)
  } catch (err) { next(err) }
}

async function list(req, res, next) {
  try {
    const result = await householdsService.getHouseholds(req.query, req.user.role, req.user.id)
    res.json(result)
  } catch (err) { next(err) }
}

async function getByCode(req, res, next) {
  try {
    const household = await householdsService.getHouseholdByCode(req.params.houseCode)
    res.json(household)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    // Field agents can only update their own households
    if (req.user.role === 'field_agent') {
      const household = await householdsService.getHouseholdByCode(req.params.houseCode)
      if (household.fieldAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only edit your own households.' })
      }
      // Field agents cannot change status
      delete req.body.status
    }
    const household = await householdsService.updateHousehold(req.params.houseCode, req.body, req.user.id)
    res.json(household)
  } catch (err) { next(err) }
}

async function byAgent(req, res, next) {
  try {
    // Field agents can only view their own
    if (req.user.role === 'field_agent' && req.params.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Field agents can only view their own households.' })
    }
    const result = await householdsService.getHouseholdsByAgent(req.params.agentId, req.query)
    res.json(result)
  } catch (err) { next(err) }
}

async function bySupervisor(req, res, next) {
  try {
    const result = await householdsService.getHouseholdsBySupervisor(req.params.supervisorId, req.query)
    res.json(result)
  } catch (err) { next(err) }
}

module.exports = { checkHouseCode, create, list, getByCode, update, byAgent, bySupervisor }
