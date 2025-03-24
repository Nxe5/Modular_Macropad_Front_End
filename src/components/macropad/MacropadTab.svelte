<!-- components/macropad/MacropadTab.svelte  -->

<script>
  import MacropadView from './MacropadView.svelte';
  import MacropadOptions from './MacropadOptions.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { MacropadState } from '../../stores/MacropadStore.svelte.js';
  import wsStore from '../../lib/api/websocket.js';

  // State for storing module data
  let modules = [];
  let loading = true;
  let error = null;
  let unsubscribe;

  // Fallback to example data if no real data is available within timeout
  const fallbackTimeout = 5000; // 5 seconds
  let fallbackTimer;
  
  let mainModuleExample = {
    id: 'A1:B2:C3:D4:E5:F6',
    name: 'Main Module',
    description: 'This is the main module with a display, rotary encoder, and buttons.',
    gridSize: { rows: 5, columns: 5 },
    components: [
      {
        id: 'display-1',
        type: 'display',
        position: { row: 0, column: 0 },
        size: { rows: 2, columns: 3 },
        keyBinding: null
      },
      {
        id: 'rotary-btn-1',
        type: 'encoder-btn',
        position: { row: 0, column: 4 },
        keyBinding: "Volume Up"
      },
      {
        id: 'btn-1',
        type: 'button',
        position: { row: 0, column: 3 },
        keyBinding: "DELAY 500; PRESS Ctrl; PRESS Z; RELEASE Ctrl; RELEASE Z"
      },
      {
        id: 'btn-2',
        type: 'button',
        position: { row: 1, column: 3 },
        keyBinding: "DELAY 100; PRESS Alt; PRESS F4; RELEASE Alt; RELEASE F4"
      },
      {
        id: 'btn-3',
        type: 'button',
        position: { row: 1, column: 4 },
        keyBinding: "DELAY 500; PRESS Ctrl; PRESS C; RELEASE Ctrl; RELEASE C"
      },
      { id: 'btn-4', type: 'button', position: { row: 2, column: 0 }, keyBinding: "DELAY 200; PRESS Space; RELEASE Space" },
      { id: 'btn-5', type: 'button', position: { row: 2, column: 1 }, keyBinding: "Ctrl+V" },
      { id: 'btn-6', type: 'button', position: { row: 2, column: 2 }, keyBinding: "Ctrl+A" },
      { id: 'btn-7', type: 'button', position: { row: 2, column: 3 }, keyBinding: "DELAY 200; PRESS Shift; PRESS Esc; RELEASE Shift; RELEASE Esc" },
      { id: 'btn-8', type: 'button', position: { row: 2, column: 4 }, keyBinding: "DELAY 300; PRESS Ctrl; PRESS S; RELEASE Ctrl; RELEASE S" },
      { id: 'btn-9', type: 'button', position: { row: 3, column: 0 }, keyBinding: "F5" },
      { id: 'btn-10', type: 'button', position: { row: 3, column: 1 }, keyBinding: "F11" },
      { id: 'btn-11', type: 'button', position: { row: 3, column: 2 }, keyBinding: "Alt+Tab" },
      { id: 'btn-12', type: 'button', position: { row: 3, column: 3 }, keyBinding: "Ctrl+Shift+Esc" },
      { id: 'btn-13', type: 'button', position: { row: 3, column: 4 }, keyBinding: "Ctrl+P" },
      { id: 'btn-14', type: 'button', position: { row: 4, column: 0 }, keyBinding: "Alt+F4" },
      { id: 'btn-15', type: 'button', position: { row: 4, column: 1 }, keyBinding: "Ctrl+W" },
      { id: 'btn-16', type: 'button', position: { row: 4, column: 2 }, keyBinding: "Ctrl+Shift+T" },
      { id: 'btn-17', type: 'button', position: { row: 4, column: 3 }, keyBinding: "Ctrl+N" },
      { id: 'btn-18', type: 'button', position: { row: 4, column: 4 }, keyBinding: "Ctrl+Shift+S" }
    ]
  };

  // Function to ensure connection and fetch data
  function fetchModules() {
    // Check if already connected
    const wsState = wsStore.subscribe(state => {
      if (!state.connected) {
        console.log('WebSocket not connected, attempting to connect...');
        wsStore.connect();
      }
    });
    wsState(); // Unsubscribe from this temporary subscription

    // Request configuration data
    wsStore.sendMessage({ type: 'get_all_configs' })
      .catch(err => {
        console.error('Error requesting configs:', err);
        // Don't set error yet as we'll try the fallback
      });
  }
  
  // On component mount
  onMount(() => {
    loading = true;
    
    try {
      // Set up WebSocket subscription
      unsubscribe = wsStore.subscribe(state => {
        // Check for connection status changes
        if (state.connected && modules.length === 0) {
          // If we just connected and don't have modules yet, request them
          fetchModules();
        }
        
        // Process events for module data
        if (state.events && state.events.length > 0) {
          // Look for config_data events
          const configEvents = state.events.filter(event => 
            event.type === 'config_data' && event.configType === 'modules'
          );
          
          if (configEvents.length > 0) {
            // Get the most recent config data
            const moduleData = configEvents[configEvents.length - 1].data;
            
            if (moduleData && Array.isArray(moduleData) && moduleData.length > 0) {
              console.log('Received module data from WebSocket:', moduleData);
              modules = moduleData;
              loading = false;
              
              // Clear fallback timer if we got real data
              if (fallbackTimer) {
                clearTimeout(fallbackTimer);
                fallbackTimer = null;
              }
            }
          }
        }
      });
      
      // Attempt to connect if not already connected
      fetchModules();
      
      // Set fallback timer to use example data if no real data arrives
      fallbackTimer = setTimeout(() => {
        if (modules.length === 0) {
          console.log('No data received within timeout, using example data');
          modules = [mainModuleExample];
          loading = false;
        }
      }, fallbackTimeout);
      
    } catch (err) {
      console.error('Error setting up WebSocket connection:', err);
      error = err.message || 'Failed to load module data';
      // Fall back to example data
      modules = [mainModuleExample];
      loading = false;
    }
    
    // Cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  });
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
  }

  .top-section {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .bottom-section {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }
  
  .error {
    color: #ef4444;
    padding: 1rem;
    border: 1px solid #ef4444;
    border-radius: 0.5rem;
    margin: 1rem;
  }
</style>

<div class="container">
  {#if loading}
    <div class="loading">
      <p>Loading macropad data...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>Error loading macropad data: {error}</p>
    </div>
  {:else}
    <div class="top-section">
      <!-- Pass the module prop to MacropadView component -->
      <MacropadView {modules} />
    </div>
    <div class="bottom-section">
      <MacropadOptions />
    </div>
  {/if}
</div>
