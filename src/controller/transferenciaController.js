// controllers/transferenciaController.js
import pool from '../config/db.js';

// Realizar transferencia
export const realizarTransferencia = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { cuenta_destino, monto, descripcion } = req.body;
    const usuario_id = req.user.id;

    console.log('💸 Iniciando transferencia:', { cuenta_destino, monto, descripcion, usuario_id });

    // 1. Obtener cuenta origen del usuario
    const cuentaOrigenResult = await client.query(
      'SELECT id, saldo, numero_cuenta FROM cuentas WHERE usuario_id = $1',
      [usuario_id]
    );

    if (cuentaOrigenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'No se encontró tu cuenta'
      });
    }

    const cuentaOrigen = cuentaOrigenResult.rows[0];

    // 2. Verificar saldo suficiente
    if (Number(cuentaOrigen.saldo) < Number(monto)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    // 3. Obtener cuenta destino
    const cuentaDestinoResult = await client.query(
      'SELECT id, usuario_id, saldo, numero_cuenta FROM cuentas WHERE numero_cuenta = $1',
      [cuenta_destino]
    );

    if (cuentaDestinoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Cuenta destino no encontrada'
      });
    }

    const cuentaDestino = cuentaDestinoResult.rows[0];

    // 4. Verificar que no sea la misma cuenta
    if (cuentaOrigen.numero_cuenta === cuentaDestino.numero_cuenta) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No puedes transferir a tu propia cuenta'
      });
    }

    // 5. Realizar las actualizaciones de saldo
    // Restar de cuenta origen
    await client.query(
      'UPDATE cuentas SET saldo = saldo - $1, updated_at = NOW() WHERE id = $2',
      [monto, cuentaOrigen.id]
    );

    // Sumar a cuenta destino
    await client.query(
      'UPDATE cuentas SET saldo = saldo + $1, updated_at = NOW() WHERE id = $2',
      [monto, cuentaDestino.id]
    );

    // 6. Registrar transacción para cuenta origen (débito)
    const transaccionOrigen = await client.query(
      `INSERT INTO transacciones 
       (cuenta_id, tipo_transaccion, monto, descripcion, cuenta_destino, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        cuentaOrigen.id,
        'TRANSFERENCIA_ENVIADA',
        monto,
        descripcion || `Transferencia a ${cuentaDestino.numero_cuenta}`,
        cuentaDestino.numero_cuenta
      ]
    );

    // 7. Registrar transacción para cuenta destino (crédito)
    await client.query(
      `INSERT INTO transacciones 
       (cuenta_id, tipo_transaccion, monto, descripcion, cuenta_destino, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        cuentaDestino.id,
        'TRANSFERENCIA_RECIBIDA',
        monto,
        descripcion || `Transferencia de ${cuentaOrigen.numero_cuenta}`,
        cuentaOrigen.numero_cuenta
      ]
    );

    await client.query('COMMIT');

    console.log('✅ Transferencia completada exitosamente');

    res.json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: {
        transaccion: transaccionOrigen.rows[0],
        saldo_actual: cuentaOrigen.saldo - monto,
        cuenta_destino: cuentaDestino.numero_cuenta
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en transferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al realizar la transferencia'
    });
  } finally {
    client.release();
  }
};

// Obtener historial de transferencias
export const obtenerHistorialTransferencias = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT t.*, c.numero_cuenta
       FROM transacciones t
       JOIN cuentas c ON t.cuenta_id = c.id
       WHERE c.usuario_id = $1 
       AND t.tipo_transaccion IN ('TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA')
       ORDER BY t.fecha DESC
       LIMIT 50`,
      [usuario_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};