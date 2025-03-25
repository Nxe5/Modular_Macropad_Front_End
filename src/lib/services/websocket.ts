import { writable, get } from 'svelte/store';
import { esp32Config } from '../stores/config';

// Connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Create stores
export const connectionState = writable<ConnectionState>(ConnectionState.DISCONNECTED);
export const lastError = writable<string | null>(null);

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

/**
 * Initialize WebSocket connection to ESP32
 */
export function connectToESP32(customIp?: string, customPort?: string): void {
  // Close any existing connection
  if (socket) {
    socket.close();
  }

  // Get connection details from store or use provided values
  const config = get(esp32Config);
  const ip = customIp || config.ip;
  const port = customPort || config.port;

  const wsUrl = `ws://${ip}:${port}/ws`;
  connectionState.set(ConnectionState.CONNECTING);
  lastError.set(null);
  
  try {
    socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('Connected to ESP32');
      connectionState.set(ConnectionState.CONNECTED);
      reconnectAttempts = 0;
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle incoming messages here
        console.log('Message from ESP32:', data);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      console.log('Disconnected from ESP32');
      connectionState.set(ConnectionState.DISCONNECTED);
      attemptReconnect();
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      connectionState.set(ConnectionState.ERROR);
      lastError.set('Failed to connect to ESP32');
    });
    
  } catch (err) {
    console.error('Error creating WebSocket:', err);
    connectionState.set(ConnectionState.ERROR);
    lastError.set(`Failed to create WebSocket: ${err}`);
  }
}

/**
 * Send data to ESP32
 */
export function sendMessage(data: any): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

/**
 * Disconnect from ESP32
 */
export function disconnect(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

/**
 * Attempt to reconnect to ESP32
 */
function attemptReconnect(): void {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      connectToESP32();
    }, RECONNECT_DELAY);
  }
}

/**
 * Force a reconnection attempt
 */
export function forceReconnect(): void {
  reconnectAttempts = 0;
  connectToESP32();
} 