// Configuração de URLs para o frontend
const CONFIG = {
    // URL base da API - detecta automaticamente ambiente de produção ou desenvolvimento
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000' 
        : 'https://chatriobr.up.railway.app',
    
    // URL do Socket.io
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://chatriobr.up.railway.app'
};

// Impedir modificações no objeto de configuração
Object.freeze(CONFIG); 