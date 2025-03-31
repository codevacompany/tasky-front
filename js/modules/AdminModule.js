/**
 * Módulo para gerenciamento de funcionalidades de administrador
 */
import { apiService } from '../services/ApiService.js';
import { uiService } from '../services/UiService.js';
import { userModule } from './UserModule.js';
import { formatUtils } from '../utils/FormatUtils.js';

class AdminModule {
  constructor() {
    this.setores = [];
    this.currentColaboradorId = null;
  }

  /**
   * Inicializa o módulo de administrador
   */
  init() {
    this.loadInitialData();
    this.setupEventListeners();
  }

  /**
   * Carrega dados iniciais necessários para o módulo
   */
  loadInitialData() {
    this.loadSetores();
    this.loadCategorias();
    this.loadColaboradores();
  }

  /**
   * Configura os listeners de eventos
   */
  setupEventListeners() {
    // Botões para abrir modais de cadastro
    const newSetorBtn = document.getElementById('newSetorBtn');
    if (newSetorBtn) {
      newSetorBtn.addEventListener('click', this.openSetorModal.bind(this));
    }
    
    const newCategoriaBtn = document.getElementById('newCategoriaBtn');
    if (newCategoriaBtn) {
      newCategoriaBtn.addEventListener('click', this.openCategoriaModal.bind(this));
    }
    
    const newColaboradorBtn = document.getElementById('newColaboradorBtn');
    if (newColaboradorBtn) {
      newColaboradorBtn.addEventListener('click', this.openColaboradorModal.bind(this));
    }
    
    // Formulário de cadastro de setores
    const setorForm = document.getElementById('setorForm');
    if (setorForm) {
      setorForm.addEventListener('submit', this.handleSetorSubmit.bind(this));
    }
    
    // Formulário de cadastro de categoria
    const categoriaForm = document.getElementById('categoriaForm');
    if (categoriaForm) {
      categoriaForm.addEventListener('submit', this.handleCategoriaSubmit.bind(this));
    }
    
    // Formulário de cadastro de colaborador
    const colaboradorForm = document.getElementById('cadastroColaboradorForm');
    if (colaboradorForm) {
      colaboradorForm.addEventListener('submit', this.handleColaboradorSubmit.bind(this));
    }
    
    // Atualização de senha de colaborador
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', this.handlePasswordChange.bind(this));
    }
    
    // Botão de alteração de senha
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        const modal = document.getElementById('changePasswordModal');
        if (modal) modal.style.display = 'block';
      });
    }
    
    // Botão de ativar/desativar colaborador
    const toggleAtivoBtn = document.getElementById('toggleAtivoBtn');
    if (toggleAtivoBtn) {
      toggleAtivoBtn.addEventListener('click', this.toggleAtivoColaborador.bind(this));
    }
    
    // Configurar itens de menu administrativo
    this.setupAdminMenuItems();
    
    // Configurar fechamento de modais
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      const modalId = btn.getAttribute('data-close-modal');
      btn.addEventListener('click', () => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
      });
    });
    
    // Fechar modais específicos
    document.querySelectorAll('.close-colaborador').forEach(btn => {
      btn.addEventListener('click', this.closeColaboradorDetailsModal.bind(this));
    });
    
    document.querySelectorAll('.close-password').forEach(btn => {
      btn.addEventListener('click', this.closePasswordModal.bind(this));
    });
  }
  
  /**
   * Configura os manipuladores de eventos das abas em todas as seções
   */
  setupTabHandlers() {
    // Coletar todas as seções com abas
    const tabSections = [
      {section: 'colaboradores', tabs: ['listaColaboradores', 'novoColaborador']},
      {section: 'setores', tabs: ['listaSetores', 'novoSetor']},
      {section: 'categorias', tabs: ['listaCategorias', 'novaCategoria']}
    ];

    // Configurar cada seção
    tabSections.forEach(section => {
      const tabBtns = document.querySelectorAll(`#${section.section}Section .tab-buttons .tab-btn`);
      tabBtns.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remover classe ativa de todas as abas da seção
          tabBtns.forEach(t => t.classList.remove('active'));
          // Adicionar classe ativa na aba clicada
          tab.classList.add('active');
          
          // Mostrar o painel correspondente
          const tabId = tab.getAttribute('data-tab');
          const panes = document.querySelectorAll(`#${section.section}Section .tab-pane`);
          panes.forEach(pane => {
            pane.classList.remove('active');
          });
          document.getElementById(`${tabId}Tab`).classList.add('active');
        });
      });
    });
  }
  
  /**
   * Configura os eventos dos itens de menu administrativo
   */
  setupAdminMenuItems() {
    // Encontrar todos os links de menu admin
    const adminMenuItems = document.querySelectorAll('.admin-menu-item');
    
    console.log('Configurando itens de menu administrativo:', adminMenuItems.length);
    
    adminMenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        console.log('Item de menu admin clicado:', item);
        
        // Obter a seção a ser mostrada
        let section = item.getAttribute('data-section');
        
        // Mapeamento de seções
        const sectionMap = {
          'reports': 'relatorios',
          'users': 'colaboradores',
          'settings': 'configuracoes'
        };
        
        // Usar o mapeamento se necessário
        if (sectionMap[section]) {
          section = sectionMap[section];
        }
        
        console.log('Mostrando seção:', section);
        
        // Mostrar a seção
        this.showAdminSection(section);
        
        // Atualizar classe ativa
        adminMenuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }
  
  /**
   * Ativa/desativa um colaborador
   */
  async toggleAtivoColaborador() {
    const toggleBtn = document.getElementById('toggleAtivoBtn');
    if (!toggleBtn) return;
    
    const isActive = toggleBtn.getAttribute('data-ativo') === 'true';
    
    try {
      uiService.showLoading();
      
      await apiService.updateUser(this.currentColaboradorId, {
        isActive: !isActive
      });
      
      uiService.showAlert(`Colaborador ${!isActive ? 'ativado' : 'desativado'} com sucesso!`, 'success');
      this.loadColaboradores();
      this.closeColaboradorModal();
    } catch (error) {
      console.error('Erro ao alterar status do colaborador:', error);
      uiService.showAlert('Erro ao alterar status do colaborador', 'error');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Mostra uma seção administrativa específica
   * @param {string} section - Nome da seção a ser mostrada
   */
  showAdminSection(section) {
    console.log('Mostrando seção admin:', section);
    this.hideAllAdminSections();

    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
      sectionElement.style.display = 'block';
      this.loadAdminSectionData(section);
    }
  }

  /**
   * Esconde todas as seções administrativas
   */
  hideAllAdminSections() {
    document.querySelectorAll('.admin-section').forEach(section => {
      section.style.display = 'none';
    });
  }

  /**
   * Carrega dados específicos para cada seção administrativa
   * @param {string} section - Nome da seção a carregar dados
   */
  loadAdminSectionData(section) {
    console.log('Carregando dados da seção:', section);
    
    switch (section) {
      case 'dashboard':
        this.updateDashboardStats();
        break;
      case 'tickets':
        if (window.ticketModule) {
          window.ticketModule.carregarTicketsIniciais();
        }
        break;
      case 'colaboradores':
        this.loadColaboradores();
        break;
      case 'setores':
        this.loadSetores();
        break;
      case 'categorias':
        this.loadCategorias();
        break;
      case 'relatorios':
        this.loadRelatorio();
        break;
      default:
        console.log('Seção não reconhecida:', section);
    }
  }

  /**
   * Atualiza os dados estatísticos do dashboard
   */
  async updateDashboardStats() {
    try {
      console.log('[AdminModule] Atualizando estatísticas do dashboard');
      
      // Obter ID do usuário atual
      const userId = userModule.getCurrentUserId();
      if (!userId) {
        console.error('[AdminModule] Usuário não identificado');
        return;
      }
      
      console.log('[AdminModule] Carregando tickets para o usuário:', userId);
      
      // Primeiro, carregar os setores para garantir que estejam disponíveis
      await this.loadSetores();
      console.log('[AdminModule] Setores carregados:', this.setores.length);
      
      // Carregar tickets recebidos pelo usuário atual
      let ticketsRecebidos = [];
      try {
        ticketsRecebidos = await apiService.getTicketsByTargetUser(userId);
        console.log('[AdminModule] Tickets recebidos carregados:', ticketsRecebidos.length);
      } catch (error) {
        console.error('[AdminModule] Erro ao carregar tickets recebidos:', error);
        ticketsRecebidos = [];
      }
      
      // Carregar tickets criados pelo usuário atual
      let ticketsCriados = [];
      try {
        ticketsCriados = await apiService.getTicketsByRequester(userId);
        console.log('[AdminModule] Tickets criados carregados:', ticketsCriados.length);
      } catch (error) {
        console.error('[AdminModule] Erro ao carregar tickets criados:', error);
        ticketsCriados = [];
      }
      
      // Contar tickets por status
      const total = ticketsRecebidos.length;
      const pendentes = ticketsRecebidos.filter(t => (t.status || '').toLowerCase().includes('pendente')).length;
      const emAndamento = ticketsRecebidos.filter(t => (t.status || '').toLowerCase().includes('andamento')).length;
      const resolvidos = ticketsRecebidos.filter(t => (t.status || '').toLowerCase().includes('finalizado')).length;
      
      console.log('[AdminModule] Estatísticas calculadas:', { total, pendentes, emAndamento, resolvidos });
      
      // Calcular porcentagem de resolução
      const porcentagemResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;
      
      // Calcular tempos médios
      const tempoMedioAceite = this.calcularTempoMedioAceite(ticketsRecebidos);
      const tempoMedioConclusao = this.calcularTempoMedioConclusao(ticketsRecebidos);
      
      // Atualizar contadores no dashboard
      this.updateDashboardCounters(total, pendentes, emAndamento, resolvidos, porcentagemResolucao, tempoMedioAceite, tempoMedioConclusao);
      
      // Carregar tickets recentes (recebidos e criados)
      this.loadLatestReceivedTickets(ticketsRecebidos);
      this.loadLatestCreatedTickets(ticketsCriados);
      
    } catch (error) {
      console.error('[AdminModule] Erro ao atualizar estatísticas do dashboard:', error);
      uiService.showAlert('Erro ao carregar estatísticas. Tente novamente.', 'error');
    }
  }

  /**
   * Calcula o tempo médio de aceite dos tickets em horas
   * @param {Array} tickets - Lista de tickets
   * @returns {string} - Tempo médio formatado em horas
   */
  calcularTempoMedioAceite(tickets) {
    // Filtrar tickets com data de aceitação
    const ticketsComAceite = tickets.filter(t => t.acceptanceDate && t.createdAt);
    
    if (ticketsComAceite.length === 0) {
      return "N/A";
    }
    
    // Calcular a diferença média entre data de criação e aceitação
    const tempoTotalMs = ticketsComAceite.reduce((acc, ticket) => {
      const dataAceite = new Date(ticket.acceptanceDate);
      const dataCriacao = new Date(ticket.createdAt);
      return acc + (dataAceite - dataCriacao);
    }, 0);
    
    const tempoMedioMs = tempoTotalMs / ticketsComAceite.length;
    const tempoMedioHoras = (tempoMedioMs / (1000 * 60 * 60)).toFixed(1);
    
    return `${tempoMedioHoras}h`;
  }

  /**
   * Calcula o tempo médio de conclusão dos tickets em dias
   * @param {Array} tickets - Lista de tickets
   * @returns {string} - Tempo médio formatado em dias
   */
  calcularTempoMedioConclusao(tickets) {
    // Filtrar tickets concluídos
    const ticketsConcluidos = tickets.filter(t => 
      (t.completionDate || t.completedAt) && t.createdAt && 
      (t.status.toLowerCase().includes('finalizado') || t.status.toLowerCase().includes('resolvido'))
    );
    
    if (ticketsConcluidos.length === 0) {
      return "N/A";
    }
    
    // Calcular a diferença média entre data de criação e conclusão
    const tempoTotalMs = ticketsConcluidos.reduce((acc, ticket) => {
      const dataConclusao = new Date(ticket.completionDate || ticket.completedAt);
      const dataCriacao = new Date(ticket.createdAt);
      return acc + (dataConclusao - dataCriacao);
    }, 0);
    
    const tempoMedioMs = tempoTotalMs / ticketsConcluidos.length;
    const tempoMedioDias = (tempoMedioMs / (1000 * 60 * 60 * 24)).toFixed(1);
    
    return `${tempoMedioDias}d`;
  }

  /**
   * Carrega os últimos tickets recebidos pelo usuário
   * @param {Array} tickets - Lista de tickets recebidos
   */
  loadLatestReceivedTickets(tickets) {
    const container = document.getElementById('latestTicketsList');
    if (!container) return;
    
    // Ordenar por data de criação (mais recentes primeiro)
    const sortedTickets = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Log para depuração - verificar a estrutura dos tickets
    console.log('[DEBUG] Tickets recebidos:', sortedTickets);
    
    // Pegar os 5 mais recentes
    const recentTickets = sortedTickets.slice(0, 5);
    
    if (recentTickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Nenhum ticket recebido recentemente</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <table class="inbox-table">
        <thead>
          <tr>
            <th style="text-align: center; padding: 0.4rem;">Assunto</th>
            <th style="text-align: center; padding: 0.4rem;">Solicitante / Setor</th>
            <th style="text-align: center; padding: 0.4rem;">Data</th>
            <th style="text-align: center; padding: 0.4rem;">Prazo</th>
            <th style="text-align: center; padding: 0.4rem;" class="status-col">Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    
    const tbody = container.querySelector('tbody');
    
    recentTickets.forEach(ticket => {
      console.log('[DEBUG] Processando ticket:', ticket);
      
      // Determinar a classe de status
      let statusClass = '';
      switch ((ticket.status || '').toLowerCase()) {
        case 'pendente':
          statusClass = 'status-flag pendente';
          break;
        case 'em andamento':
          statusClass = 'status-flag em_andamento';
          break;
        case 'finalizado':
        case 'resolvido':
          statusClass = 'status-flag finalizado';
          break;
        case 'cancelado':
          statusClass = 'status-flag cancelado';
          break;
      }
      
      // Formatar data de criação (apenas data, sem hora)
      const dataCriacao = formatUtils.formatDateOnly(ticket.createdAt);
      
      // Formatar prazo utilizando o formatUtils
      const dataLimite = this.obterDataLimite(ticket);
      let prazo = 'N/A';
      
      if (dataLimite) {
        prazo = formatUtils.formatarPrazo(dataLimite);
      }
      
      // Obter nome do solicitante com múltiplas verificações
      let solicitante = 'N/A';
      if (ticket.requesterName) {
        solicitante = ticket.requesterName;
      } else if (ticket.requester && typeof ticket.requester === 'string') {
        solicitante = ticket.requester;
      } else if (ticket.requester && ticket.requester.name) {
        solicitante = ticket.requester.name;
      } else if (ticket.requester && ticket.requester.firstName) {
        solicitante = ticket.requester.firstName + (ticket.requester.lastName ? ' ' + ticket.requester.lastName : '');
      }
      
      // Obter setor do solicitante
      let setorNome = 'N/A';
      
      // Mostrar detalhes do ticket para diagnóstico
      console.log('[DEBUG] Dados do ticket para obter setor:');
      console.log('- requesterDepartment:', ticket.requesterDepartment);
      console.log('- requester.department:', ticket.requester?.department);
      console.log('- requesterDepartmentId:', ticket.requesterDepartmentId);
      console.log('- requester.departmentId:', ticket.requester?.departmentId);
      
      // Tentar obter o nome do departamento de diferentes maneiras
      if (ticket.requesterDepartment && ticket.requesterDepartment.name) {
        setorNome = ticket.requesterDepartment.name;
        console.log('[DEBUG] Usando requesterDepartment.name:', setorNome);
      } else if (ticket.requester && ticket.requester.department && ticket.requester.department.name) {
        setorNome = ticket.requester.department.name;
        console.log('[DEBUG] Usando requester.department.name:', setorNome);
      } else if (ticket.requesterDepartmentId) {
        setorNome = this.getSetorNome(ticket.requesterDepartmentId);
        console.log('[DEBUG] Usando requesterDepartmentId:', ticket.requesterDepartmentId, '-> Nome:', setorNome);
      } else if (ticket.requester && ticket.requester.departmentId) {
        setorNome = this.getSetorNome(ticket.requester.departmentId);
        console.log('[DEBUG] Usando requester.departmentId:', ticket.requester.departmentId, '-> Nome:', setorNome);
      } else {
        console.log('[DEBUG] Nenhuma informação de departamento encontrada para o solicitante');
      }
      
      // Transformar o assunto para maiúsculas
      const assunto = (ticket.title || ticket.name).toUpperCase();
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="text-align: center; padding: 0.4rem;" class="title-cell">${assunto}</td>
        <td style="text-align: center; padding: 0.4rem;">${solicitante} / ${setorNome}</td>
        <td style="text-align: center; padding: 0.4rem;">${dataCriacao}</td>
        <td style="text-align: center; padding: 0.4rem;">${prazo}</td>
        <td style="text-align: center; padding: 0.4rem;" class="status-cell"><span class="${statusClass}" style="border-radius: 4px;">${ticket.status}</span></td>
      `;
      
      tbody.appendChild(row);
    });
  }

  /**
   * Carrega os últimos tickets criados pelo usuário
   * @param {Array} tickets - Lista de tickets criados
   */
  loadLatestCreatedTickets(tickets) {
    const container = document.getElementById('activityList');
    if (!container) return;
    
    // Ordenar por data de criação (mais recentes primeiro)
    const sortedTickets = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pegar os 5 mais recentes
    const recentTickets = sortedTickets.slice(0, 5);
    
    if (recentTickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-plus-circle"></i>
          <p>Nenhum ticket criado recentemente</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <table class="inbox-table">
        <thead>
          <tr>
            <th style="text-align: center; padding: 0.4rem;">Assunto</th>
            <th style="text-align: center; padding: 0.4rem;">Setor Destino</th>
            <th style="text-align: center; padding: 0.4rem;">Data</th>
            <th style="text-align: center; padding: 0.4rem;">Prazo</th>
            <th style="text-align: center; padding: 0.4rem;" class="status-col">Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    
    const tbody = container.querySelector('tbody');
    
    recentTickets.forEach(ticket => {
      // Determinar a classe de status
      let statusClass = '';
      switch ((ticket.status || '').toLowerCase()) {
        case 'pendente':
          statusClass = 'status-flag pendente';
          break;
        case 'em andamento':
          statusClass = 'status-flag em_andamento';
          break;
        case 'finalizado':
        case 'resolvido':
          statusClass = 'status-flag finalizado';
          break;
        case 'cancelado':
          statusClass = 'status-flag cancelado';
          break;
      }
      
      // Formatar data de criação (apenas data, sem hora)
      const dataCriacao = formatUtils.formatDateOnly(ticket.createdAt);
      
      // Formatar prazo utilizando o formatUtils
      const dataLimiteCriados = this.obterDataLimite(ticket);
      let prazoExibicao = 'N/A';
      
      if (dataLimiteCriados) {
        prazoExibicao = formatUtils.formatarPrazo(dataLimiteCriados);
      }
      
      // Definir setor destino
      const setorDestino = ticket.department ? ticket.department.name : 'N/A';
      
      // Transformar o assunto para maiúsculas
      const assunto = (ticket.title || ticket.name).toUpperCase();
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="text-align: center; padding: 0.4rem;" class="title-cell">${assunto}</td>
        <td style="text-align: center; padding: 0.4rem;">${setorDestino}</td>
        <td style="text-align: center; padding: 0.4rem;">${dataCriacao}</td>
        <td style="text-align: center; padding: 0.4rem;">${prazoExibicao}</td>
        <td style="text-align: center; padding: 0.4rem;" class="status-cell"><span class="${statusClass}" style="border-radius: 4px;">${ticket.status}</span></td>
      `;
      
      tbody.appendChild(row);
    });
  }

  /**
   * Atualiza os contadores no dashboard
   */
  updateDashboardCounters(total, pendentes, emAndamento, resolvidos, porcentagemResolucao, tempoMedioAceite, tempoMedioConclusao) {
    // Atualizar contadores principais
    document.getElementById('totalTicketsCount').textContent = total;
    document.getElementById('pendingTicketsCount').textContent = pendentes;
    document.getElementById('inProgressTicketsCount').textContent = emAndamento;
    document.getElementById('resolvedTicketsCount').textContent = resolvidos;
    
    // Atualizar estatísticas adicionais (se existirem os elementos)
    if (document.getElementById('resolucaoPercentual')) {
      document.getElementById('resolucaoPercentual').textContent = `${porcentagemResolucao}%`;
    }
    
    if (document.getElementById('tempoMedioAceite')) {
      document.getElementById('tempoMedioAceite').textContent = tempoMedioAceite;
    }
    
    if (document.getElementById('tempoMedioConclusao')) {
      document.getElementById('tempoMedioConclusao').textContent = tempoMedioConclusao;
    }
  }

  // GERENCIAMENTO DE SETORES

  /**
   * Carrega lista de setores
   * @returns {Promise} - Promise que resolve quando os setores forem carregados
   */
  async loadSetores() {
    try {
      console.log('[AdminModule] Carregando setores...');
      const setores = await apiService.getDepartments();
      console.log('[AdminModule] Setores recebidos da API:', setores);
      
      if (Array.isArray(setores)) {
        this.setores = setores;
        console.log('[AdminModule] Setores armazenados:', this.setores.length);
      } else {
        console.error('[AdminModule] Resposta de setores inválida:', setores);
        this.setores = [];
      }
      
      this.updateSetoresDropdowns(this.setores);
      this.updateSetoresTable(this.setores);
      return this.setores;
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      uiService.showAlert('Erro ao carregar setores. Tente novamente.', 'error');
      return [];
    }
  }

  /**
   * Atualiza os dropdowns de seleção de setor
   * @param {Array} setores - Lista de setores para exibir
   */
  updateSetoresDropdowns(setores) {
    const dropdowns = ['setorDestino', 'setorColaborador', 'setorSelect'];
    dropdowns.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;

      // Limpar dropdown antes de adicionar novos itens
      select.innerHTML = id === 'setorDestino' 
        ? '<option value="">Selecione um setor</option>' 
        : '';

      // Adicionar setores ao dropdown
      setores.forEach(setor => {
        const option = document.createElement('option');
        option.value = setor.id;
        option.textContent = setor.name;
        select.appendChild(option);
      });
    });
  }

  /**
   * Atualiza a tabela de setores
   * @param {Array} setores - Lista de setores para exibir
   */
  updateSetoresTable(setores) {
    const tbody = document.querySelector('#setoresTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (setores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">Nenhum setor cadastrado.</td></tr>';
      return;
    }

    setores.forEach(setor => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${setor.id}</td>
        <td>${setor.name}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Manipula o envio do formulário de cadastro de setor
   * @param {Event} event - Evento de submit do formulário
   */
  async handleSetorSubmit(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeSetor').value;
    
    if (!nome) {
      uiService.showAlert('Por favor, informe o nome do setor', 'warning');
      return;
    }
    
    try {
      uiService.showLoading();
      
      await apiService.createDepartment({ name: nome });
      
      uiService.showAlert('Setor cadastrado com sucesso!', 'success');
      document.getElementById('setorForm').reset();
      
      // Mostrar a aba de listagem de setores
      const listaTab = document.querySelector('#setoresSection .tab-btn[data-tab="listaSetores"]');
      if (listaTab) {
        listaTab.click();
      }
      
      this.loadSetores();
    } catch (error) {
      console.error('Erro ao cadastrar setor:', error);
      uiService.showAlert('Erro ao cadastrar setor. Tente novamente.', 'error');
    } finally {
      uiService.hideLoading();
    }
  }

  // GERENCIAMENTO DE CATEGORIAS

  /**
   * Carrega lista de categorias
   */
  async loadCategorias() {
    try {
      const categorias = await apiService.getCategories();
      this.updateCategoriasTable(categorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      uiService.showAlert('Erro ao carregar categorias. Tente novamente.', 'error');
    }
  }

  /**
   * Atualiza a tabela de categorias
   * @param {Array} categorias - Lista de categorias para exibir
   */
  updateCategoriasTable(categorias) {
    const tbody = document.querySelector('#categoriasTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (categorias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">Nenhuma categoria cadastrada.</td></tr>';
      return;
    }

    categorias.forEach(categoria => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${categoria.id}</td>
        <td>${categoria.name}</td>
      `;
      tbody.appendChild(row);
    });
  }

  /**
   * Manipula o envio do formulário de cadastro de categoria
   * @param {Event} event - Evento de submit do formulário
   */
  async handleCategoriaSubmit(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeCategoria').value;
    
    if (!nome) {
      uiService.showAlert('Por favor, informe o nome da categoria', 'warning');
      return;
    }
    
    try {
      uiService.showLoading();
      
      await apiService.createCategory({ name: nome });
      
      uiService.showAlert('Categoria cadastrada com sucesso!', 'success');
      document.getElementById('categoriaForm').reset();
      
      // Mostrar a aba de listagem de categorias
      const listaTab = document.querySelector('#categoriasSection .tab-btn[data-tab="listaCategorias"]');
      if (listaTab) {
        listaTab.click();
      }
      
      this.loadCategorias();
    } catch (error) {
      console.error('Erro ao cadastrar categoria:', error);
      uiService.showAlert('Erro ao cadastrar categoria. Tente novamente.', 'error');
    } finally {
      uiService.hideLoading();
    }
  }

  // GERENCIAMENTO DE COLABORADORES

  /**
   * Carrega lista de colaboradores
   */
  async loadColaboradores() {
    try {
      const colaboradores = await apiService.getUsers();
      this.updateColaboradoresTable(colaboradores);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      uiService.showAlert('Erro ao carregar colaboradores. Tente novamente.', 'error');
    }
  }

  /**
   * Atualiza a tabela de colaboradores
   * @param {Array} colaboradores - Lista de colaboradores para exibir
   */
  updateColaboradoresTable(colaboradores) {
    const tbody = document.querySelector('#colaboradoresTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (colaboradores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Nenhum colaborador encontrado.</td></tr>';
      return;
    }

    colaboradores.forEach(colaborador => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${colaborador.id}</td>
        <td>${colaborador.firstName} ${colaborador.lastName || ''}</td>
        <td>${this.getSetorNome(colaborador.departmentId)}</td>
        <td>${colaborador.isActive ? 'Sim' : 'Não'}</td>
        <td>${colaborador.createdAt || 'Não definida'}</td>
      `;
      row.addEventListener('click', () => this.showColaboradorDetails(colaborador));
      tbody.appendChild(row);
    });
  }

  /**
   * Obtém o nome do setor pelo ID
   * @param {number} setorId - ID do setor
   * @returns {string} - Nome do setor ou "Desconhecido"
   */
  getSetorNome(setorId) {
    console.log('[DEBUG] getSetorNome - ID recebido:', setorId);
    console.log('[DEBUG] getSetorNome - Setores disponíveis:', this.setores);
    
    if (!setorId) {
      console.log('[DEBUG] getSetorNome - ID vazio ou nulo');
      return 'N/A';
    }
    
    const setor = this.setores.find(s => String(s.id) === String(setorId));
    if (setor) {
      console.log('[DEBUG] getSetorNome - Setor encontrado:', setor.name);
      return setor.name;
    } else {
      console.log('[DEBUG] getSetorNome - Setor NÃO encontrado para ID:', setorId);
      return 'N/A';
    }
  }

  /**
   * Exibe os detalhes de um colaborador
   * @param {Object} colaborador - Dados do colaborador
   */
  showColaboradorDetails(colaborador) {
    this.currentColaboradorId = colaborador.id;
    
    // Preencher detalhes
    const detailsContainer = document.getElementById('colaboradorDetails');
    if (detailsContainer) {
      detailsContainer.innerHTML = this.getColaboradorDetailsHTML(colaborador);
    }
    
    // Configurar botão de toggle
    const toggleBtn = document.getElementById('toggleAtivoBtn');
    if (toggleBtn) {
      const isActive = colaborador.isActive === 'Sim' || colaborador.isActive === true;
      toggleBtn.textContent = isActive ? 'Desativar Colaborador' : 'Ativar Colaborador';
      toggleBtn.setAttribute('data-ativo', isActive);
      toggleBtn.className = isActive ? 'btn btn-danger' : 'btn btn-success';
    }
    
    // Mostrar modal
    const modal = document.getElementById('colaboradorDetailsModal');
    if (modal) modal.style.display = 'block';
  }

  /**
   * Gera o HTML para exibir detalhes do colaborador
   * @param {Object} colaborador - Dados do colaborador
   * @returns {string} - HTML com os detalhes do colaborador
   */
  getColaboradorDetailsHTML(colaborador) {
    const ativo = colaborador.isActive ? 'Sim' : 'Não';
    const dataCadastro = colaborador.createdAt || 'Não definida';

    return `
      <div class="details-grid">
        <div class="detail-item">
          <p><i class="fas fa-id-badge"></i> <strong>ID:</strong> ${colaborador.id}</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-user"></i> <strong>Nome:</strong> ${colaborador.firstName} ${colaborador.lastName || ''}</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-building"></i> <strong>Setor:</strong> ${this.getSetorNome(colaborador.departmentId)}</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-user-shield"></i> <strong>Administrador:</strong> ${colaborador.isAdmin ? 'Sim' : 'Não'}</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-check-circle"></i> <strong>Ativo:</strong> ${ativo}</p>
        </div>
        <div class="detail-item full-width">
          <p><i class="fas fa-calendar-alt"></i> <strong>Data de Cadastro:</strong> ${dataCadastro}</p>
        </div>
      </div>
    `;
  }

  /**
   * Manipula o envio do formulário de cadastro de colaborador
   * @param {Event} event - Evento de submit do formulário
   */
  async handleColaboradorSubmit(event) {
    event.preventDefault();
    
    const colaborador = {
      firstName: document.getElementById('nomeColaborador').value,
      lastName: document.getElementById('sobrenomeColaborador').value,
      email: document.getElementById('emailColaborador').value,
      departmentId: parseInt(document.getElementById('setorColaborador').value, 10),
      password: document.getElementById('senhaColaborador').value,
      isAdmin: document.getElementById('isAdminColaborador').value === 'true',
      isActive: document.getElementById('ativoColaborador').value === 'true'
    };
    
    try {
      uiService.showLoading();
      
      await apiService.createUser(colaborador);
      
      uiService.showAlert('Colaborador cadastrado com sucesso!', 'success');
      document.getElementById('cadastroColaboradorForm').reset();
      this.loadColaboradores();
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      uiService.showAlert('Erro ao cadastrar colaborador. Tente novamente.', 'error');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Manipula a alteração de senha de um colaborador
   * @param {Event} event - Evento de submit do formulário
   */
  async handlePasswordChange(event) {
    event.preventDefault();
    
    const novaSenha = document.getElementById('novaSenha').value;
    
    if (!novaSenha) {
      uiService.showAlert('Por favor, informe a nova senha', 'warning');
      return;
    }
    
    try {
      uiService.showLoading();
      
      await apiService.updateUser(this.currentColaboradorId, {
        password: novaSenha
      });
      
      uiService.showAlert('Senha alterada com sucesso!', 'success');
      this.closePasswordModal();
      this.loadColaboradores();
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      uiService.showAlert('Erro ao alterar senha. Tente novamente.', 'error');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Fecha o modal de detalhes do colaborador
   */
  closeColaboradorDetailsModal() {
    uiService.closeModal('colaboradorDetailsModal');
  }

  /**
   * Fecha o modal de alteração de senha
   */
  closePasswordModal() {
    uiService.closeModal('changePasswordModal');
  }

  /**
   * Fecha o modal de cadastro de colaborador
   */
  closeColaboradorModal() {
    uiService.closeModal('colaboradorModal');
  }

  // RELATÓRIOS

  /**
   * Carrega o relatório com as últimas atualizações
   */
  async loadRelatorio() {
    try {
      const updates = await apiService.getReportUpdates();
      this.updateRelatorioUI(updates);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      uiService.showAlert('Erro ao carregar relatório. Tente novamente.', 'error');
    }
  }

  /**
   * Atualiza a interface do relatório
   * @param {Array} updates - Lista de atualizações para exibir
   */
  updateRelatorioUI(updates) {
    const container = document.getElementById('relatorioContainer');
    if (!container) return;

    if (!updates || updates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-chart-bar"></i>
          <p>Nenhuma atualização disponível para exibição</p>
        </div>
      `;
      return;
    }

    // Implementar a exibição do relatório aqui
    // Por exemplo, uma tabela com as últimas atualizações
    container.innerHTML = `
      <div class="report-header">
        <h3>Últimas Atualizações</h3>
        <p>Total de registros: ${updates.length}</p>
      </div>
      <div class="report-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Ticket</th>
              <th>Usuário</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${updates.map(update => `
              <tr>
                <td>${this.formatDate(update.dateTime)}</td>
                <td>#${update.ticketId} - ${update.ticketTitle || 'Sem título'}</td>
                <td>${update.userName || 'Usuário'}</td>
                <td>${update.action || update.comment || 'Atualização'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Formata uma data para exibição
   * @param {string} dateString - String de data
   * @returns {string} - Data formatada
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const hora = String(date.getHours()).padStart(2, '0');
      const minuto = String(date.getMinutes()).padStart(2, '0');
      
      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  }

  /**
   * Abre o modal para cadastro de setor
   */
  openSetorModal() {
    // Limpar o formulário
    const form = document.getElementById('setorForm');
    if (form) form.reset();
    
    // Mostrar o modal
    uiService.showModal('setorModal');
  }

  /**
   * Abre o modal para cadastro de categoria
   */
  openCategoriaModal() {
    // Limpar o formulário
    const form = document.getElementById('categoriaForm');
    if (form) form.reset();
    
    // Mostrar o modal
    uiService.showModal('categoriaModal');
  }

  /**
   * Abre o modal para cadastro de colaborador
   */
  openColaboradorModal() {
    // Limpar o formulário
    const form = document.getElementById('cadastroColaboradorForm');
    if (form) form.reset();
    
    // Preencher o select de setores
    this.loadSetores().then(() => {
      this.updateSetoresDropdowns(this.setores);
    });
    
    // Mostrar o modal
    uiService.showModal('colaboradorModal');
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
    const camposPossiveis = ['deadline', 'dueDate', 'prazo', 'endDate', 'due_date', 'expectedDate', 'completionDate'];
    
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
}

// Exporta uma instância única do módulo
export const adminModule = new AdminModule();

// Exportar para acesso global
window.adminModule = adminModule; 