import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const {Pool} = pkg

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT,
// })

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER,
  host: process.env.DB_HOST || process.env.PGHOST,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  port: process.env.DB_PORT || process.env.PGPORT,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
})

export default pool
