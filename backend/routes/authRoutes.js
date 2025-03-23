const router = require('express').Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../utils/jwtAuth');

// Rota para registro de usuário
router.post('/register', authController.register);

// Rota para login
router.post('/login', authController.login);

// Rota para obter dados do usuário atual (protegida)
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;