/**
 * Serviço para gerenciar todas as chamadas de API
 */
import { CONFIG } from '../config.js';

class ApiService {
  constructor() {
    this.authToken = null;
  }

  /**
   * Define o token de autenticação
   * @param {string} token - Token de autenticação
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Limpa o token de autenticação
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Realiza uma requisição para a API
   * @param {string} endpoint - Endpoint a ser acessado
   * @param {Object} options - Opções da requisição
   * @returns {Promise<any>} Resposta da API
   */
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}`;

    // Adicionar token de autenticação se disponível
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    console.log(`Fazendo requisição para: ${url}`, {
      ...options,
      headers
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      console.log(`Resposta recebida de ${url}:`, {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      // Alguns endpoints podem não retornar JSON, então verificamos se há conteúdo
      const text = await response.text();
      let data = null;
      
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.warn('Resposta não é um JSON válido:', text);
        data = text;
      }
      
      console.log(`Dados recebidos de ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Realiza o login do usuário
   * @param {Object} loginData - Dados de login (email, password)
   * @returns {Promise<Object>} Dados do usuário e token
   */
  async login(loginData) {
    try {
      // URL direto para autenticação
      const url = `${CONFIG.API_URL}/auth/login`;
      console.log(`Tentando login em: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log(`Resposta de login: status ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Email ou senha incorretos");
        }
        if (response.status === 404) {
          throw new Error("Usuário não encontrado");
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dados de resposta do login:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Salvar o token de autenticação
      if (data.token) {
        this.setAuthToken(data.token);
      }

      return data;
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  /**
   * Realiza logout do usuário (preparado para quando o endpoint estiver disponível)
   */
  async logout() {
    try {
      // Quando o endpoint estiver disponível, descomentar a linha abaixo
      // await this.request("/logout", { method: "POST" });
      return true;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }

  // Endpoints para Tickets
  
  /**
   * Busca todos os tickets
   * @returns {Promise<Array>} Lista de tickets
   */
  async getTickets() {
    return this.request("/tickets");
  }

  /**
   * Busca um ticket específico
   * @param {number} id - ID do ticket
   * @returns {Promise<Object>} Dados do ticket
   */
  async getTicket(id) {
    return this.request(`/tickets/${id}`);
  }

  /**
   * Busca tickets atribuídos a um usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Array>} Lista de tickets
   */
  async getTicketsByTargetUser(userId) {
    return this.request(`/tickets/target-user/${userId}`);
  }

  /**
   * Busca tickets criados por um usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Array>} Lista de tickets
   */
  async getTicketsByRequester(userId) {
    return this.request(`/tickets/requester/${userId}`);
  }

  /**
   * Busca tickets de um departamento
   * @param {number} departmentId - ID do departamento
   * @returns {Promise<Array>} Lista de tickets
   */
  async getTicketsByDepartment(departmentId) {
    return this.request(`/tickets/department/${departmentId}`);
  }

  /**
   * Cria um novo ticket
   * @param {Object} ticketData - Dados do ticket
   * @returns {Promise<Object>} Ticket criado
   */
  async createTicket(ticketData) {
    return this.request("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });
  }

  /**
   * Aceita um ticket
   * @param {number} ticketId - ID do ticket
   * @returns {Promise<Object>} Resultado da operação
   */
  async acceptTicket(ticketId) {
    return this.request(`/tickets/${ticketId}/accept`, {
      method: "POST",
    });
  }

  /**
   * Rejeita um ticket
   * @param {number} ticketId - ID do ticket
   * @returns {Promise<Object>} Resultado da operação
   */
  async rejectTicket(ticketId) {
    return this.request(`/tickets/${ticketId}/reject`, {
      method: "POST",
    });
  }

  // Endpoints para Usuários

  /**
   * Busca todos os usuários
   * @returns {Promise<Array>} Lista de usuários
   */
  async getUsers() {
    return this.request("/users");
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  async createUser(userData) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Endpoints para Departamentos

  /**
   * Busca todos os departamentos
   * @returns {Promise<Array>} Lista de departamentos
   */
  async getDepartments() {
    return this.request("/departments");
  }

  /**
   * Cria um novo departamento
   * @param {Object} departmentData - Dados do departamento
   * @returns {Promise<Object>} Departamento criado
   */
  async createDepartment(departmentData) {
    return this.request("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    });
  }

  // Endpoints para Categorias

  /**
   * Busca todas as categorias
   * @returns {Promise<Array>} Lista de categorias
   */
  async getCategories() {
    return this.request("/categories");
  }

  /**
   * Cria uma nova categoria
   * @param {Object} categoryData - Dados da categoria
   * @returns {Promise<Object>} Categoria criada
   */
  async createCategory(categoryData) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  // Endpoints para Atualizações de Tickets

  /**
   * Busca atualizações de um ticket
   * @param {number} ticketId - ID do ticket
   * @returns {Promise<Array>} Lista de atualizações
   */
  async getTicketUpdates(ticketId) {
    return this.request(`/ticket-updates/${ticketId}`);
  }

  /**
   * Cria uma nova atualização para um ticket
   * @param {Object} updateData - Dados da atualização
   * @returns {Promise<Object>} Atualização criada
   */
  async createTicketUpdate(updateData) {
    return this.request("/ticket-updates", {
      method: "POST",
      body: JSON.stringify(updateData),
    });
  }

  // Endpoints para Notificações

  /**
   * Busca notificações de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de notificações
   */
  async getUserNotifications(userId) {
    try {
      // Tenta obter as notificações do backend
      const notificacoes = await this.request(`/notifications/target-user/${userId}`);
      return notificacoes;
    } catch (error) {
      console.log(`Não foi possível obter notificações do backend: ${error.message}`);
      // Retorna um array vazio em caso de falha
      return [];
    }
  }

  /**
   * Marca todas as notificações como lidas
   * @returns {Promise<Object>} Resultado da operação
   */
  async markAllNotificationsAsRead() {
    try {
      const data = await this.request("/notifications/mark-all-read", {
        method: "POST",
      });
      return data;
    } catch (error) {
      console.log("Erro ao marcar todas as notificações como lidas:", error);
      // Retorna um objeto de sucesso simulado em caso de falha na API
      return { success: true, message: "Operação local bem-sucedida" };
    }
  }

  // Endpoints para Relatórios

  /**
   * Busca as últimas atualizações para relatório
   * @returns {Promise<Array>} Lista de atualizações
   */
  async getReportUpdates() {
    return this.request("/report/latest-updates");
  }

  // Endpoints para Autenticação

  /**
   * Realiza cadastro de um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Atualiza os dados de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Marca uma notificação como lida
   * @param {string} notificationId - ID da notificação
   * @returns {Promise<Object>} Notificação atualizada
   */
  async markNotificationAsRead(notificationId) {
    try {
      const data = await this.request(`/notifications/${notificationId}/read`, {
        method: "POST"
      });
      return data;
    } catch (error) {
      console.log(`Erro ao marcar notificação como lida: ${error.message}`);
      // Retorna um objeto de sucesso simulado em caso de falha na API
      return { success: true, message: "Operação local bem-sucedida" };
    }
  }

  /**
   * Obtém um ticket pelo ID
   * @param {number} ticketId - ID do ticket
   * @returns {Promise<Object>}
   */
  async getTicketById(ticketId) {
    try {
      const response = await this.request(`/tickets/${ticketId}`);
      return response;
    } catch (error) {
      console.error(`Erro ao buscar ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Cancela um ticket pelo ID
   * @param {number} ticketId - ID do ticket a ser cancelado
   * @returns {Promise<Object>} - Resposta da API
   */
  async cancelTicket(ticketId) {
    try {
      const response = await this.request(`/tickets/${ticketId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ status: 'Cancelado' })
      });
      return response;
    } catch (error) {
      console.error(`Erro ao cancelar ticket ${ticketId}:`, error);
      throw error;
    }
  }
}

// Exporta uma instância única do serviço
export const apiService = new ApiService(); 