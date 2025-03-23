const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Definição de um JWT_SECRET padrão caso a variável de ambiente não esteja disponível
const JWT_SECRET = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjMsImV4cCI6MTc0MTAzNDUyMCwiaWF0IjoxNzQxMDMwOTIwfQ.X1kj2muFPY-zWVqmbbcqi_a11CYX0bHT0Avn5EVzw3g';

// Middleware para verificar o token JWT
const verifyToken = async (req, res, next) => {
  try {
    // Verificar se o header de autorização existe
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    // Extrair o token do header
    const token = authHeader.split(' ')[1];
    
    // Verificar o token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    
    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Middleware para verificar se o usuário é admin ou moderador
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    next();
  } else {
    return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
};

// Middleware para verificar se o usuário está mutado
const checkMuted = (req, res, next) => {
  if (req.user && req.user.isMuted) {
    return res.status(403).json({ message: 'Você está mutado e não pode enviar mensagens.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, checkMuted };