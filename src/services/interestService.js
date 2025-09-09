import pool from '../config/db.js';

class InterestService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Servicio de interés ya está corriendo');
      return;
    }

    console.log('🚀 Iniciando servicio de interés automático...');
    this.isRunning = true;

    // Aplicar interés inmediatamente al iniciar
    this.applyInterest();

    // Programar cada 5 minutos (300,000 milisegundos)
    this.intervalId = setInterval(() => {
      this.applyInterest();
    }, 5 * 60 * 1000); // 5 minutos

    console.log('✅ Servicio programado cada 5 minutos');
  }

  async applyInterest() {
    try {
      console.log('💰 Aplicando interés de $5,000 a cuentas de ahorro...');
      
      const result = await pool.query(`
        UPDATE cuentas 
        SET saldo = saldo + 5000 
        WHERE tipo_cuenta = 'Ahorro'
        RETURNING id, numero_cuenta, saldo
      `);
      
      console.log(`✅ $5.000 agregados a ${result.rowCount} cuentas`);
      
      // Opcional: registrar en una tabla de logs
      await this.logInterestApplication(result.rowCount);
      
    } catch (error) {
      console.error('❌ Error aplicando interés:', error.message);
    }
  }

  // async logInterestApplication(affectedRows) {
  //   try {
  //     await pool.query(
  //       'INSERT INTO interest_logs (amount, affected_accounts, description) VALUES ($1, $2, $3)',
  //       [5000, affectedRows, 'Interés automático aplicado cada 5 minutos']
  //     );
  //   } catch (error) {
  //     console.log('⚠️ No se pudo registrar en logs:', error.message);
  //   }
  // }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Servicio de interés detenido');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 'Cada 5 minutos' : 'Detenido'
    };
  }
}

// Crear instancia singleton
const interestService = new InterestService();

export default interestService;