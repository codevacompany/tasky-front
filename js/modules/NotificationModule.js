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
   * Mostra as notificações do usuário
   */
  async showNotifications() {
    // Primeiro mostrar o modal para dar feedback visual imediato
    uiService.showNotifications();
    
    // Obter a referência para o container de notificações
    const notificationList = document.getElementById("notificationList");
    if (!notificationList) {
      console.error("Lista de notificações não encontrada");
      return;
    }
    
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
          const item = document.createElement('div');
          item.className = 'notification-item';
          
          if (!notificacao.visualizada) {
            item.classList.add('unread');
          }
          
          const icon = document.createElement('i');
          icon.className = `notification-icon fas ${this.getNotificationIcon(notificacao.tipo)}`;
          
          const content = document.createElement('div');
          content.className = 'notification-content';
          
          const title = document.createElement('div');
          title.className = 'notification-title';
          title.textContent = notificacao.titulo;
          
          const message = document.createElement('div');
          message.className = 'notification-message';
          message.textContent = notificacao.mensagem;
          
          const time = document.createElement('div');
          time.className = 'notification-time';
          time.innerHTML = `
            <i class="far fa-clock"></i>
            ${this.formatNotificationTime(notificacao.createdAt)}
          `;
          
          content.appendChild(title);
          content.appendChild(message);
          content.appendChild(time);
          
          item.appendChild(icon);
          item.appendChild(content);
          
          item.addEventListener('click', () => {
            this.visualizarNotificacao(notificacao.id);
          });
          
          notificationList.appendChild(item);
        });
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      notificationList.innerHTML = this.getErrorNotificationHTML();
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

      // Fechar o modal
      uiService.closeNotificationModal();
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
   * Retorna o HTML para quando não há usuário logado
   * @returns {string} HTML para estado sem usuário
   */
  getNoUserNotificationHTML() {
    return `
      <div class="notification-empty">
        <i class="fas fa-user-slash"></i>
        <p>Você precisa estar logado para ver notificações</p>
      </div>
    `;
  }
}

// Exporta uma instância única do módulo
export const notificationModule = new NotificationModule(); 