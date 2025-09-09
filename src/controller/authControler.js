import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import {generateToken} from '../utils/generateToken.js'

export const register = async (req, res) => {
  const {nombre, email, password, rol_id = 2} = req.body

  try {
    const userExist = await pool.query('SELECT * FROM usuarios where email = $1', [email])

    if(userExist.rows.length > 0){
      return res.status(400).json({message: 'Usuario ya registrado'})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query('INSERT INTO usuarios (nombre, email, password, rol_id) VALUES($1,$2,$3,$4)', [nombre, email, hashedPassword, rol_id])

    res.status(201).json({message: 'Usuario registrado correctamente'})
  }

  catch(error){
    console.error(error)
    res.status(500).json({message: 'Error en el servidor'})
  }
}

  export const login = async(req,res) => {
    const {email, password} = req.body

    try {
      
      const result = await pool.query('SELECT * FROM usuarios where email = $1', [email])

      if (result.rows.length === 0) {
        return res.status(401).json({message: 'No se ha registrado el correo'})
      }

      const user = result.rows[0]

      const isMatch = await bcrypt.compare(password, user.password)

      if(!isMatch) {
        return res.status(401).json({message: 'Credenciales invalidas'})
      }

      res.json({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol_id: user.rol_id,
        token: generateToken(user.id)
      })

    } catch (error) {
      console.error(error)
      res.status(500).json({message: 'Error en el servidor'})
    }
  }