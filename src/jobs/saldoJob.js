import pool from '../config/db.js';

async function aumentarSaldosJob() {
  console.log('🔄 EJECUTANDO JOB - Aumentando saldos...', new Date().toLocaleString());
  
  try {
    // Verificar conexión a la base de datos primero
    await pool.query('SELECT 1');
    console.log('✅ Conexión a BD verificada');

    // Tu lógica de aumento de saldos aquí
    const result = await pool.query(`
      UPDATE usuarios 
      SET saldo = saldo + 100 
      RETURNING id, saldo
    `);

    console.log(`✅ Job completado. ${result.rowCount} usuarios actualizados`);
    return result.rows;
    
  } catch (error) {
    console.error('❌ ERROR en job:', error.message);
    return [];
  }
}

// ✅ EXPORTAR la función para que pueda ser importada
export { aumentarSaldosJob };
export default aumentarSaldosJob;