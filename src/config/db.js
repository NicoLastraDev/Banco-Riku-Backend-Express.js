import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pkg

// ✅ CORREGIR: Si DATABASE_URL no existe, debe ser string vacío, no número
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false,
  // Configuración para Render
  max: 5,  // Reducido para plan gratis
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ Nueva conexión a BD establecida')
})

pool.on('error', (err) => {
  console.error('💥 Error en pool de PostgreSQL:', err)
})

export default pool