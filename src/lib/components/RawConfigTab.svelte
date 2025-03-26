<script lang="ts">
  import { onMount } from 'svelte';
  import { esp32Config } from '$lib/stores/config';
  import { RefreshCw, Save, RotateCcw } from 'lucide-svelte';

  interface ConfigFile {
    name: string;
    content: any;
    isLoading: boolean;
    error: string | null;
    originalContent: string;
    editedContent: string;
    hasChanges: boolean;
  }

  let activeSubtab = 'actions';
  let logMessages: string[] = [];
  let configFiles: Record<string, ConfigFile> = {
    actions: { name: 'Actions', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    components: { name: 'Components', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    info: { name: 'Info', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    leds: { name: 'LEDs', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    reports: { name: 'Reports', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false }
  };

  function handleEdit(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const file = configFiles[activeSubtab];
    const originalContent = file.originalContent;
    const newContent = textarea.value;
    file.editedContent = newContent;
    
    // Direct console log for debugging
    window.console.log(`Content edited in ${file.name}. Original length: ${originalContent.length}, New length: ${newContent.length}`);
    
    // Check if content has actually changed
    const hasChanged = newContent !== originalContent;
    
    // Only log if the hasChanges status changes
    if (hasChanged !== file.hasChanges) {
      if (hasChanged) {
        window.console.log(`CHANGES DETECTED in ${file.name}`);
        addLog(`Changes detected in ${file.name} configuration`);
      } else {
        window.console.log(`${file.name} reverted to original`);
        addLog(`${file.name} configuration reverted to original`);
      }
    }
    
    file.hasChanges = hasChanged;
  }

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logMessages = [`[${timestamp}] ${message}`, ...logMessages.slice(0, 9)]; // Keep last 10 messages
  }

  function revertChanges() {
    addLog(`Reverting changes for ${configFiles[activeSubtab].name}`);
    console.log('Reverting changes for', configFiles[activeSubtab].name);
    const file = configFiles[activeSubtab];
    file.editedContent = file.originalContent;
    file.hasChanges = false;
    addLog(`Changes reverted successfully`);
    console.log('Changes reverted successfully');
  }

  async function saveChanges() {
    window.console.log(`SAVE button clicked for ${configFiles[activeSubtab].name}`);
    addLog(`Saving changes for ${configFiles[activeSubtab].name}`);
    
    const file = configFiles[activeSubtab];
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const endpoint = activeSubtab === 'leds' ? 'LEDs' : activeSubtab;
      
      window.console.log('Validating JSON before sending...');
      addLog(`Validating JSON before sending...`);
      
      // Validate JSON before sending
      let parsedJson;
      try {
        parsedJson = JSON.parse(file.editedContent);
        window.console.log('JSON validation successful');
        addLog(`JSON validation successful`);
      } catch (jsonError) {
        const errorMsg = `JSON validation failed: ${jsonError instanceof Error ? jsonError.message : 'Invalid JSON'}`;
        window.console.error(errorMsg);
        addLog(errorMsg);
        file.error = errorMsg;
        return;
      }
      
      const url = `${baseUrl}/api/config/${endpoint}`;
      window.console.log('SENDING POST REQUEST to:', url);
      addLog(`Sending POST request to ${url}`);
      
      try {
        // Send the raw edited content without additional formatting
        window.console.log('Request payload:', file.editedContent);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: file.editedContent
        });

        window.console.log(`Response status: ${response.status} ${response.statusText}`);
        addLog(`Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorMsg = `Failed to save ${file.name} config: ${response.status} ${response.statusText}`;
          window.console.error(errorMsg);
          addLog(`Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // Try to parse the response as JSON
        let responseData;
        try {
          responseData = await response.json();
          window.console.log('Response data:', responseData);
          addLog(`Response data: ${JSON.stringify(responseData)}`);
        } catch (e) {
          window.console.error('Could not parse response as JSON:', e);
          addLog(`Could not parse response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        window.console.log('Save successful, updating local state');
        addLog(`Save successful, updating local state`);
        
        // Update the content - store without pretty formatting
        file.content = parsedJson;
        file.originalContent = file.editedContent;
        file.hasChanges = false;
        
        window.console.log('Changes saved and state updated successfully');
        addLog(`Changes saved and state updated successfully`);
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : `Failed to save ${file.name} config`;
        window.console.error('Fetch error:', fetchError);
        addLog(`Network error: ${errorMsg}`);
        file.error = errorMsg;
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : `Failed to save ${file.name} config`;
      window.console.error('Error saving changes:', e);
      addLog(`Error: ${errorMsg}`);
      file.error = errorMsg;
    }
  }

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

      // Store the raw JSON as string - DO NOT FORMAT
      file.content = await response.json();
      // Store as a simple JSON string without pretty formatting
      file.originalContent = JSON.stringify(file.content);
      file.editedContent = file.originalContent;
      file.hasChanges = false;
      
      // Add direct console log to debug
      window.console.log(`Fetched ${file.name} config:`, file.content);
    } catch (e) {
      window.console.error(`Error fetching ${file.name}:`, e);
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
      <div class="flex justify-end space-x-2 mb-4">
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          on:click={() => fetchConfigFile(activeSubtab)}
        >
          <RefreshCw class="h-4 w-4" />
          <span>Refresh</span>
        </button>
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!configFiles[activeSubtab].hasChanges}
          on:click={revertChanges}
        >
          <RotateCcw class="h-4 w-4" />
          <span>Revert</span>
        </button>
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!configFiles[activeSubtab].hasChanges}
          on:click={saveChanges}
        >
          <Save class="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>
      <textarea
        class="w-full h-[600px] font-mono text-sm bg-background border rounded-md p-4 resize-none"
        bind:value={configFiles[activeSubtab].editedContent}
        on:input={handleEdit}
        spellcheck="false"
      />
    {:else}
      <div class="text-center text-muted-foreground py-8">
        No configuration data available
      </div>
    {/if}
  </div>
  
  {#if logMessages.length > 0}
    <div class="mt-4 bg-black text-white p-4 rounded-md text-sm font-mono overflow-auto max-h-[200px]">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold">Operation Log</h3>
        <button 
          class="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          on:click={() => logMessages = []}>
          Clear
        </button>
      </div>
      {#each logMessages as message}
        <div class="py-1">{message}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  textarea {
    caret-color: white;
  }
</style> 