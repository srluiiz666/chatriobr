const Message = require('../models/Message');
const User = require('../models/User');

// Função para enviar uma nova mensagem
exports.sendMessage = async (req, res) => {
  try {
    const { content, emojis } = req.body;
    const userId = req.user._id;

    // Verificar se o conteúdo da mensagem existe
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'O conteúdo da mensagem é obrigatório.' });
    }

    // Criar uma nova mensagem
    const newMessage = new Message({
      content,
      sender: userId,
      hasEmoji: emojis && emojis.length > 0,
      emojis: emojis || []
    });

    // Salvar a mensagem no banco de dados
    const savedMessage = await newMessage.save();

    // Buscar os detalhes do remetente para incluir na resposta
    const populatedMessage = await Message.findById(savedMessage._id).populate('sender', 'username profilePicture role');

    res.status(201).json({
      message: 'Mensagem enviada com sucesso!',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem.' });
  }
};

// Função para obter todas as mensagens
exports.getMessages = async (req, res) => {
  try {
    // Buscar todas as mensagens e popular os dados do remetente
    const messages = await Message.find()
      .populate('sender', 'username profilePicture role')
      .sort({ timestamp: 1 }); // Ordenar por timestamp em ordem crescente

    res.status(200).json({
      messages
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens.' });
  }
};

// Função para excluir uma mensagem (apenas para administradores ou o próprio remetente)
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Buscar a mensagem
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada.' });
    }

    // Verificar se o usuário é o remetente ou um administrador
    if (!isAdmin && message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta mensagem.' });
    }

    // Excluir a mensagem
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Mensagem excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ message: 'Erro ao excluir mensagem.' });
  }
};