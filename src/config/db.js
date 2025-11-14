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
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  // Configuración adicional para estabilidad
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Reciclar conexiones periódicamente
})


pool.on('connect', () => {
  console.log('✅ Nueva conexión a BD establecida')
})

pool.on('error', (err) => {
  console.error('❌ Error en pool de BD:', err.message)
})
export default pool
