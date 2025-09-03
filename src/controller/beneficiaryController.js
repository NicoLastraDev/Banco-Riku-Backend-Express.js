import e from 'cors'
import pool from '../config/db.js'

//buscar usuario por numero de cuenta
export const searchAccount = async (req, res) => {
  const {numero_cuenta} = req.body
  const userId = req.user.id // ID del usuario identificado

  try {
    //verificar que no sea la propia cuenta
    const ownAcount = await pool.query('SELECT id from cuentas WHERE usuario_id = $1 AND numero_cuenta = $2', [userId, numero_cuenta])

    if(ownAcount.rows.length > 0) {
      return res.status(400).json({message: 'No puedes agregar tu propia cuenta como destinatario'})
    }

    //buscar el usuario por numero de cuenta
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, c.numero_cuenta, c.saldo_disponible
        FROM usuarios u
        INNER jOIN cuentas c ON u.id = c.usuario_id
        WHERE c.numero_cuenta = $1`)
    
    if(result.rows.length === 0) {
      return res.status(404).json({message: 'Cuenta no encontrada'})
    }

    const userData = result.rows[0]

    //regresar informacion
    res.json({
      id: userData.id,
      nombre: userData.nombre,
      numero_cuenta: userData.numero_cuenta,
      tipo_cuenta: userData.tipo_cuenta,
      banco: userData.banco
    })
  } 
  
  catch (error) {
    console.log('Error buscando cuenta', error)
    res.status(500).json({message: 'Error en el servidor'})
  }
}

/** ----------------------------------------------------------------- */

//agregar destinatario
export const addBeneficiary = async(req,res) => {
  
  const {nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino} = req.body
  const usuario_id = req.user.id

  try {
    //verificar si ya existe como destinatario
    const existingBeneficiary = await pool.query(`
      SELECT id FROM beneficiarios
      WHERE usuario_id = $1 AND numero_cuenta = $2`,
      [usuario_id, numero_cuenta])

    if(existingBeneficiary.rows.length > 0)
      return res.status(400).json({sucess: 'false', message: 'el contacto ya existe en tu lista'})

    //verificar que la cuenta exista
    const accountExists = await pool.query(`
      select id from cuentas where numero_cuenta = $1
      `, [numero_cuenta])

    if(accountExists.rows.length === 0) {
      return res.status(404).json({
        sucess: 'false',
        message: 'La cuenta destino no existe'
      })
    }

    //agregar destinatario a la lista de beneficiarios
    await pool.query(`
      insert into beneficiarios 
      (usuario_id, nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino)
      values ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, nombre, nombre_cuenta, numero_cuenta, tipo_cuenta, banco_destino || 'Banco Riku'])

    res.status(201).json({
      sucess: 'true',
      message: 'Destinatario agregado correctamente'
    })

  }


  catch (error) {
    console.log('error al agregar destinatario', error)
    res.status(500).json({
      sucess: 'error',
      message: 'Error en el servidor'
    })
  }

}

/**-------------------------------------------------------------------- */

//obtener lista de destinatarios
export const getBeneficiaries = async (req, res) => {
  const usuario_id = req.user.id

  try {
    
  const result = await pool.query(`
    select id, nombre, numero_cuenta, tipo_cuenta, banco_destino
    from beneficiarios
    where usuario_id = $1
    order by nombre`, [usuario_id])

    res.json({
      sucess: true,
      data: result.rows
    })

  }

  catch (error) {
    console.error('Error obteniendo destinatarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor' 
    })
  }
}

/**-------------------------------------------------------------------- */

//eliminar destinatario

export const deleteBeneficiary = async (req, res) => {
  const {id} = req.params
  const usuario_id = req.user.id

  try {
    //verificar que el destinatario pertenezca al usuario
    const result = await pool.query(`delete from beneficiarios where id = $1 and usuario_id = $2 returning id`, [id, usuario_id])

    if (result.rows.length === 0){
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado'
      })
    }

    res.json({
        success: true,
        message: 'Destinatario eliminado correctamente'
      })

  }
  
  catch (error) {
    console.error('Error eliminando beneficiario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor' 
    })
  }
}
