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
    const searchBtn = document.querySelector('.search-group .btn-icon');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn[data-tab].active');
        if (activeTab) {
          const tabId = activeTab.getAttribute('data-tab');
          this.carregarTicketsPorTab(tabId);
        }
      });
    }
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
      const tbody = document.querySelector("#ticketsRecebidosTable tbody");
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
        this.atualizarContadores(0, 0, 0, 0, 'ticketsRecebidos');
        
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
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket)).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'ticketsRecebidos');
      
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
   * Configura listeners para botões de ação dos tickets
   */
  setupTicketActionButtons() {
    // Usando delegação de eventos para manipular botões de ação
    const tables = document.querySelectorAll('.tickets-table');
    tables.forEach(table => {
      if (!table.getAttribute('data-listeners-configured')) {
        table.setAttribute('data-listeners-configured', 'true');
        table.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('.action-btn');
          if (actionBtn) {
            e.stopPropagation();
            
            // Recuperar o ID do ticket do elemento pai mais próximo com data-ticket-id
            const row = actionBtn.closest('tr[data-ticket-id]');
            if (row) {
              const ticketId = row.getAttribute('data-ticket-id');
              
              // Determinar qual ação executar com base na classe do botão
              if (actionBtn.classList.contains('aceitar')) {
                this.aceitarTicket(ticketId);
              } else if (actionBtn.classList.contains('revisar')) {
                this.rejectTicket(ticketId);
              } else {
                // Botão de visualização
                this.showTicketDetails(ticketId);
              }
            }
          }
        });
      }
    });
  }

  /**
   * Atualiza contadores nas interfaces
   */
  atualizarContadores(total, pendentes, emAndamento, resolvidos, section) {
    // Selecionar os contadores da seção específica
    const summaryItems = document.querySelector(`#${section}Section .tickets-summary`);
    if (!summaryItems) {
        console.error(`Elemento .tickets-summary não encontrado na seção ${section}`);
        return;
    }

    const statNumbers = summaryItems.querySelectorAll('.summary-item .stat-number');
    
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = total;
        statNumbers[1].textContent = pendentes;
        statNumbers[2].textContent = emAndamento;
        statNumbers[3].textContent = resolvidos;
    }

    console.log(`Atualizando contadores da seção ${section}:`, {
        total,
        pendentes,
        emAndamento,
        resolvidos,
        elementosEncontrados: statNumbers.length
    });
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

      // Selecionar tbody e mostrar estado de carregamento
      const tbody = document.querySelector("#ticketsCriadosTable tbody");
      if (!tbody) {
        console.error("Elemento tbody para tickets criados não encontrado");
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
      console.log('Tickets criados:', response);
      
      // Verificar se não há tickets
      if (!response || response.length === 0) {
        tbody.innerHTML = this.getEmptyStateHTML();
        this.atualizarContadores(0, 0, 0, 0, 'ticketsCriados');
        
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
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket)).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'ticketsCriados');
    } catch (error) {
      console.error('Erro ao carregar tickets criados:', error);
      
      // Mostrar mensagem de erro na tabela
      const tbody = document.querySelector("#ticketsCriadosTable tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="ticketModule.carregarTicketsCriados()">
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
   * Carrega tickets do setor do usuário atual
   */
  async carregarTicketsSetor() {
    try {
      const departmentId = userModule.getCurrentUserDepartmentId();
      if (!departmentId) {
        throw new Error("ID do setor não encontrado");
      }

      // Selecionar tbody e mostrar estado de carregamento
      const tbody = document.querySelector("#ticketsSetor tbody");
      if (!tbody) {
        console.error("Elemento tbody para tickets do setor não encontrado");
        return;
      }
      
      // Mostrar indicador de carregamento
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando tickets do setor...</p>
          </td>
        </tr>
      `;

      // Carregar tickets da API
      const response = await apiService.getTicketsByDepartment(departmentId);
      console.log('Tickets do setor:', response);
      
      // Verificar se não há tickets
      if (!response || response.length === 0) {
        tbody.innerHTML = this.getEmptyStateHTML();
        this.atualizarContadores(0, 0, 0, 0, 'ticketsSetor');
        
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
      tbody.innerHTML = sortedTickets.map(ticket => this.getTicketRowHTML(ticket)).join('');
      
      // Calcular estatísticas
      const total = response.length;
      const pendentes = response.filter(t => t.status.toLowerCase().includes("pendente")).length;
      const emAndamento = response.filter(t => t.status.toLowerCase().includes("andamento")).length;
      const resolvidos = response.filter(t => t.status.toLowerCase().includes("finalizado")).length;

      // Atualizar contadores
      this.atualizarContadores(total, pendentes, emAndamento, resolvidos, 'ticketsSetor');
    } catch (error) {
      console.error('Erro ao carregar tickets do setor:', error);
      
      // Mostrar mensagem de erro na tabela
      const tbody = document.querySelector("#ticketsSetor tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets: ${error.message || 'Erro desconhecido'}</p>
              <button class="btn btn-small retry-btn" onclick="ticketModule.carregarTicketsSetor()">
                <i class="fas fa-sync-alt"></i> Tentar novamente
              </button>
            </td>
          </tr>
        `;
      }
      
      uiService.showAlert('Erro ao carregar tickets do setor: ' + error.message, 'error');
    }
  }

  /**
   * Cria o HTML de uma linha de ticket para tabelas
   * @param {Object} ticket - Dados do ticket
   * @returns {string} - HTML da linha
   */
  getTicketRowHTML(ticket) {
    // Formatação de datas
    const dataCriacao = formatUtils.formatarData(ticket.createdAt);
    const dataConclusao = ticket.completionDate ? formatUtils.formatarData(ticket.completionDate) : '-';
    
    // Nome do solicitante ou setor
    const solicitanteNome = ticket.requester ? 
      `${ticket.requester.firstName} ${ticket.requester.lastName || ''}` : 
      (ticket.requesterName || 'Não identificado');
    
    // Obter prazo formatado
    const prazoHTML = formatUtils.formatarPrazo(ticket.deadline);
    
    // Botões de ação conforme status
    let acoesHTML = `<button class="action-btn" title="Ver detalhes"><i class="fas fa-eye"></i></button>`;
    
    if (ticket.status === 'Pendente') {
      acoesHTML += `<button class="action-btn aceitar" title="Aceitar ticket"><i class="fas fa-check"></i></button>`;
      acoesHTML += `<button class="action-btn revisar" title="Rejeitar ticket"><i class="fas fa-times"></i></button>`;
    }
    
    // Determinar classe de prioridade e status para estilização
    const prioridadeClass = (ticket.priority || 'media').toLowerCase();
    const statusClass = (ticket.status || 'pendente').toLowerCase().replace(' ', '_');
    
    return `
      <tr data-ticket-id="${ticket.id}">
        <td class="col-id">${ticket.id}</td>
        <td class="col-titulo" title="${ticket.title}">${ticket.title}</td>
        <td class="col-prioridade">
          <span class="priority-flag ${prioridadeClass}">${ticket.priority || 'Média'}</span>
        </td>
        <td class="col-status">
          <span class="status-flag ${statusClass}">${ticket.status || 'Pendente'}</span>
        </td>
        <td class="col-solicitante">${solicitanteNome}</td>
        <td class="col-criacao">
          <div class="data-hora">
            <span class="data">${dataCriacao.split(' ')[0]}</span>
            <span class="hora">${dataCriacao.split(' ')[1]}</span>
          </div>
        </td>
        <td class="col-conclusao">
          <div class="data-hora">
            ${dataConclusao !== '-' ? 
            `<span class="data">${dataConclusao.split(' ')[0]}</span>
             <span class="hora">${dataConclusao.split(' ')[1]}</span>` : 
            '-'}
          </div>
        </td>
        <td class="col-prazo">${prazoHTML}</td>
        <td class="col-acoes">${acoesHTML}</td>
      </tr>
    `;
  }

  /**
   * Retorna HTML para estado vazio (nenhum ticket)
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
    const container = document.querySelector('.ultimos-tickets-list');
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