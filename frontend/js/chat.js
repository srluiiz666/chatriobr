// Estabelecer conexão com o Socket.IO
const socket = io(CONFIG.SOCKET_URL, {
    query: { token: localStorage.getItem('token') },
    reconnection: true,
    reconnectionAttempts: 5
});

// Evento para quando o chat é limpo por um admin
socket.on('chat_cleared', () => {
    messagesContainer.innerHTML = '';
});

// Elementos do DOM
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const onlineUsersList = document.getElementById('online-users-list');
const logoutBtn = document.getElementById('logout-btn');
const emojiButton = document.getElementById('emoji-button');
const emojiPicker = document.getElementById('emoji-picker');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const currentUserName = document.getElementById('current-user-name');
const currentUserAvatar = document.getElementById('current-user-avatar');
const userRole = document.getElementById('user-role');

// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

// Lidar com erros de conexão
socket.on('connect_error', (error) => {
    console.error('Erro de conexão:', error);
    if (error.message.includes('authentication')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

// Lidar com erros do servidor
socket.on('error', (error) => {
    console.error('Erro do servidor:', error);
    if (error.message.includes('token') || error.message.includes('autenticação')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);
themeToggleBtn.querySelector('i').className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';

// Alternar tema
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    console.log('Theme changed to:', newTheme);
});

// Carregar informações do usuário
const loadUserInfo = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar informações do usuário');
        }
        
        const data = await response.json();
        
        currentUserName.textContent = data.user.username;
        userRole.textContent = data.user.role;
        currentUserAvatar.src = data.user.profilePicture || 'assets/images/default-avatar-new.png';

        // Verificar status de administrador após carregar informações do usuário
        await checkAdminStatus();
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
};

// Enviar mensagem
const sendMessage = () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat_message', {
            text: message,
            token: token,
            username: currentUserName.textContent,
            profilePicture: currentUserAvatar.src,
            role: userRole.textContent // Adicionar a função do usuário à mensagem
        });
        messageInput.value = '';
    }
};

// Receber mensagem
socket.on('chat_message', (message) => {
    addMessageToChat(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Receber mensagens de erro do servidor
socket.on('error_message', (data) => {
    // Exibir mensagem de erro para o usuário
    const errorToast = document.createElement('div');
    errorToast.classList.add('error-toast');
    errorToast.textContent = data.message;
    document.body.appendChild(errorToast);
    
    // Remover a mensagem após alguns segundos
    setTimeout(() => {
        errorToast.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(errorToast);
        }, 500);
    }, 3000);
});

// Função para adicionar mensagem ao chat
const addMessageToChat = (message) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Formatação da data e hora
    let timeString = 'Agora';
    if (message.timestamp) {
        const messageDate = new Date(message.timestamp);
        if (!isNaN(messageDate.getTime())) {
            timeString = messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }
    
    // Garantir que o nome de usuário seja exibido corretamente
    const username = message.username || 'Anônimo';
    
    // Determinar a tag de função do usuário
    let roleTag = '';
    if (message.role) {
        const roleClass = message.role.toLowerCase();
        const roleText = message.role === 'admin' ? 'Admin' : 
                        message.role === 'moderator' ? 'Moderador' : 'Usuário';
        roleTag = `<span class="role-tag ${roleClass}">${roleText}</span>`;
    }
    
    messageElement.innerHTML = `
        <img src="${message.profilePicture || 'assets/images/default-avatar-new.png'}" alt="${username}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${username}</span>
                ${roleTag}
                <span class="message-timestamp">${timeString}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    messagesContainer.appendChild(messageElement);
};

// Atualizar lista de usuários online
socket.on('users_update', (users) => {
    onlineUsersList.innerHTML = '';
    
    // Separar usuários por função e remover duplicatas usando IDs únicos
    // Primeiro, criar um Map para garantir usuários únicos por ID
    const uniqueUsers = new Map();
    users.forEach(user => {
        // Usar o ID do usuário como chave para garantir unicidade
        uniqueUsers.set(user.id || user.username, user);
    });
    
    // Converter de volta para array e filtrar por função
    const uniqueUsersArray = Array.from(uniqueUsers.values());
    const moderators = uniqueUsersArray.filter(user => user.role === 'admin' || user.role === 'moderator');
    const regularUsers = uniqueUsersArray.filter(user => user.role === 'user');
    
    // Criar seção de moderadores se houver algum online
    if (moderators.length > 0) {
        const moderatorSection = document.createElement('div');
        moderatorSection.className = 'user-section';
        moderatorSection.innerHTML = '<h3>Moderadores Online</h3>';
        
        moderators.forEach(user => {
            const userElement = document.createElement('li');
            userElement.className = 'user-item moderator';
            userElement.innerHTML = `
                <img src="${user.profilePicture || 'assets/images/default-avatar-new.png'}" alt="${user.username}" class="user-avatar">
                <div class="user-info">
                    <span class="username">${user.username}</span>
                    <span class="user-tag">Moderador</span>
                </div>
            `;
            moderatorSection.appendChild(userElement);
        });
        
        onlineUsersList.appendChild(moderatorSection);
    }
    
    // Criar seção de usuários regulares
    const userSection = document.createElement('div');
    userSection.className = 'user-section';
    userSection.innerHTML = '<h3>Usuários Online</h3>';
    
    regularUsers.forEach(user => {
        const userElement = document.createElement('li');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <img src="${user.profilePicture || 'assets/images/default-avatar-new.png'}" alt="${user.username}" class="user-avatar">
            <div class="user-info">
                <span class="username">${user.username}</span>
            </div>
        `;
        userSection.appendChild(userElement);
    });
    
    onlineUsersList.appendChild(userSection);
});

// Implementar seletor de emojis
const emojis = ['😀', '😂', '😊', '😍', '🤔', '😎', '👍', '❤️', '🎉', '🔥', '😄', '🙌', '👏', '🎮', '🌟'];
const loadEmojis = () => {
    emojiPicker.innerHTML = '';
    emojis.forEach(emoji => {
        const emojiButton = document.createElement('button');
        emojiButton.textContent = emoji;
        emojiButton.onclick = (e) => {
            e.preventDefault();
            messageInput.value += emoji;
            messageInput.focus();
            emojiPicker.classList.add('hidden'); // Esconder o emoji picker após selecionar um emoji
        };
        emojiPicker.appendChild(emojiButton);
    });
};

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

emojiButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    emojiPicker.classList.toggle('hidden');
    if (!emojiPicker.classList.contains('hidden')) {
        loadEmojis();
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Carregar mensagens anteriores quando a página carregar
socket.emit('loadMessages');

// Receber mensagens anteriores
socket.on('previousMessages', (messages) => {
    messages.forEach(message => {
        addMessageToChat(message);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Fechar emoji picker quando clicar fora dele
document.addEventListener('click', (e) => {
    if (emojiPicker && !emojiPicker.contains(e.target) && !emojiButton.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

// Inicializar
loadUserInfo();

// Enviar informações do usuário ao conectar
socket.on('connect', () => {
    setTimeout(() => {
        socket.emit('user_join', {
            username: currentUserName.textContent,
            profilePicture: currentUserAvatar.src
        });
    }, 1000);
});