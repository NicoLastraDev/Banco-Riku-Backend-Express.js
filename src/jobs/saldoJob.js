// jobs/saldoJob.js
import pool from '../config/db.js';
import cron from 'node-cron';

export const startSaldoJob = () => {
  console.log('⏰ Iniciando job de aumento de saldo...');

  try {
    const job = cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 EJECUTANDO JOB - Aumentando saldos...', new Date().toLocaleString());
      
      try {
        const result = await pool.query(
          `UPDATE cuentas SET saldo = saldo + 100.00, updated_at = NOW() 
           RETURNING id, numero_cuenta, saldo`
        );
        
        console.log(`✅ JOB COMPLETADO - $100 agregados a ${result.rows.length} cuentas`);
        
        if (result.rows.length > 0) {
          result.rows.forEach(cuenta => {
            console.log(`   💳 ${cuenta.numero_cuenta}: $${cuenta.saldo}`);
          });
        }
        
      } catch (error) {
        console.error('❌ ERROR en ejecución del job:', error.message);
      }
    });

    console.log('🎯 Job programado correctamente (cada 5 minutos)');
    return job;

  } catch (error) {
    console.error('❌ ERROR iniciando job:', error.message);
    return null;
  }
};

// Función para testing manual
export const ejecutarJobManualmente = async () => {
  try {
    console.log('🔧 Ejecutando job manualmente...');
    const result = await pool.query(
      `UPDATE cuentas SET saldo = saldo + 100.00, updated_at = NOW() 
       RETURNING id, numero_cuenta, saldo`
    );
    console.log(`✅ Job manual completado: $100 a ${result.rows.length} cuentas`);
    return result.rows;
  } catch (error) {
    console.error('❌ Error en job manual:', error);
    throw error;
  }
};