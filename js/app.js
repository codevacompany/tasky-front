/**
 * Arquivo principal da aplicação Tasky
 * Inicializa todos os módulos e configura o comportamento global
 */
import { CONFIG } from './config.js';
import { apiService } from './services/ApiService.js';
import { uiService } from './services/UiService.js';
import { ticketModule } from './modules/TicketModule.js';
import { notificationModule } from './modules/NotificationModule.js';
import { adminModule } from './modules/AdminModule.js';
import { userModule } from './modules/UserModule.js';

// Configurar eventos globais
function setupGlobalEvents() {
  // Configurar alternância do modo escuro/claro - somente para interfaces após login
  document.getElementById('darkModeToggle').addEventListener('click', function() {
    // Apenas alternar o modo escuro se não estiver na tela de login
    if (!document.getElementById('loginSection').classList.contains('active')) {
      document.body.classList.toggle('dark-mode');
      updateLogoBasedOnTheme();
    }
  });
  
  // Configurar logo inicial baseada no tema atual
  updateLogoBasedOnTheme();
  
  // Configuração geral para fechamento de modais
  document.addEventListener('click', function(e) {
    const closeModalBtn = e.target.closest('[data-close-modal]');
    if (closeModalBtn) {
      const modalId = closeModalBtn.getAttribute('data-close-modal');
      uiService.closeModal(modalId);
    }
  });
  
  // Função para atualizar a logo baseada no tema
  function updateLogoBasedOnTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const headerLogo = document.getElementById('headerLogo');
    const loginLogo = document.getElementById('loginLogo');
    const themeToggleIcon = document.querySelector('#darkModeToggle i');
    
    if (headerLogo) {
      headerLogo.src = isDarkMode ? './images/tasky-white.png' : './images/tasky.png';
    }
    
    if (loginLogo) {
      // Login logo sempre usa a versão branca para o cabeçalho preto
      loginLogo.src = './images/tasky-white.png';
    }
    
    if (themeToggleIcon) {
      themeToggleIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
  
  // Dropdowns
  document.addEventListener('click', function(e) {
    const dropdown = e.target.closest('.dropdown-toggle');
    
    if (dropdown) {
      e.preventDefault();
      
      // Fechar outros dropdowns
      document.querySelectorAll('.dropdown-toggle.active').forEach(item => {
        if (item !== dropdown) {
          item.classList.remove('active');
          const dropdownMenu = item.nextElementSibling;
          if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
            dropdownMenu.classList.remove('show');
          }
        }
      });
      
      // Toggle dropdown atual
      dropdown.classList.toggle('active');
      const menu = dropdown.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        menu.classList.toggle('show');
      }
    } else if (!e.target.closest('.dropdown-menu')) {
      // Fechar todos os dropdowns se clicar fora
      document.querySelectorAll('.dropdown-toggle.active').forEach(item => {
        item.classList.remove('active');
      });
      
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
  
  // Botão de perfil
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.addEventListener('click', function(e) {
      e.stopPropagation(); // Evitar que o clique se propague para o documento
      console.log('Perfil clicado');
      
      // Verificar se o dropdown de notificações está aberto e fechá-lo
      const notificationsModal = document.getElementById('notificationsModal');
      if (notificationsModal && notificationsModal.classList.contains('show')) {
        notificationModule.closeNotifications();
      }
      
      // Verificar se o dropdown de perfil já está aberto
      const profileModal = document.getElementById('profileModal');
      if (profileModal && profileModal.classList.contains('show')) {
        // Se estiver aberto, fechar
        console.log('Fechando dropdown de perfil que já estava aberto');
        uiService.closeProfileModal();
      } else {
        // Se estiver fechado, abrir
        console.log('Abrindo dropdown de perfil');
        if (userModule) {
          // Primeiro carregar os dados do perfil
          userModule.loadProfileForm();
          
          // Depois mostrar o dropdown
          setTimeout(() => {
            // Garantir transparência do container
            if (profileModal) {
              profileModal.style.backgroundColor = 'transparent';
              console.log('Chamando showProfileModal');
              uiService.showProfileModal();
            } else {
              console.error('Elemento profileModal não encontrado');
            }
          }, 100);
        } else {
          console.error('Módulo de usuário não disponível');
        }
      }
    });
  }
  
  // Fechar dropdowns ao clicar fora deles
  document.addEventListener('click', function(e) {
    // Fechar dropdown de perfil se estiver aberto
    const profileModal = document.getElementById('profileModal');
    if (profileModal && profileModal.classList.contains('show') && 
        !profileModal.contains(e.target) && 
        !document.getElementById('profileButton').contains(e.target)) {
      uiService.closeProfileModal();
    }
  });
  
  // Clicar fora do dropdown de notificações para fechar
  document.addEventListener('click', function(e) {
    const notificationBtn = document.getElementById('notificationButton');
    const notificationModal = document.getElementById('notificationsModal');
    
    if (notificationModal && notificationModal.classList.contains('show') && 
        !notificationModal.contains(e.target) && 
        !document.getElementById('notificationButton').contains(e.target)) {
      console.log('Clique fora do dropdown, fechando notificações');
      notificationModule.closeNotifications();
    }
  });
  
  // Botão de notificações
  const notificationButton = document.getElementById('notificationButton');
  if (notificationButton) {
    notificationButton.addEventListener('click', function() {
      console.log('Notificações clicadas');
      notificationModule.showNotifications();
    });
  }
  
  // Botão para fechar o dropdown de notificações
  const closeNotificationsBtn = document.querySelector('[data-close-modal="notificationsModal"]');
  if (closeNotificationsBtn) {
    closeNotificationsBtn.addEventListener('click', function() {
      console.log('Fechando dropdown de notificações via botão close');
      notificationModule.closeNotifications();
    });
  }
  
  // Botão para marcar todas as notificações como lidas
  const markAllReadButton = document.getElementById('markAllReadButton');
  if (markAllReadButton) {
    markAllReadButton.addEventListener('click', function() {
      console.log('Marcando todas as notificações como lidas');
      notificationModule.marcarTodasNotificacoesLidas();
    });
  }
  
  // Botão de novo ticket
  const newTicketButton = document.getElementById('newTicketButton');
  if (newTicketButton) {
    newTicketButton.addEventListener('click', function() {
      console.log('Novo ticket clicado');
      uiService.showNewTicketModal();
    });
  }
  
  // Botão para fechar o dropdown de perfil
  const closeProfileBtn = document.getElementById('closeProfileBtn');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', function() {
      console.log('Fechando dropdown de perfil via botão close');
      uiService.closeProfileModal();
    });
  }
}

// Verificação periódica de conectividade
let connectionCheckInterval = null;

function startConnectionCheck() {
  // Limpar intervalo existente se houver
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  // Verificar a cada 30 segundos
  connectionCheckInterval = setInterval(async () => {
    const isConnected = await checkServerConnection();
    if (isConnected) {
      // Se a conexão foi restaurada, recarregar a página
      clearInterval(connectionCheckInterval);
      window.location.reload();
    }
  }, 30000);
}

// Adicionar evento para detectar mudanças na conectividade do navegador
window.addEventListener('online', () => {
  checkServerConnection();
});

// Comentamos o evento 'offline' para não mostrar o banner
// window.addEventListener('offline', () => {
//   uiService.showOfflineBanner();
// });

// Exportar módulos para acesso global
window.ticketModule = ticketModule;
window.adminModule = adminModule;

// Inicialização da aplicação
async function initApp() {
  console.log('Inicializando aplicação Tasky');
  
  // Inicializar serviços
  uiService.init();
  
  // Inicializar módulos
  userModule.init();
  
  // Configurar eventos globais
  setupGlobalEvents();
  
  // Verificar autenticação
  if (userModule.isAuthenticated()) {
    console.log('Usuário já autenticado, carregando interface principal');
    
    // Atualizar a interface com os dados do usuário
    userModule.updateUserInterface();
    
    // Inicializar módulos que dependem de autenticação
    ticketModule.init();
    notificationModule.init();
    
    // Inicializar módulo de administrador se o usuário for admin
    if (userModule.isAdmin()) {
      adminModule.init();
      uiService.showAdminInterface();
    } else {
      uiService.showUserInterface();
    }
    
    // Mostrar a seção do dashboard inicialmente
    uiService.showSection('dashboard');
    
    // Forçar atualização do dashboard após um pequeno atraso para garantir que todos os módulos estejam inicializados
    setTimeout(() => {
      console.log('Atualizando dashboard após inicialização');
      if (adminModule) {
        adminModule.updateDashboardStats();
      }
    }, 500);
  } else {
    console.log('Usuário não autenticado, mostrando tela de login');
    uiService.showLoginSection();
  }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Inicializando aplicação...');
  
  try {
    // Inicializar aplicação
    await initApp();
    
    // Iniciar verificação de conexão
    startConnectionCheck();
    
    // Configurar manipuladores para o formulário de novo ticket
    setupNewTicketHandlers();
    
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
});

// Exportar para possível uso em testes ou desenvolvimento
export { initApp, startConnectionCheck };

// Adicionar manipuladores para o formulário de novo ticket
function setupNewTicketHandlers() {
  // Referências aos elementos
  const newTicketForm = document.getElementById('newTicketForm');
  const clearTicketFormBtn = document.getElementById('clearTicketForm');
  const ticketDepartmentSelect = document.getElementById('ticketDepartment');
  const ticketUserSelect = document.getElementById('ticketUser');
  
  // Configurar submissão do formulário
  if (newTicketForm) {
    newTicketForm.addEventListener('submit', async (event) => {
      if (window.ticketModule) {
        // Usar o método do módulo de tickets para processar o envio
        await window.ticketModule.handleCreateTicket(event);
      } else {
        // Fallback caso o módulo não esteja disponível
        event.preventDefault();
        console.error('Módulo de tickets não inicializado');
        window.uiService?.showAlert('Erro ao processar solicitação. Recarregue a página.', 'error');
      }
    });
  }
  
  // Limpar formulário ao clicar no botão Limpar
  if (clearTicketFormBtn) {
    clearTicketFormBtn.addEventListener('click', () => {
      if (newTicketForm) {
        newTicketForm.reset();
        // Desabilitar o select de usuários
        if (ticketUserSelect) {
          ticketUserSelect.disabled = true;
          ticketUserSelect.innerHTML = '<option value="">Selecione um setor primeiro</option>';
        }
      }
    });
  }
  
  // Carregar usuários do setor quando um setor for selecionado
  if (ticketDepartmentSelect) {
    ticketDepartmentSelect.addEventListener('change', async () => {
      const selectedSectorId = ticketDepartmentSelect.value;
      
      if (ticketUserSelect) {
        // Resetar e desabilitar enquanto carrega
        ticketUserSelect.disabled = true;
        ticketUserSelect.innerHTML = '<option value="">Carregando usuários...</option>';
        
        if (selectedSectorId) {
          try {
            // Buscar usuários do setor selecionado
            const users = await userModule.getUsersBySector(selectedSectorId);
            
            // Preencher o select com os usuários
            ticketUserSelect.innerHTML = '<option value="">Selecione um usuário</option>';
            
            if (users && users.length > 0) {
              users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                
                // Obtendo nome do usuário baseado nos campos disponíveis
                // Campos da tabela user: id, created_at, updated_at, firstName, lastName, email, password, isAdmin, isActive, departmentId
                let displayName;
                
                if (user.firstName) {
                  displayName = user.firstName + (user.lastName ? ' ' + user.lastName : '');
                } else if (user.name) {
                  displayName = user.name;
                } else if (user.email) {
                  // Usa o email como fallback se não tiver nome
                  displayName = user.email.split('@')[0];
                } else {
                  displayName = `Usuário ${user.id}`;
                }
                
                option.textContent = displayName;
                ticketUserSelect.appendChild(option);
              });
              ticketUserSelect.disabled = false;
            } else {
              ticketUserSelect.innerHTML = '<option value="">Nenhum usuário encontrado</option>';
            }
          } catch (error) {
            console.error('Erro ao carregar usuários do setor:', error);
            ticketUserSelect.innerHTML = '<option value="">Erro ao carregar usuários</option>';
          }
        } else {
          ticketUserSelect.innerHTML = '<option value="">Selecione um setor primeiro</option>';
        }
      }
    });
  }
  
  // Permitir apenas uma prioridade selecionada por vez
  const priorityCheckboxes = document.querySelectorAll('input[name="ticketPriority"]');
  if (priorityCheckboxes.length > 0) {
    // Desmarcar todas as opções por padrão
    priorityCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    priorityCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          priorityCheckboxes.forEach(cb => {
            if (cb !== this) cb.checked = false;
          });
        }
      });
    });
  }
} 