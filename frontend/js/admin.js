// Verificar autenticação e permissões
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

// Elementos do DOM
const adminAvatar = document.getElementById('admin-avatar');
const adminUsername = document.getElementById('admin-username');
const logoutBtn = document.getElementById('logout-btn');
const usersList = document.getElementById('users-list');
const userSearch = document.getElementById('user-search');
const chatMessages = document.getElementById('chat-messages');
const clearChatBtn = document.getElementById('clear-chat');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Carregar informações do administrador
const loadAdminInfo = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar informações do administrador');
        }
        
        const data = await response.json();
        
        // Verificar se o usuário é administrador
        if (data.user.role !== 'admin' && data.user.role !== 'moderator') {
            alert('Acesso negado. Você não tem permissões de administrador.');
            window.location.href = 'chat.html';
            return;
        }
        
        adminUsername.textContent = data.user.username;
        adminAvatar.src = data.user.profilePicture || 'assets/images/default-avatar-new.png';
    } catch (error) {
        console.error('Erro ao carregar informações do administrador:', error);
        alert('Você não tem permissão para acessar o painel de administração.');
        window.location.href = 'chat.html';
    }
};

// Carregar lista de usuários
const loadUsers = async (searchTerm = '') => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/users${searchTerm ? `?search=${searchTerm}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar lista de usuários');
        }
        
        const users = await response.json();
        
        // Filtrar usuários se houver termo de busca
        const filteredUsers = searchTerm 
            ? users.filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : users;
        
        // Limpar lista atual
        usersList.innerHTML = '';
        
        // Adicionar usuários à lista
        filteredUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('user-item');
            
            const muteButtonText = user.isMuted ? 'Desmutar' : 'Mutar';
            const muteButtonIcon = user.isMuted ? 'fa-volume-up' : 'fa-volume-mute';
            
            userElement.innerHTML = `
                <div class="user-info">
                    <img src="${user.profilePicture || 'assets/images/default-avatar-new.png'}" alt="${user.username}" class="user-avatar">
                    <div class="user-details">
                        <span class="user-name">${user.username}</span>
                        <span class="user-email">${user.email}</span>
                        <span class="user-role ${user.role}">${user.role}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-mute" data-user-id="${user._id}" data-muted="${user.isMuted}">
                        <i class="fas ${muteButtonIcon}"></i> ${muteButtonText}
                    </button>
                </div>
            `;
            
            usersList.appendChild(userElement);
        });
        
        // Adicionar event listeners para botões de mutar/desmutar
        document.querySelectorAll('.btn-mute').forEach(button => {
            button.addEventListener('click', toggleMuteUser);
        });
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        usersList.innerHTML = '<p class="error-message">Erro ao carregar usuários. Tente novamente mais tarde.</p>';
    }
};

// Função para mutar/desmutar usuário
const toggleMuteUser = async (event) => {
    const button = event.currentTarget;
    const userId = button.dataset.userId;
    const isMuted = button.dataset.muted === 'true';
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/users/${userId}/toggle-mute`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao alterar status de mute do usuário');
        }
        
        const data = await response.json();
        
        // Atualizar o botão
        button.dataset.muted = !isMuted;
        button.innerHTML = !isMuted 
            ? '<i class="fas fa-volume-up"></i> Desmutar'
            : '<i class="fas fa-volume-mute"></i> Mutar';
            
        alert(data.message);
    } catch (error) {
        console.error('Erro ao alterar status de mute do usuário:', error);
        alert('Erro ao mutar/desmutar usuário. Tente novamente mais tarde.');
    }
};

// Carregar mensagens do chat
const loadChatMessages = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar mensagens do chat');
        }
        
        const messages = await response.json();
        
        // Limpar mensagens atuais
        chatMessages.innerHTML = '';
        
        // Adicionar mensagens ao painel
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('admin-message');
            
            // Formatação da data e hora
            const messageDate = new Date(message.timestamp);
            const timeString = messageDate.toLocaleString('pt-BR');
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <img src="${message.profilePicture || 'assets/images/default-avatar-new.png'}" alt="${message.username}" class="message-avatar">
                    <span class="message-username">${message.username}</span>
                    <span class="message-timestamp">${timeString}</span>
                </div>
                <div class="message-content">${message.text}</div>
                <div class="message-actions">
                    <button class="btn-delete" data-message-id="${message._id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // Adicionar event listeners para botões de excluir mensagem
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', deleteMessage);
        });
        
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        chatMessages.innerHTML = '<p class="error-message">Erro ao carregar mensagens. Tente novamente mais tarde.</p>';
    }
};

// Função para excluir mensagem
const deleteMessage = async (event) => {
    const button = event.currentTarget;
    const messageId = button.dataset.messageId;
    
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Falha ao excluir mensagem');
            }
            
            // Remover mensagem do DOM
            button.closest('.admin-message').remove();
            
            alert('Mensagem excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir mensagem:', error);
            alert('Erro ao excluir mensagem. Tente novamente mais tarde.');
        }
    }
};

// Função para limpar todo o chat
const clearAllChat = async () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de chat? Esta ação não pode ser desfeita.')) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/messages/clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Falha ao limpar chat');
            }
            
            // Limpar mensagens do DOM
            chatMessages.innerHTML = '';
            
            alert('Chat limpo com sucesso!');
        } catch (error) {
            console.error('Erro ao limpar chat:', error);
            alert('Erro ao limpar chat. Tente novamente mais tarde.');
        }
    }
};

// Alternar entre abas
const switchTab = (event) => {
    const tabId = event.currentTarget.dataset.tab;
    
    // Remover classe active de todas as abas
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Adicionar classe active à aba selecionada
    event.currentTarget.classList.add('active');
    document.getElementById(`${tabId}-panel`).classList.add('active');
    
    // Carregar conteúdo da aba
    if (tabId === 'users') {
        loadUsers();
    } else if (tabId === 'chat') {
        loadChatMessages();
    }
};

// Event Listeners
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

userSearch.addEventListener('input', (e) => {
    loadUsers(e.target.value);
});

clearChatBtn.addEventListener('click', clearAllChat);

tabButtons.forEach(button => {
    button.addEventListener('click', switchTab);
});

// Inicializar
loadAdminInfo();
loadUsers();