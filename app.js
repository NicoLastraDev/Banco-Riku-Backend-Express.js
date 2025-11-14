import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/authRoutes.js'
import beneficiaryRoutes from './src/routes/beneficiaryRoutes.js'
import cuentaRoutes from './src/routes/cuentaRoutes.js'
import transferenciaRoutes from './src/routes/transferenciaRoutes.js';
import tarjetaRoutes from './src/routes/tarjetaRoutes.js'
import notificacionRoutes from './src/routes/notificationRoutes.js';

dotenv.config()

const app = express()

// Middleware de debug PARA CADA REQUEST
app.use((req, res, next) => {
  console.log('📍 REQUEST RECIBIDO:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
});

// Middlewares
app.use(cors())
app.use(express.json())

// Registrar rutas
console.log('🔄 REGISTRANDO RUTAS...');
app.use('/api/auth', authRoutes);
console.log('✅ Ruta /api/auth registrada');
app.use('/api/beneficiarios', beneficiaryRoutes);
console.log('✅ Ruta /api/beneficiarios registrada');
app.use('/api/cuenta', cuentaRoutes);
console.log('✅ Ruta /api/cuenta registrada');
app.use('/api/transferencias', transferenciaRoutes);
console.log('✅ Ruta /api/transferencias registrada');
app.use('/api/tarjetas', tarjetaRoutes);
console.log('✅ Ruta /api/tarjetas registrada');
app.use('/api/notificaciones', notificacionRoutes);
console.log('✅ Ruta /api/notificaciones registrada');

// Endpoint de prueba
app.post('/api/auth/simple-login', (req, res) => {
  console.log('🔍 SIMPLE LOGIN RECIBIDO:', req.body);
  res.json({ 
    token: 'simple-token-123', 
    user: { 
      id: 1, 
      email: req.body.email, 
      nombre: 'Usuario Simple' 
    } 
  });
});

// Endpoints básicos
app.get('/', (req, res) => {
  res.send('API banco-app con PostgreSQL 👌👌👌')
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

console.log('✅ Todas las rutas cargadas');

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('🚀 Servidor corriendo en puerto', PORT);
});

export default app