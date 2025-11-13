import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import beneficiaryRoutes from './routes/beneficiaryRoutes.js'
import cuentaRoutes from './routes/cuentaRoutes.js'
import transferenciaRoutes from './routes/transferenciaRoutes.js';
import tarjetaRoutes from './routes/tarjetaRoutes.js'
import notificacionRoutes from './routes/notificationRoutes.js';

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
    
    // Inicializar el job SOLO cuando el servidor esté listo
    try {
      import('./jobs/saldoJob.js')
        .then(module => {
          module.aumentarSaldosJob();
          console.log('🎯 Job de saldo inicializado correctamente');
        })
        .catch(error => {
          console.log('⚠️ No se pudo cargar el job de saldo:', error.message);
        });
    } catch (error) {
      console.log('⚠️ Error inicializando job:', error.message);
    }
  });
};

// Endpoint para probar el job manualmente
app.post('/api/test/aumentar-saldo', async (req, res) => {
  try {
    const { ejecutarJobManualmente } = await import('./jobs/saldoJob.js');
    const resultado = await ejecutarJobManualmente();
    
    res.json({
      success: true,
      message: `$${100 * resultado.length} agregados manualmente`,
      cuentas_afectadas: resultado.length,
      detalles: resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ejecutando job manual: ' + error.message
    });
  }
});

startServer();

export default app