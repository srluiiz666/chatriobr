// Elementos do DOM para o modal de perfil
const editProfileBtn = document.getElementById('editProfileBtn');
const profileModal = document.getElementById('profileModal');
const closeModal = document.querySelector('.close-modal');
const profileForm = document.getElementById('profileForm');
const editUsername = document.getElementById('editUsername');
const profilePictureUpload = document.getElementById('profilePictureUpload');
// token is already declared in chat.js

// Abrir modal de edição de perfil
editProfileBtn.addEventListener('click', async () => {
    try {
        // Carregar dados atuais do usuário
        const response = await fetch(`${CONFIG.API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        // Preencher o formulário com os dados atuais
        editUsername.value = data.user.username;
        
        // Exibir o modal
        profileModal.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        alert('Erro ao carregar dados do usuário. Tente novamente.');
    }
});

// Fechar modal
closeModal.addEventListener('click', () => {
    profileModal.classList.add('hidden');
});

// Fechar modal ao clicar fora dele
window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.add('hidden');
    }
});

// Converter imagem para Base64
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Enviar formulário de atualização de perfil
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const updateData = {
            username: editUsername.value
        };
        
        // Se uma nova imagem foi selecionada, convertê-la para Base64
        if (profilePictureUpload.files.length > 0) {
            const file = profilePictureUpload.files[0];
            // Verificar tamanho do arquivo (máximo 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB.');
                return;
            }
            
            // Verificar tipo do arquivo
            if (!file.type.match('image.*')) {
                alert('Por favor, selecione uma imagem válida.');
                return;
            }
            
            try {
                updateData.profilePicture = await convertToBase64(file);
            } catch (error) {
                console.error('Erro ao converter imagem:', error);
                alert('Erro ao processar a imagem. Por favor, tente com outra imagem.');
                return;
            }
        }
        
        // Enviar dados para o servidor
        const response = await fetch(`${CONFIG.API_URL}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao atualizar perfil');
        }
        
        // Atualizar informações na página
        document.getElementById('current-user-name').textContent = data.user.username;
        if (data.user.profilePicture) {
            document.getElementById('current-user-avatar').src = data.user.profilePicture;
        }
        
        // Fechar o modal
        profileModal.classList.add('hidden');
        alert('Perfil atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
    }
});