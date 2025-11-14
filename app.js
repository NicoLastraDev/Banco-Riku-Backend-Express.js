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

// Agregar este endpoint para ejecutar el job manualmente
app.post('/api/jobs/aumentar-saldos', async (req, res) => {
  // Timeout de 30 segundos
  const timeout = setTimeout(() => {
    res.status(408).json({ 
      success: false, 
      error: 'Timeout - Job tomó demasiado tiempo' 
    })
  }, 30000)

  try {
    const { aumentarSaldosJob } = await import('./src/jobs/saldoJob.js')
    const resultado = await aumentarSaldosJob()
    
    clearTimeout(timeout)
    res.json({ 
      success: true, 
      message: `Job ejecutado - ${resultado.length} usuarios actualizados`,
      usuarios_actualizados: resultado.length
    })
    
  } catch (error) {
    clearTimeout(timeout)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})



console.log('✅ Rutas de tarjetas cargadas');

// Mover la inicialización del job AQUÍ, después de definir todo
const startServer = () => {
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto', PORT);
    
    // Inicializar el job SOLO cuando el servidor esté listo
    // try {
    //   import('./src/jobs/saldoJob.js')
    //     .then(module => {
    //       module.aumentarSaldosJob();
    //       console.log('🎯 Job de saldo inicializado correctamente');
    //     })
    //     .catch(error => {
    //       console.log('⚠️ No se pudo cargar el job de saldo:', error.message);
    //     });
    // } catch (error) {
    //   console.log('⚠️ Error inicializando job:', error.message);
    // }
  });
};

startServer();

export default app