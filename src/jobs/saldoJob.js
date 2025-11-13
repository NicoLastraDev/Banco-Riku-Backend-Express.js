// jobs/saldoJob.js
import pool from '../db.js'

async function aumentarSaldosJob() {
  console.log('🔄 EJECUTANDO JOB - Aumentando saldos...', new Date().toLocaleString());
  
  try {
    // Verificar conexión a la base de datos primero
    await pool.query('SELECT 1');
    console.log('✅ Conexión a BD verificada');

    // Tu lógica de aumento de saldos aquí
    const result = await pool.query(`
      UPDATE usuarios 
      SET saldo = saldo + 10 
      WHERE saldo < 1000
      RETURNING id, saldo
    `);

    console.log(`✅ Job completado. ${result.rowCount} usuarios actualizados`);
    
  } catch (error) {
    console.error('❌ ERROR en job:', error.message);
    console.error('Detalles:', error);
  }
}

// Programar el job cada 5 minutos
setInterval(aumentarSaldosJob, 5 * 60 * 1000);