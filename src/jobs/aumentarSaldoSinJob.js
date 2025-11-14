// Función para aumentar saldos automáticamente
export const iniciarAumentoSaldos = () => {
  console.log('⏰ Iniciando sistema de aumento automático de saldos...');
  
  const aumentarSaldos = async () => {
    try {
      console.log('🔄 EJECUTANDO - Aumentando saldos...', new Date().toLocaleString());
      
      // Importar pool directamente
      const pool = await import('../config/db.js').then(m => m.default);
      
      // UPDATE directo y simple
      const result = await pool.query(`
        UPDATE usuarios 
        SET saldo = saldo + 100
        RETURNING id, saldo
      `);

      console.log(`✅ Aumento completado. ${result.rowCount} usuarios actualizados`);
      
    } catch (error) {
      console.log('⚠️ Error en aumento de saldos:', error.message);
      // No hacemos throw para que el intervalo continúe
    }
  };

  // Ejecutar inmediatamente al iniciar (opcional)
  setTimeout(aumentarSaldos, 10000); // Esperar 10 segundos después del inicio
  
  // Programar cada 5 minutos (300,000 ms)
  setInterval(aumentarSaldos, 5 * 60 * 1000);
  
  console.log('🎯 Sistema de aumento automático programado (cada 5 minutos)');
};

