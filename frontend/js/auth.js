// Funções de autenticação para o ChatRioBR

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// URL base da API - obtida do arquivo config.js
const API_URL = CONFIG.API_URL + '/api/auth';

// Função para lidar com o login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Salvar o token no localStorage
                localStorage.setItem('token', data.token);
                
                // Redirecionar para a página de chat
                window.location.href = 'chat.html';
            } else {
                alert(`Erro: ${data.message || 'Falha no login'}`); 
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao conectar com o servidor. Tente novamente mais tarde.');
        }
    });
}

// Função para lidar com o registro
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Verificar se as senhas coincidem
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Mostrar mensagem de sucesso
                alert('Conta criada com sucesso! Faça login para continuar.');
                // Redirecionar para a página de login
                window.location.href = 'login.html';
            } else {
                alert(`Erro: ${data.message || 'Falha no registro'}`);
            }
        } catch (error) {
            console.error('Erro ao registrar:', error);
            alert('Erro ao conectar com o servidor. Tente novamente mais tarde.');
        }
    });
}

// Verificar se o usuário já está autenticado
const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (token) {
        try {
            // Verificar se o token é válido fazendo uma requisição ao servidor
            const response = await fetch(`${API_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                // Se o token for inválido, remover do localStorage e redirecionar para login
                localStorage.removeItem('token');
                if (currentPage === 'chat.html' || currentPage === 'chat') {
                    window.location.href = 'login.html';
                }
                return;
            }
            
            // Se o token for válido e estiver na página de login ou registro, redirecionar para o chat
            if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === '' || currentPage === '/') {
                window.location.href = 'chat.html';
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            localStorage.removeItem('token');
            if (currentPage === 'chat.html' || currentPage === 'chat') {
                window.location.href = 'login.html';
            }
        }
    } else if (currentPage === 'chat.html' || currentPage === 'chat') {
        // Se não tiver token e estiver na página de chat, redirecionar para login
        window.location.href = 'login.html';
    }
};

// Executar verificação de autenticação ao carregar a página
checkAuth();