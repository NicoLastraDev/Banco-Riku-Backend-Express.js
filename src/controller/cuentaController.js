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