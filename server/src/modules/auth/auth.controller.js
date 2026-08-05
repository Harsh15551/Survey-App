const authService = require('./auth.service')

async function login(req, res, next) {
  try {
    const { phone, password } = req.body
    const result = await authService.staffLogin(phone, password)

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      accessToken: result.accessToken,
      user: result.user
    })
  } catch (err) {
    next(err)
  }
}

async function citizenLogin(req, res, next) {
  try {
    const { houseCode, password } = req.body
    const result = await authService.citizenLogin(houseCode, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' })
    }
    const result = await authService.refreshAccessToken(refreshToken)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({ accessToken: result.accessToken })
  } catch (err) {
    next(err)
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out successfully.' })
}

module.exports = { login, citizenLogin, refresh, logout }
