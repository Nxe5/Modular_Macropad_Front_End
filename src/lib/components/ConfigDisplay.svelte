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
  let originalBinding: string | null = null;
  let isLoading = true;
  let hasUnsavedChanges = false;

  // Add new interfaces for navigation
  interface NavigationTab {
    id: string;
    label: string;
  }

  let activeTab: string | null = null;
  let navigationTabs: NavigationTab[] = [];

  // Add keyboard layout data with lowercase letters
  const keyboardLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Fn', 'Ctrl']
  ];

  // Add modifier keys
  const modifierKeys = ['Shift', 'Ctrl', 'Alt', 'Win'];

  // Track selected modifier
  let selectedModifier: string | null = null;

  function getReportName(action: any): string {
    if (!action || !config.reports) return '';

    if (action.type === 'hid' && action.buttonPress) {
      const hidCode = action.buttonPress[2];
      const modifierByte = action.buttonPress[0];
      const report = config.reports.hid.find((r: any) => r.code === hidCode);
      
      if (report) {
        // Handle modifiers
        const modifiers = [];
        if (modifierByte & 0x01) modifiers.push('Ctrl');
        if (modifierByte & 0x02) modifiers.push('Shift');
        if (modifierByte & 0x04) modifiers.push('Alt');
        if (modifierByte & 0x08) modifiers.push('Win');

        // If it's a letter, always show lowercase
        if (/^[A-Z]$/.test(report.name)) {
          return modifiers.length > 0 
            ? `${modifiers.join(' + ')} + ${report.name.toLowerCase()}`
            : report.name.toLowerCase();
        }
        
        return modifiers.length > 0 
          ? `${modifiers.join(' + ')} + ${report.name}`
          : report.name;
      }
      return 'HID (undefined)';
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

  function getBindingDisplay(action: any): string {
    if (!action) return 'None';
    
    if (action.type === 'hid') {
      return getReportName(action);
    }
    
    if (action.type === 'multimedia') {
      const parts = [];
      if (action.clockwise) {
        parts.push(`Clockwise: ${getReportName({ type: 'multimedia', clockwise: action.clockwise })}`);
      }
      if (action.counterclockwise) {
        parts.push(`Counterclockwise: ${getReportName({ type: 'multimedia', counterclockwise: action.counterclockwise })}`);
      }
      if (action.buttonPress) {
        parts.push(`Button: ${getReportName({ type: 'multimedia', buttonPress: action.buttonPress })}`);
      }
      return parts.join(', ');
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

  // Function to update navigation tabs based on component type
  function updateNavigationTabs(componentType: string | undefined) {
    if (!componentType) {
      navigationTabs = [];
      activeTab = null;
      return;
    }

    switch (componentType) {
      case 'display':
        navigationTabs = [
          { id: 'gif', label: 'GIF' },
          { id: 'img', label: 'Image' }
        ];
        activeTab = 'gif';
        break;

      case 'button':
        navigationTabs = [
          { id: 'keyboard', label: 'Keyboard' },
          { id: 'extended', label: 'Extended' },
          { id: 'macros', label: 'Macros' }
        ];
        activeTab = 'keyboard';
        break;

      case 'encoder':
        const selectedComponent = config.components.components.find((c: { id: string }) => c.id === selectedComponentId);
        navigationTabs = [
          { id: 'clockwise', label: 'Clockwise' },
          { id: 'counterclockwise', label: 'Counterclockwise' }
        ];
        
        // Add button tab if encoder has a button
        if (selectedComponent?.has_button) {
          navigationTabs.push({ id: 'button', label: 'Button' });
        }
        
        activeTab = 'clockwise';
        break;

      default:
        navigationTabs = [];
        activeTab = null;
    }
  }

  // Function to revert changes
  function revertChanges() {
    if (!selectedComponentId) return;
    newBinding = originalBinding;
    selectedModifier = null;
    hasUnsavedChanges = false;
  }

  // Update handleComponentSelect to track original binding
  function handleComponentSelect(componentId: string) {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Do you want to continue?')) {
        return;
      }
    }
    
    selectedComponentId = componentId;
    if (config.actions && selectedComponentId) {
      const binding = config.actions.actions['layer-config']?.[selectedComponentId];
      originalBinding = binding ? binding.type : null;
      newBinding = originalBinding;
      hasUnsavedChanges = false;
    }
    
    const componentType = config.components.components.find((c: { id: string }) => c.id === selectedComponentId)?.type;
    updateNavigationTabs(componentType);
  }

  // Update checkUnsavedChanges to compare with original binding
  function checkUnsavedChanges() {
    if (!selectedComponentId || !config.actions?.actions?.['layer-config']) return false;
    return newBinding !== originalBinding;
  }

  // Update saveChanges to update originalBinding on success
  async function saveChanges() {
    if (!selectedComponentId || !config.actions?.actions?.['layer-config']) return;

    try {
      const updatedActions = { ...config.actions };
      const componentBinding = updatedActions.actions['layer-config'][selectedComponentId];
      
      if (newBinding) {
        // Update the binding type
        componentBinding.type = newBinding;
      } else {
        // Remove the binding if set to None
        delete updatedActions.actions['layer-config'][selectedComponentId];
      }

      // Send the updated actions to the macropad using esp32Config store
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const response = await fetch(`${baseUrl}/api/config/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedActions),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Update local config and original binding
      config.actions = updatedActions;
      originalBinding = newBinding;
      hasUnsavedChanges = false;
    } catch (error) {
      console.error('Error saving changes:', error);
      error = 'Failed to save changes. Please try again.';
    }
  }

  // Function to handle key selection
  function handleKeySelect(key: string) {
    if (selectedModifier) {
      // If a modifier is selected, create a combined binding
      newBinding = `${selectedModifier} + ${key}`;
      selectedModifier = null;
    } else if (modifierKeys.includes(key)) {
      // If a modifier key is clicked, set it as selected
      selectedModifier = key;
    } else {
      // Regular key selection
      newBinding = key;
    }
    hasUnsavedChanges = checkUnsavedChanges();
  }

  // Add reactive statement to track changes
  $: {
    if (selectedComponentId) {
      hasUnsavedChanges = checkUnsavedChanges();
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
                  {#if config.actions?.actions?.['layer-config']?.[selectedComponentId]}
                    {getBindingDisplay(config.actions.actions['layer-config'][selectedComponentId])}
                  {:else}
                    None
                  {/if}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-medium">New Binding:</span>
                <span class="text-muted-foreground">
                  {#if newBinding}
                    {getBindingDisplay({ type: newBinding })}
                  {:else}
                    None
                  {/if}
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

    <!-- Bottom Navigation Section -->
    {#if selectedComponentId && navigationTabs.length > 0}
      <div class="mt-8 border-t pt-4">
        <div class="flex justify-between items-center mb-4">
          <div class="flex space-x-4">
            {#each navigationTabs as tab}
              <button
                class="px-4 py-2 rounded-md transition-colors {activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                on:click={() => activeTab = tab.id}
              >
                {tab.label}
              </button>
            {/each}
          </div>
          <div class="flex space-x-2">
            <button
              class="px-4 py-2 rounded-md bg-destructive text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasUnsavedChanges}
              on:click={revertChanges}
            >
              Revert
            </button>
            <button
              class="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasUnsavedChanges}
              on:click={saveChanges}
            >
              Save Changes
            </button>
          </div>
        </div>

        <!-- Content area for each tab -->
        <div class="mt-4">
          {#if activeTab === 'gif' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'display'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">GIF Configuration</h4>
              <!-- GIF configuration content will go here -->
            </div>
          {:else if activeTab === 'img' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'display'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Image Configuration</h4>
              <!-- Image configuration content will go here -->
            </div>
          {:else if activeTab === 'keyboard' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'button'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Keyboard Binding</h4>
              {#if selectedModifier}
                <div class="mb-4 p-2 bg-muted rounded-md">
                  Selected modifier: {selectedModifier}
                </div>
              {/if}
              <div class="grid gap-2">
                {#each keyboardLayout as row}
                  <div class="flex gap-2 justify-center">
                    {#each row as key}
                      <button
                        class="px-3 py-2 rounded-md border hover:bg-muted transition-colors {newBinding === key || (selectedModifier && key === selectedModifier) ? 'bg-primary text-primary-foreground' : ''}"
                        on:click={() => handleKeySelect(key)}
                      >
                        {key}
                      </button>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
          {:else if activeTab === 'extended' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'button'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Extended Keys</h4>
              <!-- Extended keys content will go here -->
            </div>
          {:else if activeTab === 'macros' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'button'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Macros</h4>
              <!-- Macros content will go here -->
            </div>
          {:else if activeTab === 'clockwise' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'encoder'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Clockwise Action</h4>
              <!-- Clockwise action content will go here -->
            </div>
          {:else if activeTab === 'counterclockwise' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'encoder'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Counterclockwise Action</h4>
              <!-- Counterclockwise action content will go here -->
            </div>
          {:else if activeTab === 'button' && config.components.components.find((c: { id: string; type: string }) => c.id === selectedComponentId)?.type === 'encoder'}
            <div class="p-4 bg-card rounded-lg border">
              <h4 class="font-medium mb-2">Button Action</h4>
              <!-- Button action content will go here -->
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <p class="text-muted-foreground">No configuration available</p>
  {/if}
</div> 