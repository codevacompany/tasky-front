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
    console.log(`[ApiService] Buscando tickets atribuídos ao usuário ${userId}`);
    try {
      // Tenta primeiro o endpoint específico para tickets atribuídos
      const tickets = await this.request(`/tickets/target-user/${userId}`);
      console.log(`[ApiService] Encontrados ${tickets ? tickets.length : 0} tickets para o usuário ${userId}`);
      return tickets || [];
    } catch (error) {
      console.error(`[ApiService] Erro ao buscar tickets do usuário ${userId}:`, error);
      
      // Como fallback, tenta buscar todos os tickets e filtrar pelo usuário alvo
      try {
        console.log(`[ApiService] Tentando buscar todos os tickets como fallback`);
        const allTickets = await this.request('/tickets');
        // Filtra tickets onde o usuário é o alvo (pode variar dependendo da estrutura do ticket)
        const userTickets = allTickets.filter(ticket => 
          ticket.targetUserId === userId || 
          ticket.assignedTo === userId || 
          (ticket.targetUser && ticket.targetUser.id === userId)
        );
        console.log(`[ApiService] Filtrados ${userTickets.length} tickets para o usuário ${userId}`);
        return userTickets;
      } catch (fallbackError) {
        console.error(`[ApiService] Erro no fallback para tickets do usuário ${userId}:`, fallbackError);
        return []; // Retorna array vazio em caso de falha
      }
    }
  }

  /**
   * Busca tickets criados por um usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Array>} Lista de tickets
   */
  async getTicketsByRequester(userId) {
    console.log(`[ApiService] Buscando tickets criados pelo usuário ${userId}`);
    try {
      // Tenta primeiro o endpoint específico
      const tickets = await this.request(`/tickets/requester/${userId}`);
      console.log(`[ApiService] Encontrados ${tickets ? tickets.length : 0} tickets criados pelo usuário ${userId}`);
      return tickets || [];
    } catch (error) {
      console.error(`[ApiService] Erro ao buscar tickets criados pelo usuário ${userId}:`, error);
      
      // Como fallback, tenta buscar todos os tickets e filtrar pelo criador
      try {
        console.log(`[ApiService] Tentando buscar todos os tickets como fallback`);
        const allTickets = await this.request('/tickets');
        // Filtra tickets onde o usuário é o criador
        const userTickets = allTickets.filter(ticket => 
          ticket.requesterId === userId || 
          ticket.createdBy === userId || 
          (ticket.requester && ticket.requester.id === userId)
        );
        console.log(`[ApiService] Filtrados ${userTickets.length} tickets criados pelo usuário ${userId}`);
        return userTickets;
      } catch (fallbackError) {
        console.error(`[ApiService] Erro no fallback para tickets criados pelo usuário ${userId}:`, fallbackError);
        return []; // Retorna array vazio em caso de falha
      }
    }
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
   * @returns {Promise<Object>} - Promise resolvida com a resposta da API
   */
  async createTicket(ticketData) {
    try {
      console.log('ApiService.createTicket - Enviando dados:', ticketData);
      
      // Adaptar os campos para o formato esperado pela API
      const adaptedData = {
        name: ticketData.title, // A API espera 'name' em vez de 'title'
        departmentId: parseInt(ticketData.departmentId || ticketData.department_id),
        categoryId: parseInt(ticketData.categoryId || ticketData.category_id),
        priority: this.formatarPrioridade(ticketData.priority), // Garantir que seja 'Baixa', 'Média' ou 'Alta'
        description: ticketData.description,
        status: 'Pendente', // Iniciar com P maiúsculo conforme esperado pela API
        requesterId: parseInt(ticketData.requesterId || ticketData.requester_id)
      };
      
      // Adicionar campos opcionais apenas se tiverem valor
      if (ticketData.targetUserId || ticketData.target_user_id) {
        adaptedData.targetUserId = parseInt(ticketData.targetUserId || ticketData.target_user_id);
      }
      
      // Adicionar campos de data de conclusão e deadline se tiverem valor
      if (ticketData.deadline) {
        adaptedData.deadline = ticketData.deadline;
        adaptedData.completionDate = ticketData.deadline; // Usar o mesmo valor para completionDate
        console.log(`[DEBUG] Adicionando datas - deadline: ${adaptedData.deadline}, completionDate: ${adaptedData.completionDate}`);
      } else if (ticketData.completionDate) {
        // Caso apenas o completionDate esteja definido
        adaptedData.deadline = ticketData.completionDate;
        adaptedData.completionDate = ticketData.completionDate;
        console.log(`[DEBUG] Adicionando apenas completionDate: ${adaptedData.completionDate}`);
      }
      
      console.log('ApiService.createTicket - Dados adaptados:', adaptedData);
      
      // Fazer a requisição com um tratamento de erro mais detalhado
      try {
        const url = `${CONFIG.API_URL}/tickets`;
        console.log(`ApiService.createTicket - Fazendo requisição para: ${url}`);
        
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (this.authToken) {
          headers["Authorization"] = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(adaptedData)
        });
        
        console.log(`ApiService.createTicket - Status da resposta: ${response.status}`);
        
        // Tentar ler o corpo da resposta mesmo se não for sucesso
        const textResponse = await response.text();
        let jsonResponse;
        try {
          jsonResponse = textResponse ? JSON.parse(textResponse) : null;
          console.log('ApiService.createTicket - Resposta detalhada:', jsonResponse);
        } catch (e) {
          console.warn('ApiService.createTicket - Resposta não é um JSON válido:', textResponse);
        }
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}${jsonResponse ? ` - ${jsonResponse.message || JSON.stringify(jsonResponse)}` : ''}`);
        }
        
        return jsonResponse || { success: true };
      } catch (requestError) {
        console.error('ApiService.createTicket - Erro na requisição:', requestError);
        throw requestError;
      }
    } catch (error) {
      console.error('ApiService.createTicket - Erro:', error);
      throw error;
    }
  }

  /**
   * Formata a prioridade para o formato esperado pela API
   * @param {string} prioridade - Prioridade do ticket (baixa, media, alta)
   * @returns {string} - Prioridade formatada
   */
  formatarPrioridade(prioridade) {
    if (!prioridade) return 'Média'; // Valor padrão
    
    const prioridadeLowerCase = prioridade.toLowerCase();
    
    if (prioridadeLowerCase === 'baixa') return 'Baixa';
    if (prioridadeLowerCase === 'media' || prioridadeLowerCase === 'média') return 'Média';
    if (prioridadeLowerCase === 'alta') return 'Alta';
    
    return 'Média'; // Valor padrão caso não seja reconhecido
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
   * @param {string} reason - Motivo da rejeição
   * @returns {Promise<Object>} Resultado da operação
   */
  async rejectTicket(ticketId, reason) {
    return this.request(`/tickets/${ticketId}/reject`, {
      method: "POST",
      body: JSON.stringify({ disapprovalReason: reason })
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
   * Busca um ticket específico pelo ID
   * @param {number|string} id - ID do ticket
   * @returns {Promise<Object>} Dados do ticket
   */
  async getTicketById(id) {
    console.log(`[ApiService] Buscando detalhes do ticket ${id}`);
    try {
      // Tentar obter o ticket pelo endpoint específico
      return await this.request(`/tickets/${id}`);
    } catch (error) {
      console.error(`[ApiService] Erro ao buscar ticket ${id}:`, error);
      
      // Como fallback, tentar buscar todos os tickets e encontrar o específico
      try {
        console.log(`[ApiService] Tentando buscar todos os tickets como fallback para encontrar ticket ${id}`);
        const allTickets = await this.request('/tickets');
        const ticket = allTickets.find(t => String(t.id) === String(id));
        
        if (!ticket) {
          throw new Error(`Ticket ${id} não encontrado`);
        }
        
        console.log(`[ApiService] Ticket ${id} encontrado via fallback`);
        return ticket;
      } catch (fallbackError) {
        console.error(`[ApiService] Erro no fallback para buscar ticket ${id}:`, fallbackError);
        throw new Error(`Não foi possível encontrar o ticket ${id}`);
      }
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

  /**
   * Envia um ticket para revisão
   * @param {number} ticketId - ID do ticket
   * @returns {Promise<Object>} Resultado da operação
   */
  async sendTicketToReview(ticketId) {
    console.log(`[ApiService] Enviando ticket ${ticketId} para revisão`);
    try {
      const url = `${CONFIG.API_URL}/tickets/${ticketId}/review`;
      console.log(`[ApiService] Fazendo requisição para: ${url}`);

      const headers = {
        "Content-Type": "application/json"
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        method: "PUT", // Mudando para PUT já que estamos atualizando o status
        headers: headers,
        body: JSON.stringify({ 
          status: 'Em verificação',
          updatedAt: new Date().toISOString()
        })
      });

      console.log(`[ApiService] Status da resposta: ${response.status}`);

      // Tentar ler o corpo da resposta mesmo se não for sucesso
      const textResponse = await response.text();
      let jsonResponse;
      try {
        jsonResponse = textResponse ? JSON.parse(textResponse) : null;
        console.log('[ApiService] Resposta detalhada:', jsonResponse);
      } catch (e) {
        console.warn('[ApiService] Resposta não é um JSON válido:', textResponse);
      }

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}${jsonResponse ? ` - ${jsonResponse.message || JSON.stringify(jsonResponse)}` : ''}`);
      }

      return jsonResponse || { success: true };
    } catch (error) {
      console.error('[ApiService] Erro ao enviar ticket para revisão:', error);
      throw error;
    }
  }
}

// Exporta uma instância única do serviço
export const apiService = new ApiService(); 