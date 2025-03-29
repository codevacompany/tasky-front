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

// Configurar listeners de eventos globais
function setupGlobalEventListeners() {
  // Tema escuro/claro
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Aplicar tema salvo
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme === CONFIG.THEMES.DARK) {
      document.body.classList.add('dark-mode');
    }
  }
  
  // Botão de perfil
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.addEventListener('click', () => {
      userModule.loadProfileForm();
      uiService.showProfileModal();
    });
  }
  
  // Botão de notificações
  const notificationButton = document.getElementById('notificationButton');
  if (notificationButton) {
    notificationButton.addEventListener('click', () => {
      notificationModule.showNotifications();
    });
  }
  
  // Marcar todas as notificações como lidas
  const markAllReadButton = document.getElementById('markAllReadButton');
  if (markAllReadButton) {
    markAllReadButton.addEventListener('click', () => {
      notificationModule.marcarTodasNotificacoesLidas();
    });
  }
  
  // Botão de novo ticket
  const newTicketButton = document.getElementById('newTicketButton');
  if (newTicketButton) {
    newTicketButton.addEventListener('click', () => {
      uiService.showNewTicketModal();
    });
  }
}

// Alternar entre tema claro e escuro
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  
  // Salvar preferência
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem(
    CONFIG.STORAGE_KEYS.THEME, 
    isDarkMode ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT
  );
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
  setupGlobalEventListeners();
  
  // Verificar autenticação
  if (userModule.isAuthenticated()) {
    console.log('Usuário já autenticado, carregando interface principal');
    
    // Inicializar módulos que dependem de autenticação
    ticketModule.init();
    notificationModule.init();
    
    // Mostrar interface com base no perfil
    if (userModule.isAdmin()) {
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
export { initApp, checkServerConnection, toggleDarkMode, startConnectionCheck }; 