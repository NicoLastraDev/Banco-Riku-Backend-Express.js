import express from 'express'
import {register, login, authenticateToken, checkStatus} from '../controller/authControler.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/check-status', authenticateToken, checkStatus)

export default router