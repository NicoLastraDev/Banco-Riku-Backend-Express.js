import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import {generateToken} from '../utils/generateToken.js'
import jwt from 'jsonwebtoken'; // ← AGREGAR ESTE IMPORT

// ✅ AGREGAR: Middleware de autenticación
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    
    req.user = decoded; // { id: userId }
    next();
  });
};

// ✅ AGREGAR: Endpoint para verificar token
export const checkStatus = async (req, res) => {
  try {
    console.log('🔍 [BACKEND] checkStatus llamado para usuario ID:', req.user.id);
    
    // Obtener información actualizada del usuario
    const result = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    console.log('✅ [BACKEND] Token válido para usuario:', user.email);

    // Generar nuevo token (refresh)
    const newToken = generateToken(user.id);

    res.json({
      token: newToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: ['user']
      }
    });

  } catch (error) {
    console.error('❌ [BACKEND] Error en checkStatus:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const register = async (req, res) => {
  const {nombre, email, password, rol_id = 2} = req.body

  console.log('🔔 [BACKEND 1] Register INICIADO -', email, new Date().toISOString());

  try {
    console.log('🔔 [BACKEND 2] Verificando si usuario existe...');
    const userExist = await pool.query('SELECT * FROM usuarios where email = $1', [email])

    if(userExist.rows.length > 0){
      console.log('❌ [BACKEND 3] Usuario YA EXISTE en DB:', email);
      return res.status(400).json({message: 'Usuario ya registrado'})
    }

    console.log('🔔 [BACKEND 4] Usuario NO existe, procediendo con registro...');
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('🔔 [BACKEND 5] Insertando usuario en DB...');
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol_id) VALUES($1,$2,$3,$4) RETURNING id, nombre, email', 
      [nombre, email, hashedPassword, rol_id]
    );

    const newUser = result.rows[0];
    console.log('✅ [BACKEND 6] Usuario INSERTADO con ID:', newUser.id);

    const token = generateToken(newUser.id);
    console.log('✅ [BACKEND 7] Token generado para usuario:', newUser.id);

    console.log('✅ [BACKEND 8] Enviando respuesta exitosa');
    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      token: token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        roles: ['user']
      }
    });

  } catch (error) {
    console.error('💥 [BACKEND ERROR] En register:', error.message);
    return res.status(500).json({message: 'Error en el servidor'})
  }
}

export const login = async(req,res) => {
  const {email, password} = req.body

  console.log('🔐 LOGIN CONTROLLER - INICIANDO');
  console.log('📧 Email recibido:', email);
  console.log('🔑 Password recibido:', password ? 'PRESENTE' : 'FALTANTE');

  try {
    console.log('1. 🔍 Buscando usuario en BD...');
    
    // Verificar conexión a BD primero
    console.log('1.1 Verificando conexión a BD...');
    const pool = await import('../config/db.js').then(m => m.default);
    console.log('1.2 Conexión a BD establecida');
    
    const result = await pool.query('SELECT * FROM usuarios where email = $1', [email])
    console.log('1.3 Resultado de query:', result.rows);

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({message: 'No se ha registrado el correo'})
    }

    const user = result.rows[0]
    console.log('✅ Usuario encontrado:', user.email);
    console.log('👤 Datos usuario:', { id: user.id, nombre: user.nombre });

    console.log('2. 🔑 Comparando passwords...');
    console.log('2.1 Password recibido:', password);
    console.log('2.2 Hash en BD:', user.password);
    
    const isMatch = await bcrypt.compare(password, user.password)
    console.log('2.3 Resultado comparación:', isMatch);

    if(!isMatch) {
      console.log('❌ Password incorrecto');
      return res.status(401).json({message: 'Credenciales invalidas'})
    }

    console.log('3. 🎫 Generando token...');
    const token = generateToken(user.id);
    console.log('3.1 Token generado para usuario ID:', user.id);

    console.log('✅ LOGIN EXITOSO para:', user.email);

    return res.json({
      token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: ['user']
      }
    })

  } catch (error) {
    console.error('💥 ERROR EN LOGIN CONTROLLER:');
    console.error('💥 Mensaje:', error.message);
    console.error('💥 Stack:', error.stack);
    console.error('💥 Tipo:', typeof error);
    return res.status(500).json({message: 'Error en el servidor'})
  }
}