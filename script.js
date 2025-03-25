const CONFIG = {
  API_BASE_URL: "https://tasky-api-lime.vercel.app",
  // API_BASE_URL: "http://localhost:4443",
  NOTIFICATION_CHECK_INTERVAL: 60000,
  DATE_FORMAT: "pt-BR",
};

// Classe principal do sistema
class ChamadosSystem {
  constructor() {
    this.user = null;
    this.notificationCount = 0;
    this.setores = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkUserSession();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Login
    document
      .getElementById("loginForm")
      ?.addEventListener("submit", this.handleLogin.bind(this));

    // Forms
    document
      .getElementById("ticketForm")
      ?.addEventListener("submit", this.handleTicketSubmit.bind(this));
    document
      .getElementById("cadastroColaboradorForm")
      ?.addEventListener("submit", this.handleColaboradorSubmit.bind(this));
    document
      .getElementById("setorForm")
      ?.addEventListener("submit", this.handleSetorSubmit.bind(this));
    document
      .getElementById("categoriaForm")
      ?.addEventListener("submit", this.handleCategoriaSubmit.bind(this));
    document
      .getElementById("changePasswordForm")
      ?.addEventListener("submit", this.handlePasswordChange.bind(this));

    document
      .getElementById("toggleSetorForm")
      ?.addEventListener("click", () => this.toggleSetorForm());

    // Menus
    this.setupMenuListeners();

    // Modais
    this.setupModalListeners();

    // Notificações e Logout
    document
      .querySelector(".notification")
      ?.addEventListener("click", () => this.showNotifications());
    document
      .querySelector(".logout-btn")
      ?.addEventListener("click", () => this.logout());

    // Evento de mudança no setor destino
    document
      .getElementById("setorDestino")
      ?.addEventListener("change", (e) =>
        this.loadUsuariosPorSetor(e.target.value)
      );
  }

  setupMenuListeners() {
    // Menu do usuário
    const userMenuItems = document.querySelectorAll("#userMenu .menu-item");
    userMenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.getAttribute("data-section");
        if (section) {
          userMenuItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          this.showUserSection(section);
        }
      });
    });

    // Menu do admin
    const adminMenuItems = document.querySelectorAll("#adminMenu .menu-item");
    adminMenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.getAttribute("data-section");
        if (section === "toggleSubmenu") {
          const submenu = document.querySelector("#adminMenu .submenu");
          submenu.classList.toggle("active");
          return;
        }
        if (section) {
          adminMenuItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          this.showAdminSection(section);
        }
      });
    });

    // Submenu do admin
    const submenuItems = document.querySelectorAll("#adminMenu .submenu li");
    submenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.getAttribute("data-section");
        if (section) {
          submenuItems.forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          this.showAdminSection(section);
        }
      });
    });
  }

  checkUserSession() {
    const userName = localStorage.getItem("user_nome");
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (userName) {
      this.user = {
        firstName: userName,
        isAdmin: isAdmin,
        id: localStorage.getItem("user_id"),
        departmentId: localStorage.getItem("user_setor"),
      };
      this.updateUIForLoggedUser();
    }
  }

  loadInitialData() {
    this.loadSetores();
    this.loadColaboradores();
    this.loadCategorias();
  }

  // Métodos de API
  async apiRequest(endpoint, options = {}) {
    const baseUrl = CONFIG.API_BASE_URL || "";
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  // Handlers de eventos
  async handleLogin(e) {
    e.preventDefault();
    const loginData = {
      email: document.getElementById("emailLogin").value,
      password: document.getElementById("senhaLogin").value,
    };

    try {
      const data = await this.apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
      });

      if (data.error) {
        this.showAlert(data.error);
        return;
      }

      this.handleSuccessfulLogin(data);
    } catch (error) {
      this.showAlert("Erro ao fazer login. Tente novamente.");
    }
  }

  handleSuccessfulLogin(data) {
    console.log("Dados do login recebidos:", data);

    // Garantir que o ID seja uma string
    const userId = String(data.user.id);

    this.user = {
      id: userId,
      isAdmin: data.user.isAdmin,
      firstName: data.user.firstName,
      departmentId: data.user.departmentId,
    };

    console.log("Dados do usuário processados:", this.user);

    // Salvar na sessão
    localStorage.setItem("user_id", userId);
    localStorage.setItem("is_admin", data.user.isAdmin);
    localStorage.setItem("user_nome", data.user.firstName);
    localStorage.setItem("user_setor", data.user.departmentId);

    console.log("Dados salvos na sessão:", {
      id: localStorage.getItem("user_id"),
      is_admin: localStorage.getItem("is_admin"),
      nome: localStorage.getItem("user_nome"),
      setor: localStorage.getItem("user_setor"),
    });

    this.updateUIForLoggedUser();
    this.startNotificationCheck();
    this.carregarUltimosTickets();
  }

  // Métodos de UI
  updateUIForLoggedUser() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "flex";

    if (this.user.isAdmin) {
      this.showAdminUI();
    } else {
      this.showUserUI();
    }
  }

  showAdminUI() {
    console.log("Showwing user: ", this.user);
    document.getElementById("adminMenuContainer").style.display = "block";
    document.getElementById("adminMenu").style.display = "block";
    document.getElementById("userContent").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    document.getElementById(
      "adminGreeting"
    ).textContent = `Olá, ${this.user.firstName}!`;
    this.showAdminSection("inicio");
  }

  showUserUI() {
    console.log("Showwing user: ", this.user);
    document.getElementById("userContent").style.display = "flex";
    document.getElementById(
      "userGreeting"
    ).textContent = `Olá, ${this.user.firstName}!`;
    this.showUserSection("novoTicket");
  }

  // Métodos de utilidade
  showAlert(message) {
    const alertElement = document.getElementById("customAlert");
    const messageElement = alertElement.querySelector(".custom-alert-message");
    messageElement.textContent = message;
    alertElement.style.display = "flex";
  }

  formatDate(date) {
    if (!date) return "-";
    const [dataParte, horaParte] = date.split(" ");
    if (!dataParte || !horaParte) return date;

    const [dia, mes, ano] = dataParte.split("/");
    const [hora, minuto] = horaParte.split(":");

    return `${dia}/${mes}/${ano.slice(-2)} ${hora}:${minuto}`;
  }

  // Gerenciamento de Tickets
  async handleTicketSubmit(e) {
    e.preventDefault();
    const ticket = this.getTicketFormData();

    try {
      await this.apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify(ticket),
      });

      this.showAlert("Ticket enviado com sucesso!");
      document.getElementById("ticketForm").reset();
      this.updateNotificationCount(1);
      this.carregarUltimosTickets();
    } catch (error) {
      this.showAlert("Erro ao enviar ticket. Tente novamente.");
    }
  }

  getTicketFormData() {
    const conclusao = document.getElementById("conclusao").value;
    const targetUserId = document.getElementById("usuarioDestino").value;

    return {
      name: document.getElementById("nome").value,
      priority: document.getElementById("prioridade").value,
      description: document.getElementById("descricao").value,
      departmentId: parseInt(document.getElementById("setorDestino").value, 10),
      requesterId: parseInt(this.user.id, 10),
      targetUserId: targetUserId ? parseInt(targetUserId, 10) : null,
      status: "Pendente",
      completionDate: conclusao,
    };
  }

  formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  async loadTicketsSolicitante() {
    try {
      if (!this.user?.id) {
        console.error("ID do usuário não encontrado:", this.user);
        this.showAlert(
          "Erro: Usuário não identificado. Por favor, faça login novamente."
        );
        return;
      }

      console.log("Fazendo requisição para /tickets com ID:", this.user.id);
      const tickets = await this.apiRequest(
        `/tickets/requester/${this.user.id}`
      );

      console.log("Tickets recebidos:", tickets);

      if (!Array.isArray(tickets)) {
        console.error("Resposta inválida (não é um array):", tickets);
        this.showAlert(
          "Erro ao carregar tickets. Formato de resposta inválido."
        );
        return;
      }

      // Atualizar a tabela com os tickets
      const tbody = document.querySelector("#ticketsSolicitante tbody");
      if (!tbody) {
        console.error("Elemento tbody não encontrado");
        return;
      }

      tbody.innerHTML = "";

      if (tickets.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>Nenhum ticket encontrado</p>
            </td>
          </tr>`;
      } else {
        tickets.forEach((ticket) => {
          const tr = document.createElement("tr");
          tr.innerHTML = this.getTicketRowHTML(ticket);
          tbody.appendChild(tr);
        });
      }

      // Atualizar contadores
      const total = tickets.length;
      const pendentes = tickets.filter((t) => t.status === "pendente").length;
      const emAndamento = tickets.filter(
        (t) => t.status === "em_andamento"
      ).length;
      const resolvidos = tickets.filter(
        (t) => t.status === "finalizado"
      ).length;

      document.getElementById("totalTickets").textContent = total;
      document.getElementById("pendingTickets").textContent = pendentes;
      document.getElementById("inProgressTickets").textContent = emAndamento;
      document.getElementById("resolvedTickets").textContent = resolvidos;
    } catch (error) {
      console.error("Erro detalhado ao carregar tickets:", error);
      this.showAlert("Erro ao carregar tickets. Por favor, tente novamente.");

      // Mostrar estado vazio em caso de erro
      const tbody = document.querySelector("#ticketsSolicitante tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-state error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>Erro ao carregar tickets</p>
              <small>${error.message}</small>
            </td>
          </tr>`;
      }
    }
  }

  getTicketRowHTML(ticket) {
    const prioridade = ticket.priority.toUpperCase();
    const status = ticket.status.toUpperCase();

    return `
      <td>${ticket.id}</td>
      <td>${ticket.name}</td>
      <td><span class="priority-label priority-${
        ticket.priority
      }">${prioridade}</span></td>
      <td><span class="status-label status-${
        ticket.status
      }">${status}</span></td>
      <td>${formatarData(ticket.createdAt)}</td>
      <td>${
        ticket.completionDate ? formatarData(ticket.completionDate) : "-"
      }</td>
      <td>
        <button class="action-btn" onclick="chamadosSystem.showTicketDetails(${
          ticket.id
        })">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;
  }

  async loadTicketsSetor() {
    try {
      if (!this.user?.departmentId) {
        console.error("Setor não identificado para o usuário:", this.user);
        this.showAlert(
          "Erro: Setor não identificado. Por favor, faça login novamente."
        );
        return;
      }

      const response = await this.apiRequest(
        `/tickets/department/${this.user.departmentId}`
      );
      console.log("Resposta do servidor:", response);

      if (!response) {
        console.error("Resposta vazia do servidor");
        this.showAlert("Erro: Nenhum dado recebido do servidor.");
        return;
      }

      // Se a resposta for um array, atualiza a tabela
      if (Array.isArray(response)) {
        this.updateTicketsTable("ticketsSetor", response);

        // Atualizar contadores específicos do setor
        const total = response.length;
        const pendentes = response.filter(
          (t) => t.status === "Pendente"
        ).length;
        const emAndamento = response.filter(
          (t) => t.status === "Em andamento"
        ).length;
        const resolvidos = response.filter(
          (t) => t.status === "Finalizado"
        ).length;

        // Atualizar os contadores com os IDs corretos
        document.getElementById("totalTicketsSetor").textContent = total;
        document.getElementById("pendingTicketsSetor").textContent = pendentes;
        document.getElementById("inProgressTicketsSetor").textContent =
          emAndamento;
        document.getElementById("resolvedTicketsSetor").textContent =
          resolvidos;
      } else {
        console.error("Formato de resposta inválido:", response);
        this.showAlert("Erro: Formato de resposta inválido do servidor.");
      }
    } catch (error) {
      console.error("Erro ao carregar tickets do setor:", error);
      // Só mostra o alerta se não houver tickets carregados
      const tbody = document.querySelector("#ticketsSetor tbody");
      if (!tbody || !tbody.children.length) {
        this.showAlert(
          "Erro ao carregar tickets do setor. Por favor, tente novamente."
        );
      }
    }
  }

  updateTicketsTable(tableId, tickets) {
    console.log(
      "Atualizando tabela:",
      tableId,
      "com",
      tickets.length,
      "tickets"
    );
    const tbody = document.querySelector(`#${tableId} tbody`);

    if (!tbody) {
      console.error("Elemento tbody não encontrado para a tabela:", tableId);
      return;
    }

    tbody.innerHTML = "";

    if (tickets.length === 0) {
      tbody.innerHTML = this.getEmptyStateHTML();
      return;
    }

    tickets.forEach((ticket) => {
      const tr = document.createElement("tr");
      tr.innerHTML = this.getTicketRowHTML(ticket);
      tr.addEventListener("click", () => this.showTicketDetails(ticket.id));
      tbody.appendChild(tr);
    });
  }

  getEmptyStateHTML() {
    return `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Nenhum ticket encontrado</p>
        </td>
      </tr>`;
  }

  updateTicketsSummary(tickets, elementId = "ticketsSummary") {
    const total = tickets.length;
    const pendentes = tickets.filter((t) => t.status === "pendente").length;
    const emAndamento = tickets.filter(
      (t) => t.status === "em_andamento"
    ).length;
    const resolvidos = tickets.filter((t) => t.status === "finalizado").length;

    const summaryHTML = this.user?.isAdmin
      ? this.getAdminSummaryHTML(total, pendentes, emAndamento, resolvidos)
      : `Abertos: ${total} | Pendentes: ${pendentes} | Em andamento: ${emAndamento} | Resolvidos: ${resolvidos}`;

    document.getElementById(elementId).innerHTML = summaryHTML;
  }

  getAdminSummaryHTML(total, pendentes, emAndamento, resolvidos) {
    return `
      <div class="summary-item">
        <i class="fas fa-ticket-alt"></i>
        <span>Total: <strong>${total}</strong></span>
      </div>
      <div class="summary-item">
        <i class="fas fa-clock"></i>
        <span>Pendentes: <strong>${pendentes}</strong></span>
      </div>
      <div class="summary-item">
        <i class="fas fa-sync-alt"></i>
        <span>Em andamento: <strong>${emAndamento}</strong></span>
      </div>
      <div class="summary-item">
        <i class="fas fa-check-circle"></i>
        <span>Resolvidos: <strong>${resolvidos}</strong></span>
      </div>
    `;
  }

  // Gerenciamento de Notificações
  startNotificationCheck() {
    this.checkNewNotifications();
    setInterval(
      () => this.checkNewNotifications(),
      CONFIG.NOTIFICATION_CHECK_INTERVAL
    );
  }

  async checkNewNotifications() {
    try {
      const notificacoes = await this.apiRequest("/notifications");
      const unreadCount = notificacoes.filter((n) => n.read === false).length;
      this.updateNotificationCount(unreadCount);
    } catch (error) {
      console.error("Erro ao verificar notificações:", error);
    }
  }

  updateNotificationCount(count) {
    this.notificationCount = count;
    document.getElementById("notificationCount").textContent = count.toString();
    localStorage.setItem("notificationCount", count.toString());
  }

  async showNotifications() {
    try {
      const notificacoes = await this.apiRequest("/notifications");
      this.updateNotificationsUI(notificacoes);
      document.getElementById("notificationModal").style.display = "block";
    } catch (error) {
      this.showAlert("Erro ao carregar notificações. Tente novamente.");
    }
  }

  updateNotificationsUI(notificacoes) {
    const notificationList = document.getElementById("notificationList");
    notificationList.innerHTML = "";

    if (notificacoes.length === 0) {
      notificationList.innerHTML = this.getEmptyNotificationHTML();
      return;
    }

    notificacoes.forEach((n) => {
      const notificationDiv = document.createElement("div");

      notificationDiv.className = `notification-item ${n.type} ${
        n.read ? "" : "unread"
      }`;
      notificationDiv.innerHTML = this.getNotificationHTML(n);
      notificationList.appendChild(notificationDiv);
    });
  }

  getEmptyNotificationHTML() {
    return `
      <div class="notification-item">
        <i class="fas fa-check-circle"></i>
        <div class="notification-content">
          <div class="notification-message">Nenhuma notificação encontrada</div>
        </div>
      </div>`;
  }

  getNotificationHTML(notification) {
    const icon = this.getNotificationIcon(notification.type);
    const message = this.formatNotificationMessage(notification);

    return `
      <i class="fas ${icon}"></i>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <div class="notification-timestamp">${notification.createdAt}</div>
      </div>
    `;
  }

  getNotificationIcon(tipo) {
    const icons = {
      abertura: "fa-ticket-alt",
      comentario: "fa-comment",
      prazo: "fa-clock",
      status: "fa-sync-alt",
    };
    return icons[tipo] || "fa-info-circle";
  }

  formatNotificationMessage(notification) {
    const message = notification.message;
    const tipos = {
      abertura: /Novo ticket #\d+ criado por/,
      comentario: /Novo comentário no ticket #\d+ por/,
      status: /Ticket #\d+ atualizado para/,
    };

    if (tipos[notification.type]) {
      return message.replace(
        tipos[notification.type],
        this.getNotificationReplacement(notification.type)
      );
    }

    return message;
  }

  getNotificationReplacement(tipo) {
    const replacements = {
      abertura: "Novo ticket criado por",
      comentario: "Novo comentário adicionado por",
      status: "Status do ticket atualizado para",
    };
    return replacements[tipo] || message;
  }

  // Gerenciamento de Colaboradores
  async handleColaboradorSubmit(e) {
    e.preventDefault();
    const colaborador = this.getColaboradorFormData();

    try {
      await this.apiRequest("/users", {
        method: "POST",
        body: JSON.stringify(colaborador),
      });

      this.showAlert("Colaborador cadastrado com sucesso!");
      document.getElementById("cadastroColaboradorForm").reset();
      this.loadColaboradores();
    } catch (error) {
      console.log(error);
      this.showAlert("Erro ao cadastrar colaborador. Tente novamente.");
    }
  }

  getColaboradorFormData() {
    return {
      firstName: document.getElementById("nomeColaborador").value,
      lastName: document.getElementById("sobrenomeColaborador").value,
      email: document.getElementById("emailColaborador").value,
      departmentId: parseInt(
        document.getElementById("setorColaborador").value,
        10
      ), // Convert to number
      password: document.getElementById("senhaColaborador").value,
      isAdmin: document.getElementById("isAdminColaborador").value === "true",
      isActive: document.getElementById("ativoColaborador").value === "true",
    };
  }

  async loadColaboradores() {
    try {
      const colaboradores = await this.apiRequest("/users");
      this.updateColaboradoresTable(colaboradores);
    } catch (error) {
      this.showAlert("Erro ao carregar colaboradores. Tente novamente.");
    }
  }

  updateColaboradoresTable(colaboradores) {
    const tbody = document.querySelector("#colaboradoresTable tbody");
    tbody.innerHTML = "";

    if (colaboradores.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">Nenhum colaborador encontrado.</td></tr>';
      return;
    }

    colaboradores.forEach((c) => {
      const row = document.createElement("tr");
      row.innerHTML = this.getColaboradorRowHTML(c);
      row.addEventListener("click", () => this.showColaboradorDetails(c));
      tbody.appendChild(row);
    });
  }

  getColaboradorRowHTML(colaborador) {
    const dataCadastro =
      colaborador.createdAt && colaborador.createdAt !== "1"
        ? colaborador.createdAt
        : "Não definida";
    const ativo = colaborador.isActive ? "Sim" : "Não";

    return `
      <td>${colaborador.id}</td>
      <td>${colaborador.firstName}</td>
      <td>${this.getSetorNome(colaborador.departmentId)}</td>
      <td>${ativo}</td>
      <td>${dataCadastro}</td>
    `;
  }

  showColaboradorDetails(colaborador) {
    this.currentColaboradorId = colaborador.id;
    const modal = document.getElementById("colaboradorModal");
    const details = document.getElementById("colaboradorDetails");
    const toggleBtn = document.getElementById("toggleAtivoBtn");

    details.innerHTML = this.getColaboradorDetailsHTML(colaborador);
    toggleBtn.textContent = colaborador.isActive ? "Desativar" : "Ativar";
    toggleBtn.setAttribute("data-ativo", colaborador.isActive);

    modal.style.display = "block";
  }

  getColaboradorDetailsHTML(colaborador) {
    const ativo = colaborador.isActive ? "Sim" : "Não";
    const dataCadastro =
      colaborador.createdAt && colaborador.createdAt
        ? colaborador.createdAt
        : "Não definida";

    return `
      <div class="details-grid">
        <div class="detail-item">
          <p><i class="fas fa-id-badge"></i> <strong>ID:</strong> ${
            colaborador.id
          }</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-user"></i> <strong>Nome:</strong> ${
            colaborador.firstName
          }</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-building"></i> <strong>Setor:</strong> ${this.getSetorNome(
            colaborador.departmentId
          )}</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-user-shield"></i> <strong>Administrador:</strong> ${
            colaborador.isAdmin ? "Sim" : "Não"
          }</p>
        </div>
        <div class="detail-item">
          <p><i class="fas fa-check-circle"></i> <strong>Ativo:</strong> ${ativo}</p>
        </div>
        <div class="detail-item full-width">
          <p><i class="fas fa-calendar-alt"></i> <strong>Data de Cadastro:</strong>${dataCadastro}</p>
        </div>
      </div>
    `;
  }

  async handlePasswordChange(e) {
    e.preventDefault();
    const novaSenha = document.getElementById("novaSenha").value;

    //TODO: change this later
    try {
      await this.apiRequest(
        `/colaboradores/${this.currentColaboradorId}/senha`,
        {
          method: "PUT",
          body: JSON.stringify({ senha: novaSenha }),
        }
      );

      this.showAlert("Senha alterada com sucesso!");
      this.closePasswordModal();
      this.loadColaboradores();
    } catch (error) {
      this.showAlert("Erro ao alterar senha. Tente novamente.");
    }
  }

  //TODO: check this later
  async toggleAtivoColaborador() {
    const ativo =
      document.getElementById("toggleAtivoBtn").getAttribute("data-ativo") ===
      "1"
        ? "0"
        : "1";

    try {
      await this.apiRequest(
        `/colaboradores/${this.currentColaboradorId}/ativo`,
        {
          method: "PUT",
          body: JSON.stringify({ ativo }),
        }
      );

      this.showAlert("Status atualizado com sucesso!");
      this.loadColaboradores();
      this.closeColaboradorModal();
    } catch (error) {
      this.showAlert("Erro ao atualizar status. Tente novamente.");
    }
  }

  // Gerenciamento de Setores
  async loadSetores() {
    try {
      const setores = await this.apiRequest("/departments");
      this.setores = setores;
      this.updateSetoresDropdowns(setores);
      this.updateSetoresTable(setores);
    } catch (error) {
      this.showAlert("Erro ao carregar setores. Tente novamente.");
    }
  }

  updateSetoresDropdowns(setores) {
    const dropdowns = ["setorDestino", "setorColaborador", "setorSelect"];
    dropdowns.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;

      select.innerHTML =
        id === "setorDestino"
          ? '<option value="">Selecione um setor</option>'
          : "";

      setores.forEach((setor) => {
        const option = document.createElement("option");
        option.value = setor.id;
        option.textContent = setor.name;
        select.appendChild(option);
      });
    });
  }

  updateSetoresTable(setores) {
    const tbody = document.querySelector("#setoresTable tbody");
    tbody.innerHTML = "";

    setores.forEach((setor) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${setor.id}</td>
        <td>${setor.name}</td>
      `;
      tbody.appendChild(row);
    });
  }

  getSetorNome(setorId) {
    const setor = this.setores.find((s) => s.id === setorId);
    return setor ? setor.name : "Desconhecido";
  }

  async handleSetorSubmit(e) {
    e.preventDefault();
    const nome = document.getElementById("nomeSetor").value;

    try {
      await this.apiRequest("/departments", {
        method: "POST",
        body: JSON.stringify({ name: nome }),
      });

      this.showAlert("Setor cadastrado com sucesso!");
      this.loadSetores();
      this.toggleSetorForm();
    } catch (error) {
      this.showAlert("Erro ao cadastrar setor. Tente novamente.");
    }
  }

  // Métodos de UI
  toggleSetorForm() {
    const form = document.getElementById("setorForm");
    form.style.display = form.style.display === "block" ? "none" : "block";
  }

  closeColaboradorModal() {
    document.getElementById("colaboradorModal").style.display = "none";
  }

  closePasswordModal() {
    document.getElementById("changePasswordModal").style.display = "none";
  }

  setupModalListeners() {
    // Fechar modais ao clicar no X
    document
      .querySelectorAll(
        ".close, .close-notification, .close-colaborador, .close-password"
      )
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const modal = btn.closest(".modal");
          if (modal) modal.style.display = "none";
        });
      });

    // Fechar modais ao clicar fora
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    });

    // Configurar botão de marcar todas como lidas
    document
      .querySelector(".mark-all-read")
      ?.addEventListener("click", () => this.marcarTodasNotificacoesLidas());
  }

  // Gerenciamento de Categorias
  async loadCategorias() {
    try {
      const categorias = await this.apiRequest("/categories");
      this.updateCategoriasTable(categorias);
    } catch (error) {
      this.showAlert("Erro ao carregar categorias. Tente novamente.");
    }
  }

  updateCategoriasTable(categorias) {
    const tbody = document.querySelector("#categoriasTable tbody");
    tbody.innerHTML = "";

    categorias.forEach((categoria) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${categoria.id}</td>
        <td>${categoria.name}</td>
      `;
      tbody.appendChild(row);
    });
  }

  async handleCategoriaSubmit(e) {
    e.preventDefault();
    const nome = document.getElementById("nomeCategoria").value;

    try {
      await this.apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({ name: nome }),
      });

      this.showAlert("Categoria cadastrada com sucesso!");
      this.loadCategorias();
      this.toggleCategoriaForm();
    } catch (error) {
      this.showAlert("Erro ao cadastrar categoria. Tente novamente.");
    }
  }

  toggleCategoriaForm() {
    const form = document.getElementById("categoriaForm");
    form.style.display = form.style.display === "block" ? "none" : "block";
  }

  // Gerenciamento de Relatórios
  //TODO: check this later
  async loadRelatorio() {
    try {
      const updates = await this.apiRequest("/relatorio/ultimas_atualizacoes");
      this.updateRelatorioUI(updates);
    } catch (error) {
      this.showAlert("Erro ao carregar relatório. Tente novamente.");
    }
  }

  updateRelatorioUI(updates) {
    const container = document.getElementById("ultimasAtualizacoes");
    container.innerHTML = "";

    updates.forEach((u) => {
      const updateDiv = document.createElement("div");
      updateDiv.className = "update-item";
      updateDiv.innerHTML = `
        <div class="update-message">Ticket #${u.id} - ${u.nome} (${u.status}) - Setor: ${u.setor_destino}</div>
        <div class="update-timestamp">${u.data_criacao}</div>
      `;
      container.appendChild(updateDiv);
    });
  }

  // Dashboard
  async updateDashboardStats() {
    try {
      const [tickets, colaboradores, setores] = await Promise.all([
        this.apiRequest("/tickets"),
        this.apiRequest("/users"),
        this.apiRequest("/departments"),
      ]);

      // Atualizar total de tickets
      const totalTicketsElement = document.getElementById("totalTicketsAdmin");
      if (totalTicketsElement) {
        totalTicketsElement.textContent = tickets.length || "0";
      }

      // Atualizar total de colaboradores
      const totalColabElement = document.getElementById("totalColaboradores");
      if (totalColabElement) {
        totalColabElement.textContent = colaboradores.length || "0";
      }

      // Atualizar total de setores
      const totalSetoresElement = document.getElementById("totalSetores");
      if (totalSetoresElement) {
        totalSetoresElement.textContent = setores.length || "0";
      }

      // Atualizar tickets pendentes
      const ticketsPendentesElement =
        document.getElementById("ticketsPendentes");
      if (ticketsPendentesElement) {
        const pendentes = tickets.filter((t) => t.status === "Pendente").length;
        ticketsPendentesElement.textContent = pendentes || "0";
      }

      console.log("Dashboard atualizado com sucesso:", {
        tickets: tickets.length,
        colaboradores: colaboradores.length,
        setores: setores.length,
        pendentes: tickets.filter((t) => t.status === "Pendente").length,
      });
    } catch (error) {
      console.error("Erro ao atualizar estatísticas:", error);
    }
  }

  // Navegação
  showUserSection(section) {
    console.log("Mostrando seção:", section);
    this.hideAllUserSections();

    // Atualizar item ativo no menu
    document.querySelectorAll("#userMenu .menu-item").forEach((item) => {
      if (item.getAttribute("data-section") === section) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Mostrar a seção selecionada
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
      sectionElement.style.display = "block";
    } else {
      console.error("Seção não encontrada:", section);
      return;
    }

    if (!this.user) {
      console.error("Usuário não está logado");
      return;
    }

    switch (section) {
      case "meusTickets":
        carregarMeusTickets();
        break;
      case "ticketsSetor":
        this.loadTicketsSetor();
        break;
      case "novoTicket":
        this.loadSetores();
        this.loadColaboradores();
        // Limpar o select de usuário destino
        const selectUsuario = document.getElementById("usuarioDestino");
        if (selectUsuario) {
          selectUsuario.innerHTML =
            '<option value="">Selecione um usuário</option>';
        }
        break;
    }
  }

  hideAllUserSections() {
    document.querySelectorAll(".user-section").forEach((el) => {
      el.style.display = "none";
    });
  }

  showSelectedSection(section) {
    console.log("Mostrando seção selecionada:", section);
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
      sectionElement.style.display = "block";
    } else {
      console.error("Seção não encontrada:", section);
    }
  }

  showAdminSection(section) {
    console.log("Mostrando seção admin:", section);
    this.hideAllAdminSections();

    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
      sectionElement.style.display = "block";
      this.loadAdminSectionData(section);
    }
  }

  hideAllAdminSections() {
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.style.display = "none";
    });
  }

  loadAdminSectionData(section) {
    switch (section) {
      case "inicio":
        this.updateDashboardStats();
        break;
      case "cadastroColaboradores":
        this.loadSetores();
        break;
      case "colaboradores":
        this.loadColaboradores();
        break;
      case "setores":
        this.loadSetores();
        break;
      case "categorias":
        this.loadCategorias();
        break;
      case "relatorios":
        this.loadRelatorio();
        break;
    }
  }

  // Logout
  //TODO: change this later
  async logout() {
    try {
      // await this.apiRequest("/logout", { method: "POST" });
      this.clearSession();
      this.resetUI();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  clearSession() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("user_nome");
    localStorage.removeItem("user_setor");
    localStorage.removeItem("notificationCount");
  }

  resetUI() {
    // Limpar campos do formulário
    document.getElementById("emailLogin").value = "";
    document.getElementById("senhaLogin").value = "";

    // Restaurar estado inicial
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("adminMenuContainer").style.display = "none";
    document.getElementById("adminMenu").style.display = "none";
    document.getElementById("adminContent").style.display = "none";
    document.getElementById("userContent").style.display = "block";

    // Resetar contador de notificações
    document.getElementById("notificationCount").textContent = "0";
  }

  // Métodos de utilidade
  saveUserSession() {
    console.log("Salvando sessão do usuário:", this.user);
    localStorage.setItem("user_id", this.user.id);
    localStorage.setItem("is_admin", this.user.isAdmin ? true : false);
    localStorage.setItem("user_nome", this.user.firstName);
    localStorage.setItem("user_setor", this.user.departmentId);
  }

  // Gerenciamento de Detalhes do Ticket
  getTicketDetailsHTML(ticket) {
    return `
      <div class="ticket-details">
        <p>
          <i class="fas fa-hashtag"></i>
          <strong>ID:</strong>
          ${ticket.id}
        </p>
        <p>
          <i class="fas fa-ticket-alt"></i>
          <strong>Assunto:</strong>
          ${ticket.name || "Sem título"}
        </p>
        <p>
          <i class="fas fa-exclamation-circle"></i>
          <strong>Prioridade:</strong>
          <span class="priority-label priority-${
            ticket.priority?.toLowerCase() || "baixa"
          }">${ticket.priority || "Baixa"}</span>
        </p>
        <p>
          <i class="fas fa-tag"></i>
          <strong>Status:</strong>
          <span class="status-label status-${(ticket.status || "pendente")
            .toLowerCase()
            .replace(" ", "-")}">${ticket.status || "Pendente"}</span>
        </p>
        <p>
          <i class="fas fa-building"></i>
          <strong>Setor:</strong>
          ${ticket.department?.name || "Não especificado"}
        </p>
        <p>
          <i class="fas fa-user"></i>
          <strong>Solicitante:</strong>
          ${ticket.requester?.firstName || "Não especificado"}
        </p>
        <p>
          <i class="fas fa-calendar-alt"></i>
          <strong>Criado em:</strong>
          ${formatarData(ticket.createdAt)}
        </p>
        <p>
          <i class="fas fa-calendar-check"></i>
          <strong>Conclusão:</strong>
          ${
            ticket.completionDate
              ? formatarData(ticket.completionDate)
              : "Não definida"
          }
        </p>
        <p class="full-width">
          <i class="fas fa-align-left"></i>
          <strong>Descrição:</strong>
          ${ticket.description || "Sem descrição"}
        </p>
        ${
          ticket.disapprovalReason
            ? `
        <p class="full-width">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Motivo da Reprovação:</strong>
          ${ticket.disapprovalReason}
        </p>`
            : ""
        }
      </div>
    `;
  }

  async carregarAtualizacoes(ticketId) {
    try {
      const atualizacoes = await this.apiRequest(`/ticket-updates/${ticketId}`);
      const commentContainer = document.getElementById("atualizacoes");

      if (!commentContainer) return;

      commentContainer.innerHTML = "";

      atualizacoes.forEach((a) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.innerHTML = `
          <div class="comment-header">
            <span class="comment-author">${a.user.name}</span>
            <span class="comment-timestamp">${formatarData(a.dateTime)}</span>
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

  async enviarComentario() {
    const comentario = document.getElementById("novoComentario").value;
    if (!comentario.trim()) return;

    try {
      await this.apiRequest("/ticket-updates", {
        method: "POST",
        body: JSON.stringify({
          ticketId: this.currentTicketId,
          comment: comentario,
        }),
      });

      document.getElementById("novoComentario").value = "";
      await this.carregarAtualizacoes(this.currentTicketId);
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      this.showAlert("Erro ao enviar comentário. Tente novamente.");
    }
  }

  async marcarTodasNotificacoesLidas() {
    try {
      const data = await this.apiRequest("/notifications/mark-as-read", {
        method: "POST",
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Atualizar visual das notificações com animação
      const notifications = document.querySelectorAll(".notification-item");
      notifications.forEach((notification) => {
        notification.classList.add("fade-out");
      });

      // Remover as notificações após a animação
      setTimeout(() => {
        const notificationList = document.getElementById("notificationList");
        notificationList.innerHTML = this.getEmptyNotificationHTML();
      }, 300);

      // Zerar o contador
      this.updateNotificationCount(0);

      // Mostrar mensagem de sucesso
      this.showAlert(
        `${data.atualizadas} notificações foram marcadas como lidas`
      );

      // Fechar o modal
      document.getElementById("notificationModal").style.display = "none";

      // Forçar uma verificação das notificações
      this.checkNewNotifications();
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
      this.showAlert("Erro ao marcar notificações como lidas");
    }
  }

  async showTicketDetails(ticketId) {
    try {
      if (!ticketId) {
        throw new Error("ID do ticket não fornecido");
      }

      const ticket = await this.apiRequest(`/tickets/${ticketId}`);
      console.log("Dados do ticket recebidos:", ticket);

      if (!ticket || !ticket.id) {
        throw new Error("Dados do ticket inválidos");
      }

      this.currentTicketId = ticketId;

      const modal = document.getElementById("ticketModal");
      const details = document.getElementById("ticketDetails");

      if (!modal || !details) {
        throw new Error("Elementos do modal não encontrados");
      }

      // Renderizar detalhes do ticket
      details.innerHTML = this.getTicketDetailsHTML(ticket);

      // Limpar e carregar comentários
      const atualizacoesContainer = document.getElementById("atualizacoes");
      if (atualizacoesContainer) {
        atualizacoesContainer.innerHTML = "";
      }

      const comentarioInput = document.getElementById("novoComentario");
      if (comentarioInput) {
        comentarioInput.value = "";
      }

      // Carregar atualizações
      await this.carregarAtualizacoes(ticketId);

      // Exibir modal
      modal.style.display = "block";

      // Focar no campo de comentário
      if (comentarioInput) {
        comentarioInput.focus();
      }
    } catch (error) {
      console.error("Erro detalhado ao exibir detalhes do ticket:", error);
      this.showAlert(`Erro ao exibir detalhes do ticket: ${error.message}`);
    }
  }

  async loadUsuariosPorSetor(setorId) {
    try {
      const selectUsuario = document.getElementById("usuarioDestino");
      selectUsuario.innerHTML =
        '<option value="">Selecione um usuário</option>';

      if (!setorId) return;

      const colaboradores = await this.apiRequest("/users");
      const colaboradoresDoSetor = colaboradores.filter(
        (c) => c.departmentId == setorId
      );

      colaboradoresDoSetor.forEach((colaborador) => {
        const option = document.createElement("option");
        option.value = colaborador.id;
        option.textContent = `${colaborador.firstName} ${colaborador.lastName}`;
        selectUsuario.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar usuários do setor:", error);
      this.showAlert("Erro ao carregar usuários do setor. Tente novamente.");
    }
  }

  async carregarUltimosTickets() {
    const ultimosTicketsList = document.querySelector(".ultimos-tickets-list");
    if (!ultimosTicketsList) return;

    try {
      if (!this.user || !this.user.id) {
        throw new Error("Usuário não identificado");
      }

      const userId = this.user.id;
      const tickets = await this.apiRequest(`/tickets/requester/${userId}`);

      if (!tickets || !Array.isArray(tickets)) {
        throw new Error("Dados inválidos recebidos do servidor");
      }

      const ultimosTickets = tickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (ultimosTickets.length === 0) {
        ultimosTicketsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-ticket-alt"></i>
            <p>Você ainda não criou nenhum ticket</p>
          </div>
        `;
        return;
      }

      ultimosTicketsList.innerHTML = ultimosTickets
        .map(
          (ticket) => `
        <div class="ticket-item" data-ticket-id="${ticket.id}">
          <div class="ticket-header">
            <div class="ticket-title">
              <i class="fas fa-ticket-alt"></i>
              ${ticket.name || "Sem título"}
            </div>
            <span class="ticket-status status-${(ticket.status || "pendente")
              .toLowerCase()
              .replace(" ", "_")}">
              ${(ticket.status || "Pendente").toUpperCase()}
            </span>
          </div>
          <div class="ticket-info">
            <div class="ticket-meta">
              <span>
                <i class="fas fa-calendar-alt"></i> 
                ${formatarData(ticket.createdAt)}
              </span>
              <span>
                <i class="fas fa-building"></i> 
                ${
                  (ticket.department && ticket.department.name) ||
                  "Setor não especificado"
                }
              </span>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      document.querySelectorAll(".ticket-item").forEach((item) => {
        item.addEventListener("click", () => {
          const ticketId = item.dataset.ticketId;
          if (ticketId) this.showTicketDetails(ticketId);
        });
      });
    } catch (error) {
      console.error("Erro ao carregar últimos tickets:", error);
      ultimosTicketsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Não foi possível carregar os últimos tickets</p>
          <small>${error.message}</small>
        </div>
      `;
    }
  }
}

// Inicialização do sistema
let chamadosSystem;

document.addEventListener("DOMContentLoaded", () => {
  window.chamadosSystem = new ChamadosSystem();
  chamadosSystem = window.chamadosSystem;
});

// Chamar a função quando a página carregar e quando um novo ticket for criado
document.addEventListener("DOMContentLoaded", () => {
  console.log("Chamadoss:", chamadosSystem);
  if (chamadosSystem && chamadosSystem.user) {
    chamadosSystem.carregarUltimosTickets();
  }
});

// Adicionar chamada após o login bem-sucedido
if (chamadosSystem) {
  const originalHandleSuccessfulLogin = chamadosSystem.handleSuccessfulLogin;
  chamadosSystem.handleSuccessfulLogin = function (data) {
    originalHandleSuccessfulLogin.call(this, data);
    chamadosSystem.carregarUltimosTickets(); // Recarrega a lista após o login
  };
}

// Adicionar chamada após criar um novo ticket
const originalHandleTicketSubmit = chamadosSystem.handleTicketSubmit;
chamadosSystem.handleTicketSubmit = async function (e) {
  await originalHandleTicketSubmit.call(this, e);
  chamadosSystem.carregarUltimosTickets(); // Recarrega a lista após criar um novo ticket
};

async function carregarMeusTickets() {
  const ticketsCriadosContainer = document.getElementById("ticketsCriados");
  const ticketsRecebidosContainer = document.getElementById("ticketsRecebidos");

  if (!ticketsCriadosContainer || !ticketsRecebidosContainer) return;

  try {
    // Carregar tickets criados (onde o usuário é o requester)
    const ticketsCriados = await chamadosSystem.apiRequest(
      `/tickets/requester/${chamadosSystem.user.id}`
    );
    console.log("Tickets criados:", ticketsCriados);

    // Carregar tickets recebidos (onde o usuário é o targetUser)
    console.log("Target user:", chamadosSystem.user.id)
    const ticketsRecebidos = await chamadosSystem.apiRequest(
      `/tickets/target-user/${chamadosSystem.user.id}`
    );
    console.log("Tickets recebidos:", ticketsRecebidos);

    // Atualizar contadores
    atualizarContadores(ticketsCriados, ticketsRecebidos);

    // Atualizar contadores específicos de cada seção
    document.getElementById("ticketsRecebidosCount").textContent =
      ticketsRecebidos?.length || 0;
    document.getElementById("ticketsCriadosCount").textContent =
      ticketsCriados?.length || 0;

    // Renderizar tickets criados
    if (ticketsCriados && Array.isArray(ticketsCriados)) {
      if (ticketsCriados.length === 0) {
        ticketsCriadosContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-ticket-alt"></i>
            <p>Você ainda não criou nenhum ticket</p>
          </div>
        `;
      } else {
        ticketsCriadosContainer.innerHTML = ticketsCriados
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((ticket) => criarTicketHTML(ticket))
          .join("");
      }
    }

    // Renderizar tickets recebidos
    if (ticketsRecebidos && Array.isArray(ticketsRecebidos)) {
      if (ticketsRecebidos.length === 0) {
        ticketsRecebidosContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Você não tem tickets atribuídos</p>
          </div>
        `;
      } else {
        ticketsRecebidosContainer.innerHTML = ticketsRecebidos
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((ticket) => criarTicketHTML(ticket))
          .join("");
      }
    }

    // Adicionar eventos de clique
    document.querySelectorAll(".ticket-item").forEach((item) => {
      item.addEventListener("click", () => {
        const ticketId = item.dataset.ticketId;
        if (ticketId) chamadosSystem.showTicketDetails(ticketId);
      });
    });
  } catch (error) {
    console.error("Erro ao carregar tickets:", error);
    const errorMessage = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Não foi possível carregar os tickets</p>
        <small>${error.message}</small>
      </div>
    `;
    ticketsCriadosContainer.innerHTML = errorMessage;
    ticketsRecebidosContainer.innerHTML = errorMessage;
  }
}

function formatarData(dataString) {
  if (!dataString) return "-";

  const data = new Date(dataString);

  // Formatar dia, mês, ano
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  // Formatar hora e minuto
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
}

function criarTicketHTML(ticket) {
  return `
    <div class="ticket-item" data-ticket-id="${ticket.id}">
      <div class="ticket-header">
        <div class="ticket-title">
          <i class="fas fa-ticket-alt"></i>
          ${ticket.name || "Sem título"}
        </div>
        <span class="ticket-status status-${(ticket.status || "pendente")
          .toLowerCase()
          .replace(" ", "_")}">
          ${(ticket.status || "PENDENTE").toUpperCase()}
        </span>
      </div>
      <div class="ticket-info">
        <div class="ticket-meta">
          <span>
            <i class="fas fa-calendar-alt"></i>
            ${formatarData(ticket.createdAt)}
          </span>
          <span>
            <i class="fas fa-building"></i>
            ${
              (ticket.department && ticket.department.name) ||
              "Setor não especificado"
            }
          </span>
        </div>
      </div>
    </div>
  `;
}

function atualizarContadores(ticketsCriados = [], ticketsRecebidos = []) {
  // Usar apenas tickets recebidos para o dashboard
  const total = ticketsRecebidos.length;
  const pendentes = ticketsRecebidos.filter(
    (t) => t.status.toUpperCase() === "PENDENTE"
  ).length;
  const emAndamento = ticketsRecebidos.filter(
    (t) => t.status.toUpperCase() === "EM_ANDAMENTO"
  ).length;
  const resolvidos = ticketsRecebidos.filter(
    (t) => t.status.toUpperCase() === "FINALIZADO"
  ).length;

  document.querySelectorAll(".summary-item").forEach((item) => {
    const label = item.querySelector(".stat-label").textContent.toLowerCase();
    const numberElement = item.querySelector(".stat-number");

    switch (label) {
      case "total":
        numberElement.textContent = total;
        break;
      case "pendentes":
        numberElement.textContent = pendentes;
        break;
      case "em andamento":
        numberElement.textContent = emAndamento;
        break;
      case "resolvidos":
        numberElement.textContent = resolvidos;
        break;
    }
  });
}
