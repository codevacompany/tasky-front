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
        
        // Inicializar o formulário de novo ticket
        this.initNewTicketForm();
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
          <td colspan="10" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando tickets recebidos...</p>
          </td>
        </tr>
      `;

      // Carregar tickets da API
      const response = await apiService.getTicketsByTargetUser(userId);
      console.log('Tickets recebidos:', response);
        
      // Mostrar detalhadamente a estrutura do primeiro ticket
      if (response && response.length > 0) {
        console.log('Estrutura detalhada do primeiro ticket:');
        console.log(JSON.stringify(response[0], null, 2));
        console.log('Campos específicos:');
        console.log('createdAt:', response[0].createdAt);
        console.log('completedAt:', response[0].completedAt);
        console.log('completionDate:', response[0].completionDate);
        console.log('deadline:', response[0].deadline);
        console.log('dueDate:', response[0].dueDate);
        console.log('priority:', response[0].priority);
        console.log('status:', response[0].status);
        console.log('requester:', response[0].requester);
        console.log('department:', response[0].department);
      }
        
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
      const tbody = document.querySelector("#ticketsRecebidosTableBody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="document.dispatchEvent(new CustomEvent('retryLoadReceivedTickets'))">
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
   * Configura os botões de ação dos tickets
   */
  setupTicketActionButtons() {
    // Configurar clique na linha do ticket
    document.querySelectorAll('tr[data-id]').forEach(row => {
      const ticketId = row.getAttribute('data-id');
      
      // Adicionar evento de clique à linha inteira
      row.addEventListener('click', (event) => {
        // Verificar se o clique não foi em um botão de ação
        if (!event.target.closest('.action-btn')) {
          this.viewTicketDetails(ticketId);
        }
      });
      
      // Adicionar estilo de cursor para indicar que é clicável
      row.style.cursor = 'pointer';
    });
    
    // Configurar botões de cancelar
    document.querySelectorAll('.action-btn .fa-times').forEach(btn => {
      const row = btn.closest('tr');
      const ticketId = row.getAttribute('data-id');
      
      btn.parentElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Evitar propagação para o evento da linha
        this.confirmCancelTicket(ticketId);
      });
    });
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
      
      // Gerar o HTML com os detalhes do ticket
      const ticketHTML = this.getTicketDetailsHTML(ticket);
      
      // Mostrar o modal com os detalhes do ticket
      uiService.showTicketDetails(ticketHTML);
      
      // Carregar as atualizações do ticket
      await this.carregarAtualizacoes(ticketId);
      
      // Configurar os botões de ação para o ticket no modal, se necessário
      this.setupTicketModalActions(ticket);
      
      uiService.hideLoading();
    } catch (error) {
      console.error('Erro ao carregar detalhes do ticket:', error);
      uiService.hideLoading();
      uiService.showAlert('Erro ao carregar detalhes: ' + error.message, 'error');
    }
  }
  
  /**
   * Configura os botões de ação no modal de detalhes do ticket
   * @param {Object} ticket - Dados do ticket
   */
  setupTicketModalActions(ticket) {
    // Configurar botões de ação no modal, se houver
    const actionButtons = document.querySelectorAll('#ticketDetailsContent .ticket-action-btn');
    
    actionButtons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      
      btn.addEventListener('click', () => {
        switch(action) {
          case 'edit':
            this.openEditTicketForm(ticket.id);
            break;
          case 'cancel':
            this.confirmCancelTicket(ticket.id);
            break;
          case 'resolve':
            this.resolveTicket(ticket.id);
            break;
          default:
            console.log(`Ação não implementada: ${action}`);
        }
      });
    });
  }
  
  /**
   * Cria o HTML de detalhes do ticket para o modal
   * @param {Object} ticket - Dados do ticket
   * @returns {string} - HTML de detalhes
   */
  getTicketDetailsHTML(ticket) {
    // Função auxiliar para formatar datas
    const formatarData = (dataString) => {
      if (!dataString) return '-';
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    };
    
    // Obter classes para status e prioridade
    const getStatusClass = (status) => {
      switch(status?.toLowerCase()) {
        case 'pendente': return 'status-pendente';
        case 'em_andamento': 
        case 'em andamento': return 'status-em-andamento';
        case 'resolvido': return 'status-resolvido';
        case 'cancelado': return 'status-cancelado';
        default: return '';
      }
    };
    
    const getPriorityClass = (priority) => {
      switch(priority?.toLowerCase()) {
        case 'baixa': return 'priority-baixa';
        case 'média':
        case 'media': return 'priority-media';
        case 'alta': return 'priority-alta';
        default: return '';
      }
    };
    
    // Formatar texto do status
    const formatStatus = (status) => {
      if (!status) return '-';
      switch(status.toLowerCase()) {
        case 'em_andamento': return 'EM ANDAMENTO';
        case 'em andamento': return 'EM ANDAMENTO';
        default: return status.toUpperCase();
      }
    };
    
    // Verificar data limite para prazo
    let prazo = "-";
    const dataLimite = this.obterDataLimite(ticket);
    if (dataLimite) {
      prazo = formatUtils.formatarPrazo(dataLimite);
    }
    
    // Obter nome do solicitante
    let solicitante = "Desconhecido";
    if (ticket.requesterName) {
      solicitante = ticket.requesterName;
    } else if (ticket.requester && typeof ticket.requester === 'string') {
      solicitante = ticket.requester;
    } else if (ticket.requester && ticket.requester.name) {
      solicitante = ticket.requester.name;
    } else if (ticket.requester && ticket.requester.firstName) {
      solicitante = ticket.requester.firstName + (ticket.requester.lastName ? ' ' + ticket.requester.lastName : '');
    }

    // Obter assunto do ticket
    let assunto = "-";
    if (ticket.subject) {
      assunto = ticket.subject;
    } else if (ticket.title) {
      assunto = ticket.title;
    } else if (ticket.name) {
      assunto = ticket.name;
    }
    
    // Botões de ação
    let html = `
      <div class="ticket-details ticket-details-grid">
        <div class="details-row">
          <div class="details-item"><strong>ID:</strong> ${ticket.id || '-'}</div>
          <div class="details-item"><strong>Categoria:</strong> ${ticket.category || '-'}</div>
        </div>
        
        <div class="details-row full-width">
          <div class="details-item"><strong>Assunto:</strong> ${assunto}</div>
        </div>
        
        <div class="details-row">
          <div class="details-item"><strong>Prioridade:</strong> <span class="priority-label ${getPriorityClass(ticket.priority)}">${ticket.priority?.toUpperCase() || '-'}</span></div>
          <div class="details-item"><strong>Status:</strong> <span class="status-label ${getStatusClass(ticket.status)}">${formatStatus(ticket.status)}</span></div>
        </div>
        
        <div class="details-row">
          <div class="details-item"><strong>Solicitante:</strong> ${solicitante}</div>
          <div class="details-item"><strong>Setor:</strong> ${ticket.department?.name || ticket.setor || '-'}</div>
        </div>
        
        <div class="details-row">
          <div class="details-item"><strong>Data de Criação:</strong> ${formatarData(ticket.createdAt || ticket.created_at)}</div>
          <div class="details-item"><strong>Data de Aceitação:</strong> ${formatarData(ticket.acceptanceDate || ticket.acceptance_date)}</div>
        </div>
        
        <div class="details-row">
          <div class="details-item"><strong>Data de Conclusão:</strong> ${formatarData(ticket.completionDate || ticket.completion_date)}</div>
          <div class="details-item"><strong>Prazo:</strong> ${prazo}</div>
        </div>
        
        <div class="details-row full-width">
          <div class="details-item"><strong>Descrição:</strong> ${ticket.description || '-'}</div>
        </div>
        
        <div class="ticket-actions">`;

    if (ticket.status === 'Pendente') {
      html += `
        <button class="btn btn-success" onclick="ticketModule.aceitarTicket(${ticket.id})">
          <i class="fas fa-check"></i> Aceitar
        </button>`;
    } else if (ticket.status === 'Em andamento') {
      html += `
        <button class="btn btn-primary" onclick="ticketModule.enviarParaRevisao(${ticket.id})">
          <i class="fas fa-arrow-right"></i> Enviar para Revisão
        </button>`;
    } else if (ticket.status === 'Em verificação') {
      html += `
        <span class="action-icon" title="Aguardando verificação">
          <i class="fas fa-clock"></i>
        </span>`;
    }

    html += `
      </div>`;

    html += `
        </div>
      
      <div class="ticket-updates">
        <h3><i class="fas fa-comments"></i> Atualizações</h3>
        <div id="atualizacoesContainer" class="updates-container">
          <div id="atualizacoesList" class="updates-list">
            <!-- As atualizações serão carregadas aqui dinamicamente -->
      </div>
        </div>
        
        <div class="update-form">
          <label for="novoComentario">Adicionar comentário</label>
          <textarea 
            id="novoComentario" 
            placeholder="Digite seu comentário aqui..." 
            class="update-input"
          ></textarea>
          <button onclick="ticketModule.enviarComentario(${ticket.id})" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i> Enviar comentário
          </button>
        </div>
      </div>
      
      <div class="ticket-timeline">
        <h3><i class="fas fa-history"></i> Linha do Tempo</h3>
        <div class="timeline">`;

    // Criação do ticket
    html += `
          <div class="timeline-item created">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-plus-circle"></i>
                  Ticket criado por ${ticket.requesterName}
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>
          </div>`;

    // Aceitação do ticket
    if (ticket.acceptedAt) {
      html += `
          <div class="timeline-item accepted">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-check"></i>
                  Ticket aceito por ${ticket.assigneeName}
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.acceptedAt)}
                </span>
              </div>
            </div>
          </div>`;
    }

    // Envio para revisão
    if (ticket.reviewedAt) {
      html += `
          <div class="timeline-item review">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-arrow-right"></i>
                  Enviado para revisão por ${ticket.assigneeName}
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.reviewedAt)}
                </span>
              </div>
            </div>
          </div>`;
    }

    // Aguardando verificação
    if (ticket.status === 'Em verificação') {
      html += `
          <div class="timeline-item waiting">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-clock"></i>
                  Aguardando verificação do solicitante
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.reviewedAt)}
                </span>
              </div>
            </div>
          </div>`;
    }

    // Rejeição do ticket
    if (ticket.disapprovalReason) {
      html += `
          <div class="timeline-item rejected">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-times-circle"></i>
                  Ticket reprovado por ${ticket.requesterName}
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.disapprovedAt)}
                </span>
              </div>
              <div class="timeline-reason">
                <strong>Motivo:</strong> ${ticket.disapprovalReason}
              </div>
            </div>
          </div>`;
    }

    // Finalização do ticket
    if (ticket.status === 'Resolvido' || ticket.status === 'Finalizado') {
      html += `
          <div class="timeline-item finished">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">
                  <i class="fas fa-check-circle"></i>
                  Ticket finalizado por ${ticket.assigneeName}
                </span>
                <span class="timeline-date">
                  ${formatUtils.formatDate(ticket.completedAt)}
                </span>
              </div>
            </div>
          </div>`;
    }

    html += `
        </div>
      </div>
    </div>`;

    return html;
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
          <td colspan="10" class="loading-state">
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
            <td colspan="10" class="error-state">
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
          <td colspan="10" class="loading-state">
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
            <td colspan="10" class="error-state">
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
   * Obtém a data limite de um ticket, verificando múltiplas propriedades possíveis
   * @param {Object} ticket - Objeto do ticket
   * @returns {Date|null} - Data limite do ticket ou null se não encontrada
   */
  obterDataLimite(ticket) {
    if (!ticket) return null;
    
    // Verificar se o ticket já está finalizado ou resolvido
    const statusFinalizado = ticket.status && 
      (ticket.status.toLowerCase().includes('finalizado') || 
       ticket.status.toLowerCase().includes('resolvido'));
    
    // Se o ticket estiver finalizado, a data de conclusão é mais relevante
    if (statusFinalizado && ticket.completedAt) {
      try {
        const data = new Date(ticket.completedAt);
        if (!isNaN(data.getTime())) {
          console.log(`[DEBUG] Ticket finalizado, usando completedAt:`, data);
          return data;
        }
      } catch (error) {
        console.error(`[DEBUG] Erro ao converter data de conclusão:`, error);
      }
    }
    
    // Lista de possíveis propriedades que podem conter a data limite
    const camposPossiveis = ['deadline', 'dueDate', 'prazo', 'endDate', 'due_date', 'expectedDate', 'completionDate', 'dueDateTime'];
    
    // Verificar cada propriedade e retornar a primeira data válida encontrada
    for (const campo of camposPossiveis) {
      if (ticket[campo]) {
        try {
          const data = new Date(ticket[campo]);
          if (!isNaN(data.getTime())) {
            console.log(`[DEBUG] Data limite encontrada no campo ${campo}:`, data);
            return data;
          }
        } catch (error) {
          console.error(`[DEBUG] Erro ao converter data do campo ${campo}:`, error);
        }
      }
    }
    
    return null;
  }

  /**
   * Retorna HTML para uma linha de ticket na tabela
   * @param {Object} ticket - Objeto do ticket
   * @param {string} secao - Seção onde o ticket será exibido ('recebidos', 'criados', 'departamento')
   * @returns {string} HTML para linha de ticket
   */
  getTicketRowHTML(ticket, secao = 'recebidos') {
    console.log(`Processando ticket para tabela ${secao}:`, ticket);
    
    // Verificar campos relacionados a datas e status
    console.log(`Ticket #${ticket.id} campos detalhados:`, {
      createdAt: ticket.createdAt,
      completedAt: ticket.completedAt,
      completionDate: ticket.completionDate,
      deadline: ticket.deadline,
      dueDate: ticket.dueDate,
      status: ticket.status,
      priority: ticket.priority
    });
    
    const setorNome = this.getSetorNome(ticket.departmentId);
    
    // Tentativas diferentes para obter o nome do solicitante
    let solicitante = "Desconhecido";
    if (ticket.requesterName) {
      solicitante = ticket.requesterName;
    } else if (ticket.requester && typeof ticket.requester === 'string') {
      solicitante = ticket.requester;
    } else if (ticket.requester && ticket.requester.name) {
      solicitante = ticket.requester.name;
    } else if (ticket.requester && ticket.requester.firstName) {
      solicitante = ticket.requester.firstName + (ticket.requester.lastName ? ' ' + ticket.requester.lastName : '');
    }
    
    const assignee = ticket.assigneeName || "Não atribuído";
    
    // Classe de prioridade para estilização
    let prioridadeClass = "";
    switch(ticket.priority?.toLowerCase()) {
      case "alta":
        prioridadeClass = "priority-flag alta";
        break;
      case "média":
      case "media":
        prioridadeClass = "priority-flag media";
        break;
      case "baixa":
        prioridadeClass = "priority-flag baixa";
        break;
    }
    
    // Classe de status para estilização
    let statusClass = "";
    switch(ticket.status?.toLowerCase()) {
      case "pendente":
        statusClass = "status-flag pendente";
        break;
      case "em andamento":
        statusClass = "status-flag em_andamento";
        break;
      case "em verificação":
        statusClass = "status-flag em_verificacao";
        break;
      case "finalizado":
      case "concluído":
      case "concluido":
        statusClass = "status-flag finalizado";
        break;
      case "cancelado":
        statusClass = "status-flag cancelado";
        break;
    }
    
    // Formatar datas - tentativa múltipla de campos para adaptação a diferentes estruturas de dados
    const dataCriacao = ticket.createdAt ? formatUtils.formatDate(ticket.createdAt) : "N/A";
    
    // Tentar diferentes campos para data de conclusão
    let dataConclusao = "N/A";
    if (ticket.completionDate) {
      dataConclusao = formatUtils.formatDate(ticket.completionDate);
    } else if (ticket.completedAt) {
      dataConclusao = formatUtils.formatDate(ticket.completedAt);
    } else if (ticket.completedDate) {
      dataConclusao = formatUtils.formatDate(ticket.completedDate);
    }
    
    // Verificar data limite para prazo
    let prazo = "N/A";
    const dataLimite = this.obterDataLimite(ticket);
    if (dataLimite) {
      prazo = formatUtils.formatarPrazo(dataLimite);
      console.log(`Ticket #${ticket.id}: Data limite encontrada:`, dataLimite);
    } else {
      console.log(`Ticket #${ticket.id}: Nenhuma data limite encontrada`);
    }
    
    // Coluna de ações
    let actionsHtml = `<td class="actions">`;

    if (secao === 'recebidos') {
      if (ticket.status === 'Pendente') {
        actionsHtml += `
          <button class="action-btn" onclick="event.stopPropagation(); ticketModule.aceitarTicket(${ticket.id});" title="Aceitar ticket">
            <i class="fas fa-check" style="color: white;"></i>
          </button>`;
      } else if (ticket.status === 'Em andamento') {
        actionsHtml += `
          <button class="action-btn" onclick="event.stopPropagation(); ticketModule.enviarParaRevisao(${ticket.id});" title="Enviar para REVISÃO">
            <i class="fas fa-arrow-right" style="color: white;"></i>
          </button>`;
      } else if (ticket.status === 'Em verificação') {
        actionsHtml += `
          <span class="action-icon" title="Aguardando verificação">
            <i class="fas fa-clock" style="color: #9C27B0;"></i>
          </span>`;
      }
    }

    if (ticket.requesterId === userModule.getCurrentUserId() && ticket.status === 'Em verificação') {
      actionsHtml += `
        <button class="action-btn" onclick="event.stopPropagation(); ticketModule.abrirVerificacao(${ticket.id});" title="VERIFICAR">
          <i class="fas fa-check-double" style="color: #9C27B0;"></i>
        </button>`;
    }

    actionsHtml += `</td>`;
    
    // Construir HTML com base na seção
    let html = `
      <tr data-id="${ticket.id}">
        <td>${ticket.id}</td>
        <td>${ticket.title || ticket.name}</td>
    `;
    
    // Adicionar colunas específicas baseadas na seção
    if (secao === 'departamento') {
      // Para tickets do departamento: Solicitante, Departamento, Prioridade, Status
      html += `
        <td>${solicitante}</td>
        <td>${setorNome}</td>
        <td><span class="${prioridadeClass}">${ticket.priority || "Desconhecido"}</span></td>
        <td><span class="${statusClass}">${ticket.status || "Desconhecido"}</span></td>
      `;
    } else if (secao === 'criados') {
      // Para tickets criados: Solicitante (não aplicável), Departamento, Prioridade, Status
      html += `
        <td>${solicitante}</td>
        <td>${setorNome}</td>
        <td><span class="${prioridadeClass}">${ticket.priority || "Desconhecido"}</span></td>
        <td><span class="${statusClass}">${ticket.status || "Desconhecido"}</span></td>
      `;
    } else {
      // Para tickets recebidos: Solicitante, Departamento, Prioridade, Status
      html += `
        <td>${solicitante}</td>
        <td>${setorNome}</td>
        <td><span class="${prioridadeClass}">${ticket.priority || "Desconhecido"}</span></td>
        <td><span class="${statusClass}">${ticket.status || "Desconhecido"}</span></td>
      `;
    }
    
    // Adicionar colunas de datas
    html += `
        <td>${dataCriacao}</td>
        <td>${dataConclusao}</td>
        <td>${prazo}</td>
    `;
    
    // Adicionar coluna de ações
    html += actionsHtml;
    
    // Fechar a tag da coluna de ações e a linha
    html += `
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
        <td colspan="10" class="empty-state">
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
   * Carrega as atualizações de um ticket
   * @param {number} ticketId - ID do ticket
   */
  async carregarAtualizacoes(ticketId) {
    try {
      const atualizacoes = await apiService.getTicketUpdates(ticketId);
      const container = document.getElementById('atualizacoesList');
      
      if (!container) {
        console.error('Container de atualizações não encontrado');
        return;
      }

      if (!atualizacoes || atualizacoes.length === 0) {
        container.innerHTML = `
          <div class="empty-updates">
            <i class="fas fa-comments"></i>
            <p>Nenhuma atualização ainda</p>
            <small>Seja o primeiro a comentar!</small>
          </div>
        `;
        return;
      }

      // Ordenar atualizações por data (mais recentes por último)
      const sortedUpdates = atualizacoes.sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );

      container.innerHTML = sortedUpdates.map(update => `
        <div class="update-item">
          <div class="update-header">
            <span class="update-author">
              <i class="fas fa-user-circle"></i>
              ${update.user?.name || 'Usuário'}
            </span>
            <span class="update-date">
              <i class="far fa-clock"></i>
              ${formatUtils.formatDate(update.dateTime)}
            </span>
          </div>
          <div class="update-content">${update.comment}</div>
        </div>
      `).join('');

      // Rolar para a última atualização
      container.scrollTop = container.scrollHeight;
    } catch (error) {
      console.error('Erro ao carregar atualizações:', error);
      const container = document.getElementById('atualizacoesList');
      if (container) {
        container.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Erro ao carregar atualizações</p>
            <small>Por favor, tente novamente mais tarde</small>
          </div>
        `;
      }
    }
  }

  /**
   * Envia um novo comentário para um ticket
   * @param {number} ticketId - ID do ticket
   */
  async enviarComentario(ticketId) {
    try {
      const comentario = document.getElementById('novoComentario').value.trim();
      
      if (!comentario) {
        uiService.showAlert('Por favor, digite um comentário.', 'warning');
        return;
      }

      const userId = userModule.getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não identificado');
      }

      const updateData = {
        ticketId: ticketId,
        userId: userId,
        comment: comentario,
        dateTime: new Date().toISOString()
      };

      await apiService.createTicketUpdate(updateData);
      
      // Limpar o campo de comentário
      document.getElementById('novoComentario').value = '';
      
      // Recarregar as atualizações
      await this.carregarAtualizacoes(ticketId);
      
      uiService.showAlert('Comentário enviado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      uiService.showAlert('Erro ao enviar comentário. Por favor, tente novamente.', 'error');
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

      document.body.appendChild(confirmModal);

      // Adicionar evento de fechar ao clicar fora do modal
      confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
          confirmModal.remove();
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
    
    // Define o prazo usando a função obterDataLimite e formatUtils
    let prazoHTML = '';
    const dataLimite = this.obterDataLimite(ticket);
    if (dataLimite) {
      prazoHTML = formatUtils.formatarPrazo(dataLimite);
    }
    
    return `
      <div class="ticket-item" data-ticket-id="${ticket.id}">
        <div class="ticket-content">
          <div class="ticket-title">${ticket.title}</div>
          <div class="ticket-info">
            <span>Setor: ${departmentName}</span>
            ${prazoHTML ? `<span>${prazoHTML}</span>` : ''}
          </div>
        </div>
        <span class="status-flag ${statusClass}">${ticket.status}</span>
      </div>
    `;
  }

  /**
   * Método para criar um novo ticket
   * @param {Event} event - Evento de submit do formulário
   */
  handleCreateTicket = async (event) => {
    event.preventDefault();
    
    try {
      uiService.showLoading();
      
      // Obter elementos do formulário
      const titleInput = document.getElementById('ticketTitle');
      const departmentSelect = document.getElementById('ticketDepartment');
      const categorySelect = document.getElementById('ticketCategory');
      const userSelect = document.getElementById('ticketUser');
      const deadlineInput = document.getElementById('ticketDeadline');
      const descriptionInput = document.getElementById('ticketDescription');
      
      // Log de debug para verificar o valor da data
      console.log(`[DEBUG] Valor do campo data de conclusão:`, deadlineInput.value);
      
      // Garantir que a data tenha o formato correto
      let deadlineValue = null;
      if (deadlineInput.value) {
        // Adicionar 'Z' ao final para indicar UTC e garantir formato ISO 8601 completo
        deadlineValue = new Date(deadlineInput.value).toISOString();
        console.log(`[DEBUG] Data formatada:`, deadlineValue);
      }
      
      // Obter o valor da prioridade dos checkboxes
      const priorityCheckbox = document.querySelector('input[name="ticketPriority"]:checked');
      
      // Validar campos obrigatórios
      if (!titleInput.value || !departmentSelect.value || !categorySelect.value || !descriptionInput.value) {
        uiService.showAlert('Preencha todos os campos obrigatórios', 'error');
        uiService.hideLoading();
        return;
      }
      
      // Validar que uma prioridade foi selecionada
      if (!priorityCheckbox) {
        uiService.showAlert('Selecione uma prioridade para o ticket', 'error');
        uiService.hideLoading();
        return;
      }
      
      // Verificar se o título tem pelo menos 2 caracteres
      if (titleInput.value.trim().length < 2) {
        uiService.showAlert('O título deve ter pelo menos 2 caracteres', 'error');
        uiService.hideLoading();
        return;
      }
      
      const priority = priorityCheckbox.value;
      const currentUserId = userModule.getCurrentUserId();
      
      // Validar que o ID do usuário está disponível
      if (!currentUserId) {
        uiService.showAlert('Não foi possível identificar o usuário atual. Tente fazer login novamente.', 'error');
        uiService.hideLoading();
        return;
      }
      
      // Criar objeto do ticket
      const ticketData = {
        title: titleInput.value.trim(),
        departmentId: parseInt(departmentSelect.value),
        categoryId: parseInt(categorySelect.value),
        targetUserId: userSelect.value ? parseInt(userSelect.value) : null,
        priority: priority,
        deadline: deadlineValue,
        completionDate: deadlineValue,
        description: descriptionInput.value.trim(),
        status: 'Pendente',
        requesterId: parseInt(currentUserId)
      };
      
      console.log('Enviando ticket para API:', ticketData);
      
      // Enviar para a API
      const response = await apiService.createTicket(ticketData);
      
      console.log('Resposta da API:', response);
      
      // Fechar o modal
      uiService.closeModal('newTicketModal');
      
      // Limpar formulário
      document.getElementById('newTicketForm').reset();
      
      // Mostrar mensagem de sucesso
      uiService.showAlert('Ticket criado com sucesso!', 'success');
      
      // Recarregar os tickets
      this.carregarTicketsIniciais();
      
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      uiService.showAlert(
        `Erro ao criar ticket: ${error.message || 'Verifique sua conexão'}`,
        'error'
      );
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Inicializa o formulário de novo ticket com dados dos selects
   */
  async initNewTicketForm() {
    console.log('Inicializando formulário de novo ticket');
    
    // Obter referências aos selects
    const departmentSelect = document.getElementById('ticketDepartment');
    const categorySelect = document.getElementById('ticketCategory');
    const deadlineInput = document.getElementById('ticketDeadline');
    
    // Definir um valor padrão para o campo de data e hora
    if (deadlineInput) {
      // Criar data atual, adicionar 3 dias e formatar para o input datetime-local
      const dataAtual = new Date();
      dataAtual.setDate(dataAtual.getDate() + 3); // Adiciona 3 dias à data atual
      
      // Formatar a data e hora para o formato esperado pelo datetime-local (YYYY-MM-DDThh:mm)
      const ano = dataAtual.getFullYear();
      const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
      const dia = String(dataAtual.getDate()).padStart(2, '0');
      const hora = String(dataAtual.getHours()).padStart(2, '0');
      const minuto = String(dataAtual.getMinutes()).padStart(2, '0');
      
      const dataFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}`;
      deadlineInput.value = dataFormatada;
      
      console.log('Data padrão definida:', dataFormatada);
    }
    
    try {
      // Carregar setores para o select de departamentos
      if (departmentSelect) {
        console.log('Carregando setores para o select...');
        // Usar os setores já carregados no TicketModule
        const sectors = this.setores;
        departmentSelect.innerHTML = ''; // Limpar opções existentes
        
        // Adicionar opção padrão
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione um setor';
        departmentSelect.appendChild(defaultOption);
        
        // Adicionar setores
        if (sectors && sectors.length > 0) {
          console.log(`Adicionando ${sectors.length} setores ao select`);
          sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            departmentSelect.appendChild(option);
          });
      } else {
          console.warn('Nenhum setor disponível para carregar no select');
        }
      }
      
      // Carregar categorias para o select de categorias
      if (categorySelect) {
        console.log('Carregando categorias para o select...');
        const categories = await apiService.getCategories();
        categorySelect.innerHTML = ''; // Limpar opções existentes
        
        // Adicionar opção padrão
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione uma categoria';
        categorySelect.appendChild(defaultOption);
        
        // Adicionar categorias
        if (categories && categories.length > 0) {
          console.log(`Adicionando ${categories.length} categorias ao select`);
          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
          });
        } else {
          console.warn('Nenhuma categoria disponível para carregar no select');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar formulário de novo ticket:', error);
      uiService.showAlert('Erro ao carregar dados do formulário', 'error');
    }
  }

  /**
   * Resolve um ticket
   * @param {string|number} ticketId - ID do ticket a ser resolvido
   */
  async resolveTicket(ticketId) {
    try {
      console.log('Resolvendo ticket:', ticketId);
      uiService.showLoading('Resolvendo ticket...');
      
      // Chamar API para resolver o ticket
      await apiService.request(`/tickets/${ticketId}/resolve`, {
        method: 'PUT'
      });
      
      uiService.hideLoading();
      uiService.showAlert('Ticket resolvido com sucesso', 'success');
      
      // Fechar o modal de detalhes do ticket
      uiService.closeModal('ticketDetailsModal');
      
      // Recarregar a lista de tickets para atualizar a interface
      const activeTab = document.querySelector('.tab-btn[data-tab].active');
      if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        this.carregarTicketsPorTab(tabId);
      }
      
    } catch (error) {
      console.error('Erro ao resolver ticket:', error);
      uiService.hideLoading();
      uiService.showAlert('Erro ao resolver ticket: ' + error.message, 'error');
    }
  }

  /**
   * Envia um ticket para revisão
   * @param {number} ticketId - ID do ticket
   */
  async enviarParaRevisao(ticketId) {
    try {
      // Criar modal de confirmação
      const confirmModal = document.createElement('div');
      confirmModal.className = 'modal';
      confirmModal.style.display = 'block';
      confirmModal.innerHTML = `
        <div class="modal-content confirmation-modal">
          <div class="modal-header">
            <h2>Enviar para Verificação</h2>
          </div>
          <div class="modal-body">
            <p class="confirmation-message">Tem certeza que deseja enviar este ticket para verificação?</p>
            <p class="confirmation-description">O solicitante será notificado para verificar e aprovar o atendimento.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closest('.modal').remove()">
              <i class="fas fa-times"></i> CANCELAR
            </button>
            <button class="btn-primary" id="confirmSendToReview">
              <i class="fas fa-check"></i> CONFIRMAR
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(confirmModal);

      // Adicionar evento de fechar ao clicar fora do modal
      confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
          confirmModal.remove();
        }
      });

      // Adicionar evento de confirmação
      return new Promise((resolve) => {
        confirmModal.querySelector('#confirmSendToReview').addEventListener('click', async () => {
          try {
            const response = await apiService.sendTicketToReview(ticketId);

            if (response) {
              uiService.showAlert('Ticket enviado para verificação com sucesso!', 'success');
              await this.carregarTicketsRecebidos();
              resolve(true);
            } else {
              uiService.showAlert('Erro ao enviar o ticket para verificação. Por favor, tente novamente.', 'error');
              resolve(false);
            }
          } catch (error) {
            console.error('Erro ao enviar ticket para verificação:', error);
            uiService.showAlert('Erro ao enviar o ticket para verificação. Por favor, tente novamente.', 'error');
            resolve(false);
          } finally {
            confirmModal.remove();
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
   * Abre o modal de verificação do ticket
   * @param {number} ticketId - ID do ticket
   */
  async abrirVerificacao(ticketId) {
    try {
      const ticket = await apiService.getTicketById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Criar modal de verificação
      const verificationModal = document.createElement('div');
      verificationModal.className = 'modal';
      verificationModal.style.display = 'block';
      verificationModal.innerHTML = `
        <div class="modal-content verification-modal">
          <div class="modal-header">
            <h2>Verificar Atendimento</h2>
            <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="ticket-details">
              <h3>${ticket.title}</h3>
              <p class="ticket-description">${ticket.description}</p>
            </div>
            <div class="verification-actions">
              <button class="btn-success" onclick="ticketModule.aprovarTicket(${ticketId}); this.closest('.modal').remove();">
                <i class="fas fa-check"></i> APROVAR
              </button>
              <button class="btn-danger" onclick="ticketModule.rejeitarTicket(${ticketId}); this.closest('.modal').remove();">
                <i class="fas fa-times"></i> REJEITAR
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(verificationModal);

      // Adicionar evento de fechar ao clicar fora do modal
      verificationModal.addEventListener('click', (e) => {
        if (e.target === verificationModal) {
          verificationModal.remove();
        }
      });

    } catch (error) {
      console.error('Erro ao abrir verificação do ticket:', error);
      uiService.showAlert('Erro ao carregar detalhes do ticket. Por favor, tente novamente.', 'error');
    }
  }

  /**
   * Aprova um ticket após verificação
   * @param {number} ticketId - ID do ticket
   */
  async aprovarTicket(ticketId) {
    try {
      const response = await apiService.approveTicket(ticketId);
      
      if (response) {
        uiService.showAlert('Ticket aprovado com sucesso! O atendimento foi finalizado.', 'success');
        await this.carregarTicketsCriados();
      } else {
        uiService.showAlert('Erro ao aprovar o ticket. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao aprovar ticket:', error);
      uiService.showAlert('Erro ao aprovar o ticket. Por favor, tente novamente.', 'error');
    }
  }

  /**
   * Rejeita um ticket após verificação
   * @param {number} ticketId - ID do ticket
   */
  async rejeitarTicket(ticketId) {
    try {
      // Criar modal para motivo da rejeição
      const rejectModal = document.createElement('div');
      rejectModal.className = 'modal';
      rejectModal.style.display = 'block';
      rejectModal.innerHTML = `
        <div class="modal-content rejection-modal">
          <div class="modal-header">
            <h2>Motivo da Rejeição</h2>
          </div>
          <div class="modal-body">
            <textarea id="rejectionReason" placeholder="Descreva o motivo da rejeição..." rows="4"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closest('.modal').remove()">
              CANCELAR
            </button>
            <button class="btn-primary" id="confirmReject">
              CONFIRMAR REJEIÇÃO
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(rejectModal);

      // Adicionar evento de confirmação
      rejectModal.querySelector('#confirmReject').addEventListener('click', async () => {
        const reason = document.getElementById('rejectionReason').value.trim();
        
        if (!reason) {
          uiService.showAlert('Por favor, informe o motivo da rejeição.', 'warning');
          return;
        }

        try {
          const response = await apiService.rejectTicket(ticketId, reason);
          
          if (response) {
            uiService.showAlert('Ticket rejeitado. O atendimento voltará para "Em andamento".', 'success');
            await this.carregarTicketsCriados();
            rejectModal.remove();
          } else {
            uiService.showAlert('Erro ao rejeitar o ticket. Por favor, tente novamente.', 'error');
          }
        } catch (error) {
          console.error('Erro ao rejeitar ticket:', error);
          uiService.showAlert('Erro ao rejeitar o ticket. Por favor, tente novamente.', 'error');
        }
      });

      // Adicionar evento de fechar ao clicar fora do modal
      rejectModal.addEventListener('click', (e) => {
        if (e.target === rejectModal) {
          rejectModal.remove();
        }
      });

    } catch (error) {
      console.error('Erro ao rejeitar ticket:', error);
      uiService.showAlert('Erro ao processar a rejeição. Por favor, tente novamente.', 'error');
    }
  }
}

// Exporta uma instância única do módulo
export const ticketModule = new TicketModule(); 