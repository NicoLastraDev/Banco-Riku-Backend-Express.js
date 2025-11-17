import pool from '../config/db.js';

export const realizarTransferencia = async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 [TRANSFERENCIA] Iniciando con datos:', req.body);
    console.log('👤 [TRANSFERENCIA] Usuario ID:', req.user.id);
    
    await client.query('BEGIN');
    
    const { fromAccountId, cuenta_destino, monto, descripcion } = req.body;
    const usuario_id = req.user.id;

    // ✅ VERIFICAR DATOS RECIBIDOS
    if (!cuenta_destino || !monto) {
      console.log('❌ [TRANSFERENCIA] Datos faltantes:', { cuenta_destino, monto });
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Datos incompletos' 
      });
    }

    // ... resto del código existente ...

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [TRANSFERENCIA] Error completo:', error);
    console.error('❌ [TRANSFERENCIA] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al realizar la transferencia: ' + error.message
    });
  } finally {
    client.release();
  }
};

// Obtener historial de transferencias (este está correcto)
export const obtenerHistorialTransferencias = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        t.*, 
        c.numero_cuenta,
        CASE 
          WHEN t.tipo_transaccion = 'TRANSFERENCIA_ENVIADA' THEN
            (SELECT u.nombre FROM cuentas c2 
            JOIN usuarios u ON c2.usuario_id = u.id 
            WHERE c2.numero_cuenta = t.cuenta_destino)
          ELSE NULL
        END as nombre_destinatario,
        
        CASE 
          WHEN t.tipo_transaccion = 'TRANSFERENCIA_RECIBIDA' THEN
            (SELECT u.nombre FROM cuentas c2 
            JOIN usuarios u ON c2.usuario_id = u.id 
            WHERE c2.numero_cuenta = t.cuenta_destino)
          ELSE NULL
        END as nombre_remitente
      FROM transacciones t
      JOIN cuentas c ON t.cuenta_id = c.id
      WHERE c.usuario_id = $1 
      AND t.tipo_transaccion IN ('TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA')
      ORDER BY t.fecha DESC
      LIMIT 50`,
      [usuario_id]
    );

    console.log('🔍 Transferencias con nombres corregidos:');
    result.rows.forEach(t => {
      console.log({
        id: t.id,
        tipo: t.tipo_transaccion,
        cuenta_destino: t.cuenta_destino,
        nombre_destinatario: t.nombre_destinatario,
        nombre_remitente: t.nombre_remitente
      });
    });

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