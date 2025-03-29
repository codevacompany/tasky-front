/**
 * Arquivo principal da aplicação Tasky
 * Inicializa todos os módulos e configura o comportamento global
 */
import { CONFIG } from './config.js';
import { apiService } from './services/ApiService.js';
import { uiService } from './services/UiService.js';
import { userModule } from './modules/UserModule.js';
import { ticketModule } from './modules/TicketModule.js';
import { notificationModule } from './modules/NotificationModule.js';
import { adminModule } from './modules/AdminModule.js';

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
        uiService.closeNotificationModal();
      }
      
      // Verificar se o dropdown de perfil já está aberto
      const profileModal = document.getElementById('profileModal');
      if (profileModal && profileModal.classList.contains('show')) {
        uiService.closeProfileModal();
      } else {
        if (userModule) {
          // Primeiro carregar os dados do perfil
          userModule.loadProfileForm();
          
          // Depois mostrar o dropdown
          setTimeout(() => {
            uiService.showProfileModal();
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
    
    // Fechar dropdown de notificações se estiver aberto
    const notificationsModal = document.getElementById('notificationsModal');
    if (notificationsModal && notificationsModal.classList.contains('show') && 
        !notificationsModal.contains(e.target) && 
        !document.getElementById('notificationButton').contains(e.target)) {
      uiService.closeNotificationModal();
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
  
  // Botão para fechar o modal de notificações
  const closeNotificationsBtn = document.querySelector('[data-close-modal="notificationsModal"]');
  if (closeNotificationsBtn) {
    closeNotificationsBtn.addEventListener('click', function() {
      console.log('Fechando modal de notificações via botão close');
      uiService.closeNotificationModal();
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
  } else {
    console.log('Usuário não autenticado, mostrando tela de login');
    uiService.showLoginSection();
  }
}

// Iniciar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);

// Exportar para possível uso em testes ou desenvolvimento
export { initApp, startConnectionCheck }; 