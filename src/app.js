import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import beneficiaryRoutes from './routes/beneficiaryRoutes.js'
import cuentaRoutes from './routes/cuentaRoutes.js'

dotenv.config()

const app = express()

//Primero configurar middlewares
app.use(cors())
app.use(express.json())

//Luego las rutas
app.use('/api/auth', authRoutes)
app.use('/api/beneficiarios', beneficiaryRoutes)
app.use('/api/cuenta',cuentaRoutes)

app.get('/', (req, res) => {
  res.send('API banco-app con postgreSQL 👌👌👌')
})

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API banco-app con PostgreSQL 👌👌👌',
    endpoints: {
      auth: '/api/auth',
      beneficiaries: '/api/beneficiarios',
      cuwenta: '/api/cuenta'
    }
  });
});

export default app