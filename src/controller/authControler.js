import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import {generateToken} from '../utils/generateToken.js'
import jwt from 'jsonwebtoken'; // ← AGREGAR ESTE IMPORT
import { 
  generarNumeroCuenta, 
  generarNumeroTarjeta, 
  generarFechaVencimiento, 
  generarCVV 
} from '../utils/tarjetaUtils.js';

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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { nombre, email, password } = req.body;

    // 1. Verificar si el usuario ya existe
    const userExists = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // 2. Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear usuario (el trigger se ejecutará automáticamente después de esto)
    const userResult = await client.query(
      `INSERT INTO usuarios (nombre, email, password) 
      VALUES ($1, $2, $3) 
      RETURNING id, nombre, email, created_at`,
      [nombre, email, hashedPassword]
    );

    const newUser = userResult.rows[0];

    await client.query('COMMIT');

    // 4. Obtener la cuenta que creó el trigger
    const cuentaCreada = await client.query(
      'SELECT * FROM cuentas WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 1',
      [newUser.id]
    );

    // 5. Obtener la tarjeta que creó el trigger
    const tarjetaCreada = await client.query(
      'SELECT * FROM tarjetas WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 1',
      [newUser.id]
    );

    // ✅ Validar que el trigger creó ambos
    if (!cuentaCreada.rows[0] || !tarjetaCreada.rows[0]) {
      throw new Error('El trigger no creó la cuenta o tarjeta automáticamente');
    }

    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente con cuenta y tarjeta creadas automáticamente',
      token: token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email
      },
      cuenta: {
        numero_cuenta: cuentaCreada.rows[0].numero_cuenta,
        saldo: cuentaCreada.rows[0].saldo,
        tipo_cuenta: cuentaCreada.rows[0].tipo_cuenta
      },
      tarjeta: {
        numero_tarjeta: tarjetaCreada.rows[0].numero_tarjeta,
        tipo_tarjeta: tarjetaCreada.rows[0].tipo_tarjeta,
        fecha_vencimiento: tarjetaCreada.rows[0].fecha_vencimiento
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al registrar usuario: ' + error.message
    });
  } finally {
    client.release();
  }
};

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