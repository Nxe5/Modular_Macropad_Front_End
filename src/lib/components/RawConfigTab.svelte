<script lang="ts">
  import { onMount } from 'svelte';
  import { esp32Config } from '$lib/stores/config';

  interface ConfigFile {
    name: string;
    content: any;
  }

  let activeSubtab = 'actions';
  let configFiles: Record<string, ConfigFile> = {
    actions: { name: 'Actions', content: null },
    components: { name: 'Components', content: null },
    info: { name: 'Info', content: null },
    leds: { name: 'LEDs', content: null },
    reports: { name: 'Reports', content: null }
  };
  let isLoading = true;
  let error: string | null = null;

  async function fetchConfigFiles() {
    try {
      isLoading = true;
      error = null;
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;

      // Fetch all configuration files
      const [actionsResponse, componentsResponse, infoResponse, ledsResponse, reportsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/config/actions`),
        fetch(`${baseUrl}/api/config/components`),
        fetch(`${baseUrl}/api/config/info`),
        fetch(`${baseUrl}/api/config/LEDs`),
        fetch(`${baseUrl}/api/config/reports`)
      ]);

      // Check all responses
      if (!actionsResponse.ok) throw new Error('Failed to fetch actions config');
      if (!componentsResponse.ok) throw new Error('Failed to fetch components config');
      if (!infoResponse.ok) throw new Error('Failed to fetch info config');
      if (!ledsResponse.ok) throw new Error('Failed to fetch leds config');
      if (!reportsResponse.ok) throw new Error('Failed to fetch reports config');

      // Parse all responses
      configFiles.actions.content = await actionsResponse.json();
      configFiles.components.content = await componentsResponse.json();
      configFiles.info.content = await infoResponse.json();
      configFiles.leds.content = await ledsResponse.json();
      configFiles.reports.content = await reportsResponse.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch configuration files';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchConfigFiles();
  });
</script>

<div class="space-y-6">
  {#if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      {error}
    </div>
  {:else if isLoading}
    <div class="text-center text-muted-foreground py-8">
      Loading configuration files...
    </div>
  {:else}
    <!-- Subtabs -->
    <div class="flex space-x-4 border-b border-border">
      {#each Object.entries(configFiles) as [key, file]}
        <button
          class={`py-2 px-4 text-sm font-medium transition-colors ${
            activeSubtab === key
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          on:click={() => activeSubtab = key}
        >
          {file.name}
        </button>
      {/each}
    </div>

    <!-- Content -->
    <div class="bg-card rounded-lg p-6 shadow">
      <pre class="text-sm overflow-auto max-h-[600px]">
        {JSON.stringify(configFiles[activeSubtab].content, null, 2)}
      </pre>
    </div>
  {/if}
</div> 