const router = require('express').Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../utils/jwtAuth');

// Rota para atualizar o perfil do usuário (protegida)
router.put('/profile', verifyToken, userController.updateProfile);

// Rota para obter detalhes de um usuário específico (protegida)
router.get('/:id', verifyToken, userController.getUserById);

// Rota para mutar/desmutar um usuário (apenas para administradores)
router.put('/:id/toggle-mute', verifyToken, isAdmin, userController.toggleMute);

module.exports = router;