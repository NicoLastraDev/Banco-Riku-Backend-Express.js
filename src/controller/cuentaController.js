import pool from '../config/db.js';

export const getCuentaByUsuario = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    console.log('📊 Buscando cuenta para usuario:', usuario_id);
    
    const result = await pool.query(`
      SELECT 
        id,
        numero_cuenta,
        saldo,
        tipo_cuenta,
        usuario_id,
        fecha_apertura
      FROM cuentas 
      WHERE usuario_id = $1
      ORDER BY fecha_apertura DESC 
      LIMIT 1
    `, [usuario_id]);

    console.log('✅ Resultado de la query:', result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cuenta no encontrada para este usuario' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error en getCuentaByUsuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor al obtener cuenta' 
    });
  }
};


export const getCuentaInfo = async (req, res) => {
  try {
    const { numeroCuenta } = req.params;
    const usuario_id = req.user.id;

    console.log('🔍 Buscando información de cuenta:', numeroCuenta);

    // Limpiar número de cuenta (remover guiones)
    const numeroCuentaLimpio = numeroCuenta.replace(/-/g, '');

    const result = await pool.query(
      `SELECT 
        c.id,
        c.numero_cuenta,
        c.tipo_cuenta,
        c.saldo,
        u.id as usuario_id,
        u.nombre,
        u.email
      FROM cuentas c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE REPLACE(c.numero_cuenta, '-', '') = $1`,
      [numeroCuentaLimpio]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      });
    }

    const cuentaInfo = result.rows[0];

    res.json({
      success: true,
      data: {
        numero_cuenta: cuentaInfo.numero_cuenta,
        tipo_cuenta: cuentaInfo.tipo_cuenta,
        saldo: cuentaInfo.saldo,
        usuario: {
          id: cuentaInfo.usuario_id,
          nombre: cuentaInfo.nombre,
          email: cuentaInfo.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// ✅ OBTENER USUARIO POR NÚMERO DE CUENTA
export const getUsuarioByCuenta = async (req, res) => {
  try {
    const { numeroCuenta } = req.params;

    console.log('👤 Buscando usuario por cuenta:', numeroCuenta);

    // Limpiar número de cuenta (remover guiones)
    const numeroCuentaLimpio = numeroCuenta.replace(/-/g, '');

    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        u.email
      FROM usuarios u
      JOIN cuentas c ON u.id = c.usuario_id
      WHERE REPLACE(c.numero_cuenta, '-', '') = $1`,
      [numeroCuentaLimpio]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para esta cuenta'
      });
    }

    const usuario = result.rows[0];

    res.json({
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario por cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};