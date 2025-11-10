// controllers/tarjetaController.js
import pool from '../config/db.js';

// Obtener tarjetas del usuario
export const obtenerTarjetasUsuario = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        numero_tarjeta,
        fecha_vencimiento,
        cvv,
        nombre_titular,
        tipo_tarjeta,
        marca_tarjeta,
        saldo_actual,
        created_at
        FROM tarjetas 
        WHERE usuario_id = $1 AND activa = true
        ORDER BY created_at DESC`,
      [usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron tarjetas para este usuario'
      });
    }

    // Formatear respuesta para el frontend
    const tarjetasFormateadas = result.rows.map(tarjeta => ({
      id: tarjeta.id,
      numero_tarjeta: tarjeta.numero_tarjeta,
      fecha_vencimiento: tarjeta.fecha_vencimiento,
      cvv: tarjeta.cvv,
      nombre_titular: tarjeta.nombre_titular,
      tipo_tarjeta: tarjeta.tipo_tarjeta,
      marca_tarjeta: tarjeta.marca_tarjeta,
      saldo_actual: parseFloat(tarjeta.saldo_actual),
      created_at: tarjeta.created_at
    }));

    res.json({
      success: true,
      data: tarjetasFormateadas
    });

  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tarjetas'
    });
  }
};

// Obtener una tarjeta específica
export const obtenerTarjeta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        numero_tarjeta,
        fecha_vencimiento,
        cvv,
        nombre_titular,
        tipo_tarjeta,
        marca_tarjeta,
        saldo_actual,
        created_at
       FROM tarjetas 
       WHERE id = $1 AND usuario_id = $2 AND activa = true`,
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    const tarjeta = result.rows[0];

    res.json({
      success: true,
      data: {
        id: tarjeta.id,
        numero_tarjeta: tarjeta.numero_tarjeta,
        fecha_vencimiento: tarjeta.fecha_vencimiento,
        cvv: tarjeta.cvv,
        nombre_titular: tarjeta.nombre_titular,
        tipo_tarjeta: tarjeta.tipo_tarjeta,
        marca_tarjeta: tarjeta.marca_tarjeta,
        saldo_actual: parseFloat(tarjeta.saldo_actual),
        created_at: tarjeta.created_at
      }
    });

  } catch (error) {
    console.error('Error obteniendo tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener la tarjeta'
    });
  }
};

// Crear nueva tarjeta (si necesitas esta funcionalidad)
export const crearTarjeta = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      numero_tarjeta,
      fecha_vencimiento,
      cvv,
      nombre_titular
    } = req.body;
    
    const usuario_id = req.user.id;

    // Verificar si el usuario ya tiene una tarjeta activa
    const tarjetaExistente = await client.query(
      'SELECT id FROM tarjetas WHERE usuario_id = $1 AND activa = true',
      [usuario_id]
    );

    if (tarjetaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una tarjeta activa'
      });
    }

    // Obtener saldo de la cuenta del usuario
    const cuentaResult = await client.query(
      'SELECT saldo FROM cuentas WHERE usuario_id = $1',
      [usuario_id]
    );

    const saldo_cuenta = cuentaResult.rows[0]?.saldo || 0;

    // Insertar nueva tarjeta
    const result = await client.query(
      `INSERT INTO tarjetas (
        usuario_id, 
        numero_tarjeta, 
        fecha_vencimiento, 
        cvv, 
        nombre_titular,
        saldo_actual
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [usuario_id, numero_tarjeta, fecha_vencimiento, cvv, nombre_titular, saldo_cuenta]
    );

    await client.query('COMMIT');

    const tarjetaCreada = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Tarjeta creada exitosamente',
      data: {
        id: tarjetaCreada.id,
        numero_tarjeta: tarjetaCreada.numero_tarjeta,
        fecha_vencimiento: tarjetaCreada.fecha_vencimiento,
        cvv: tarjetaCreada.cvv,
        nombre_titular: tarjetaCreada.nombre_titular,
        tipo_tarjeta: tarjetaCreada.tipo_tarjeta,
        marca_tarjeta: tarjetaCreada.marca_tarjeta,
        saldo_actual: parseFloat(tarjetaCreada.saldo_actual),
        created_at: tarjetaCreada.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear tarjeta'
    });
  } finally {
    client.release();
  }
};