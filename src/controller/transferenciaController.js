import pool from '../config/db.js';

export const realizarTransferencia = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { fromAccountId, cuenta_destino, monto, descripcion } = req.body;
    const usuario_id = req.user.id;

    console.log('💸 Iniciando transferencia:', { cuenta_destino, monto, descripcion, usuario_id });

    // ✅ 1. PRIMERO OBTENER EL NOMBRE DEL USUARIO QUE ENVÍA
    const usuarioOrigenResult = await client.query(
      'SELECT nombre FROM usuarios WHERE id = $1',
      [usuario_id]
    );
    
    if (usuarioOrigenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    const nombreRemitente = usuarioOrigenResult.rows[0].nombre;
    console.log('✅ Nombre del remitente:', nombreRemitente);

    // 2. Obtener cuenta de origen (del usuario que envía)
    const cuentaOrigenResult = await client.query(
      'SELECT id, saldo, numero_cuenta FROM cuentas WHERE usuario_id = $1',
      [usuario_id]
    );

    if (cuentaOrigenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No se encontró tu cuenta'
      });
    }

    const cuentaOrigen = cuentaOrigenResult.rows[0];

    // 3. Verificar saldo suficiente
    if (cuentaOrigen.saldo < monto) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    // 4. Obtener cuenta de destino
    const cuentaDestinoResult = await client.query(
      'SELECT id, usuario_id, saldo, numero_cuenta FROM cuentas WHERE numero_cuenta = $1',
      [cuenta_destino]
    );

    if (cuentaDestinoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cuenta destino no encontrada'
      });
    }

    const cuentaDestino = cuentaDestinoResult.rows[0];

    // 5. Actualizar saldos
    await client.query(
      'UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2',
      [monto, cuentaOrigen.id]
    );

    await client.query(
      'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
      [monto, cuentaDestino.id]
    );

    // 6. Registrar transacciones
    const transaccionOrigen = await client.query(
      `INSERT INTO transacciones 
       (cuenta_id, tipo_transaccion, monto, descripcion, cuenta_destino, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        cuentaOrigen.id,
        'TRANSFERENCIA_ENVIADA',
        monto,
        descripcion || 'Transferencia realizada',
        cuenta_destino
      ]
    );

    await client.query(
      `INSERT INTO transacciones 
       (cuenta_id, tipo_transaccion, monto, descripcion, cuenta_destino, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        cuentaDestino.id,
        'TRANSFERENCIA_RECIBIDA',
        monto,
        descripcion || 'Transferencia recibida',
        cuentaOrigen.numero_cuenta
      ]
    );

    // ✅ 7. CREAR NOTIFICACIONES PARA AMBOS USUARIOS (DENTRO DE LA TRANSACCIÓN)
    
    // ✅ NOTIFICACIÓN PARA EL REMITENTE (quien envía)
    await client.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        usuario_id, // ID del usuario que envía
        'transferencia_exitosa',
        '✅ Transferencia Exitosa',
        `Enviaste $${monto} a cuenta ${cuenta_destino}`,
        false
      ]
    );
    console.log('✅ Notificación creada para remitente:', usuario_id);

    // ✅ NOTIFICACIÓN PARA EL DESTINATARIO (quien recibe)
    await client.query(
      `INSERT INTO notificaciones 
       (usuario_id, tipo, titulo, mensaje, leida, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        cuentaDestino.usuario_id, // ID del usuario que recibe
        'transferencia_recibida',
        '💰 Transferencia Recibida',
        `Recibiste $${monto} de ${nombreRemitente}`,
        false
      ]
    );
    console.log('✅ Notificación creada para destinatario:', cuentaDestino.usuario_id);

    await client.query('COMMIT');
    console.log('✅ Transferencia y notificaciones completadas exitosamente');

    res.json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: {
        transaccion: transaccionOrigen.rows[0],
        saldo_actual: cuentaOrigen.saldo - monto,
        cuenta_destino: cuentaDestino.numero_cuenta,
        destinatario_notificado: true,
        notificaciones_creadas: true
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