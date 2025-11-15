// routes/cuentaRoutes.js
import express from 'express';
import pool from '../config/db.js';
import { authenticateToken as protect } from '../middlewares/authMiddlewares.js';
import { 
  getCuentaByUsuario,
  getCuentaInfo,           // ✅ NUEVO
  getUsuarioByCuenta       // ✅ NUEVO
} from '../controller/cuentaController.js';

const router = express.Router();

// GET /api/cuenta/info - Obtiene la cuenta del usuario autenticado
router.get('/info', protect, async (req, res) => {
  try {
    const usuarioId = req.user.id;

    console.log('🔍 Buscando cuenta para usuario ID:', usuarioId);

    const result = await pool.query(
      `SELECT id, numero_cuenta, tipo_cuenta, saldo, usuario_id 
      FROM cuentas 
      WHERE usuario_id = $1`,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      console.log('❌ No se encontró cuenta para usuario:', usuarioId);
      return res.status(404).json({ 
        success: false,
        message: 'Cuenta no encontrada' 
      });
    }

    const cuenta = result.rows[0];
    console.log('✅ Cuenta encontrada:', cuenta);

    res.json({
      success: true,
      data: cuenta
    });

  } catch (error) {
    console.error('❌ Error en /api/cuenta/info:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor al obtener la cuenta' 
    });
  }
});

router.get('/:numeroCuenta/info', getCuentaInfo);        // ✅ NUEVO
router.get('/:numeroCuenta/usuario', getUsuarioByCuenta);

export default router;