const router = require('express').Router();
const chatController = require('../controllers/chatController');
const { verifyToken, checkMuted } = require('../utils/jwtAuth');

// Rota para enviar uma nova mensagem (protegida e verificação de mute)
router.post('/messages', verifyToken, checkMuted, chatController.sendMessage);

// Rota para obter todas as mensagens (protegida)
router.get('/messages', verifyToken, chatController.getMessages);

// Rota para excluir uma mensagem (protegida)
router.delete('/messages/:id', verifyToken, chatController.deleteMessage);

module.exports = router;