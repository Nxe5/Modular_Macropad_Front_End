import { writable, get } from 'svelte/store'

// Define interfaces for our API data structures
export interface Macro {
  id: string
  name: string
  description?: string
  commands: MacroCommand[]
}

export interface MacroCommand {
  type: string
  report?: number[]
  text?: string
  ms?: number
  macro_id?: string
}

export interface ModuleComponent {
  id: string
  type: string
  position: { row: number; column: number }
  size?: { rows: number; columns: number }
  keyBinding?: string
}

export interface Module {
  id: string
  name: string
  description?: string
  gridSize: { rows: number; columns: number }
  components: ModuleComponent[]
}

// ====== API Configuration ======
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:80'
    : `http://${window.location.hostname}`

const WS_URL =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:80/ws'
    : `ws://${window.location.hostname}/ws`

// Create store for macros
function createMacroStore() {
  const { subscribe, set, update } = writable<Macro[]>([])

  return {
    subscribe,

    // Fetch all macros
    fetchAll: async (): Promise<Macro[]> => {
      try {
        const response = await fetch(`${API_URL}/api/macros`)

        if (!response.ok) {
          throw new Error(`Failed to fetch macros: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        set(data)
        return data
      } catch (error) {
        console.error('Error fetching macros:', error)
        throw error
      }
    },

    // Fetch a specific macro
    fetchMacro: async (id: string): Promise<Macro> => {
      try {
        const response = await fetch(`${API_URL}/api/macros/${id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch macro: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error(`Error fetching macro ${id}:`, error)
        throw error
      }
    },

    // Create a new macro
    createMacro: async (macro: Macro): Promise<Macro> => {
      try {
        const response = await fetch(`${API_URL}/api/macros`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(macro)
        })

        if (!response.ok) {
          throw new Error(`Failed to create macro: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        update(macros => [...macros, data])
        return data
      } catch (error) {
        console.error('Error creating macro:', error)
        throw error
      }
    },

    // Update an existing macro
    updateMacro: async (id: string, macro: Macro): Promise<Macro> => {
      try {
        const response = await fetch(`${API_URL}/api/macros/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(macro)
        })

        if (!response.ok) {
          throw new Error(`Failed to update macro: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        update(macros => macros.map(m => (m.id === id ? data : m)))
        return data
      } catch (error) {
        console.error(`Error updating macro ${id}:`, error)
        throw error
      }
    },

    // Delete a macro
    deleteMacro: async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/api/macros/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error(`Failed to delete macro: ${response.status} ${response.statusText}`)
        }

        update(macros => macros.filter(m => m.id !== id))
      } catch (error) {
        console.error(`Error deleting macro ${id}:`, error)
        throw error
      }
    },

    // Execute a macro via the REST API
    executeMacro: async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/api/macros/${id}/execute`, {
          method: 'POST'
        })

        if (!response.ok) {
          throw new Error(`Failed to execute macro: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error(`Error executing macro ${id}:`, error)
        throw error
      }
    }
  }
}

// Create WebSocket connection for real-time updates
function createWebSocketStore() {
  const { subscribe, set, update } = writable({
    connected: false,
    events: [] as any[]
  })

  let socket: WebSocket | null = null
  let reconnectTimer: number | null = null

  // Create store object with methods
  const wsStore = {
    subscribe,

    connect: () => {
      try {
        // Only connect if we're not already connected
        const state = get({ subscribe })
        if (state.connected) return

        socket = new WebSocket(WS_URL)

        socket.onopen = () => {
          console.log('WebSocket connected')
          update(state => ({ ...state, connected: true }))
        }

        socket.onclose = () => {
          if (reconnectTimer) {
            clearTimeout(reconnectTimer)
          }
          update(state => ({ ...state, connected: false }))
          console.log('WebSocket disconnected, will attempt to reconnect')
          reconnectTimer = setTimeout(() => wsStore.connect(), 3000) as any
        }

        socket.onerror = error => {
          console.log('WebSocket connection error, will retry automatically')
          update(state => ({ ...state, connected: false }))
        }

        socket.onmessage = event => {
          try {
            const data = JSON.parse(event.data)
            update(state => ({
              ...state,
              events: [...state.events.slice(-99), data] // Keep last 100 events
            }))
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }
      } catch (error) {
        console.log('Error initializing WebSocket, will retry')
        reconnectTimer = setTimeout(() => wsStore.connect(), 3000) as any
      }
    },

    disconnect: () => {
      if (socket) {
        socket.close()
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
      }
    },

    sendMessage: (message: any): Promise<void> => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
        return Promise.resolve()
      } else {
        console.error('WebSocket not connected, unable to send message')
        return Promise.reject(new Error('WebSocket not connected'))
      }
    },

    executeMacro: (id: string): Promise<void> => {
      // Execute a macro via WebSocket for real-time feedback
      return wsStore.sendMessage({
        type: 'execute_macro',
        macroId: id
      })
    },

    assignMacroToButton: (macroId: string, buttonId: string): Promise<void> => {
      // Send command to assign a macro to a button
      return wsStore.sendMessage({
        type: 'assign_macro',
        macroId: macroId,
        buttonId: buttonId
      })
    },

    saveMacro: (macro: Macro): Promise<void> => {
      // Save via WebSocket for immediate feedback
      return wsStore.sendMessage({
        type: 'save_macro',
        macro: macro
      })
    },

    clearEvents: () => {
      update(state => ({ ...state, events: [] }))
    }
  }

  return wsStore
}

// Add new function to save configuration
function createConfigStore() {
  interface ConfigState {
    loading: boolean
    error: string | null
    lastSaved: string | null
  }

  const { subscribe, set, update } = writable<ConfigState>({
    loading: false,
    error: null,
    lastSaved: null
  })

  return {
    subscribe,

    // Save the macropad configuration
    saveConfig: async (modules: Module[]): Promise<boolean> => {
      try {
        update(state => ({ ...state, loading: true, error: null }))

        const response = await fetch(`${API_URL}/api/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ modules })
        })

        if (!response.ok) {
          throw new Error(`Failed to save configuration: ${response.status} ${response.statusText}`)
        }

        update(state => ({
          ...state,
          loading: false,
          lastSaved: new Date().toISOString()
        }))

        return true
      } catch (error: any) {
        console.error('Error saving configuration:', error)
        update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Failed to save configuration'
        }))
        throw error
      }
    },

    // Save via WebSocket for immediate feedback
    saveConfigWs: (modules: Module[]): Promise<boolean> => {
      if (!get(wsStore).connected) {
        return Promise.reject(new Error('WebSocket not connected'))
      }

      return wsStore
        .sendMessage({
          type: 'save_config',
          data: { modules }
        })
        .then(() => {
          update(state => ({
            ...state,
            lastSaved: new Date().toISOString()
          }))
          return true
        })
    }
  }
}

// Export the stores
export const macroStore = createMacroStore()
export const wsStore = createWebSocketStore()
export const configStore = createConfigStore()
