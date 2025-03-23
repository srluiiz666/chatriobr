const User = require('../models/User');
const Message = require('../models/Message');

// Obter todos os usuários
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Erro ao obter usuários:', error);
        res.status(500).json({ message: 'Erro ao obter usuários.' });
    }
};

// Obter todas as mensagens
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('sender', 'username profilePicture')
            .sort({ timestamp: -1 });

        // Formatar as mensagens para corresponder à expectativa do frontend
        const formattedMessages = messages.map(message => ({
            _id: message._id,
            text: message.content,
            username: message.sender.username,
            profilePicture: message.sender.profilePicture || 'assets/images/default-avatar-new.png',
            timestamp: message.timestamp
        }));

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('Erro ao obter mensagens:', error);
        res.status(500).json({ message: 'Erro ao obter mensagens.' });
    }
};

// Excluir uma mensagem específica
exports.deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const deletedMessage = await Message.findByIdAndDelete(messageId);
        
        if (!deletedMessage) {
            return res.status(404).json({ message: 'Mensagem não encontrada.' });
        }
        
        res.status(200).json({ message: 'Mensagem excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        res.status(500).json({ message: 'Erro ao excluir mensagem.' });
    }
};

// Limpar todo o histórico de chat
exports.clearAllMessages = async (req, res) => {
    try {
        await Message.deleteMany({});
        res.status(200).json({ message: 'Histórico de chat limpo com sucesso.' });
    } catch (error) {
        console.error('Erro ao limpar histórico de chat:', error);
        res.status(500).json({ message: 'Erro ao limpar histórico de chat.' });
    }
};