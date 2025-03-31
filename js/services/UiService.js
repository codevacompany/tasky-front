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
    console.log('Inicializando UiService');
    this.setupElements();
    this.setupModalHandlers();
    this.setupNavHandlers();
    this.setupResizeHandlers();
    
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
    
    // Configurar botão de fechar específico para o modal de perfil
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => {
        console.log('Fechando modal de perfil via setupModalHandlers');
        this.closeProfileModal();
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
        console.log('Navegação para seção:', section);
        
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
   * Configura manipuladores de eventos para redimensionamento
   */
  setupResizeHandlers() {
    // Recentralizar modais quando a janela for redimensionada
    window.addEventListener('resize', () => {
      // Verificar se o modal de novo ticket está aberto
      const newTicketModal = document.getElementById('newTicketModal');
      if (newTicketModal && newTicketModal.classList.contains('show')) {
        this.centerNewTicketModal();
      }
      
      // Verificar se o modal de perfil está aberto
      const profileModal = document.getElementById('profileModal');
      if (profileModal && profileModal.classList.contains('show')) {
        this.adjustProfileModalPosition();
      }
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
      'relatorios': 'relatorios',
      'colaboradores': 'colaboradores',
      'usuarios': 'colaboradores',
      'setores': 'setores',
      'categorias': 'categorias',
      'dashboard': 'dashboard',
      'tickets': 'tickets'
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
      sectionElement.classList.add('active');
      
      // Notificar o módulo apropriado sobre a mudança
      try {
        if (sectionId === 'dashboard' || sectionId === 'tickets') {
          // Para dashboard e tickets usamos outros módulos
          if (sectionId === 'dashboard' && window.adminModule) {
            window.adminModule.loadAdminSectionData('dashboard');
          } else if (sectionId === 'tickets' && window.ticketModule) {
            window.ticketModule.carregarTicketsIniciais();
          }
        } else if (window.adminModule) {
          // Para seções administrativas usamos adminModule
          window.adminModule.loadAdminSectionData(sectionId);
        } else {
          // Importar dinamicamente se necessário
          import('../modules/AdminModule.js').then(module => {
            module.adminModule.loadAdminSectionData(sectionId);
          }).catch(error => {
            console.error('Erro ao importar AdminModule:', error);
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados da seção:', error);
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
    console.log('Mostrando seção:', sectionId);
    
    // Esconder todas as seções
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    // Mostrar a seção selecionada
    const section = document.getElementById(`${sectionId}Section`);
    if (section) {
      section.classList.add('active');
      section.style.display = 'block';
      this.activeSection = sectionId;
      
      // Se for a seção de tickets, acionar carregamento de tickets
      if (sectionId === 'tickets' && window.ticketModule) {
        window.ticketModule.carregarTicketsIniciais();
      }
      
      // Se for dashboard, atualizar estatísticas
      if (sectionId === 'dashboard' && window.adminModule) {
        window.adminModule.updateDashboardStats();
      }
    } else {
      console.error(`Seção não encontrada: ${sectionId}Section`);
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
        badgeElement.style.display = "flex"; // Exibir o contador
      } else {
        badgeElement.classList.remove("has-notifications");
        badgeElement.style.display = "none"; // Ocultar o contador quando for zero
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
   * Mostra o modal de perfil do usuário
   */
  showProfileModal() {
    console.log('Mostrando dropdown de perfil');
    const modal = document.getElementById('profileModal');
    if (modal) {
      // Garantir que o display esteja configurado corretamente
      modal.style.display = 'block';
      
      // Posicionar corretamente com base no header
      const headerHeight = document.querySelector('header')?.offsetHeight || 60;
      modal.style.top = `${headerHeight}px`;
      modal.style.right = '0'; // Posicionamento totalmente à direita
      
      // Mostrar o modal
      modal.classList.add('show');
      
      // Posicionar o modal de acordo com o viewport
      this.adjustProfileModalPosition();
      
      // Adicionar evento de redimensionamento da janela para ajustar posição do modal
      window.addEventListener('resize', this.adjustProfileModalPosition);
    } else {
      console.error('Dropdown de perfil não encontrado!');
    }
  }

  /**
   * Ajusta a posição do modal de perfil para garantir que fique visível na tela
   */
  adjustProfileModalPosition = () => {
    const modal = document.getElementById('profileModal');
    if (!modal || !modal.classList.contains('show')) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    const viewportHeight = window.innerHeight;
    const modalRect = modalContent.getBoundingClientRect();
    const modalHeight = modalRect.height;
    
    // Verificar se o modal está saindo da tela
    if (modalRect.top + modalHeight > viewportHeight) {
      // Ajustar posição para cima se necessário
      modal.style.top = `${Math.max(10, viewportHeight - modalHeight - 20)}px`;
    }
  }

  /**
   * Fecha o modal de perfil do usuário
   */
  closeProfileModal() {
    console.log('Fechando dropdown de perfil');
    const modal = document.getElementById('profileModal');
    if (modal) {
      // Remover a classe show do modal
      modal.classList.remove('show');
      
      // Garantir que o estilo de display esteja correto para permitir reabrir
      modal.style.display = '';
      
      // Remover evento de redimensionamento
      window.removeEventListener('resize', this.adjustProfileModalPosition);
    }
  }

  /**
   * Mostra o modal de novo ticket
   */
  showNewTicketModal() {
    this.showModal('newTicketModal');
    
    // Centralizar o modal na tela após ser exibido
    this.centerNewTicketModal();
  }
  
  /**
   * Centraliza o modal de novo ticket na tela
   */
  centerNewTicketModal() {
    const modal = document.getElementById('newTicketModal');
    if (!modal) return;
    
    // Garantir que o modal tenha a classe show
    modal.classList.add('show');
    
    // Centralizar verticalmente
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      // Calcula a altura do modal e centraliza
      const windowHeight = window.innerHeight;
      const modalHeight = modalContent.offsetHeight;
      
      // Se o modal for maior que a janela, ajusta para exibir com scroll
      if (modalHeight > windowHeight * 0.9) {
        modalContent.style.marginTop = '5vh';
        modalContent.style.marginBottom = '5vh';
      } else {
        // Centraliza verticalmente
        const topMargin = Math.max(0, (windowHeight - modalHeight) / 2);
        modalContent.style.marginTop = `${topMargin}px`;
        modalContent.style.marginBottom = `${topMargin}px`;
      }
    }
  }

  /**
   * Fecha o modal de novo ticket
   */
  closeNewTicketModal() {
    this.closeModal('newTicketModal');
  }

  /**
   * Mostra um modal específico pelo ID
   * @param {string} modalId - ID do modal a ser mostrado
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
      
      // Adicionar classe à body para prevenir rolagem
      document.body.classList.add('modal-open');
    } else {
      console.error(`Modal não encontrado: ${modalId}`);
    }
  }

  /**
   * Fecha um modal específico pelo ID
   * @param {string} modalId - ID do modal a ser fechado
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      
      // Remover classe da body para permitir rolagem novamente
      document.body.classList.remove('modal-open');
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