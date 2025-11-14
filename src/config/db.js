import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false,
  // Configuración optimizada para Railway
  max: 10,  // Railway permite más conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Agregar esto para mejor manejo de conexiones
  allowExitOnIdle: true
});

pool.on('connect', () => {
  console.log('✅ Nueva conexión a BD establecida')
})

pool.on('error', (err) => {
  console.error('💥 Error en pool de PostgreSQL:', err)
})

export default pool