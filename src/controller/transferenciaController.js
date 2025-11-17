import pool from '../config/db.js';

export const realizarTransferencia = async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 [TRANSFERENCIA] INICIANDO TRANSFERENCIA ==================');
    console.log('📦 [TRANSFERENCIA] Body recibido:', req.body);
    console.log('👤 [TRANSFERENCIA] Usuario ID:', req.user.id);
    
    await client.query('BEGIN');

    const { fromAccountId, cuenta_destino, monto, descripcion } = req.body;
    const usuario_id = req.user.id;

    // ✅ VALIDACIÓN COMPLETA DE DATOS
    if (!cuenta_destino) {
      console.log('❌ [TRANSFERENCIA] Error: cuenta_destino faltante');
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Número de cuenta destino es requerido' 
      });
    }

    if (!monto || monto <= 0) {
      console.log('❌ [TRANSFERENCIA] Error: monto inválido:', monto);
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Monto debe ser mayor a 0' 
      });
    }

    console.log('🔍 [TRANSFERENCIA] Datos validados OK');

    // ✅ 1. OBTENER NOMBRE DEL REMITENTE
    console.log('🔍 [TRANSFERENCIA] Obteniendo nombre del remitente...');
    const usuarioOrigenResult = await client.query(
      'SELECT nombre FROM usuarios WHERE id = $1',
      [usuario_id]
    );
    
    if (usuarioOrigenResult.rows.length === 0) {
      console.log('❌ [TRANSFERENCIA] Error: Usuario no encontrado ID:', usuario_id);
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    const nombreRemitente = usuarioOrigenResult.rows[0].nombre;
    console.log('✅ [TRANSFERENCIA] Nombre del remitente:', nombreRemitente);

    // ✅ 2. OBTENER CUENTA DE ORIGEN
    console.log('🔍 [TRANSFERENCIA] Buscando cuenta de origen para usuario:', usuario_id);
    const cuentaOrigenResult = await client.query(
      'SELECT id, saldo, numero_cuenta FROM cuentas WHERE usuario_id = $1',
      [usuario_id]
    );

    if (cuentaOrigenResult.rows.length === 0) {
      console.log('❌ [TRANSFERENCIA] Error: Usuario no tiene cuenta');
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No se encontró tu cuenta'
      });
    }

    const cuentaOrigen = cuentaOrigenResult.rows[0];
    console.log('✅ [TRANSFERENCIA] Cuenta origen encontrada:', {
      id: cuentaOrigen.id,
      saldo: cuentaOrigen.saldo,
      numero_cuenta: cuentaOrigen.numero_cuenta
    });

    // ✅ 3. VERIFICAR SALDO
    if (cuentaOrigen.saldo < monto) {
      console.log('❌ [TRANSFERENCIA] Error: Saldo insuficiente. Saldo actual:', cuentaOrigen.saldo, 'Monto:', monto);
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Saldo insuficiente. Tu saldo actual es $${cuentaOrigen.saldo}`
      });
    }

    console.log('✅ [TRANSFERENCIA] Saldo suficiente');

    // ✅ 4. OBTENER CUENTA DE DESTINO
    console.log('🔍 [TRANSFERENCIA] Buscando cuenta destino:', cuenta_destino);
    const cuentaDestinoResult = await client.query(
      'SELECT id, usuario_id, saldo, numero_cuenta FROM cuentas WHERE numero_cuenta = $1',
      [cuenta_destino]
    );

    if (cuentaDestinoResult.rows.length === 0) {
      console.log('❌ [TRANSFERENCIA] Error: Cuenta destino no encontrada:', cuenta_destino);
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cuenta destino no encontrada'
      });
    }

    const cuentaDestino = cuentaDestinoResult.rows[0];
    console.log('✅ [TRANSFERENCIA] Cuenta destino encontrada:', {
      id: cuentaDestino.id,
      usuario_id: cuentaDestino.usuario_id,
      numero_cuenta: cuentaDestino.numero_cuenta
    });

    // ✅ 5. ACTUALIZAR SALDOS
    console.log('💰 [TRANSFERENCIA] Actualizando saldos...');
    
    // Restar de cuenta origen
    await client.query(
      'UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2',
      [monto, cuentaOrigen.id]
    );
    console.log('✅ [TRANSFERENCIA] Saldo restado de cuenta origen');

    // Sumar a cuenta destino
    await client.query(
      'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
      [monto, cuentaDestino.id]
    );
    console.log('✅ [TRANSFERENCIA] Saldo sumado a cuenta destino');

    // ✅ 6. REGISTRAR TRANSACCIONES
    console.log('📝 [TRANSFERENCIA] Registrando transacciones...');
    
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
    console.log('✅ [TRANSFERENCIA] Transacción origen registrada');

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
    console.log('✅ [TRANSFERENCIA] Transacción destino registrada');

    // ✅ 7. CREAR NOTIFICACIONES PARA AMBOS USUARIOS
    console.log('🔔 [TRANSFERENCIA] Creando notificaciones...');
    
    // Notificación para REMITENTE
    await client.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        usuario_id,
        'transferencia_exitosa',
        '✅ Transferencia Exitosa',
        `Enviaste $${monto} a cuenta ${cuenta_destino}`,
        false
      ]
    );
    console.log('✅ [TRANSFERENCIA] Notificación creada para remitente:', usuario_id);

    // Notificación para DESTINATARIO
    await client.query(
      `INSERT INTO notificaciones 
       (usuario_id, tipo, titulo, mensaje, leida, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        cuentaDestino.usuario_id,
        'transferencia_recibida',
        '💰 Transferencia Recibida',
        `Recibiste $${monto} de ${nombreRemitente}`,
        false
      ]
    );
    console.log('✅ [TRANSFERENCIA] Notificación creada para destinatario:', cuentaDestino.usuario_id);

    // ✅ 8. CONFIRMAR TRANSACCIÓN
    await client.query('COMMIT');
    console.log('🎉 [TRANSFERENCIA] TRANSFERENCIA COMPLETADA EXITOSAMENTE');

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
    console.error('💥 [TRANSFERENCIA] ERROR CRÍTICO:', error);
    console.error('💥 [TRANSFERENCIA] Stack trace:', error.stack);
    
    await client.query('ROLLBACK');
    
    res.status(500).json({
      success: false,
      message: 'Error del servidor al realizar la transferencia: ' + error.message
    });
  } finally {
    client.release();
    console.log('🔚 [TRANSFERENCIA] Conexión liberada');
  }
};

// Obtener historial de transferencias 
export const obtenerHistorialTransferencias = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    console.log('📊 [HISTORIAL] Obteniendo historial para usuario:', usuario_id);

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

    console.log('✅ [HISTORIAL] Transferencias encontradas:', result.rows.length);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ [HISTORIAL] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener historial'
    });
  }
};