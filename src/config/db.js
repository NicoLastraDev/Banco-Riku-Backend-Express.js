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
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
})


export default pool
