const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Definição de um JWT_SECRET padrão caso a variável de ambiente não esteja disponível
const JWT_SECRET = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjMsImV4cCI6MTc0MTAzNDUyMCwiaWF0IjoxNzQxMDMwOTIwfQ.X1kj2muFPY-zWVqmbbcqi_a11CYX0bHT0Avn5EVzw3g';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Log para debug
console.log('JWT_SECRET definido:', !!JWT_SECRET);
console.log('JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

// Função para registrar um novo usuário
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Verificar se o email já está em uso
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Este email já está em uso.' });
    }

    // Verificar se o nome de usuário já está em uso
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
    }

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar um novo usuário
    const newUser = new User({
      email,
      username,
      password: hashedPassword
    });

    // Salvar o usuário no banco de dados
    const savedUser = await newUser.save();

    // Gerar token JWT
    const token = jwt.sign(
      { userId: savedUser._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        profilePicture: savedUser.profilePicture,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
};

// Função para fazer login
exports.login = async (req, res) => {
  try {
    console.log('Tentativa de login:', req.body.email);
    const { email, password } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // Verificar se a senha está correta
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Senha inválida para usuário:', email);
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('Login bem-sucedido para:', email);
    
    // Responder com o token e informações do usuário
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
};

// Função para verificar o token e obter dados do usuário atual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        role: user.role,
        isMuted: user.isMuted
      }
    });
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    res.status(500).json({ message: 'Erro ao obter usuário atual.' });
  }
};