const usersService = require('./users.service')

async function list(req, res, next) {
  try {
    const result = await usersService.getUsers(req.query)
    res.json(result)
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id)
    res.json(user)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const user = await usersService.createUser(req.body)
    res.status(201).json(user)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body, req.user.id)
    res.json(user)
  } catch (err) { next(err) }
}

async function listSupervisors(req, res, next) {
  try {
    const supervisors = await usersService.getSupervisors()
    res.json(supervisors)
  } catch (err) { next(err) }
}

module.exports = { list, getById, create, update, listSupervisors }
