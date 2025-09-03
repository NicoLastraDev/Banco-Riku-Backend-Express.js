import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export const protect = async (req, res, next) => {
  let token

  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  {
    try {
      
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const result = await pool.query('SELECT id, nombre, email, rol_id FROM usuarios where id = $1', [decoded.id])

      if(result.rows.length === 0) {
        return res.status(401).json({message: 'Usuario no encontrado'})
      }

      req.user = result.rows[0]
      next()
    } 
    
    catch (error) {
      return res.status(401).json({message: 'Token no válido'})
    }
  }

  else {
    return res.status(401).json({message: 'No autorizado, no token'})
  }
}