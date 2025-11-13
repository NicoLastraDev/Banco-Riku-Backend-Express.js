// routes/notificacionRoutes.js - Crear este archivo
import express from 'express';
import { obtenerNotificacionesUsuario, marcarComoLeida } from '../controller/notificationController.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';


const router = express.Router();

router.get('/', authenticateToken, obtenerNotificacionesUsuario);
router.patch('/:id/leer', authenticateToken, marcarComoLeida);

export default router;