// Configuration for API endpoints and URLs
export const config = {
  // Backend API URL
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  
  // WebSocket URL
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
  
  // Frontend URL (for redirects and links)
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  
  // Development server URL
  devServerUrl: process.env.NEXT_PUBLIC_DEV_SERVER_URL || 'http://localhost:3000',
}

// Helper functions for API calls
export const api = {
  // Chat API endpoints
  chats: {
    list: () => `${config.backendUrl}/api/chats`,
    create: () => `${config.backendUrl}/api/chats`,
    update: (id: string) => `${config.backendUrl}/api/chats/${id}`,
    delete: (id: string) => `${config.backendUrl}/api/chats/${id}`,
  },
  
  // Messages API endpoints
  messages: {
    list: (chatId: string) => `${config.backendUrl}/api/messages/chat/${chatId}`,
    create: () => `${config.backendUrl}/api/messages`,
    update: (id: string) => `${config.backendUrl}/api/messages/${id}`,
    delete: (id: string) => `${config.backendUrl}/api/messages/${id}`,
  },
  
  // Projects API endpoints
  projects: {
    list: () => `${config.frontendUrl}/api/projects`,
    create: () => `${config.frontendUrl}/api/projects`,
    files: (projectName: string) => `${config.frontendUrl}/api/projects/${projectName}/files`,
    file: (projectName: string) => `${config.frontendUrl}/api/projects/${projectName}/file`,
  },
  
  // Development server API endpoints
  devServer: {
    start: () => `${config.frontendUrl}/api/dev-server/start`,
    stop: () => `${config.frontendUrl}/api/dev-server/stop`,
    status: () => `${config.frontendUrl}/api/dev-server/status`,
  },
  
  // Todos API endpoints
  todos: {
    list: (chatId: string) => `${config.backendUrl}/api/todos/chat/${chatId}`,
    create: () => `${config.backendUrl}/api/todos`,
    update: (id: string) => `${config.backendUrl}/api/todos/${id}`,
    delete: (id: string) => `${config.backendUrl}/api/todos/${id}`,
  },
  
  // Subtasks API endpoints
  subtasks: {
    get: (id: string) => `${config.backendUrl}/api/subtasks/${id}`,
    create: () => `${config.backendUrl}/api/subtasks`,
    update: (id: string) => `${config.backendUrl}/api/subtasks/${id}`,
    delete: (id: string) => `${config.backendUrl}/api/subtasks/${id}`,
  },
}
