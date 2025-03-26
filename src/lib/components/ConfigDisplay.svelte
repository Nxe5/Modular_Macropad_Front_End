<script lang="ts">
  import { onMount } from 'svelte';
  import { esp32Config } from '$lib/stores/config';
  import ModuleGrid from './ModuleGrid.svelte';

  interface ModuleConfig {
    components: any;
    actions: any;
    info: any;
    reports: any;
  }

  let config: ModuleConfig = {
    components: null,
    actions: null,
    info: null,
    reports: null
  };
  let error: string | null = null;
  let selectedComponentId: string | null = null;
  let newBinding: string | null = null;
  let isLoading = true;

  function getReportName(action: any): string {
    if (!action || !config.reports) return '';

    if (action.type === 'hid' && action.buttonPress) {
      const hidCode = action.buttonPress[2];
      const report = config.reports.hid.find((r: any) => r.code === hidCode);
      return report ? report.name : 'HID (undefined)';
    }

    if (action.type === 'multimedia') {
      if (action.clockwise) {
        const clockwiseCode = action.clockwise[2];
        const report = config.reports.consumer.find((r: any) => r.code === clockwiseCode);
        return report ? report.name : 'Consumer (undefined)';
      }
      if (action.counterclockwise) {
        const counterclockwiseCode = action.counterclockwise[2];
        const report = config.reports.consumer.find((r: any) => r.code === counterclockwiseCode);
        return report ? report.name : 'Consumer (undefined)';
      }
      if (action.buttonPress) {
        const buttonCode = action.buttonPress[2];
        const report = config.reports.consumer.find((r: any) => r.code === buttonCode);
        return report ? report.name : 'Consumer (undefined)';
      }
    }

    return action.type || 'None';
  }

  async function fetchConfig() {
    try {
      isLoading = true;
      error = null;
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      
      // Fetch all configuration files
      const [componentsResponse, actionsResponse, infoResponse, reportsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/config/components`),
        fetch(`${baseUrl}/api/config/actions`),
        fetch(`${baseUrl}/api/config/info`),
        fetch(`${baseUrl}/api/config/reports`)
      ]);

      // Check all responses
      if (!componentsResponse.ok) throw new Error('Failed to fetch components config');
      if (!actionsResponse.ok) throw new Error('Failed to fetch actions config');
      if (!infoResponse.ok) throw new Error('Failed to fetch info config');
      if (!reportsResponse.ok) throw new Error('Failed to fetch reports config');

      // Parse all responses
      config = {
        components: await componentsResponse.json(),
        actions: await actionsResponse.json(),
        info: await infoResponse.json(),
        reports: await reportsResponse.json()
      };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch configuration';
      config = {
        components: null,
        actions: null,
        info: null,
        reports: null
      };
    } finally {
      isLoading = false;
    }
  }

  function handleComponentSelect(componentId: string) {
    selectedComponentId = componentId;
    // Find current binding for the selected component
    if (config.actions && selectedComponentId) {
      // The actions object has a layer-config property that contains the bindings
      const binding = config.actions['layer-config']?.[selectedComponentId];
      newBinding = binding ? binding.type : null;
    }
  }

  onMount(() => {
    fetchConfig();
  });
</script>

<div class="space-y-6">
  {#if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      {error}
    </div>
  {:else if isLoading}
    <div class="text-center text-muted-foreground py-8">
      Loading configuration...
    </div>
  {:else if config.components && config.info}
    <div class="grid grid-cols-2 gap-8">
      <div class="space-y-6 max-w-[300px]">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Component Details</h3>
          {#if selectedComponentId}
            <div class="space-y-2 p-4 bg-card rounded-lg border">
              <div class="flex justify-between items-center">
                <span class="font-medium">Name:</span>
                <span>{config.components.components.find((c: { id: string }) => c.id === selectedComponentId)?.id}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">Type:</span>
                <span>{config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">Size:</span>
                <span>{config.components.components.find((c: { id: string; size: { rows: number; columns: number } }) => c.id === selectedComponentId)?.size.rows}x{config.components.components.find((c: { id: string; size: { rows: number; columns: number } }) => c.id === selectedComponentId)?.size.columns}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">Location:</span>
                <span>Row {config.components.components.find((c: { id: string; start_location: { row: number; column: number } }) => c.id === selectedComponentId)?.start_location.row}, Col {config.components.components.find((c: { id: string; start_location: { row: number; column: number } }) => c.id === selectedComponentId)?.start_location.column}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">Current Binding:</span>
                <span class="text-muted-foreground">
                  {#if config.actions?.[selectedComponentId]}
                    {getReportName(config.actions[selectedComponentId])}
                  {:else}
                    None
                  {/if}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">New Binding:</span>
                <span class="text-muted-foreground">
                  {newBinding || 'None'}
                </span>
              </div>
            </div>
          {:else}
            <div class="text-center text-muted-foreground py-4">
              Select a component to view details
            </div>
          {/if}
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Module Grid</h3>
          {#if config.info}
            <ModuleGrid
              moduleName={config.info.name}
              moduleSize={config.info['module-size']}
              gridSize={config.info.gridSize}
              components={config.components.components}
              selectedComponentId={selectedComponentId}
              onComponentSelect={handleComponentSelect}
              version={config.info.version}
              id={config.info.id}
            />
          {:else}
            <div class="text-center text-muted-foreground py-4">
              Loading module information...
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <p class="text-muted-foreground">No configuration available</p>
  {/if}
</div> 