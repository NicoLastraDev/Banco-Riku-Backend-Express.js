import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/authRoutes.js'
import beneficiaryRoutes from './src/routes/beneficiaryRoutes.js'
import cuentaRoutes from './src/routes/cuentaRoutes.js'
import transferenciaRoutes from './src/routes/transferenciaRoutes.js';
import tarjetaRoutes from './src/routes/tarjetaRoutes.js'
import notificacionRoutes from './src/routes/notificationRoutes.js';
import { iniciarAumentoSaldos } from './aumentarSaldoSinJob.js';

dotenv.config()

const app = express()

// Primero configurar middlewares
app.use(cors())
app.use(express.json())

// Luego las rutas
app.use('/api/auth', authRoutes)
app.use('/api/beneficiarios', beneficiaryRoutes)
app.use('/api/cuenta', cuentaRoutes)
app.use('/api/transferencias', transferenciaRoutes);
console.log('🔄 Cargando rutas de tarjetas...');
app.use('/api/tarjetas', tarjetaRoutes)
app.use('/api/notificaciones', notificacionRoutes);

app.get('/', (req, res) => {
  res.send('API banco-app con postgreSQL 👌👌👌')
})

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API banco-app con PostgreSQL 👌👌👌',
    endpoints: {
      auth: '/api/auth',
      beneficiaries: '/api/beneficiarios',
      cuenta: '/api/cuenta',
      tarjetas: '/api/tarjetas',
      notificaciones: '/api/notificaciones',
    }
  });
});

console.log('✅ Rutas de tarjetas cargadas');

// Mover la inicialización del job AQUÍ, después de definir todo
const startServer = () => {
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto', PORT);
    iniciarAumentoSaldos();
  });
};

startServer();

export default app