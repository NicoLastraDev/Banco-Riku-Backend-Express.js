import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import beneficiaryRoutes from './routes/beneficiaryRoutes.js'

dotenv.config()

const app = express()

//Primero configurar middlewares
app.use(cors())
app.use(express.json())

//Luego las rutas
app.use('/api/auth', authRoutes)
app.use('/api/beneficiaries', beneficiaryRoutes)

app.get('/', (req, res) => {
  res.send('API banco-app con postgreSQL 👌👌👌')
})

export default app