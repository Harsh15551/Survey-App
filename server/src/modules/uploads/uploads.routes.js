const { Router } = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const env = require('../../config/env')
const { authenticate, requireRoles } = require('../../middleware/auth')

const router = Router()

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../../', env.UPLOAD_DIR)
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Multer config: local storage with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    const ext = allowed.test(path.extname(file.originalname).toLowerCase())
    const mime = allowed.test(file.mimetype.split('/')[1])
    if (ext || mime) return cb(null, true)
    cb(new Error('Only image files (jpg, png, webp) are allowed.'))
  }
})

// POST /api/uploads/photo - Upload a household photo (optional)
router.post(
  '/photo',
  authenticate,
  requireRoles(['field_agent', 'admin']),
  upload.single('photo'),
  (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No photo file provided.' })
      }
      const photoUrl = `/uploads/${req.file.filename}`
      res.json({ photoUrl, filename: req.file.filename })
    } catch (err) { next(err) }
  }
)

module.exports = router
