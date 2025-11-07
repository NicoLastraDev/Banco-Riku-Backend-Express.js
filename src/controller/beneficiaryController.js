import pool from '../config/db.js'

// Buscar usuario por numero de cuenta
export const searchAccount = async (req, res) => {
  console.log('🟢 SEARCH ACCOUNT ENDPOINT HIT - Body:', req.body)
  const { numero_cuenta } = req.body
  const userId = req.user.id // ID del usuario autenticado

  try {
    // 🔥 SOLUCIÓN: Remover guiones del número de cuenta recibido
    const numeroCuentaLimpio = numero_cuenta.replace(/-/g, '')
    console.log('🔍 Número de cuenta limpio:', numeroCuentaLimpio)

    // Verificar que no sea la propia cuenta (también aplicar REPLACE aquí)
    const ownAccount = await pool.query(
      `SELECT id FROM cuentas 
       WHERE usuario_id = $1 AND REPLACE(numero_cuenta, '-', '') = $2`, 
      [userId, numeroCuentaLimpio]
    )

    if (ownAccount.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes agregar tu propia cuenta como destinatario'
      })
    }

    // 🔥 SOLUCIÓN: Buscar usando REPLACE para ignorar guiones
    const result = await pool.query(
      `SELECT u.id as usuario_id, u.nombre, c.numero_cuenta, c.tipo_cuenta
      FROM usuarios u
      INNER JOIN cuentas c ON u.id = c.usuario_id
      WHERE REPLACE(c.numero_cuenta, '-', '') = $1`,
      [numeroCuentaLimpio]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta no encontrada'
      })
    }

    const accountData = result.rows[0]

    return res.json({
      success: true,
      data: {
        usuario_id: accountData.usuario_id,
        nombre: accountData.nombre,
        numero_cuenta: accountData.numero_cuenta, // Esto devuelve el formato con guiones
        tipo_cuenta: accountData.tipo_cuenta
      }
    })

  } catch (error) {
    console.log('Error buscando cuenta', error)
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    })
  }
}

/** ----------------------------------------------------------------- */

// Agregar destinatario
export const addBeneficiary = async (req, res) => {
  const { nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino } = req.body
  const usuario_id = req.user.id

  try {
    // Verificar si ya existe como destinatario
    const existingBeneficiary = await pool.query(
      `SELECT id FROM beneficiarios
      WHERE usuario_id = $1 AND numero_cuenta = $2`,
      [usuario_id, numero_cuenta]
    )

    if (existingBeneficiary.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El contacto ya existe en tu lista'
      })
    }

    // Verificar que la cuenta exista
    const accountExists = await pool.query(
  `SELECT id FROM cuentas WHERE REPLACE(numero_cuenta, '-', '') = $1`,
  [numero_cuenta.replace(/-/g, '')]
)

    if (accountExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'La cuenta destino no existe'
      })
    }

    // Agregar destinatario a la lista de beneficiarios
    await pool.query(
      `INSERT INTO beneficiarios 
      (usuario_id, nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuario_id, nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino || 'Banco Riku']
    )

    // ✅ AGREGAR RETURN aquí también
    return res.status(201).json({
      success: true,
      message: 'Destinatario agregado correctamente'
    })

  } catch (error) {
    console.log('Error al agregar destinatario', error)
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    })
  }
}

/**-------------------------------------------------------------------- */

// Obtener lista de destinatarios
export const getBeneficiaries = async (req, res) => {
  const usuario_id = req.user.id

  try {
    const result = await pool.query(
      `SELECT id, nombre, numero_cuenta, tipo_cuenta, banco_destino
      FROM beneficiarios
      WHERE usuario_id = $1
      ORDER BY nombre`,
      [usuario_id]
    )

    // ✅ AGREGAR RETURN
    return res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('Error obteniendo destinatarios:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Error en el servidor' 
    })
  }
}

/**-------------------------------------------------------------------- */

// Eliminar destinatario
export const deleteBeneficiary = async (req, res) => {
  const { id } = req.params
  const usuario_id = req.user.id

  try {
    // Verificar que el destinatario pertenezca al usuario
    const result = await pool.query(
      `DELETE FROM beneficiarios 
      WHERE id = $1 AND usuario_id = $2 
      RETURNING id`,
      [id, usuario_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado'
      })
    }

    res.json({
      success: true,
      message: 'Destinatario eliminado correctamente'
    })

  } catch (error) {
    console.error('Error eliminando beneficiario:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor' 
    })
  }
}