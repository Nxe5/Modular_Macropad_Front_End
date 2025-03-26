<script lang="ts">
  import { onMount } from 'svelte';
  import { esp32Config } from '$lib/stores/config';
  import { RefreshCw } from 'lucide-svelte';

  interface ConfigFile {
    name: string;
    content: any;
    isLoading: boolean;
    error: string | null;
  }

  let activeSubtab = 'actions';
  let configFiles: Record<string, ConfigFile> = {
    actions: { name: 'Actions', content: null, isLoading: true, error: null },
    components: { name: 'Components', content: null, isLoading: true, error: null },
    info: { name: 'Info', content: null, isLoading: true, error: null },
    leds: { name: 'LEDs', content: null, isLoading: true, error: null },
    reports: { name: 'Reports', content: null, isLoading: true, error: null }
  };

  async function fetchConfigFile(key: string) {
    const file = configFiles[key];
    file.isLoading = true;
    file.error = null;

    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const endpoint = key === 'leds' ? 'LEDs' : key;
      const response = await fetch(`${baseUrl}/api/config/${endpoint}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${file.name} config`);
      }

      file.content = await response.json();
    } catch (e) {
      file.error = e instanceof Error ? e.message : `Failed to fetch ${file.name} config`;
    } finally {
      file.isLoading = false;
    }
  }

  async function fetchAllConfigFiles() {
    await Promise.all(Object.keys(configFiles).map(fetchConfigFile));
  }

  onMount(() => {
    fetchAllConfigFiles();
  });
</script>

<div class="space-y-6">
  <!-- Subtabs -->
  <div class="flex space-x-4 border-b border-border">
    {#each Object.entries(configFiles) as [key, file]}
      <button
        class={`py-2 px-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
          activeSubtab === key
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        on:click={() => activeSubtab = key}
      >
        <span>{file.name}</span>
        {#if file.error}
          <span class="text-destructive text-xs">(Error)</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Content -->
  <div class="bg-card rounded-lg p-6 shadow">
    {#if configFiles[activeSubtab].isLoading}
      <div class="text-center text-muted-foreground py-8">
        Loading {configFiles[activeSubtab].name} configuration...
      </div>
    {:else if configFiles[activeSubtab].error}
      <div class="space-y-4">
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
          {configFiles[activeSubtab].error}
        </div>
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          on:click={() => fetchConfigFile(activeSubtab)}
        >
          <RefreshCw class="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    {:else if configFiles[activeSubtab].content}
      <div class="flex justify-end mb-4">
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          on:click={() => fetchConfigFile(activeSubtab)}
        >
          <RefreshCw class="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      <pre class="text-sm overflow-auto max-h-[600px]">
        {JSON.stringify(configFiles[activeSubtab].content, null, 2)}
      </pre>
    {:else}
      <div class="text-center text-muted-foreground py-8">
        No configuration data available
      </div>
    {/if}
  </div>
</div> 