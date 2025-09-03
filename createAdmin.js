import pool from '../backend/src/config/db.js';
import bcrypt from 'bcryptjs';

const createAdminUser = async () => {
  const adminData = {
    nombre: 'Admin', 
    email: 'admin@bancoriku.cl',
    password: process.env.ADMIN_PASSWORD || 'AdminSecure123', // Usa variable de entorno
    rol_id: 3 // ID del rol Administrador según tu INSERT
  };

  try {
    console.log('Verificando existencia de usuario administrador...');
    
    const userExist = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', 
      [adminData.email]
    );

    if (userExist.rows.length > 0) {
      console.log('⚠️  El administrador ya existe en la base de datos');
      return;
    }

    console.log('Encriptando contraseña...');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    console.log('Creando usuario administrador...');
    await pool.query(
      `INSERT INTO usuarios 
      (nombre, email, password, rol_id) 
      VALUES ($1, $2, $3, $4)`,
      [adminData.nombre, adminData.email, hashedPassword, adminData.rol_id]
    );

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Contraseña: ${adminData.password}`); // Solo para desarrollo
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
  } finally {
    await pool.end();
  }
};

createAdminUser();