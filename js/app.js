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

// Verificar conexão com o servidor
async function checkServerConnection() {
  try {
    await apiService.checkHealth();
    console.log('Conexão com o servidor estabelecida com sucesso');
    uiService.hideOfflineBanner(); // Se já estava mostrando, esconder agora
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o servidor:', error);
    // Comentamos as linhas abaixo para permitir uso mesmo sem conexão
    // uiService.showAlert('Não foi possível conectar ao servidor. Algumas funcionalidades podem estar limitadas.', 'warning');
    // uiService.showOfflineBanner();
    return false;
  }
}

// Configurar eventos globais
function setupGlobalEvents() {
  // Forçar modo escuro
  document.body.classList.add('dark-mode');
  
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
    profileButton.addEventListener('click', function() {
      console.log('Perfil clicado');
      
      if (userModule) {
        // Primeiro carregar os dados do perfil
        userModule.loadProfileForm();
        
        // Depois mostrar o modal
        setTimeout(() => {
          uiService.showProfileModal();
        }, 100);
      } else {
        console.error('Módulo de usuário não disponível');
      }
    });
  }
  
  // Botão de notificações
  const notificationButton = document.getElementById('notificationButton');
  if (notificationButton) {
    notificationButton.addEventListener('click', function() {
      console.log('Notificações clicadas');
      notificationModule.showNotifications();
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

// Inicialização da aplicação
async function initApp() {
  console.log('Inicializando aplicação Tasky');
  
  // Inicializar serviços
  uiService.init();
  
  // Verificar conexão com o servidor
  const isConnected = await checkServerConnection();
  if (!isConnected) {
    // Comentamos as linhas abaixo para não mostrar o banner offline
    // uiService.showOfflineBanner();
    
    // Se estiver offline, verificar periodicamente se o servidor voltou
    startConnectionCheck();
    // Continuar com a inicialização mesmo offline
  }
  
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
export { initApp, checkServerConnection, startConnectionCheck }; 