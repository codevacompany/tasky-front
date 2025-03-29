/**
 * Serviço para gerenciar a interface do usuário
 */
class UiService {
  constructor() {
    this.ticketDetailsModal = null;
    this.newTicketModal = null;
    this.profileModal = null;
    this.notificationsModal = null;
    this.alertBox = null;
    this.alertTimeout = null;
    this.activeSection = null;
  }

  /**
   * Inicializa o serviço de UI
   */
  init() {
    this.setupElements();
    this.setupModalHandlers();
    this.setupNavHandlers();
    
    // Esconder o banner offline ao iniciar
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'none';
    }
  }

  /**
   * Configura os elementos da UI
   */
  setupElements() {
    // Modais
    this.ticketDetailsModal = document.getElementById('ticketDetailsModal');
    this.newTicketModal = document.getElementById('newTicketModal');
    this.profileModal = document.getElementById('profileModal');
    this.notificationsModal = document.getElementById('notificationsModal');
    this.alertBox = document.getElementById('alertBox');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.offlineBanner = document.getElementById('offlineBanner');
    this.mainHeader = document.getElementById('mainHeader');
    this.mainContent = document.getElementById('mainContent');
    this.loginSection = document.getElementById('loginSection');
  }

  /**
   * Configura manipuladores de eventos para modais
   */
  setupModalHandlers() {
    // Configurar manipuladores de fechamento de modal
    document.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => {
        const modalId = button.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // Configurar botão de fechar alerta
    const alertCloseBtn = document.getElementById('alertClose');
    if (alertCloseBtn) {
      alertCloseBtn.addEventListener('click', () => {
        this.hideAlert();
      });
    }
  }

  /**
   * Configura manipuladores de eventos para navegação
   */
  setupNavHandlers() {
    // Navegação principal
    document.querySelectorAll('.main-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const section = link.getAttribute('data-section');
        
        // Especial para links de admin
        if (link.classList.contains('admin-menu-item')) {
          this.handleAdminNavigation(link, section);
          return;
        }
        
        this.showSection(section);
        
        // Atualizar navegação ativa
        document.querySelectorAll('.main-nav a').forEach(item => {
          item.classList.remove('active');
        });
        link.classList.add('active');
      });
    });

    // Abas na seção de tickets
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        this.showTicketTab(tabId);
      });
    });
  }

  /**
   * Manipula a navegação para seções administrativas
   * @param {HTMLElement} link - O link clicado
   * @param {string} section - A seção a ser mostrada
   */
  handleAdminNavigation(link, section) {
    console.log('Navegação administrativa:', section);
    
    // Remover active de todos os links
    document.querySelectorAll('.main-nav a').forEach(item => {
      item.classList.remove('active');
    });
    
    // Adicionar active no link clicado
    link.classList.add('active');
    
    // Mapeamento de seções
    const sectionMap = {
      'reports': 'relatorios',
      'users': 'colaboradores'
    };
    
    // Usar o mapeamento se necessário
    const sectionId = sectionMap[section] || section;
    
    console.log(`Mostrando seção admin: ${sectionId}`);
    
    // Esconder todas as seções
    document.querySelectorAll('.section-content').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    
    // Mostrar a seção administrativa
    const sectionElement = document.getElementById(`${sectionId}Section`);
    if (sectionElement) {
      sectionElement.style.display = 'block';
      
      // Notificar o módulo de admin sobre a mudança
      if (window.adminModule) {
        window.adminModule.loadAdminSectionData(sectionId);
      } else {
        console.warn('AdminModule não disponível para carregar dados da seção', sectionId);
        // Importar dinamicamente
        import('../modules/AdminModule.js').then(module => {
          module.adminModule.loadAdminSectionData(sectionId);
        }).catch(error => {
          console.error('Erro ao importar AdminModule:', error);
        });
      }
    } else {
      console.error(`Seção não encontrada: ${sectionId}Section`);
    }
  }

  /**
   * Mostra uma seção específica do conteúdo principal
   * @param {string} sectionId - ID da seção a ser mostrada
   */
  showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.remove('active');
    });

    // Mostrar a seção selecionada
    const section = document.getElementById(`${sectionId}Section`);
    if (section) {
      section.classList.add('active');
      this.activeSection = sectionId;
    }
  }

  /**
   * Mostra uma aba específica na seção de tickets
   * @param {string} tabId - ID da aba a ser mostrada
   */
  showTicketTab(tabId) {
    // Atualizar botões de aba
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

    // Atualizar conteúdo da aba
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(`${tabId}Tab`).classList.add('active');
  }

  /**
   * Mostra um alerta personalizado
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de alerta: 'success', 'error', 'warning' ou 'info'
   * @param {string} title - Título opcional do alerta
   * @param {number} duration - Duração em milissegundos para esconder o alerta (default: 5000)
   */
  showAlert(message, type = "success", title = "", duration = 5000) {
    if (!this.alertBox) return;

    // Limpar timeout anterior se existir
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }

    // Definir ícone baseado no tipo
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    // Definir título padrão se não fornecido
    if (!title) {
      if (type === 'success') title = 'Sucesso';
      if (type === 'error') title = 'Erro';
      if (type === 'warning') title = 'Atenção';
      if (type === 'info') title = 'Informação';
    }

    // Atualizar classes
    this.alertBox.className = 'alert';
    this.alertBox.classList.add(`alert-${type}`);
    
    const alertIcon = this.alertBox.querySelector('.alert-icon');
    if (alertIcon) {
      alertIcon.className = `alert-icon fas ${iconClass}`;
    }
    
    const alertTitle = this.alertBox.querySelector('.alert-title');
    if (alertTitle) {
      alertTitle.textContent = title;
    }
    
    const alertMessage = this.alertBox.querySelector('.alert-message');
    if (alertMessage) {
      alertMessage.textContent = message;
    }

    // Garantir que o alerta esteja no correto z-index
    this.alertBox.style.zIndex = "1000";

    // Mostrar alerta
    this.alertBox.classList.add('show');

    // Esconder automaticamente após o tempo especificado
    this.alertTimeout = setTimeout(() => {
      this.hideAlert();
    }, duration);
  }

  /**
   * Esconde o alerta
   */
  hideAlert() {
    if (this.alertBox) {
      this.alertBox.classList.remove('show');
    }
  }

  /**
   * Mostra o indicador de carregamento
   */
  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
    }
  }

  /**
   * Esconde o indicador de carregamento
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Mostra o banner de modo offline
   */
  showOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'block';
    }
  }

  /**
   * Esconde o banner de modo offline
   */
  hideOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'none';
    }
  }

  /**
   * Atualiza o contador de notificações na interface
   * @param {number} count - Quantidade de notificações
   */
  updateNotificationCount(count) {
    const badgeElement = document.getElementById("notificationBadge");
    if (badgeElement) {
      badgeElement.textContent = count;
      
      // Adicionar classe para animação se houver notificações
      if (count > 0) {
        badgeElement.classList.add("has-notifications");
      } else {
        badgeElement.classList.remove("has-notifications");
      }
    }
  }

  /**
   * Mostra a seção de login
   */
  showLoginSection() {
    if (this.loginSection && this.mainContent && this.mainHeader) {
      this.loginSection.style.display = "flex";
      this.mainContent.style.display = "none";
      this.mainHeader.style.display = "none";
      
      // Garantir que o modo escuro está desativado na tela de login
      document.body.classList.remove('dark-mode');
      
      // Adicionar classe active para controle
      this.loginSection.classList.add('active');
      
      // Garantir que a logo seja a versão branca
      const loginLogo = document.getElementById('loginLogo');
      if (loginLogo) {
        loginLogo.src = './images/tasky-white.png';
      }
    }
  }

  /**
   * Mostra a interface principal
   */
  showMainInterface() {
    if (this.loginSection && this.mainContent && this.mainHeader) {
      this.loginSection.style.display = "none";
      this.loginSection.classList.remove('active');
      this.mainContent.style.display = "flex";
      this.mainHeader.style.display = "flex";
    }
  }

  /**
   * Mostra a interface de administrador
   */
  showAdminInterface() {
    this.showMainInterface();
    document.body.classList.add('admin-user');
  }

  /**
   * Mostra a interface de usuário comum
   */
  showUserInterface() {
    this.showMainInterface();
    document.body.classList.remove('admin-user');
  }

  /**
   * Mostra o modal de detalhes do ticket
   * @param {string} ticketHTML - HTML com os detalhes do ticket
   */
  showTicketDetails(ticketHTML) {
    if (!this.ticketDetailsModal) return;
    
    const contentContainer = document.getElementById('ticketDetailsContent');
    if (contentContainer) {
      contentContainer.innerHTML = ticketHTML;
    }
    
    this.showModal('ticketDetailsModal');
  }

  /**
   * Mostra o modal de notificações
   */
  showNotifications() {
    console.log('Mostrando modal de notificações');
    const modal = document.getElementById('notificationsModal');
    if (modal) {
      modal.classList.add('show');
      // Não adicionamos a classe modal-open ao body para evitar overflow:hidden
      // que impediria a rolagem da página enquanto o dropdown de notificações está aberto
    } else {
      console.error('Modal de notificações não encontrado!');
    }
  }

  /**
   * Fecha o modal de notificações
   */
  closeNotificationModal() {
    console.log('Fechando modal de notificações');
    const modal = document.getElementById('notificationsModal');
    if (modal) {
      modal.classList.remove('show');
      // Não removemos a classe modal-open do body, pois não a adicionamos
    }
  }

  /**
   * Mostra o modal de perfil do usuário
   */
  showProfileModal() {
    console.log('Mostrando dropdown de perfil');
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.add('show');
      // Não adicionamos a classe modal-open ao body para evitar overflow:hidden
      // que impediria a rolagem da página enquanto o dropdown de perfil está aberto
    } else {
      console.error('Dropdown de perfil não encontrado!');
    }
  }

  /**
   * Fecha o modal de perfil do usuário
   */
  closeProfileModal() {
    console.log('Fechando dropdown de perfil');
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.remove('show');
      // Não removemos a classe modal-open do body, pois não a adicionamos
    }
  }

  /**
   * Mostra o modal de novo ticket
   */
  showNewTicketModal() {
    this.showModal('newTicketModal');
  }

  /**
   * Fecha o modal de novo ticket
   */
  closeNewTicketModal() {
    this.closeModal('newTicketModal');
  }

  /**
   * Mostra um modal específico
   * @param {string} modalId - ID do modal a ser exibido
   */
  showModal(modalId) {
    console.log(`Tentando mostrar modal: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      console.log(`Modal encontrado: ${modalId}`);
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      
      // Focar no primeiro campo de entrada, se houver
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) {
        console.log(`Focando primeiro campo do modal: ${modalId}`);
        setTimeout(() => {
          firstInput.focus();
        }, 100);
      }
    } else {
      console.error(`Modal não encontrado: ${modalId}`);
    }
  }

  /**
   * Fecha um modal específico
   * @param {string} modalId - ID do modal a ser fechado
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Resetar formulários dentro do modal
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
    }
  }

  /**
   * Reseta a interface para o estado inicial (logout)
   */
  resetUI() {
    // Limpar formulários
    document.querySelectorAll('form').forEach(form => form.reset());

    // Restaurar estado inicial
    this.showLoginSection();

    // Resetar contador de notificações
    this.updateNotificationCount(0);
    
    // Remover classe de admin
    document.body.classList.remove('admin-user');
  }
}

// Exporta uma instância única do serviço
export const uiService = new UiService(); 