const service = require('./dashboard.service')

async function stats(req, res, next) {
  try { res.json(await service.getAdminStats()) }
  catch (err) { next(err) }
}

async function supervisors(req, res, next) {
  try { res.json(await service.getSupervisorHierarchy()) }
  catch (err) { next(err) }
}

async function teamStats(req, res, next) {
  try { res.json(await service.getTeamStats(req.user.id)) }
  catch (err) { next(err) }
}

module.exports = { stats, supervisors, teamStats }
