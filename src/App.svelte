<script>
	import './app.css';

  import { Keyboard, Lightbulb, Settings } from 'lucide-svelte';
  import MacropadTab from './components/macropad/MacropadTab.svelte';
  import LightingTab from './components/lighting/LightingTab.svelte';
  import SettingsTab from './components/settings/SettingsTab.svelte';

  let activeTab = 'macropad';
</script>

<main class="min-h-screen flex flex-col bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-center space-x-8 py-4">
        <button
          class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
            {activeTab === 'keys' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => activeTab = 'macropad'}
        >
          <Keyboard size={20} />
          <span>Macropad</span>
        </button>
        
        <button
          class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
            {activeTab === 'lighting' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => activeTab = 'lighting'}
        >
          <Lightbulb size={20} />
          <span>Lighting</span>
        </button>
        
        <button
          class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
            {activeTab === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => activeTab = 'settings'}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Content Area -->
  <div class="flex-1">
    {#if activeTab === 'macropad'}
      <MacropadTab />
    {:else if activeTab === 'lighting'}
      <!-- <LightingTab /> -->
    {:else if activeTab === 'settings'}
      <!-- <SettingsTab /> -->
    {/if}
  </div>
</main>
