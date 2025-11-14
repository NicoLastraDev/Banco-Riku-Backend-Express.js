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

// Manejo de errores mejorado
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool de BD:', err.message)
})

// Verificar conexión al inicio
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conexión a BD verificada'))
  .catch(err => console.error('❌ Error conectando a BD:', err.message))

export default pool
