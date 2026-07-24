const app = require('./app')
const env = require('./config/env')
const prisma = require('./config/database')

async function start() {
  // Verify database connection
  try {
    await prisma.$connect()
    console.log('[DB] Connected to PostgreSQL')
  } catch (err) {
    console.error('[DB] Failed to connect:', err.message)
    console.error('[DB] Check your DATABASE_URL in .env')
    process.exit(1)
  }

  app.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`)
    console.log(`[Server] Environment: ${env.NODE_ENV}`)
    console.log(`[Server] CORS origin: ${env.CORS_ORIGIN}`)
  })
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()
