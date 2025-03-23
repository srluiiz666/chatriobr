const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [process.env.FRONTEND_URL, 'https://chatriobr.netlify.app'] 
            : '*',
        methods: ['GET', 'POST']
    }
});

// Make io instance available to our app
app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://chatriobr.netlify.app'] 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
// Configure body size limit for profile pictures
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files from frontend directory
app.use(express.static(require('path').join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../frontend/login.html'));
});

// Online users storage
let onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('user_join', async (userData) => {
        try {
            const User = require('./models/User');
            const user = await User.findOne({ username: userData.username });
            
            if (user) {
                const enhancedUserData = {
                    ...userData,
                    role: user.role,
                    isMuted: user.isMuted
                };
                onlineUsers.set(socket.id, enhancedUserData);
                io.emit('users_update', Array.from(onlineUsers.values()));
            }
        } catch (error) {
            console.error('Error handling user join:', error);
        }
    });

    // Handle chat messages
    socket.on('chat_message', async (message) => {
        try {
            // Create a new message in the database
            const User = require('./models/User');
            const Message = require('./models/Message');
            
            // Find user by username
            const user = await User.findOne({ username: message.username });
            
            if (!user) {
                console.error('User not found:', message.username);
                return;
            }
            
            // Check if user is muted
            if (user.isMuted) {
                // Send error message only to the sender
                socket.emit('error_message', { message: 'Você está mutado e não pode enviar mensagens.' });
                return;
            }
            
            const newMessage = new Message({
                content: message.text,
                sender: user._id,
                timestamp: new Date()
            });
            
            await newMessage.save();
            
            // Broadcast the message to all clients with user information
            io.emit('chat_message', {
                text: message.text,
                username: user.username,
                profilePicture: user.profilePicture || 'assets/images/default-avatar.png',
                timestamp: newMessage.timestamp,
                role: user.role // Include user role in the message
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    
    // Handle loading previous messages
    socket.on('loadMessages', async () => {
        try {
            const Message = require('./models/Message');
            const messages = await Message.find()
                .populate('sender', 'username profilePicture role')
                .sort({ timestamp: 1 });
                
            const formattedMessages = messages.map(msg => ({
                text: msg.content,
                username: msg.sender ? msg.sender.username : 'Unknown User',
                profilePicture: msg.sender ? (msg.sender.profilePicture || 'assets/images/default-avatar.png') : 'assets/images/default-avatar.png',
                timestamp: msg.timestamp,
                role: msg.sender ? msg.sender.role : 'user' // Include user role in previous messages
            }));
            
            socket.emit('previousMessages', formattedMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    });

    // Handle typing status
    socket.on('typing_start', (userData) => {
        socket.broadcast.emit('user_typing', userData);
    });

    socket.on('typing_stop', () => {
        socket.broadcast.emit('user_stop_typing');
    });

    // Handle chat clearing
    socket.on('clear_chat', () => {
        io.emit('chat_cleared');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        onlineUsers.delete(socket.id);
        io.emit('users_update', Array.from(onlineUsers.values()));
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});