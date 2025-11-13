import pool from '../config/db.js';

export const obtenerNotificacionesUsuario = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT id, tipo, titulo, mensaje, leida, created_at
        FROM notificaciones 
        WHERE usuario_id = $1 
        ORDER BY created_at DESC
        LIMIT 50`,
      [usuario_id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener notificaciones'
    });
  }
};

export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const result = await pool.query(
      'UPDATE notificaciones SET leida = true, updated_at = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};