const service = require('./grievances.service')

async function submit(req, res, next) {
  try {
    const g = await service.submitGrievance(req.user.houseCode, req.body.message)
    res.status(201).json(g)
  } catch (err) { next(err) }
}

async function list(req, res, next) {
  try { res.json(await service.getGrievances(req.query)) }
  catch (err) { next(err) }
}

async function getById(req, res, next) {
  try { res.json(await service.getGrievanceById(req.params.id)) }
  catch (err) { next(err) }
}

async function updateStatus(req, res, next) {
  try { res.json(await service.updateGrievanceStatus(req.params.id, req.body.status)) }
  catch (err) { next(err) }
}

module.exports = { submit, list, getById, updateStatus }
