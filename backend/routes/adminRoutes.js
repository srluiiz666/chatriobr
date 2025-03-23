const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../utils/jwtAuth');

// Rota para obter todos os usuários (apenas para administradores)
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);

// Rota para obter todas as mensagens (apenas para administradores)
router.get('/messages', verifyToken, isAdmin, adminController.getAllMessages);

// Rota para limpar todo o histórico de chat (apenas para administradores)
router.delete('/messages/clear', verifyToken, isAdmin, adminController.clearAllMessages);

// Rota para excluir uma mensagem específica (apenas para administradores)
router.delete('/messages/:id', verifyToken, isAdmin, adminController.deleteMessage);

module.exports = router;