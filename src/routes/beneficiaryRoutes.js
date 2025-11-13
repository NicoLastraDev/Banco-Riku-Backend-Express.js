import express from 'express';
import { 
  searchAccount, 
  addBeneficiary, 
  getBeneficiaries,
  deleteBeneficiary 
} from '../controller/beneficiaryController.js';
import { authenticateToken as protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.use(protect); // Todas las rutas protegidas

router.post('/search', searchAccount);
router.post('/add', addBeneficiary);
router.get('/list', getBeneficiaries);
router.delete('/delete/:id', deleteBeneficiary);

export default router;