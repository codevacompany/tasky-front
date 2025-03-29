/**
 * Configurações globais da aplicação
 */
export const CONFIG = {
  // API
  API_URL: 'https://tasky-api-lime.vercel.app',
  API_BASE_URL: 'https://tasky-api-lime.vercel.app',
  
  // Intervalos
  NOTIFICATION_CHECK_INTERVAL: 60000, // 60 segundos
  SESSION_TIMEOUT: 1800000, // 30 minutos
  
  // Paginação
  ITEMS_PER_PAGE: 10,
  
  // Status dos tickets
  TICKET_STATUS: {
    PENDING: 'pendente',
    IN_PROGRESS: 'em_andamento',
    RESOLVED: 'resolvido',
    CANCELED: 'cancelado'
  },
  
  // Prioridades
  TICKET_PRIORITY: {
    LOW: 'baixa',
    MEDIUM: 'media',
    HIGH: 'alta'
  },
  
  // Configurações de armazenamento
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'app_theme',
    NOTIFICATION_COUNT: 'notification_count'
  },
  
  // Temas
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  }
}; 