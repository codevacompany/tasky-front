/**
 * Módulo para gerenciamento de tickets
 */
import { apiService } from '../services/ApiService.js';
import { uiService } from '../services/UiService.js';
import { userModule } from './UserModule.js';
import { formatUtils } from '../utils/FormatUtils.js';

class TicketModule {
  constructor() {
    this.currentTicketId = null;
    this.setores = [];
  }

  /**
   * Inicializa o módulo de tickets
   */
  init() {
    console.log('Inicializando TicketModule');
    this.loadSetores()
      .then(() => {
        // Carregar tickets iniciais
        this.carregarTicketsIniciais();
        
        // Configurar eventos
        this.setupTicketEvents();
      })
      .catch(error => {
        console.error('Erro ao inicializar TicketModule:', error);
      });
  }

  /**
   * Carrega os setores para uso no módulo
   * @returns {Promise} - Promise resolvida quando os setores forem carregados
   */
  async loadSetores() {
    try {
      this.setores = await apiService.getDepartments();
      console.log('Setores carregados:', this.setores.length);
      return this.setores;
    } catch (error) {
      console.error("Erro ao carregar setores:", error);
      uiService.showAlert("Erro ao carregar setores. Tente novamente.", "error");
      throw error;
    }
  }

  /**
   * Carrega os tickets iniciais após o login do usuário
   */
  carregarTicketsIniciais() {
    // Determinar qual aba está ativa e carregar seus tickets
    const activeTab = document.querySelector('.tab-btn[data-tab].active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      this.carregarTicketsPorTab(tabId);
    } else {
      // Padrão: carregar tickets recebidos
      this.carregarTicketsRecebidos();
    }
  }

  /**
   * Configura todos os eventos relacionados aos tickets
   */
  setupTicketEvents() {
    // Configurar eventos de tabs
    const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos os tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Adicionar active ao tab clicado
        button.classList.add('active');
        
        // Carregar tickets correspondentes
        const tabId = button.getAttribute('data-tab');
        this.carregarTicketsPorTab(tabId);
      });
    });

    // Configurar eventos de filtros
    const filtros = document.querySelectorAll('.ticket-filters select, .ticket-filters input');
    filtros.forEach(filtro => {
      filtro.addEventListener('change', () => {
        // Recarregar tickets com os filtros aplicados
        const activeTab = document.querySelector('.tab-btn[data-tab].active');
        if (activeTab) {
          const tabId = activeTab.getAttribute('data-tab');
          this.carregarTicketsPorTab(tabId);
        }
      });
    });

    // Configurar botão de busca
    const searchBtn = document.querySelectorAll('.search-group .btn-icon');
    searchBtn.forEach(btn => {
      btn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn[data-tab].active');
        if (activeTab) {
          const tabId = activeTab.getAttribute('data-tab');
          this.carregarTicketsPorTab(tabId);
        }
      });
    });

    // Configurar eventos para retry (botões de tentar novamente)
    document.addEventListener('retryLoadReceivedTickets', () => {
      this.carregarTicketsRecebidos();
    });
    
    document.addEventListener('retryLoadCreatedTickets', () => {
      this.carregarTicketsCriados();
    });
    
    document.addEventListener('retryLoadDepartmentTickets', () => {
      this.carregarTicketsSetor();
    });
  }

  /**
   * Carrega tickets com base na tab selecionada
   * @param {string} tabId - ID da tab: recebidos, criados ou departamento
   */
  carregarTicketsPorTab(tabId) {
    // Mostrar a tab correspondente
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    const tabPane = document.getElementById(`${tabId}Tab`);
    if (tabPane) {
      tabPane.classList.add('active');
    }
    
    // Carregar os tickets correspondentes
    switch (tabId) {
      case 'recebidos':
        this.carregarTicketsRecebidos();
        break;
      case 'criados':
        this.carregarTicketsCriados();
        break;
      case 'departamento':
        this.carregarTicketsSetor();
        break;
      default:
        console.error('Tab desconhecida:', tabId);
    }
  }

  /**
   * Busca o nome de um setor pelo ID
   * @param {number} setorId - ID do setor
   * @returns {string} - Nome do setor ou "Desconhecido"
   */
  getSetorNome(setorId) {
    const setor = this.setores.find((s) => s.id == setorId);
    return setor ? setor.name : "Desconhecido";
  }

  /**
   * Carrega tickets atribuídos ao usuário atual
   */
  async carregarTicketsRecebidos() {
    try {
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        console.error("ID do usuário não encontrado:", userModule.getCurrentUser());
        return;
      }

      // Selecionar tbody e mostrar estado de carregamento
      const tbody = document.querySelector("#ticketsRecebidosTableBody");
      if (!tbody) {
        console.error("Elemento tbody para tickets recebidos não encontrado");
        return;
      }
      
      // Mostrar indicador de carregamento
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando tickets recebidos...</p>
          </td>
        </tr>
      `;

      // Carregar tickets da API
      const response = await apiService.getTicketsByTargetUser(userId);
      console.log('Tickets recebidos:', response);
        
      // Verificar se não há tickets
      if (!response || response.length === 0) {
        tbody.innerHTML = this.getEmptyStateHTML();
        this.atualizarContadores(0, 0, 0, 0, 'recebidos');
        
        // Mostrar mensagem de nenhum ticket encontrado
        const noTicketsMsg = document.getElementById('noTicketsRecebidos');
        if (noTicketsMsg) {
          noTicketsMsg.style.display = 'flex';
        }
        return;
      }

      // Ocultar mensagem de nenhum ticket se estiver visível
      const noTicketsMsg = document.getElementById('noTicketsRecebidos');
      if (noTicketsMsg) {
        noTicketsMsg.style.display = 'none';
      }

      // Ordenar tickets por data de criação (mais recentes primeiro)
      const sortedTickets = [...response].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Renderizar tickets na tabela
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket, 'recebidos')).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'recebidos');
      
      // Adicionar event listeners para botões de ação
      this.setupTicketActionButtons();
    } catch (error) {
      console.error('Erro ao carregar tickets recebidos:', error);
      
      // Mostrar mensagem de erro na tabela
      const tbody = document.querySelector("#ticketsRecebidosTable tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="ticketModule.carregarTicketsRecebidos()">
                <i class="fas fa-sync-alt"></i> Tentar novamente
              </button>
            </td>
          </tr>
        `;
      }
      
      uiService.showAlert('Erro ao carregar tickets recebidos: ' + error.message, 'error');
    }
  }

  /**
   * Configura event listeners para botões de ação nos tickets
   */
  setupTicketActionButtons() {
    console.log('Configurando event listeners para botões de ação');
    
    // Botões de visualização de ticket
    const viewButtons = document.querySelectorAll('.view-ticket');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const ticketId = event.target.closest('tr').dataset.id;
        if (ticketId) {
          this.viewTicketDetails(ticketId);
        }
      });
    });
    
    // Botões de edição de ticket
    const editButtons = document.querySelectorAll('.edit-ticket');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const ticketId = event.target.closest('tr').dataset.id;
        if (ticketId) {
          this.openEditTicketForm(ticketId);
        }
      });
    });
    
    // Botões de cancelamento de ticket
    const cancelButtons = document.querySelectorAll('.cancel-ticket');
    cancelButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const ticketId = event.target.closest('tr').dataset.id;
        if (ticketId) {
          this.confirmCancelTicket(ticketId);
        }
      });
    });

    console.log(`Event listeners configurados: ${viewButtons.length} view, ${editButtons.length} edit, ${cancelButtons.length} cancel`);
  }

  /**
   * Abre o modal de visualização de detalhes do ticket
   * @param {string|number} ticketId - ID do ticket a ser visualizado
   */
  async viewTicketDetails(ticketId) {
    try {
      console.log('Carregando detalhes do ticket:', ticketId);
      uiService.showLoading('Carregando detalhes do ticket...');
      
      // Carregar dados completos do ticket
      const ticket = await apiService.getTicketById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }
      
      // Aqui você pode implementar a lógica para mostrar os detalhes do ticket
      // Por exemplo, exibir um modal com todas as informações
      
      console.log('Detalhes do ticket carregados:', ticket);
      uiService.hideLoading();
      
      // [IMPLEMENTAR] Mostrar modal com detalhes
      uiService.showAlert('Função de visualização de detalhes em implementação', 'info');
      
    } catch (error) {
      console.error('Erro ao carregar detalhes do ticket:', error);
      uiService.hideLoading();
      uiService.showAlert('Erro ao carregar detalhes: ' + error.message, 'error');
    }
  }

  /**
   * Abre o formulário de edição de ticket
   * @param {string|number} ticketId - ID do ticket a ser editado
   */
  async openEditTicketForm(ticketId) {
    try {
      console.log('Preparando edição do ticket:', ticketId);
      uiService.showLoading('Carregando formulário de edição...');
      
      // Carregar dados completos do ticket
      const ticket = await apiService.getTicketById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }
      
      // Aqui você pode implementar a lógica para mostrar o formulário de edição
      // preenchido com os dados do ticket
      
      console.log('Ticket para edição carregado:', ticket);
      uiService.hideLoading();
      
      // [IMPLEMENTAR] Mostrar formulário de edição
      uiService.showAlert('Função de edição de ticket em implementação', 'info');
      
    } catch (error) {
      console.error('Erro ao preparar edição do ticket:', error);
      uiService.hideLoading();
      uiService.showAlert('Erro ao preparar edição: ' + error.message, 'error');
    }
  }

  /**
   * Confirma o cancelamento de um ticket
   * @param {string|number} ticketId - ID do ticket a ser cancelado
   */
  confirmCancelTicket(ticketId) {
    // Confirmar com o usuário antes de cancelar
    if (confirm('Tem certeza que deseja cancelar este ticket? Esta ação não pode ser desfeita.')) {
      this.cancelTicket(ticketId);
    }
  }

  /**
   * Cancela um ticket
   * @param {string|number} ticketId - ID do ticket a ser cancelado
   */
  async cancelTicket(ticketId) {
    try {
      console.log('Cancelando ticket:', ticketId);
      uiService.showLoading('Cancelando ticket...');
      
      // Chamar API para cancelar o ticket
      await apiService.cancelTicket(ticketId);
      
      uiService.hideLoading();
      uiService.showAlert('Ticket cancelado com sucesso', 'success');
      
      // Recarregar a lista de tickets para atualizar a interface
      const activeTab = document.querySelector('.tab-btn[data-tab].active');
      if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        this.carregarTicketsPorTab(tabId);
      }
      
    } catch (error) {
      console.error('Erro ao cancelar ticket:', error);
      uiService.hideLoading();
      uiService.showAlert('Erro ao cancelar ticket: ' + error.message, 'error');
    }
  }

  /**
   * Atualiza os contadores de tickets em uma determinada seção
   * @param {number} total - Total de tickets
   * @param {number} pendentes - Número de tickets pendentes
   * @param {number} emAndamento - Número de tickets em andamento
   * @param {number} resolvidos - Número de tickets resolvidos
   * @param {string} secao - Seção a ser atualizada ('recebidos', 'criados', 'departamento')
   */
  atualizarContadores(total, pendentes, emAndamento, resolvidos, secao) {
    console.log(`Atualizando contadores da seção ${secao}:`, {
      total, pendentes, emAndamento, resolvidos
    });
    
    // Determinar o prefixo dos IDs com base na seção
    let idPrefix;
    if (secao === 'recebidos') {
      idPrefix = 'recebidos';
    } else if (secao === 'criados') {
      idPrefix = 'criados';
    } else if (secao === 'departamento') {
      idPrefix = 'departamento';
    } else {
      console.error('Seção inválida para atualização de contadores:', secao);
      return;
    }
    
    // Atualizar os contadores
    const elements = {
      total: document.getElementById(`${idPrefix}Total`),
      pendentes: document.getElementById(`${idPrefix}Pendentes`),
      emAndamento: document.getElementById(`${idPrefix}EmAndamento`),
      resolvidos: document.getElementById(`${idPrefix}Resolvidos`)
    };
    
    // Verificar se os elementos existem e atualizar
    if (elements.total) elements.total.textContent = total;
    if (elements.pendentes) elements.pendentes.textContent = pendentes;
    if (elements.emAndamento) elements.emAndamento.textContent = emAndamento;
    if (elements.resolvidos) elements.resolvidos.textContent = resolvidos;
  }

  /**
   * Carrega tickets criados pelo usuário atual
   */
  async carregarTicketsCriados() {
    try {
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        console.error("ID do usuário não encontrado:", userModule.getCurrentUser());
        return;
      }

      console.log('Carregando tickets criados pelo usuário de ID:', userId);

      // Selecionar tbody e mostrar estado de carregamento
      const tbody = document.getElementById("ticketsCriadosTable");
      if (!tbody) {
        console.error("Elemento ticketsCriadosTable não encontrado");
        return;
      }
      
      // Mostrar indicador de carregamento
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando tickets criados...</p>
          </td>
        </tr>
      `;

      // Carregar tickets da API
      const response = await apiService.getTicketsByRequester(userId);
      console.log('Tickets criados recebidos da API:', response);
      
      // Verificar se não há tickets
      if (!response || response.length === 0) {
        tbody.innerHTML = this.getEmptyStateHTML();
        this.atualizarContadores(0, 0, 0, 0, 'criados');
        
        // Mostrar mensagem de nenhum ticket encontrado
        const noTicketsMsg = document.getElementById('noTicketsCriados');
        if (noTicketsMsg) {
          noTicketsMsg.style.display = 'flex';
        }
        return;
      }

      // Ocultar mensagem de nenhum ticket se estiver visível
      const noTicketsMsg = document.getElementById('noTicketsCriados');
      if (noTicketsMsg) {
        noTicketsMsg.style.display = 'none';
      }

      // Ordenar tickets por data de criação (mais recentes primeiro)
      const sortedTickets = [...response].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Renderizar tickets na tabela
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket, 'criados')).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'criados');
      
      // Adicionar event listeners para botões de ação
      this.setupTicketActionButtons();
    } catch (error) {
      console.error('Erro ao carregar tickets criados:', error);
      
      // Mostrar mensagem de erro na tabela
      const tbody = document.getElementById("ticketsCriadosTable");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="document.dispatchEvent(new CustomEvent('retryLoadCreatedTickets'))">
                <i class="fas fa-sync-alt"></i> Tentar novamente
              </button>
            </td>
          </tr>
        `;
      }
      
      uiService.showAlert('Erro ao carregar tickets criados: ' + error.message, 'error');
    }
  }

  /**
   * Carrega tickets do departamento do usuário atual
   */
  async carregarTicketsSetor() {
    try {
      // Obter o ID do departamento do usuário atual
      const userDeptId = userModule.getCurrentUserDepartmentId();
      if (!userDeptId) {
        console.error("ID do departamento do usuário não encontrado");
        return;
      }

      console.log('Carregando tickets do departamento ID:', userDeptId);

      // Selecionar tbody e mostrar estado de carregamento
      const tbody = document.getElementById("ticketsSetor");
      if (!tbody) {
        console.error("Elemento ticketsSetor não encontrado");
        return;
      }
      
      // Mostrar indicador de carregamento
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando tickets do departamento...</p>
          </td>
        </tr>
      `;

      // Carregar tickets da API
      const response = await apiService.getTicketsByDepartment(userDeptId);
      console.log('Tickets do departamento recebidos da API:', response);
      
      // Verificar se não há tickets
      if (!response || response.length === 0) {
        tbody.innerHTML = this.getEmptyStateHTML();
        this.atualizarContadores(0, 0, 0, 0, 'departamento');
        
        // Mostrar mensagem de nenhum ticket encontrado
        const noTicketsMsg = document.getElementById('noTicketsSetor');
        if (noTicketsMsg) {
          noTicketsMsg.style.display = 'flex';
        }
        return;
      }

      // Ocultar mensagem de nenhum ticket se estiver visível
      const noTicketsMsg = document.getElementById('noTicketsSetor');
      if (noTicketsMsg) {
        noTicketsMsg.style.display = 'none';
      }

      // Ordenar tickets por data de criação (mais recentes primeiro)
      const sortedTickets = [...response].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Renderizar tickets na tabela
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket, 'departamento')).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'departamento');
      
      // Adicionar event listeners para botões de ação
      this.setupTicketActionButtons();
    } catch (error) {
      console.error('Erro ao carregar tickets do departamento:', error);
      
      // Mostrar mensagem de erro na tabela
      const tbody = document.getElementById("ticketsSetor");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="document.dispatchEvent(new CustomEvent('retryLoadDepartmentTickets'))">
                <i class="fas fa-sync-alt"></i> Tentar novamente
              </button>
            </td>
          </tr>
        `;
      }
      
      uiService.showAlert('Erro ao carregar tickets do departamento: ' + error.message, 'error');
    }
  }

  /**
   * Retorna HTML para uma linha de ticket na tabela
   * @param {Object} ticket - Objeto do ticket
   * @param {string} secao - Seção onde o ticket será exibido ('recebidos', 'criados', 'departamento')
   * @returns {string} HTML para linha de ticket
   */
  getTicketRowHTML(ticket, secao = 'recebidos') {
    const setorNome = this.getSetorNome(ticket.departmentId);
    const creator = ticket.requesterName || "Desconhecido";
    const assignee = ticket.assigneeName || "Não atribuído";
    
    // Classe de prioridade para estilização
    let prioridadeClass = "";
    switch(ticket.priority?.toLowerCase()) {
      case "alta":
        prioridadeClass = "priority-high";
        break;
      case "média":
      case "media":
        prioridadeClass = "priority-medium";
        break;
      case "baixa":
        prioridadeClass = "priority-low";
        break;
    }
    
    // Classe de status para estilização
    let statusClass = "";
    switch(ticket.status?.toLowerCase()) {
      case "pendente":
        statusClass = "status-pending";
        break;
      case "em andamento":
        statusClass = "status-progress";
        break;
      case "finalizado":
      case "concluído":
      case "concluido":
        statusClass = "status-done";
        break;
      case "cancelado":
        statusClass = "status-cancelled";
        break;
    }
    
    // Formatar datas
    const dataCriacao = ticket.createdAt ? formatUtils.formatDate(ticket.createdAt) : "N/A";
    const dataConclusao = ticket.completedAt ? formatUtils.formatDate(ticket.completedAt) : "N/A";
    const prazo = ticket.deadline ? formatUtils.formatDate(ticket.deadline) : "N/A";
    
    // Construir HTML com base na seção
    let html = `
      <tr data-id="${ticket.id}">
        <td>${ticket.id}</td>
        <td>${ticket.name}</td>
        <td><span class="priority-badge ${prioridadeClass}">${ticket.priority || "N/A"}</span></td>
        <td><span class="status-badge ${statusClass}">${ticket.status || "N/A"}</span></td>
    `;
    
    // Adicionar coluna de Setor (para tickets recebidos e criados) ou Solicitante (para tickets do departamento)
    if (secao === 'departamento') {
      html += `<td>${creator}</td>`;
    } else {
      html += `<td>${setorNome}</td>`;
    }
    
    // Adicionar colunas comuns
    html += `
        <td>${dataCriacao}</td>
        <td>${dataConclusao}</td>
        <td>${prazo}</td>
        <td class="actions">
          <button class="btn-icon view-ticket" title="Ver detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon edit-ticket" title="Editar ticket">
            <i class="fas fa-edit"></i>
          </button>
    `;
    
    // Adicionar botão de cancelar apenas para tickets criados pelo usuário
    if (secao === 'criados') {
      html += `
          <button class="btn-icon cancel-ticket" title="Cancelar ticket">
            <i class="fas fa-times"></i>
          </button>
      `;
    }
    
    // Fechar a tag da coluna de ações e a linha
    html += `
        </td>
      </tr>
    `;
    
    return html;
  }

  /**
   * Retorna HTML para estado vazio (nenhum ticket encontrado)
   * @returns {string} HTML para estado vazio
   */
  getEmptyStateHTML() {
    return `
      <tr>
        <td colspan="9" class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <p>Nenhum ticket encontrado</p>
        </td>
      </tr>
    `;
  }

  /**
   * Mostra detalhes de um ticket específico
   * @param {number} ticketId - ID do ticket
   */
  async showTicketDetails(ticketId) {
    try {
      const ticket = await apiService.getTicket(ticketId);
      this.currentTicketId = ticketId;
      
      const detailsHTML = this.getTicketDetailsHTML(ticket);
      uiService.showTicketDetails(ticket, detailsHTML);
      
      // Carregar atualizações do ticket
      await this.carregarAtualizacoes(ticketId);
    } catch (error) {
      console.error("Erro ao carregar detalhes do ticket:", error);
      uiService.showAlert("Erro ao carregar detalhes do ticket", "error");
    }
  }

  /**
   * Carrega as atualizações de um ticket específico
   * @param {number} ticketId - ID do ticket
   */
  async carregarAtualizacoes(ticketId) {
    try {
      const atualizacoes = await apiService.getTicketUpdates(ticketId);
      const commentContainer = document.getElementById("atualizacoes");

      if (!commentContainer) return;

      commentContainer.innerHTML = "";

      atualizacoes.forEach((a) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.innerHTML = `
          <div class="comment-header">
            <span class="comment-author">${a.user.name}</span>
            <span class="comment-timestamp">${formatUtils.formatarData(a.dateTime)}</span>
          </div>
          <div class="comment-text">${a.comment}</div>
        `;
        commentContainer.appendChild(commentDiv);
      });

      commentContainer.scrollTop = commentContainer.scrollHeight;
    } catch (error) {
      console.error("Erro ao carregar atualizações:", error);
    }
  }

  /**
   * Cria o HTML de detalhes do ticket para o modal
   * @param {Object} ticket - Dados do ticket
   * @returns {string} - HTML de detalhes
   */
  getTicketDetailsHTML(ticket) {
    return `
      <div class="ticket-details">
        <p><strong>ID:</strong> ${ticket.id}</p>
        <p><strong>Assunto:</strong> ${ticket.title}</p>
        <p><strong>Prioridade:</strong> ${formatUtils.getPriorityIcon(ticket.priority)} ${ticket.priority}</p>
        <p><strong>Status:</strong> ${formatUtils.getStatusIcon(ticket.status)} ${ticket.status}</p>
        <p><strong>Solicitante:</strong> ${ticket.solicitante}</p>
        <p><strong>Data de Criação:</strong> ${formatUtils.formatarData(ticket.createdAt)}</p>
        <p><strong>Data de Aceitação:</strong> ${formatUtils.formatarData(ticket.acceptanceDate)}</p>
        <p><strong>Data de Conclusão:</strong> ${ticket.completionDate ? formatUtils.formatarData(ticket.completionDate) : "-"}</p>
        <p><strong>Prazo:</strong> ${formatUtils.formatarPrazo(ticket.deadline)}</p>
        <p class="full-width"><strong>Descrição:</strong> ${ticket.description}</p>
      </div>
    `;
  }

  /**
   * Envia um novo comentário para um ticket
   */
  async enviarComentario() {
    const comentario = document.getElementById("novoComentario").value;
    if (!comentario.trim()) return;

    try {
      await apiService.createTicketUpdate({
        ticketId: this.currentTicketId,
        comment: comentario,
      });

      document.getElementById("novoComentario").value = "";
      await this.carregarAtualizacoes(this.currentTicketId);
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      uiService.showAlert("Erro ao enviar comentário. Tente novamente.");
    }
  }

  /**
   * Aceita um ticket pendente
   * @param {number} ticketId - ID do ticket
   */
  async aceitarTicket(ticketId) {
    try {
      // Criar modal de confirmação
      const confirmModal = document.createElement('div');
      confirmModal.className = 'modal';
      confirmModal.style.display = 'block';
      confirmModal.innerHTML = `
        <div class="modal-content confirmation-modal">
          <div class="modal-header">
            <h2>Confirmar Aceitação</h2>
          </div>
          <div class="modal-body">
            <p class="confirmation-message">Tem certeza que deseja aceitar este ticket?</p>
            <p class="confirmation-description">Ao aceitar, você será responsável pelo atendimento desta solicitação.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closest('.modal').remove()">
              <i class="fas fa-times"></i> CANCELAR
            </button>
            <button class="btn-primary" id="confirmAccept">
              <i class="fas fa-check"></i> CONFIRMAR
            </button>
          </div>
        </div>
      `;

      // Adicionar estilos específicos para este modal
      const style = document.createElement('style');
      style.textContent = `
        .confirmation-modal {
          max-width: 500px;
        }
        .modal-footer {
          padding: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #e9ecef;
        }
        .confirmation-message {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 10px;
        }
        .confirmation-description {
          color: #6c757d;
        }
        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }
        .btn-primary:hover {
          background: #2563eb;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        .btn-secondary:hover {
          background: #e2e8f0;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(confirmModal);

      // Adicionar evento de fechar ao clicar fora do modal
      confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
          confirmModal.remove();
          style.remove();
        }
      });

      // Adicionar evento de confirmação
      return new Promise((resolve) => {
        confirmModal.querySelector('#confirmAccept').addEventListener('click', async () => {
          try {
            const response = await apiService.acceptTicket(ticketId);

            if (response) {
              uiService.showAlert('Ticket aceito com sucesso! O status foi alterado para "Em andamento" e a data de aceitação foi registrada.', 'success');
              await this.carregarTicketsRecebidos();
              await this.carregarTicketsSetor();
              resolve(true);
            } else {
              uiService.showAlert('Erro ao aceitar o ticket. Por favor, tente novamente.', 'error');
              resolve(false);
            }
          } catch (error) {
            console.error('Erro ao aceitar ticket:', error);
            uiService.showAlert('Erro ao aceitar o ticket. Por favor, tente novamente.', 'error');
            resolve(false);
          } finally {
            confirmModal.remove();
            style.remove();
          }
        });
      });
    } catch (error) {
      console.error('Erro ao criar modal de confirmação:', error);
      uiService.showAlert('Erro ao processar a solicitação. Por favor, tente novamente.', 'error');
      return false;
    }
  }

  /**
   * Rejeita um ticket
   * @param {number} ticketId - ID do ticket
   */
  async rejectTicket(ticketId) {
    try {
      const confirmacao = confirm("Tem certeza que deseja rejeitar este ticket?");
      if (confirmacao) {
      await apiService.rejectTicket(ticketId);
        uiService.showAlert('Ticket rejeitado com sucesso.', 'success');
        this.refreshTickets();
      }
    } catch (error) {
      console.error('Erro ao rejeitar ticket:', error);
      uiService.showAlert('Erro ao rejeitar o ticket. Por favor, tente novamente.', 'error');
    }
  }

  /**
   * Carrega os últimos tickets criados pelo usuário atual
   */
  async carregarUltimosTickets() {
    const container = document.querySelector('.latestTickestList');
    console.log(container)
    if (!container) return;

    try {
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        throw new Error("Usuário não identificado");
      }

      // Carregar tickets criados pelo usuário
      const tickets = await apiService.getTicketsByRequester(userId);
      
      if (!Array.isArray(tickets)) {
        throw new Error("Formato de resposta inválido");
      }

      // Ordenar por data de criação (mais recentes primeiro) e limitar a 5
      const ultimosTickets = tickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (ultimosTickets.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-ticket-alt"></i>
            <p>Nenhum ticket criado ainda</p>
          </div>
        `;
        return;
      }

      container.innerHTML = ultimosTickets
        .map(ticket => this.criarTicketHTML(ticket))
        .join('');

      // Adicionar eventos de clique
      container.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
          const ticketId = item.dataset.ticketId;
          if (ticketId) this.showTicketDetails(ticketId);
        });
      });

    } catch (error) {
      console.error('Erro ao carregar últimos tickets:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Erro ao carregar tickets</p>
          <small>${error.message}</small>
        </div>
      `;
    }
  }

  /**
   * Cria o HTML para um item de ticket na lista de últimos tickets
   * @param {Object} ticket - Dados do ticket
   * @returns {string} - HTML do item de ticket
   */
  criarTicketHTML(ticket) {
    const tempoRestante = formatUtils.calcularTempoRestante(ticket.completionDate);
    const targetUserName = ticket.targetUser ? ticket.targetUser.firstName : 'Não atribuído';
    const departmentName = ticket.department ? ticket.department.name : 'Não definido';
    
    // Define a classe baseada no status
    let statusClass = 'status-pendente';
    if (ticket.status.toLowerCase() === 'em andamento') {
      statusClass = 'status-em_andamento';
    } else if (ticket.status.toLowerCase() === 'finalizado' || ticket.status.toLowerCase() === 'resolvido') {
      statusClass = 'status-finalizado';
    }
    
    // Define a classe para prazo
    let prazoClass = '';
    let prazoTexto = '';
    
    if (ticket.deadline) {
      const hoje = new Date();
      const prazo = new Date(ticket.deadline);
      const diffDias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
      
      if (diffDias < 0) {
        prazoClass = 'prazo-atrasado';
        prazoTexto = `Atrasado: ${Math.abs(diffDias)} dias`;
      } else if (diffDias <= 3) {
        prazoClass = 'prazo-proximo';
        prazoTexto = `Prazo: ${diffDias} dias`;
      } else {
        prazoClass = 'prazo-ok';
        prazoTexto = `Prazo: ${diffDias} dias`;
      }
    }
    
    return `
      <div class="ticket-item" data-ticket-id="${ticket.id}">
        <div class="ticket-content">
          <div class="ticket-title">${ticket.title}</div>
          <div class="ticket-info">
            <span>Setor: ${departmentName}</span>
            <span class="${prazoClass}">${prazoTexto}</span>
          </div>
        </div>
        <span class="status-flag ${statusClass}">${ticket.status}</span>
      </div>
    `;
  }

  /**
   * Cria um novo ticket
   * @param {Object} ticketData - Dados do ticket
   * @returns {Promise<boolean>} - Resultado da criação
   */
  async createTicket(ticketData) {
    try {
      const response = await apiService.createTicket(ticketData);
      if (response && response.id) {
        uiService.showAlert("Ticket criado com sucesso!", "success");
        return true;
      } else {
        uiService.showAlert("Erro ao criar ticket. Verifique os dados e tente novamente.", "error");
        return false;
      }
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      uiService.showAlert("Erro ao criar ticket: " + error.message, "error");
      return false;
    }
  }
}

// Exporta uma instância única do módulo
export const ticketModule = new TicketModule(); 