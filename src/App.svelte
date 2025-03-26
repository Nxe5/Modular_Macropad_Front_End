<script lang="ts">
  import "./app.css";
  import { onMount } from 'svelte';
  import { Moon, Sun, Settings, Keyboard, Layers } from 'lucide-svelte';
  import ConnectionStatus from './lib/components/ConnectionStatus.svelte';
  import ConnectionSettings from './lib/components/ConnectionSettings.svelte';
  import ConfigDisplay from './lib/components/ConfigDisplay.svelte';
  
  // Theme handling
  let isDarkMode = false;
  
  onMount(() => {
    // Check system preference or local storage for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    isDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark);
    updateTheme();
  });
  
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    updateTheme();
  }
  
  function updateTheme() {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
  
  // Navigation
  let currentTab = 'macropad';
</script>

<div class="min-h-screen bg-background flex flex-col">
  <!-- Header -->
  <header class="border-b border-border">
    <div class="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-foreground">Ocho Labs Macropad</h1>
        <div class="flex items-center gap-4">
          <ConnectionStatus />
          <button
            class="p-2 rounded-md hover:bg-muted"
            on:click={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {#if isDarkMode}
              <Sun class="h-5 w-5" />
            {:else}
              <Moon class="h-5 w-5" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Navigation -->
  <nav class="border-b border-border bg-card">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex space-x-4 -mb-px">
        <button
          class={`py-4 px-2 border-b-2 font-medium text-sm ${currentTab === 'macropad' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          on:click={() => currentTab = 'macropad'}
        >
          <div class="flex items-center space-x-2">
            <Keyboard class="h-4 w-4" />
            <span>Macropad</span>
          </div>
        </button>
        
        <button
          class={`py-4 px-2 border-b-2 font-medium text-sm ${currentTab === 'lighting' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          on:click={() => currentTab = 'lighting'}
        >
          <div class="flex items-center space-x-2">
            <Layers class="h-4 w-4" />
            <span>Lighting</span>
          </div>
        </button>
        
        <button
          class={`py-4 px-2 border-b-2 font-medium text-sm ${currentTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          on:click={() => currentTab = 'settings'}
        >
          <div class="flex items-center space-x-2">
            <Settings class="h-4 w-4" />
            <span>Settings</span>
          </div>
        </button>
        
        <button
          class={`py-4 px-2 border-b-2 font-medium text-sm ${currentTab === 'raw-config' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          on:click={() => currentTab = 'raw-config'}
        >
          <div class="flex items-center space-x-2">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h6M9 18h6M9 12h2" />
            </svg>
            <span>Raw Config</span>
          </div>
        </button>
      </div>
    </div>
  </nav>
  
  <!-- Main Content -->
  <main class="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
    {#if currentTab === 'macropad'}
      <div class="bg-card rounded-lg p-6 shadow">
        <h2 class="text-xl font-semibold mb-4">Macropad Configuration</h2>
        <ConfigDisplay />
      </div>
    {:else if currentTab === 'lighting'}
      <div class="bg-card rounded-lg p-6 shadow">
        <h2 class="text-xl font-semibold mb-4">Lighting Configuration</h2>
        <p class="text-muted-foreground">Configure LED colors, effects, and brightness.</p>
      </div>
    {:else if currentTab === 'settings'}
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 shadow">
          <h2 class="text-xl font-semibold mb-4">Settings</h2>
          <p class="text-muted-foreground">Adjust general settings for your macropad.</p>
        </div>
        
        <ConnectionSettings />
      </div>
    {:else if currentTab === 'raw-config'}
      <div class="bg-card rounded-lg p-6 shadow">
        <h2 class="text-xl font-semibold mb-4">Raw Configuration</h2>
        <p class="text-muted-foreground">View and edit the raw JSON configuration files.</p>
      </div>
    {/if}
  </main>
  
  <!-- Footer -->
  <footer class="border-t border-border py-4">
    <div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} Ocho Labs. All rights reserved.
    </div>
  </footer>
</div>
