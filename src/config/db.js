import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT,
// })

const { Pool } = pkg

// ✅ Usar DATABASE_URL de Render (esto es lo que Render provee automáticamente)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 3000,
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración minimalista para evitar timeouts
  max: 2,  // Reducido para plan gratis
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  // Evitar verificaciones automáticas
  allowExitOnIdle: true
})


pool.on('connect', () => {
  console.log('✅ Nueva conexión a BD establecida')
})

export default pool
