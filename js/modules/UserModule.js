/**
 * Módulo para gerenciamento de usuários
 */
import { apiService } from '../services/ApiService.js';
import { uiService } from '../services/UiService.js';
import { CONFIG } from '../config.js';

class UserModule {
  constructor() {
    this.currentUser = null;
    this.sessionTimeout = null;
  }

  /**
   * Inicializa o módulo de usuário
   */
  init() {
    // Tentar restaurar sessão do usuário do localStorage
    this.restoreUserSession();
    
    // Configurar listeners de eventos
    this.setupEventListeners();
  }

  /**
   * Configura os listeners de eventos
   */
  setupEventListeners() {
    // Listener para o formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }
    
    // Atualização de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', this.updateProfile.bind(this));
    }
  }

  /**
   * Restaura a sessão do usuário do localStorage
   */
  restoreUserSession() {
    try {
      const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      
      if (userData && token) {
        this.currentUser = JSON.parse(userData);
        apiService.setAuthToken(token);
        this.resetSessionTimeout();
        return true;
      }
    } catch (error) {
      console.error("Erro ao restaurar sessão:", error);
      this.clearUserSession();
    }
    
    return false;
  }

  /**
   * Manipula o evento de login
   * @param {Event} event - Evento do formulário
   */
  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      uiService.showAlert("Por favor, preencha todos os campos", "warning");
      return;
    }
    
    try {
      uiService.showLoading();
      
      const loginData = { email, password };
      const data = await apiService.login(loginData);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      this.setCurrentUser(data.user, data.token);
      uiService.showAlert("Login realizado com sucesso!");
      
      // Redirecionar para a página principal com base no perfil do usuário
      if (this.isAdmin()) {
        uiService.showAdminInterface();
      } else {
        uiService.showUserInterface();
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      uiService.showAlert("Erro ao fazer login. Verifique suas credenciais.", "error");
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Define o usuário atual e salva no localStorage
   * @param {Object} user - Dados do usuário
   * @param {string} token - Token de autenticação
   */
  setCurrentUser(user, token) {
    this.currentUser = user;
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    
    apiService.setAuthToken(token);
    this.resetSessionTimeout();
    
    // Atualizar interface
    this.updateUserInterface();
  }

  /**
   * Atualiza a interface com informações do usuário
   */
  updateUserInterface() {
    if (!this.currentUser) {
      return;
    }
    
    // Atualizar nome do usuário no cabeçalho
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = this.currentUser.nome;
    }
    
    // Atualizar avatar
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
      userAvatarElement.src = this.getUserAvatar();
    }
    
    // Mostrar/ocultar elementos baseados no perfil
    if (this.isAdmin()) {
      document.body.classList.add('admin-user');
    } else {
      document.body.classList.remove('admin-user');
    }
  }

  /**
   * Obtém o avatar do usuário ou um placeholder
   * @returns {string} - URL do avatar
   */
  getUserAvatar() {
    if (this.currentUser?.avatar) {
      return this.currentUser.avatar;
    }
    
    // Gerar avatar baseado nas iniciais do nome
    const iniciais = this.getInitials();
    return `https://ui-avatars.com/api/?name=${iniciais}&background=random&color=fff`;
  }

  /**
   * Obtém as iniciais do nome do usuário
   * @returns {string} - Iniciais do nome
   */
  getInitials() {
    if (!this.currentUser?.nome) {
      return 'U';
    }
    
    return this.currentUser.nome
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Verifica se o usuário atual é administrador
   * @returns {boolean}
   */
  isAdmin() {
    return this.currentUser?.tipo === 'admin';
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Obtém o ID do usuário atual
   * @returns {string|null}
   */
  getCurrentUserId() {
    return this.currentUser?.id || null;
  }

  /**
   * Obtém o usuário atual
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Realiza logout do usuário
   */
  logout() {
    this.clearUserSession();
    uiService.showLoginSection();
    uiService.showAlert("Logout realizado com sucesso");
  }

  /**
   * Limpa os dados da sessão do usuário
   */
  clearUserSession() {
    this.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    apiService.clearAuthToken();
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Reinicia o timeout da sessão
   */
  resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    this.sessionTimeout = setTimeout(() => {
      if (this.isAuthenticated()) {
        uiService.showAlert("Sua sessão expirou por inatividade", "warning");
        this.logout();
      }
    }, CONFIG.SESSION_TIMEOUT);
  }

  /**
   * Atualiza o perfil do usuário
   * @param {Event} event - Evento do formulário
   */
  async updateProfile(event) {
    event.preventDefault();
    
    if (!this.isAuthenticated()) {
      uiService.showAlert("Você precisa estar logado para atualizar o perfil", "error");
      return;
    }
    
    const profileForm = event.target;
    const formData = new FormData(profileForm);
    
    try {
      uiService.showLoading();
      
      const userData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        // Só enviar a senha se ela foi preenchida
        ...(formData.get('senha') ? { senha: formData.get('senha') } : {})
      };
      
      const data = await apiService.updateUser(this.getCurrentUserId(), userData);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Atualizar dados do usuário
      this.currentUser = { ...this.currentUser, ...data.user };
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.currentUser));
      
      // Atualizar interface
      this.updateUserInterface();
      
      uiService.showAlert("Perfil atualizado com sucesso");
      uiService.closeProfileModal();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      uiService.showAlert("Erro ao atualizar perfil", "error");
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Carrega dados para o formulário de perfil
   */
  loadProfileForm() {
    if (!this.isAuthenticated()) {
      return;
    }
    
    const nameField = document.getElementById('profileNome');
    const emailField = document.getElementById('profileEmail');
    const telefoneField = document.getElementById('profileTelefone');
    
    if (nameField) {
      nameField.value = this.currentUser.nome || '';
    }
    
    if (emailField) {
      emailField.value = this.currentUser.email || '';
    }
    
    if (telefoneField) {
      telefoneField.value = this.currentUser.telefone || '';
    }
    
    // Limpar campos de senha
    const senhaField = document.getElementById('profileSenha');
    const confirmSenhaField = document.getElementById('profileConfirmSenha');
    
    if (senhaField) {
      senhaField.value = '';
    }
    
    if (confirmSenhaField) {
      confirmSenhaField.value = '';
    }
  }
}

// Exporta uma instância única do módulo
export const userModule = new UserModule(); 