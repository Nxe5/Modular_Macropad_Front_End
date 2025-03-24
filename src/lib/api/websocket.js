// WebSocketStore class to manage WebSocket connections
class WebSocketStore {
  constructor() {
    this.socket = null
    this.reconnectTimer = null
    this.heartbeatInterval = null
    this.subscribers = []
    this.state = {
      connected: false,
      connectionVerified: false,
      events: [],
      lastPingResponse: null
    }

    // Add message queue to store messages when disconnected
    this.messageQueue = []
    this.isConnectionReady = false
    this.connectionReadyTimeout = null
    this.reconnectAttempts = 0
    this.maxReconnectDelay = 30000 // 30 seconds max delay
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback)
    callback(this.state)

    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  // Update state and notify subscribers
  setState(newState) {
    this.state = { ...this.state, ...newState }
    this.subscribers.forEach(callback => callback(this.state))
  }

  // Connect to WebSocket server
  connect() {
    try {
      // Only connect if we're not already connected
      if (this.state.connected) {
        console.log('WebSocket already connected, skipping connection attempt')
        return
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const WS_URL = `${wsProtocol}//${window.location.hostname}/ws`

      // Clear any existing ready timeout
      if (this.connectionReadyTimeout) {
        clearTimeout(this.connectionReadyTimeout)
      }

      // Reset connection ready flag
      this.isConnectionReady = false

      console.log('Attempting to connect to WebSocket at:', WS_URL)
      this.socket = new WebSocket(WS_URL)

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully')
        console.log('WebSocket readyState:', this.socket.readyState)
        this.setState({ connected: true })
        this.reconnectAttempts = 0 // Reset reconnect attempts on successful connection

        // Set a delay before considering the connection fully ready for use
        this.connectionReadyTimeout = setTimeout(() => {
          console.log('Connection marked as ready for use')
          this.isConnectionReady = true

          // Process any queued messages
          this.processMessageQueue()

          // Request initial configuration data
          this.requestInitialData()
        }, 1000) // Wait 1 second before using the connection

        // Start heartbeat to verify connection is working
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval)
        }

        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000) // Send ping every 30 seconds
      }

      this.socket.onclose = event => {
        console.log('WebSocket closed with code:', event.code, 'reason:', event.reason)
        this.cleanupConnection()
        this.scheduleReconnect()
      }

      this.socket.onerror = error => {
        console.error('WebSocket connection error:', error)
        this.cleanupConnection()
        // Don't reconnect here, let onclose handle it
      }

      this.socket.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', {
            type: data.type,
            timestamp: new Date().toISOString(),
            data: data
          })

          // Fix fields if needed
          if (data.key_bindings) {
            // Map component_id to buttonId for compatibility
            data.key_bindings = data.key_bindings.map(binding => {
              if (binding.component_id && !binding.buttonId) {
                binding.buttonId = binding.component_id
              }
              return binding
            })
          }

          // Mark connection as verified once we receive any message
          this.setState({
            connectionVerified: true,
            events: [...this.state.events.slice(-99), data], // Keep last 100 events
            ...(data.type === 'pong' ? { lastPingResponse: Date.now() } : {})
          })
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Error initializing WebSocket:', error)
      this.cleanupConnection()
      this.scheduleReconnect()
    }
  }

  // Send heartbeat ping and monitor for response
  sendHeartbeat() {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Sending heartbeat ping')
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))

        // If we haven't received a response in 10 seconds, reconnect
        setTimeout(() => {
          const now = Date.now()
          if (this.state.lastPingResponse === null || now - this.state.lastPingResponse > 10000) {
            console.log(
              'Connection seems dead (no ping response). Last response:',
              this.state.lastPingResponse
                ? new Date(this.state.lastPingResponse).toISOString()
                : 'never'
            )
            console.log('Current time:', new Date(now).toISOString())
            this.reconnect()
          }
        }, 10000)
      } else {
        console.warn('WebSocket not in OPEN state during heartbeat:', this.socket?.readyState)
      }
    } catch (err) {
      console.error('Error sending ping:', err)
    }
  }

  // Request initial data when connection is established
  requestInitialData() {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Requesting initial configuration data')
        this.sendMessage({ type: 'get_all_configs' })

        // If we don't get a response in 5 seconds, mark as not verified
        setTimeout(() => {
          if (!this.state.connectionVerified) {
            console.warn(
              'No initial data received after 5 seconds. Connection may be partially working.'
            )
            console.log('Current WebSocket state:', {
              readyState: this.socket?.readyState,
              connected: this.state.connected,
              connectionVerified: this.state.connectionVerified,
              lastPingResponse: this.state.lastPingResponse
                ? new Date(this.state.lastPingResponse).toISOString()
                : 'never'
            })
            this.setState({ connectionVerified: false })
          }
        }, 5000)
      } else {
        console.warn(
          'WebSocket not in OPEN state when requesting initial data:',
          this.socket?.readyState
        )
      }
    } catch (err) {
      console.error('Error requesting initial data:', err)
    }
  }

  // Clean up connections and intervals
  cleanupConnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.connectionReadyTimeout) {
      clearTimeout(this.connectionReadyTimeout)
      this.connectionReadyTimeout = null
    }

    this.isConnectionReady = false
    this.setState({
      connected: false,
      connectionVerified: false
    })
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnect() {
    const baseDelay = 1000 // Start with 1 second
    this.reconnectAttempts += 1
    const delay = Math.min(
      baseDelay * Math.pow(1.5, this.reconnectAttempts - 1), // Exponential backoff
      this.maxReconnectDelay // Cap at 30 seconds
    )

    console.log(
      `WebSocket disconnected, will attempt to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts})`
    )
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  // Process any queued messages after reconnection
  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`)
      const queueCopy = [...this.messageQueue]
      this.messageQueue = []

      // Process queued messages with a small delay between each
      queueCopy.forEach((message, index) => {
        setTimeout(() => {
          this.sendMessage(message.message).then(message.resolve).catch(message.reject)
        }, index * 100) // Space out messages by 100ms
      })
    }
  }

  // Reconnect to WebSocket server
  reconnect() {
    this.disconnect()
    this.connect()
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.cleanupConnection()
    }

    this.setState({
      connected: false,
      connectionVerified: false,
      events: [],
      lastPingResponse: null
    })
  }

  // Send a message through the WebSocket
  sendMessage(message) {
    // If connection isn't ready but socket is open, queue the message
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      if (!this.isConnectionReady) {
        return new Promise((resolve, reject) => {
          console.log('Connection not fully ready, queuing message:', message)
          this.messageQueue.push({ message, resolve, reject })
        })
      }

      console.log('Sending WebSocket message:', {
        message,
        readyState: this.socket.readyState,
        timestamp: new Date().toISOString()
      })

      try {
        this.socket.send(JSON.stringify(message))
        return Promise.resolve()
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
        return Promise.reject(error)
      }
    } else {
      // Queue message if socket isn't ready
      return new Promise((resolve, reject) => {
        const errorMsg = this.state.connected
          ? `WebSocket appears connected but is not in OPEN state (readyState: ${this.socket?.readyState})`
          : 'WebSocket not connected'

        console.log(errorMsg + ', queuing message for later delivery')
        this.messageQueue.push({ message, resolve, reject })

        // If not connected, try to reconnect
        if (!this.state.connected && !this.reconnectTimer) {
          this.connect()
        }
      })
    }
  }

  // Request all configurations from the server
  requestAllConfigs() {
    return this.sendMessage({ type: 'get_all_configs' })
  }

  // Request a specific configuration from the server
  requestConfig(configType) {
    return this.sendMessage({
      type: 'get_config',
      config: configType
    })
  }

  // Execute a macro via WebSocket for real-time feedback
  executeMacro(id) {
    return this.sendMessage({
      type: 'execute_macro',
      macroId: id
    })
  }

  // Send command to assign a macro to a button
  assignMacroToButton(macroId, buttonId) {
    return this.sendMessage({
      type: 'assign_macro',
      macroId: macroId,
      buttonId: buttonId
    })
  }
}

// Create and export a singleton instance
const wsStore = new WebSocketStore()
export default wsStore
