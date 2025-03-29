/**
 * Utilitários para formatação de dados
 */
import { CONFIG } from '../config.js';

class FormatUtils {
  /**
   * Formata uma data para exibição
   * @param {string|Date} date - Data a ser formatada
   * @returns {string} - Data formatada
   */
  formatarData(date) {
    if (!date) return '-';
    
    try {
      const dataObj = new Date(date);
      return new Intl.DateTimeFormat(CONFIG.DATE_FORMAT, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dataObj);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return String(date);
    }
  }

  /**
   * Formata um prazo para melhor visualização
   * @param {string|Date} deadline - Data limite
   * @returns {string} - HTML formatado do prazo
   */
  formatarPrazo(deadline) {
    if (!deadline) return '-';
    
    const hoje = new Date();
    const prazo = new Date(deadline);
    const diffDias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
    
    let classe = 'prazo-ok';
    let icone = 'check-circle';
    
    if (diffDias < 0) {
        classe = 'prazo-atrasado';
        icone = 'exclamation-circle';
    } else if (diffDias <= 3) {
        classe = 'prazo-proximo';
        icone = 'clock';
    }
    
    return `<span class="prazo-col ${classe}"><i class="fas fa-${icone}"></i> ${diffDias}d</span>`;
  }

  /**
   * Calcula o tempo restante para uma data
   * @param {string|Date} date - Data alvo
   * @returns {Object} - Objeto com informações de tempo restante
   */
  calcularTempoRestante(date) {
    if (!date) return { dias: null, status: 'indefinido' };
    
    const hoje = new Date();
    const alvo = new Date(date);
    const diffMs = alvo - hoje;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    let status = 'ok';
    
    if (diffDias < 0) {
      status = 'atrasado';
    } else if (diffDias <= 3) {
      status = 'proximo';
    }
    
    return {
      dias: Math.abs(diffDias),
      status: status,
      passado: diffDias < 0
    };
  }

  /**
   * Obtém ícone baseado na prioridade
   * @param {string} priority - Prioridade do ticket
   * @returns {string} - HTML do ícone
   */
  getPriorityIcon(priority) {
    const lowerPriority = String(priority).toLowerCase();
    if (lowerPriority === 'alta') {
      return '<i class="fas fa-fire-alt"></i>';
    } else if (lowerPriority === 'media') {
      return '<i class="fas fa-arrow-circle-up"></i>';
    } else {
      return '<i class="fas fa-arrow-circle-down"></i>';
    }
  }

  /**
   * Obtém ícone baseado no status
   * @param {string} status - Status do ticket
   * @returns {string} - HTML do ícone
   */
  getStatusIcon(status) {
    const lowerStatus = String(status).toLowerCase();
    if (lowerStatus === 'pendente') {
      return '<i class="fas fa-hourglass-half"></i>';
    } else if (lowerStatus === 'em andamento') {
      return '<i class="fas fa-sync-alt"></i>';
    } else if (lowerStatus === 'resolvido' || lowerStatus === 'finalizado') {
      return '<i class="fas fa-check-circle"></i>';
    } else if (lowerStatus === 'cancelado') {
      return '<i class="fas fa-ban"></i>';
    } else {
      return '<i class="fas fa-info-circle"></i>';
    }
  }
}

// Exporta uma instância única
export const formatUtils = new FormatUtils(); 