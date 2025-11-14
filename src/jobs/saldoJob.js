import pool from '../config/db.js'

async function aumentarSaldosJob() {
  console.log('🔄 EJECUTANDO JOB - Aumentando saldos...', new Date().toLocaleString());
  
  try {
    // Verificar que el pool esté conectado
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        UPDATE usuarios 
        SET saldo = saldo + 10 
        WHERE saldo < 1000
        RETURNING id, saldo
      `)

      console.log(`✅ Job completado. ${result.rowCount} usuarios actualizados`)
    } finally {
      client.release() // Siempre liberar el cliente
    }
    
  } catch (error) {
    console.error('❌ ERROR en job:', error.message)
  }
}

// Programar el job cada 5 minutos
setInterval(aumentarSaldosJob, 5 * 60 * 1000)