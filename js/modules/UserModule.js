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
      
      // Definir o usuário atual e salvar no localStorage
      this.setCurrentUser(data.user, data.token);
      
      // Garantir que o nome do usuário seja atualizado na interface
      console.log('Login bem-sucedido, atualizando UI');
      setTimeout(() => {
        this.updateUserInterface();
      }, 300);
      
      uiService.showAlert("Login realizado com sucesso!");
      
      // Importar o adminModule apenas quando necessário
      if (this.isAdmin()) {
        const { adminModule } = await import('./AdminModule.js');
        adminModule.init();
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
    console.log('Definindo usuário atual:', user);
    
    // Verificar se o objeto user contém o campo nome
    if (!user.nome) {
      console.warn('O objeto de usuário não possui um campo nome válido:', user);
      // Tentar encontrar o nome em outra propriedade
      user.nome = user.name || user.fullName || user.username || 'Usuário';
      console.log('Nome ajustado para:', user.nome);
    }
    
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
      console.warn('Tentativa de atualizar interface sem usuário logado');
      return;
    }
    
    console.log('Atualizando interface para o usuário:', this.currentUser);
    
    // Atualizar nome do usuário no cabeçalho
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      const nomeUsuario = this.currentUser.nome || 'Usuário';
      console.log('Atualizando nome no header para:', nomeUsuario);
      userNameElement.textContent = nomeUsuario;
    } else {
      console.warn('Elemento userName não encontrado no DOM');
    }
    
    // Atualizar avatar
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
      userAvatarElement.src = this.getUserAvatar();
    } else {
      console.warn('Elemento userAvatar não encontrado no DOM');
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
    return this.currentUser?.isAdmin === true || this.currentUser?.tipo === 'admin';
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Retorna o objeto do usuário atual
   * @returns {Object|null} - Objeto do usuário atual ou null se não estiver logado
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Retorna o ID do usuário atual
   * @returns {number|null} - ID do usuário atual ou null se não estiver logado
   */
  getCurrentUserId() {
    if (!this.currentUser) return null;
    return this.currentUser.id || null;
  }

  /**
   * Retorna o ID do departamento do usuário atual
   * @returns {number|null} - ID do departamento do usuário atual ou null se não estiver logado
   */
  getCurrentUserDepartmentId() {
    if (!this.currentUser) return null;
    
    // Verifica se o usuário tem departmentId ou setorId
    const departmentId = this.currentUser.departmentId || this.currentUser.setorId || null;
    
    if (!departmentId) {
      console.warn("Usuário logado não possui departamento definido:", this.currentUser);
    }
    
    return departmentId;
  }

  /**
   * Realiza logout do usuário
   */
  logout() {
    // Fechar o modal de perfil antes de fazer logout
    uiService.closeProfileModal();
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
    
    console.log('Carregando perfil do usuário:', this.currentUser);
    
    // Atualizar nome no cabeçalho do perfil
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) {
      profileNameElement.textContent = this.currentUser.nome || 'Usuário';
    }
    
    // Atualizar cargo/departamento no cabeçalho do perfil
    const profileRoleElement = document.getElementById('profileRole');
    if (profileRoleElement) {
      profileRoleElement.textContent = this.currentUser.setor || 'Sem departamento';
    }
    
    // Atualizar avatar no perfil
    const profileAvatarElement = document.getElementById('profileAvatar');
    if (profileAvatarElement) {
      profileAvatarElement.src = this.getUserAvatar();
    }
    
    // Preencher campos somente leitura com as informações do usuário
    const nomeDisplay = document.getElementById('profileNomeDisplay');
    const emailDisplay = document.getElementById('profileEmailDisplay');
    const setorDisplay = document.getElementById('profileSetorDisplay');
    
    if (nomeDisplay) {
      nomeDisplay.textContent = this.currentUser.nome || '-';
    }
    
    if (emailDisplay) {
      emailDisplay.textContent = this.currentUser.email || '-';
    }
    
    if (setorDisplay) {
      setorDisplay.textContent = this.currentUser.setor || 'Sem departamento';
    }
  }
}

// Exporta uma instância única do módulo
export const userModule = new UserModule(); 