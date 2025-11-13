// routes/tarjetaRoutes.js
import express from 'express';
import { 
  obtenerTarjetasUsuario,
  obtenerTarjeta,
  crearTarjeta
} from '../controller/tarjetaController.js';
import { authenticateToken as protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// GET /api/tarjetas - Obtener todas las tarjetas del usuario
router.get('/', obtenerTarjetasUsuario);

// GET /api/tarjetas/:id - Obtener una tarjeta específica
router.get('/:id', obtenerTarjeta);

// POST /api/tarjetas - Crear nueva tarjeta
router.post('/', crearTarjeta);

export default router;