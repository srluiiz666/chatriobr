const User = require('../models/User');

// Função para atualizar o perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, profilePicture } = req.body;
    
    // Verificar se o nome de usuário já está em uso (se estiver sendo alterado)
    if (username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
      }
    }
    
    // Validar a imagem do perfil
    if (profilePicture) {
      // Verificar se a string base64 é válida
      if (!profilePicture.startsWith('data:image')) {
        return res.status(400).json({ message: 'Formato de imagem inválido.' });
      }
      
      // Verificar o tamanho da imagem (máximo 2MB)
      const base64Size = Math.ceil((profilePicture.length * 3) / 4);
      if (base64Size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: 'A imagem deve ter no máximo 2MB.' });
      }
    }
    
    // Campos a serem atualizados
    const updateFields = {};
    if (username) updateFields.username = username;
    if (profilePicture) updateFields.profilePicture = profilePicture;
    
    // Atualizar o usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        isMuted: updatedUser.isMuted
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil. Por favor, tente novamente.' });
  }
};

// Função para obter detalhes de um usuário específico
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário.' });
  }
};

// Função para mutar/desmutar um usuário (apenas para administradores)
exports.toggleMute = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    
    // Verificar se o usuário alvo existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Alternar o status de mute
    targetUser.isMuted = !targetUser.isMuted;
    await targetUser.save();
    
    // Emitir evento de socket para notificar o usuário
    try {
      // Obter a instância do io do módulo global
      const io = req.app.get('io');
      if (io) {
        if (targetUser.isMuted) {
          io.emit('user_muted', targetUser._id);
        } else {
          io.emit('user_unmuted', targetUser._id);
        }
      }
    } catch (socketError) {
      console.error('Erro ao emitir evento de socket:', socketError);
      // Continuar mesmo se houver erro no socket
    }
    
    const action = targetUser.isMuted ? 'mutado' : 'desmutado';
    
    res.status(200).json({
      message: `Usuário ${action} com sucesso!`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        isMuted: targetUser.isMuted
      }
    });
  } catch (error) {
    console.error('Erro ao mutar/desmutar usuário:', error);
    res.status(500).json({ message: 'Erro ao mutar/desmutar usuário.' });
  }
};