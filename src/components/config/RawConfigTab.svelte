<!-- components/config/RawConfigTab.svelte -->

<script>
  import { onMount } from 'svelte';
  import { wsStore } from '../../lib/api';

  // State for storing config data
  let configData = {
    modules: null,
    macros: null,
    system: null
  };
  
  let activeConfigTab = 'modules';
  let loading = true;
  let error = null;
  
  // Format JSON with indentation for better readability
  function formatJson(data) {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Error formatting JSON';
    }
  }
  
  // Fetch all configurations on component mount
  onMount(async () => {
    try {
      loading = true;
      
      // Request configuration data through WebSocket
      wsStore.sendMessage({ type: 'get_all_configs' });
      
      // Subscribe to WebSocket events to receive configuration data
      const unsubscribe = wsStore.subscribe(state => {
        if (state.events && state.events.length > 0) {
          // Process the most recent event
          const latestEvent = state.events[state.events.length - 1];
          
          if (latestEvent.type === 'config_data') {
            if (latestEvent.configType === 'modules') {
              configData.modules = latestEvent.data;
            } else if (latestEvent.configType === 'macros') {
              configData.macros = latestEvent.data;
            } else if (latestEvent.configType === 'system') {
              configData.system = latestEvent.data;
            }
            
            loading = false;
          }
        }
      });
      
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Failed to load configurations:', err);
      error = err.message || 'Failed to load configurations';
      loading = false;
    }
  });
  
  // For demo purposes: sample data if WebSocket doesn't respond
  function loadSampleData() {
    configData = {
      modules: [
        {
          id: 'A1:B2:C3:D4:E5:F6',
          name: 'Main Module',
          gridSize: { rows: 5, columns: 5 },
          components: [
            { id: 'display-1', type: 'display', position: { row: 0, column: 0 }, keyBinding: null },
            { id: 'btn-1', type: 'button', position: { row: 1, column: 0 }, keyBinding: 'macro:123' }
          ]
        }
      ],
      macros: [
        { id: '123', name: 'Test Macro', commands: [{ type: 'keypress', key: 'a' }] }
      ],
      system: { 
        version: '1.0.0',
        deviceName: 'Modular Macropad',
        lastSync: new Date().toISOString()
      }
    };
    loading = false;
  }
</script>

<div class="raw-config-container">
  <h2 class="text-2xl font-bold mb-4">Raw Configuration</h2>
  
  <div class="bg-white rounded-lg shadow p-4 mb-6">
    <p class="text-gray-600 mb-4">
      This page displays the raw JSON configuration files stored in the ESP32 memory.
      You can view different configuration files by selecting the tabs below.
    </p>
    
    {#if loading}
      <div class="flex justify-center items-center p-8">
        <div class="loading-spinner"></div>
        <p class="ml-2">Loading configuration data...</p>
      </div>
      
      <button 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
        on:click={loadSampleData}
      >
        Load Sample Data (Demo)
      </button>
    {:else if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
          on:click={loadSampleData}
        >
          Load Sample Data (Demo)
        </button>
      </div>
    {:else}
      <!-- Config type tabs -->
      <div class="flex border-b mb-4">
        <button 
          class={`px-4 py-2 mr-2 ${activeConfigTab === 'modules' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
          on:click={() => activeConfigTab = 'modules'}
        >
          Modules
        </button>
        <button 
          class={`px-4 py-2 mr-2 ${activeConfigTab === 'macros' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
          on:click={() => activeConfigTab = 'macros'}
        >
          Macros
        </button>
        <button 
          class={`px-4 py-2 ${activeConfigTab === 'system' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
          on:click={() => activeConfigTab = 'system'}
        >
          System
        </button>
      </div>
      
      <!-- Config content display -->
      <div class="config-content-container">
        {#if activeConfigTab === 'modules' && configData.modules}
          <pre class="json-display">{formatJson(configData.modules)}</pre>
        {:else if activeConfigTab === 'macros' && configData.macros}
          <pre class="json-display">{formatJson(configData.macros)}</pre>
        {:else if activeConfigTab === 'system' && configData.system}
          <pre class="json-display">{formatJson(configData.system)}</pre>
        {:else}
          <p class="text-gray-500 italic">No data available for this configuration type</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .raw-config-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .config-content-container {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background-color: #f8fafc;
    overflow: auto;
    max-height: 500px;
  }
  
  .json-display {
    padding: 1rem;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
    line-height: 1.5;
    color: #334155;
  }
  
  .loading-spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style> 