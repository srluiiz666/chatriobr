// Elementos do DOM para o modal de administração
let adminModal;
let closeAdminModal;
let adminTabButtons;
let adminTabContents;
let usersList;
let userSearch;
let chatMessages;
let clearChatBtn;

// Verificar se o usuário atual é um administrador
const checkAdminStatus = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar informações do usuário');
        }
        
        const data = await response.json();
        
        // Verificar se o usuário é administrador ou moderador
        if (data.user.role === 'admin' || data.user.role === 'moderator') {
            // Adicionar botão de admin ao chat se ainda não existir
            addAdminButton();
        }
    } catch (error) {
        console.error('Erro ao verificar status de administrador:', error);
    }
};

// Adicionar botão de administração ao chat
const addAdminButton = () => {
    // Verificar se o botão já existe
    if (document.getElementById('admin-panel-btn')) {
        return;
    }
    
    // Criar botão de administração
    const adminButton = document.createElement('button');
    adminButton.id = 'admin-panel-btn';
    adminButton.className = 'admin-panel-btn';
    adminButton.innerHTML = '<i class="fas fa-shield-alt"></i>';
    adminButton.title = 'Painel de Administração';
    
    // Adicionar o botão ao lado do botão de tema
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.parentNode.insertBefore(adminButton, themeToggle);
    
    // Adicionar evento de clique para abrir o modal
    adminButton.addEventListener('click', openAdminModal);
    
    // Criar o modal de administração
    createAdminModal();
};

// Criar modal de administração
const createAdminModal = () => {
    // Verificar se o modal já existe
    if (document.getElementById('adminModal')) {
        return;
    }
    
    // Criar estrutura do modal
    const modalHTML = `
    <div id="adminModal" class="modal hidden">
        <div class="modal-content admin-modal-content">
            <div class="modal-header">
                <h2>Painel de Administração</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="admin-tabs">
                <button class="admin-tab-button active" data-tab="users">
                    <i class="fas fa-users"></i> Usuários
                </button>
                <button class="admin-tab-button" data-tab="chat">
                    <i class="fas fa-comments"></i> Chat
                </button>
            </div>
            <div class="admin-tab-content">
                <div id="users-panel" class="admin-tab-panel active">
                    <div class="search-bar">
                        <input type="text" id="user-search" placeholder="Buscar usuários...">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="users-list" id="users-list">
                        <!-- Usuários serão carregados aqui -->
                    </div>
                </div>
                <div id="chat-panel" class="admin-tab-panel">
                    <div class="chat-controls">
                        <button id="clear-chat" class="btn-danger">
                            <i class="fas fa-trash"></i> Limpar Chat
                        </button>
                    </div>
                    <div class="chat-messages" id="admin-chat-messages">
                        <!-- Mensagens do chat serão carregadas aqui -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Adicionar o modal ao corpo do documento
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Obter referências aos elementos do modal
    adminModal = document.getElementById('adminModal');
    closeAdminModal = adminModal.querySelector('.close-modal');
    adminTabButtons = adminModal.querySelectorAll('.admin-tab-button');
    adminTabContents = adminModal.querySelectorAll('.admin-tab-panel');
    usersList = document.getElementById('users-list');
    userSearch = document.getElementById('user-search');
    chatMessages = document.getElementById('admin-chat-messages');
    clearChatBtn = document.getElementById('clear-chat');
    
    // Adicionar event listeners
    closeAdminModal.addEventListener('click', () => {
        adminModal.classList.add('hidden');
    });
    
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.classList.add('hidden');
        }
    });
    
    // Event listeners para as abas
    adminTabButtons.forEach(button => {
        button.addEventListener('click', switchAdminTab);
    });
    
    // Event listener para busca de usuários
    userSearch.addEventListener('input', (e) => {
        loadUsers(e.target.value);
    });
    
    // Event listener para limpar chat
    clearChatBtn.addEventListener('click', clearAllChat);
};

// Abrir modal de administração
const openAdminModal = () => {
    adminModal.classList.remove('hidden');
    
    // Carregar conteúdo da aba ativa
    const activeTab = adminModal.querySelector('.admin-tab-button.active').dataset.tab;
    if (activeTab === 'users') {
        loadUsers();
    } else if (activeTab === 'chat') {
        loadChatMessages();
    }
};

// Alternar entre abas
const switchAdminTab = (event) => {
    const tabId = event.currentTarget.dataset.tab;
    
    // Remover classe active de todas as abas
    adminTabButtons.forEach(button => button.classList.remove('active'));
    adminTabContents.forEach(content => content.classList.remove('active'));
    
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

// Carregar lista de usuários
const loadUsers = async (searchTerm = '') => {
    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
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
        const response = await fetch(`http://localhost:3000/api/users/${userId}/toggle-mute`, {
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
        console.error('Erro ao mutar/desmutar usuário:', error);
        alert('Erro ao mutar/desmutar usuário. Tente novamente mais tarde.');
    }
};

// Carregar mensagens do chat
const loadChatMessages = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/admin/messages', {
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
            const response = await fetch(`http://localhost:3000/api/admin/messages/${messageId}`, {
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
            const response = await fetch('http://localhost:3000/api/admin/messages/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Falha ao limpar o chat');
            }
            
            // Limpar mensagens do DOM
            chatMessages.innerHTML = '';
            
            // Emitir evento para todos os clientes limparem o chat
            socket.emit('clear_chat');
            
            alert('Chat limpo com sucesso!');
        } catch (error) {
            console.error('Erro ao limpar chat:', error);
            alert('Erro ao limpar chat. Tente novamente mais tarde.');
        }
    }
};