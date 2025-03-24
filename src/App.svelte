<script>
	import './app.css';

  import { Keyboard, Coffee, Settings, List, LayoutGrid, FileJson } from 'lucide-svelte';
  import MacropadTab from './components/macropad/MacropadTab.svelte';
  import LightingTab from './components/lighting/LightingTab.svelte';
  import SettingsTab from './components/settings/SettingsTab.svelte';
  import MacrosPage from './components/macropad/MacrosPage.svelte';
  import ConnectionStatus from './components/common/ConnectionStatus.svelte';
  import RawConfigTab from './components/config/RawConfigTab.svelte';
  import { onMount } from 'svelte';
  import wsStore from './lib/api/websocket.js';

  let activeTab = 'macropad';
  
  // Initialize WebSocket connection on app mount
  onMount(() => {
    // Try to establish connection
    wsStore.connect();
    
    // Return cleanup function
    return () => {
      wsStore.disconnect();
    };
  });
</script>

<main class="min-h-screen flex flex-col bg-gray-50">
  <!-- Connection Status Indicator -->
  <ConnectionStatus position="top-right" />

  <!-- Navigation -->
  <div class="navbar mb-2 p-2 bg-primary text-primary-content rounded-lg shadow max-w-6xl mx-auto">
    <div class="flex flex-col w-full items-center justify-center gap-2">
      <div class="text-center mb-2">
        <h1 class="text-xl font-bold">Macropad Control Panel</h1>
      </div>
      <div class="tabs tabs-boxed bg-primary-focus">
        <button
          class={`tab transition-colors duration-200 ${activeTab === 'macropad' ? 'tab-active bg-primary-content text-primary' : 'text-primary-content'}`}
          on:click={() => (activeTab = 'macropad')}
          data-tab="macropad"
        >
          <LayoutGrid class="inline-block w-5 h-5 mr-1" />
          Macropad
        </button>
        <button
          class={`tab transition-colors duration-200 ${activeTab === 'macros' ? 'tab-active bg-primary-content text-primary' : 'text-primary-content'}`}
          on:click={() => (activeTab = 'macros')}
          data-tab="macros"
        >
          <List class="inline-block w-5 h-5 mr-1" />
          Macros
        </button>
        <button
          class={`tab transition-colors duration-200 ${activeTab === 'lighting' ? 'tab-active bg-primary-content text-primary' : 'text-primary-content'}`}
          on:click={() => (activeTab = 'lighting')}
          data-tab="lighting"
        >
          <Coffee class="inline-block w-5 h-5 mr-1" />
          Lighting
        </button>
        <button
          class={`tab transition-colors duration-200 ${activeTab === 'settings' ? 'tab-active bg-primary-content text-primary' : 'text-primary-content'}`}
          on:click={() => (activeTab = 'settings')}
          data-tab="settings"
        >
          <Settings class="inline-block w-5 h-5 mr-1" />
          Settings
        </button>
        <button
          class={`tab transition-colors duration-200 ${activeTab === 'raw-config' ? 'tab-active bg-primary-content text-primary' : 'text-primary-content'}`}
          on:click={() => (activeTab = 'raw-config')}
          data-tab="raw-config"
        >
          <FileJson class="inline-block w-5 h-5 mr-1" />
          Raw Config
        </button>
      </div>
    </div>
  </div>

  <div class="main-content mb-8 max-w-6xl mx-auto w-full">
    {#if activeTab === 'macropad'}
      <MacropadTab />
    {:else if activeTab === 'macros'}
      <MacrosPage />
    {:else if activeTab === 'lighting'}
      <LightingTab />
    {:else if activeTab === 'settings'}
      <SettingsTab />
    {:else if activeTab === 'raw-config'}
      <RawConfigTab />
    {/if}
  </div>
</main>
