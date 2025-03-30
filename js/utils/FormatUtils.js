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
    
    try {
      const hoje = new Date();
      const prazo = new Date(deadline);
      
      // Verificar se a data é válida
      if (isNaN(prazo.getTime())) {
        console.error('Data de prazo inválida:', deadline);
        return 'Data inválida';
      }
      
      const diffDias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
      
      let classe = 'prazo-ok';
      let icone = 'check-circle';
      let textoFormato = '';
      
      if (diffDias < 0) {
        classe = 'prazo-atrasado';
        icone = 'exclamation-circle';
        textoFormato = 'Atrasado';
      } else {
        textoFormato = `${Math.abs(diffDias)} dia${diffDias !== 1 ? 's' : ''} restantes`;
        if (diffDias <= 3) {
          classe = 'prazo-urgente';
          icone = 'exclamation-circle';
        } else if (diffDias <= 7) {
          classe = 'prazo-proximo';
          icone = 'clock';
        }
      }
      
      // Formatar a data para exibição no tooltip
      const dia = String(prazo.getDate()).padStart(2, '0');
      const mes = String(prazo.getMonth() + 1).padStart(2, '0');
      const ano = prazo.getFullYear();
      const dataFormatada = `${dia}/${mes}/${ano}`;
      
      // Construir o HTML com o texto formatado
      return `<span class="prazo-col ${classe}" title="Prazo: ${dataFormatada}">
                <i class="fas fa-${icone}"></i> 
                ${textoFormato}
              </span>`;
    } catch (error) {
      console.error('Erro ao formatar prazo:', error, deadline);
      return `<span class="prazo-col prazo-erro" title="Erro ao processar data">
                <i class="fas fa-exclamation-triangle"></i> Erro
              </span>`;
    }
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

  /**
   * Formata uma data para exibição
   * @param {string} dateString - String de data
   * @returns {string} - Data formatada no padrão dd/mm/aaaa hh:mm
   */
  formatDate(dateString) {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const hora = String(date.getHours()).padStart(2, '0');
      const minuto = String(date.getMinutes()).padStart(2, '0');
      
      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "N/A";
    }
  }

  /**
   * Formata uma data para exibição sem hora
   * @param {string} dateString - String de data
   * @returns {string} - Data formatada no padrão dd/mm/aaaa
   */
  formatDateOnly(dateString) {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "N/A";
    }
  }

  /**
   * Formata um valor monetário
   * @param {number} value - Valor a ser formatado
   * @returns {string} - Valor formatado como moeda (R$)
   */
  formatCurrency(value) {
    if (value === null || value === undefined) return "R$ 0,00";
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  /**
   * Formata um número com separadores de milhares
   * @param {number} value - Valor a ser formatado
   * @returns {string} - Número formatado
   */
  formatNumber(value) {
    if (value === null || value === undefined) return "0";
    
    return new Intl.NumberFormat('pt-BR').format(value);
  }
  
  /**
   * Trunca um texto longo, adicionando "..." ao final
   * @param {string} text - Texto a ser truncado
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} - Texto truncado
   */
  truncateText(text, maxLength = 50) {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + "...";
  }
}

// Exporta uma instância única
export const formatUtils = new FormatUtils(); 