// routes/transferenciaRoutes.js
import express from 'express';
import { 
  realizarTransferencia, 
  obtenerHistorialTransferencias 
} from '../controller/transferenciaController.js';
import { authenticateToken as protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// POST /api/transferencias - Realizar transferencia
router.post('/', realizarTransferencia);

// GET /api/transferencias - Obtener historial (cambiar a raíz)
router.get('/', obtenerHistorialTransferencias);

export default router;