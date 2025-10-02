import { config } from './config'

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private connectionId: string | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private url: string = config.websocketUrl) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected to backend');
          console.log('🔌 WebSocket readyState:', this.ws?.readyState);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('🔌 Raw WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            console.log('🔌 Parsed WebSocket data:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔌 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    console.log('🔌 WebSocket received message:', data);
    console.log('🔌 Looking for handler for type:', data.type);
    console.log('🔌 Available handlers:', Array.from(this.messageHandlers.keys()));
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      console.log('🔌 Found handler, calling it');
      handler(data);
    } else {
      console.log('❌ No handler found for message type:', data.type);
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    console.log('🔌 Registering handler for type:', type);
    this.messageHandlers.set(type, handler);
    console.log('🔌 Total handlers registered:', this.messageHandlers.size);
  }

  sendMessage(action: string, data: any = {}) {
    console.log('🔌 WebSocket sending message:', { action, ...data });
    console.log('🔌 WebSocket readyState:', this.ws?.readyState);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }));
      console.log('🔌 Message sent successfully');
    } else {
      console.error('❌ WebSocket is not connected. Ready state:', this.ws?.readyState);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Convenience methods for common operations
  processRequest(userInput: string, projectName?: string) {
    this.sendMessage('process_request', { userInput, projectName });
  }

  getProjects() {
    console.log('🔌 WebSocket: Sending get_projects message')
    this.sendMessage('get_projects');
  }

  getProjectFiles(projectName: string) {
    this.sendMessage('get_project_files', { projectName });
  }

  getFileContent(projectName: string, filePath: string) {
    this.sendMessage('get_file_content', { projectName, filePath });
  }

  saveFile(projectName: string, filePath: string, content: string) {
    this.sendMessage('save_file', { projectName, filePath, content });
  }

  stopAgent() {
    this.sendMessage('stop_agent');
  }
}
