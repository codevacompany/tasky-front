/**
 * Módulo para gerenciamento de funcionalidades de administrador
 */
import { apiService } from '../services/ApiService.js';
import { uiService } from '../services/UiService.js';
import { userModule } from './UserModule.js';

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
      const tickets = await apiService.getTickets();
      
      // Contar tickets por status
      const total = tickets.length;
      const pendentes = tickets.filter(t => t.status.toLowerCase().includes('pendente')).length;
      const emAndamento = tickets.filter(t => t.status.toLowerCase().includes('andamento')).length;
      const resolvidos = tickets.filter(t => t.status.toLowerCase().includes('finalizado')).length;
      
      // Atualizar contadores no dashboard
      this.updateDashboardCounters(total, pendentes, emAndamento, resolvidos);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do dashboard:', error);
      uiService.showAlert('Erro ao carregar estatísticas. Tente novamente.', 'error');
    }
  }

  /**
   * Atualiza os contadores no dashboard
   */
  updateDashboardCounters(total, pendentes, emAndamento, resolvidos) {
    document.getElementById('totalTicketsCount').textContent = total;
    document.getElementById('pendingTicketsCount').textContent = pendentes;
    document.getElementById('inProgressTicketsCount').textContent = emAndamento;
    document.getElementById('resolvedTicketsCount').textContent = resolvidos;
  }

  // GERENCIAMENTO DE SETORES

  /**
   * Carrega lista de setores
   */
  async loadSetores() {
    try {
      const setores = await apiService.getDepartments();
      this.setores = setores;
      this.updateSetoresDropdowns(setores);
      this.updateSetoresTable(setores);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      uiService.showAlert('Erro ao carregar setores. Tente novamente.', 'error');
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
    const setor = this.setores.find(s => s.id == setorId);
    return setor ? setor.name : 'Desconhecido';
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
}

// Exporta uma instância única do módulo
export const adminModule = new AdminModule();

// Exportar para acesso global
window.adminModule = adminModule; 