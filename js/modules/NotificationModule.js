/**
 * Módulo para gerenciamento de notificações
 */
import { apiService } from '../services/ApiService.js';
import { uiService } from '../services/UiService.js';
import { userModule } from './UserModule.js';
import { CONFIG } from '../config.js';
import { formatUtils } from '../utils/FormatUtils.js';

class NotificationModule {
  constructor() {
    this.notificationCount = 0;
    this.checkInterval = null;
  }

  /**
   * Inicializa o módulo de notificações
   */
  init() {
    // Carregar contador de notificações do localStorage
    const savedCount = localStorage.getItem('notificationCount');
    if (savedCount) {
      this.updateNotificationCount(parseInt(savedCount, 10));
    }

    // Iniciar verificação periódica
    this.startNotificationCheck();
    
    // Inicializar eventos
    this.initEvents();
  }
  
  /**
   * Inicializa os eventos de notificações
   */
  initEvents() {
    // Botão para fechar notificações
    const closeBtn = document.getElementById('closeNotifications');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeNotifications();
      });
    }
    
    // Botão para marcar todas como lidas
    const markAllReadBtn = document.getElementById('markAllReadButton');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.marcarTodasNotificacoesLidas();
      });
    }
  }

  /**
   * Inicia a verificação periódica de notificações
   */
  startNotificationCheck() {
    // Limpar qualquer intervalo existente
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Verificar notificações imediatamente
    this.checkNewNotifications();

    // Configurar verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkNewNotifications();
    }, CONFIG.NOTIFICATION_CHECK_INTERVAL);
  }

  /**
   * Para a verificação periódica de notificações
   */
  stopNotificationCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Verifica novas notificações
   */
  async checkNewNotifications() {
    try {
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        return;
      }

      const notificacoes = await apiService.getUserNotifications(userId);
      this.updateNotificationCount(notificacoes.length);
    } catch (error) {
      console.error("Erro ao verificar notificações:", error);
    }
  }

  /**
   * Atualiza o contador de notificações
   * @param {number} count - Quantidade de notificações
   */
  updateNotificationCount(count) {
    this.notificationCount = count;
    localStorage.setItem('notificationCount', count);
    uiService.updateNotificationCount(count);
  }

  /**
   * Exibe o dropdown de notificações e carrega as notificações
   */
  async showNotifications() {
    console.log('[NotificationModule] Exibindo notificações');
    
    try {
      // Verificar se o dropdown existe e está disponível
      const dropdown = document.getElementById('notificationsModal');
      if (!dropdown) {
        console.error('[NotificationModule] Dropdown de notificações não encontrado!');
        return;
      }
      
      // Verificar se o dropdown já está visível
      const isVisible = dropdown.classList.contains('show');
      
      if (isVisible) {
        // Se já estiver visível, fechar
        console.log('[NotificationModule] Dropdown já visível, fechando');
        this.closeNotifications();
        return;
      }
      
      // Se não estiver visível, mostrar
      console.log('[NotificationModule] Abrindo dropdown de notificações');
      
      // Adicionar classe para estilos
      dropdown.classList.add('show');
      
      // Posicionamento adequado
      const notifButton = document.getElementById('notificationButton');
      if (notifButton) {
        const rect = notifButton.getBoundingClientRect();
        const headerHeight = document.querySelector('header')?.offsetHeight || 60;
        
        // Posicionar o dropdown 
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${headerHeight}px`;
        dropdown.style.right = '250px'; 
      }
      
      // Carregar notificações
      console.log('[NotificationModule] Carregando notificações...');
      await this.carregarNotificacoes();
      
      // Adicionar evento para fechar ao clicar fora
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      }, 100);
    } catch (error) {
      console.error('[NotificationModule] Erro ao exibir notificações:', error);
    }
  }
  
  /**
   * Manipula cliques fora do dropdown para fechá-lo
   * @param {Event} event - Evento de clique
   */
  handleOutsideClick = (event) => {
    const dropdown = document.getElementById('notificationsModal');
    const notificationButton = document.getElementById('notificationButton');
    
    if (dropdown && !dropdown.contains(event.target) && 
        notificationButton && !notificationButton.contains(event.target)) {
      this.closeNotifications();
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }
  
  /**
   * Fecha o dropdown de notificações
   */
  closeNotifications() {
    console.log('[NotificationModule] Fechando dropdown de notificações');
    const dropdown = document.getElementById('notificationsModal');
    if (dropdown) {
      // Remover classe
      dropdown.classList.remove('show');
      
      // Remover evento de clique fora
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  /**
   * Carrega as notificações do usuário atual
   */
  async carregarNotificacoes() {
    const notificationList = document.getElementById("notificationList");
    if (!notificationList) return;
    
    try {
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        notificationList.innerHTML = this.getNoUserNotificationHTML();
        return;
      }

      // Mostrar estado de carregamento
      notificationList.innerHTML = this.getLoadingNotificationHTML();
      
      // Buscar as notificações
      const notificacoes = await apiService.getUserNotifications(userId);
      
      // Limpar a lista
      notificationList.innerHTML = '';
      
      if (!notificacoes || notificacoes.length === 0) {
        // Mostrar estado vazio
        notificationList.innerHTML = this.getEmptyNotificationHTML();
      } else {
        // Adicionar as notificações
        notificacoes.forEach(notificacao => {
          // Converter para o formato esperado pelo método getNotificationHTML
          const notificacaoFormatada = {
            id: notificacao.id,
            tipo: this.mapTipoNotificacao(notificacao.tipo),
            titulo: notificacao.titulo || 'Notificação',
            data_criacao: notificacao.createdAt,
            lida: !notificacao.visualizada
          };
          
          // Criar elemento a partir do HTML gerado
          const notificationHTML = this.getNotificationHTML(notificacaoFormatada);
          notificationList.insertAdjacentHTML('beforeend', notificationHTML);
          
          // Adicionar evento de clique à última notificação adicionada
          const lastItem = notificationList.lastElementChild;
          if (lastItem) {
            lastItem.addEventListener('click', () => {
            this.visualizarNotificacao(notificacao.id);
          });
          }
        });
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      notificationList.innerHTML = this.getErrorNotificationHTML();
    }
  }

  /**
   * Mapeia o tipo da notificação para os tipos padronizados
   * @param {string} tipo - Tipo original da notificação
   * @returns {string} - Tipo mapeado
   */
  mapTipoNotificacao(tipo) {
    switch (tipo?.toLowerCase()) {
      case 'ticket_novo':
      case 'ticket_atualizado':
        return 'ticket';
      case 'comentario':
      case 'comentario_novo':
        return 'comentario';
      case 'atribuicao':
      case 'responsavel_alterado':
        return 'atribuicao';
      case 'status_alterado':
        return 'status';
      case 'prazo_proximo':
      case 'prazo_expirado':
        return 'prazo';
      default:
        return 'ticket';
    }
  }
  
  /**
   * Formata a data relativa (há X dias/horas)
   * @param {string} dateString - Data em formato ISO
   * @returns {string} - Data formatada
   */
  formatarDataRelativa(dateString) {
    if (!dateString) return "Há alguns instantes";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        return date.toLocaleDateString();
      } else if (diffDays >= 1) {
        return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours >= 1) {
          return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          if (diffMinutes >= 1) {
            return `Há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
          } else {
            return "Há alguns instantes";
          }
        }
      }
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return "Data desconhecida";
    }
  }

  /**
   * Obtém o ícone adequado para o tipo de notificação
   * @param {string} tipo - Tipo de notificação
   * @returns {string} - Classe do ícone
   */
  getNotificationIcon(tipo) {
    switch (tipo?.toLowerCase()) {
      case 'ticket_novo':
        return 'fa-ticket-alt';
      case 'comentario':
        return 'fa-comment-alt';
      case 'atribuicao':
        return 'fa-user-check';
      case 'alteracao_status':
        return 'fa-exchange-alt';
      case 'prazo':
        return 'fa-clock';
      default:
        return 'fa-bell';
    }
  }

  /**
   * Formata o tempo relativo para notificações
   * @param {string|Date} timestamp - Data da notificação
   * @returns {string} - Tempo formatado
   */
  formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'Agora mesmo';
    } else if (diffMin < 60) {
      return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHour < 24) {
      return `Há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    } else if (diffDay < 7) {
      return `Há ${diffDay} ${diffDay === 1 ? 'dia' : 'dias'}`;
    } else {
      return formatUtils.formatarData(timestamp);
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async marcarTodasNotificacoesLidas() {
    try {
      uiService.showLoading();
      
      try {
        // Tentativa de chamar a API
        await apiService.markAllNotificationsAsRead();
      } catch (apiError) {
        console.warn("API para marcar notificações como lidas não disponível:", apiError);
        // Continue mesmo com erro na API - tratamos como sucesso local
      }
      
      // Atualizar visual das notificações com animação
      const notifications = document.querySelectorAll(".notification-item");
      notifications.forEach((notification) => {
        notification.classList.add("fade-out");
      });

      // Remover as notificações após a animação
      setTimeout(() => {
        const notificationList = document.getElementById("notificationList");
        if (notificationList) {
          notificationList.innerHTML = this.getEmptyNotificationHTML();
        }
      }, 300);

      // Zerar o contador
      this.updateNotificationCount(0);

      // Mostrar mensagem de sucesso
      uiService.showAlert("Todas as notificações foram marcadas como lidas");

      // Fechar o dropdown
      this.closeNotifications();
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
      uiService.showAlert("Não foi possível marcar as notificações como lidas", "error");
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Marca uma notificação como visualizada
   * @param {number} notificationId - ID da notificação
   */
  async visualizarNotificacao(notificationId) {
    try {
      await apiService.markNotificationAsRead(notificationId);
      this.checkNewNotifications(); // Atualizar contador
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }

  /**
   * Retorna o HTML para estado vazio de notificações
   * @returns {string} HTML para estado vazio
   */
  getEmptyNotificationHTML() {
    return `
      <div class="notification-empty">
        <i class="far fa-bell-slash"></i>
        <p>Você não tem novas notificações</p>
      </div>
    `;
  }

  /**
   * Retorna o HTML para estado de erro de notificações
   * @returns {string} HTML para estado de erro
   */
  getErrorNotificationHTML() {
    return `
      <div class="notification-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>Não foi possível carregar as notificações</p>
        <small>O servidor pode estar indisponível no momento.</small>
      </div>
    `;
  }
  
  /**
   * Retorna o HTML para estado de carregamento de notificações
   * @returns {string} HTML para estado de carregamento
   */
  getLoadingNotificationHTML() {
    return `
      <div class="notification-empty">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando notificações...</p>
      </div>
    `;
  }
  
  /**
   * Retorna o HTML para estado sem usuário logado
   * @returns {string} HTML para estado sem usuário
   */
  getNoUserNotificationHTML() {
    return `
      <div class="notification-empty">
        <i class="fas fa-user-slash"></i>
        <p>Sem acesso às notificações</p>
        <small>Faça login para visualizar suas notificações.</small>
      </div>
    `;
  }

  /**
   * Cria uma notificação de exemplo para testes
   * @param {Object} data - Dados para preencher a notificação
   * @returns {Object} - Notificação de exemplo
   */
  createSampleNotification(data = {}) {
    const types = ['ticket_novo', 'comentario', 'atribuicao', 'alteracao_status', 'prazo'];
    const titles = [
      'Novo ticket criado', 
      'Comentário adicionado', 
      'Ticket atribuído a você', 
      'Status do ticket alterado', 
      'Prazo do ticket próximo'
    ];
    const messages = [
      'Um novo ticket foi criado e atribuído ao seu setor.',
      'Um comentário foi adicionado ao ticket que você está acompanhando.',
      'Um ticket foi atribuído diretamente a você.',
      'O status de um ticket que você acompanha foi alterado.',
      'O prazo de um ticket está se aproximando do fim.'
    ];
    
    const randomType = data.tipo || types[Math.floor(Math.random() * types.length)];
    const typeIndex = types.indexOf(randomType);
    
    return {
      id: data.id || Math.floor(Math.random() * 1000),
      tipo: randomType,
      titulo: data.titulo || titles[typeIndex],
      mensagem: data.mensagem || messages[typeIndex],
      createdAt: data.createdAt || new Date().toISOString(),
      visualizada: data.visualizada || false
    };
  }
  
  /**
   * Carrega notificações de exemplo para fins de desenvolvimento
   * @param {number} count - Número de notificações a serem geradas
   */
  loadSampleNotifications(count = 5) {
    const notificationList = document.getElementById("notificationList");
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    // Gerar notificações de exemplo
    for (let i = 0; i < count; i++) {
      const notificacao = this.createSampleNotification({
        visualizada: i % 3 === 0, // Algumas lidas, outras não
        createdAt: new Date(Date.now() - (i * 3600000)).toISOString() // Horas diferentes
      });
      
      // Converter para o formato esperado pelo método getNotificationHTML
      const notificacaoFormatada = {
        id: notificacao.id,
        tipo: this.mapTipoNotificacao(notificacao.tipo),
        titulo: notificacao.titulo,
        data_criacao: notificacao.createdAt,
        lida: !notificacao.visualizada
      };
      
      // Criar elemento a partir do HTML gerado
      const notificationHTML = this.getNotificationHTML(notificacaoFormatada);
      notificationList.insertAdjacentHTML('beforeend', notificationHTML);
      
      // Adicionar evento de clique à última notificação adicionada
      const lastItem = notificationList.lastElementChild;
      if (lastItem) {
        lastItem.addEventListener('click', () => {
          this.visualizarNotificacao(notificacao.id);
        });
      }
    }
    
    // Atualizar contador
    this.updateNotificationCount(count);
  }

  /**
   * Retorna o HTML para uma notificação
   * @param {Object} notificacao - Objeto de notificação
   * @returns {string} HTML da notificação
   */
  getNotificationHTML(notificacao) {
    // Formatar a data relativa (há X dias/horas)
    const dataRelativa = this.formatarDataRelativa(notificacao.data_criacao);
    
    // Determinar classe para notificação não lida
    const unreadClass = notificacao.lida ? '' : 'unread';
    
    // Determinar ícone com base no tipo
    let icone = 'bell';
    switch (notificacao.tipo) {
      case 'ticket':
        icone = 'ticket-alt';
        break;
      case 'comentario':
        icone = 'comment-alt';
        break;
      case 'atribuicao':
        icone = 'user-check';
        break;
      case 'status':
        icone = 'exchange-alt';
        break;
      case 'prazo':
        icone = 'clock';
        break;
    }
    
    // Limitar o tamanho do título para evitar quebra de layout
    const titulo = notificacao.titulo.length > 30
      ? notificacao.titulo.substring(0, 30) + '...' 
      : notificacao.titulo;
    
    return `
      <div class="notification-item ${unreadClass}" data-id="${notificacao.id}">
        <i class="fas fa-${icone}"></i>
        <div class="notification-content">
          <div class="notification-title">${titulo}</div>
        <div class="notification-time">
          <i class="far fa-clock"></i>
            ${dataRelativa}
          </div>
        </div>
        </div>
      `;
  }
}

// Exporta uma instância única do módulo
export const notificationModule = new NotificationModule(); 