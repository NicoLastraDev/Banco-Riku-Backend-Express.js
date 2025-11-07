// routes/transferenciaRoutes.js
import express from 'express';
import { 
  realizarTransferencia, 
  obtenerHistorialTransferencias 
} from '../controller/transferenciaController.js';
import { protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// POST /api/transferencias - Realizar transferencia
router.post('/', realizarTransferencia);

// GET /api/transferencias/historial - Obtener historial
router.get('/historial', obtenerHistorialTransferencias);

export default router;