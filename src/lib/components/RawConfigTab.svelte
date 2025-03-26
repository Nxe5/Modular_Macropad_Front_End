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
    reports: { name: 'Reports', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    macros: { name: 'Macros', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false }
  };

  // For macros directory
  interface MacroInfo {
    id: string;
    name: string;
    description?: string;
  }

  interface MacroFile {
    content: any;
    isLoading: boolean;
    error: string | null;
    originalContent: string;
    editedContent: string;
    hasChanges: boolean;
  }

  let macrosList: MacroInfo[] = [];
  let selectedMacro: string | null = null;
  let macroFile: MacroFile = { content: null, isLoading: false, error: null, originalContent: '', editedContent: '', hasChanges: false };
  let showNewMacroForm = false;
  let newMacroId = '';
  let newMacroName = '';

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

  // Load the macros index file
  async function fetchMacrosList() {
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const response = await fetch(`${baseUrl}/api/macros`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch macros list`);
      }
      
      const data = await response.json();
      macrosList = data.macros || [];
      window.console.log('Fetched macros list:', macrosList);
    } catch (e) {
      window.console.error('Error fetching macros list:', e);
      configFiles.macros.error = e instanceof Error ? e.message : 'Failed to fetch macros list';
    } finally {
      configFiles.macros.isLoading = false;
    }
  }
  
  // Load a specific macro file
  async function fetchMacroFile(macroId: string) {
    if (!macroId) return;
    
    macroFile.isLoading = true;
    macroFile.error = null;
    
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const response = await fetch(`${baseUrl}/api/macros/${macroId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch macro: ${macroId}`);
      }
      
      macroFile.content = await response.json();
      macroFile.originalContent = JSON.stringify(macroFile.content, null, 2);
      macroFile.editedContent = macroFile.originalContent;
      macroFile.hasChanges = false;
      
      window.console.log(`Fetched macro ${macroId}:`, macroFile.content);
    } catch (e) {
      window.console.error(`Error fetching macro ${macroId}:`, e);
      macroFile.error = e instanceof Error ? e.message : `Failed to fetch macro: ${macroId}`;
    } finally {
      macroFile.isLoading = false;
    }
  }
  
  // Select a macro to view/edit
  async function selectMacro(macroId: string) {
    selectedMacro = macroId;
    await fetchMacroFile(macroId);
  }
  
  // Create a new macro file
  async function createNewMacro() {
    if (!newMacroId || !newMacroName) {
      addLog('Macro ID and name are required');
      return;
    }
    
    const newMacro = {
      id: newMacroId,
      name: newMacroName,
      description: `${newMacroName} macro`,
      commands: []
    };
    
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const response = await fetch(`${baseUrl}/api/macros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMacro)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create macro: ${response.status} ${response.statusText}`);
      }
      
      addLog(`Created new macro: ${newMacroName}`);
      showNewMacroForm = false;
      newMacroId = '';
      newMacroName = '';
      
      // Refresh the macros list
      await fetchMacrosList();
      // Select the newly created macro
      await selectMacro(newMacro.id);
    } catch (e) {
      window.console.error('Error creating macro:', e);
      addLog(`Error creating macro: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  // Handle macro file editing
  function handleMacroEdit(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const originalContent = macroFile.originalContent;
    const newContent = textarea.value;
    macroFile.editedContent = newContent;
    
    // Check if content has actually changed
    const hasChanged = newContent !== originalContent;
    
    // Only log if the hasChanges status changes
    if (hasChanged !== macroFile.hasChanges) {
      if (hasChanged) {
        window.console.log(`CHANGES DETECTED in macro: ${selectedMacro}`);
        addLog(`Changes detected in macro: ${selectedMacro}`);
      } else {
        window.console.log(`Macro ${selectedMacro} reverted to original`);
        addLog(`Macro ${selectedMacro} reverted to original`);
      }
    }
    
    macroFile.hasChanges = hasChanged;
  }
  
  // Save macro changes
  async function saveMacroChanges() {
    if (!selectedMacro) {
      addLog('No macro selected');
      return;
    }
    
    addLog(`Saving changes for macro: ${selectedMacro}`);
    
    try {
      window.console.log('Validating JSON before sending...');
      addLog(`Validating JSON before sending...`);
      
      // Validate JSON before sending
      let parsedJson;
      try {
        parsedJson = JSON.parse(macroFile.editedContent);
        window.console.log('JSON validation successful');
        addLog(`JSON validation successful`);
      } catch (jsonError) {
        const errorMsg = `JSON validation failed: ${jsonError instanceof Error ? jsonError.message : 'Invalid JSON'}`;
        window.console.error(errorMsg);
        addLog(errorMsg);
        macroFile.error = errorMsg;
        return;
      }
      
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const url = `${baseUrl}/api/macros`;
      window.console.log('SENDING POST REQUEST to:', url);
      addLog(`Sending POST request to ${url}`);
      
      try {
        // Send the raw edited content without additional formatting
        window.console.log('Request payload:', macroFile.editedContent);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: macroFile.editedContent
        });

        window.console.log(`Response status: ${response.status} ${response.statusText}`);
        addLog(`Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorMsg = `Failed to save macro: ${response.status} ${response.statusText}`;
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
        
        // Update the content
        macroFile.content = parsedJson;
        macroFile.originalContent = macroFile.editedContent;
        macroFile.hasChanges = false;
        
        // Refresh the macros list to capture any name/description changes
        await fetchMacrosList();
        
        window.console.log('Changes saved and state updated successfully');
        addLog(`Changes saved and state updated successfully`);
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : `Failed to save macro`;
        window.console.error('Fetch error:', fetchError);
        addLog(`Network error: ${errorMsg}`);
        macroFile.error = errorMsg;
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : `Failed to save macro`;
      window.console.error('Error saving changes:', e);
      addLog(`Error: ${errorMsg}`);
      macroFile.error = errorMsg;
    }
  }
  
  // Delete a macro
  async function deleteMacro(macroId: string) {
    if (!confirm(`Are you sure you want to delete macro "${macroId}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const response = await fetch(`${baseUrl}/api/macros/${macroId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete macro: ${response.status} ${response.statusText}`);
      }
      
      addLog(`Deleted macro: ${macroId}`);
      
      // If the deleted macro was selected, clear selection
      if (selectedMacro === macroId) {
        selectedMacro = null;
        macroFile.content = null;
        macroFile.originalContent = '';
        macroFile.editedContent = '';
        macroFile.hasChanges = false;
      }
      
      // Refresh the macros list
      await fetchMacrosList();
    } catch (e) {
      window.console.error('Error deleting macro:', e);
      addLog(`Error deleting macro: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  // Revert macro changes
  function revertMacroChanges() {
    addLog(`Reverting changes for macro: ${selectedMacro}`);
    console.log('Reverting changes for', selectedMacro);
    macroFile.editedContent = macroFile.originalContent;
    macroFile.hasChanges = false;
    addLog(`Changes reverted successfully`);
    console.log('Changes reverted successfully');
  }

  async function fetchAllConfigFiles() {
    await Promise.all(Object.keys(configFiles).map(key => {
      if (key === 'macros') {
        return fetchMacrosList();
      } else {
        return fetchConfigFile(key);
      }
    }));
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
    {#if activeSubtab === 'macros'}
      <!-- Macros specific view -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Macros sidebar -->
        <div class="md:col-span-1 border-r pr-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-medium">Macro Files</h3>
            <button
              class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90"
              on:click={() => showNewMacroForm = true}
            >
              + Add New
            </button>
          </div>
          
          {#if configFiles.macros.isLoading}
            <div class="text-center text-muted-foreground py-4">
              Loading macros...
            </div>
          {:else if configFiles.macros.error}
            <div class="text-destructive text-sm p-2">
              {configFiles.macros.error}
            </div>
            <button
              class="w-full mt-2 text-xs bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90"
              on:click={fetchMacrosList}
            >
              Retry Loading Macros
            </button>
          {:else if macrosList.length === 0}
            <div class="text-center text-muted-foreground py-4">
              No macros found
            </div>
          {:else}
            <ul class="space-y-1">
              {#each macrosList as macro}
                <li class="relative group">
                  <button
                    class={`w-full text-left px-3 py-2 rounded-md ${selectedMacro === macro.id ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                    on:click={() => selectMacro(macro.id)}
                  >
                    {macro.name}
                  </button>
                  <div class="absolute top-1 right-1 hidden group-hover:flex space-x-1">
                    <button
                      class="text-xs text-destructive hover:bg-destructive/10 p-1 rounded"
                      on:click|stopPropagation={() => deleteMacro(macro.id)}
                      title="Delete macro"
                    >
                      ×
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
          
          {#if showNewMacroForm}
            <div class="mt-4 border rounded-md p-3 bg-muted">
              <h4 class="text-sm font-medium mb-2">New Macro</h4>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-muted-foreground">ID (used in filename)</label>
                  <input
                    type="text"
                    class="w-full rounded-md text-sm p-1 border"
                    placeholder="my_macro"
                    bind:value={newMacroId}
                  />
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">Display Name</label>
                  <input
                    type="text"
                    class="w-full rounded-md text-sm p-1 border"
                    placeholder="My Macro"
                    bind:value={newMacroName}
                  />
                </div>
                <div class="flex justify-between pt-1">
                  <button
                    class="text-xs bg-muted-foreground/20 px-2 py-1 rounded-md hover:bg-muted-foreground/30"
                    on:click={() => showNewMacroForm = false}
                  >
                    Cancel
                  </button>
                  <button
                    class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
                    disabled={!newMacroId || !newMacroName}
                    on:click={createNewMacro}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Macro content area -->
        <div class="md:col-span-3">
          {#if selectedMacro}
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-medium">Editing: {selectedMacro}</h3>
              <div class="flex space-x-2">
                <button
                  class="flex items-center space-x-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  on:click={() => fetchMacroFile(selectedMacro || '')}
                >
                  <RefreshCw class="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                <button
                  class="flex items-center space-x-1 px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
                  disabled={!macroFile.hasChanges}
                  on:click={revertMacroChanges}
                >
                  <RotateCcw class="h-3 w-3" />
                  <span>Revert</span>
                </button>
                <button
                  class="flex items-center space-x-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled={!macroFile.hasChanges}
                  on:click={saveMacroChanges}
                >
                  <Save class="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>
            
            {#if macroFile.isLoading}
              <div class="text-center text-muted-foreground py-8">
                Loading macro...
              </div>
            {:else if macroFile.error}
              <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
                {macroFile.error}
              </div>
            {:else if macroFile.content}
              <textarea
                class="w-full h-[600px] font-mono text-sm bg-background border rounded-md p-4 resize-none"
                bind:value={macroFile.editedContent}
                on:input={handleMacroEdit}
                spellcheck="false"
              />
            {:else}
              <div class="text-center text-muted-foreground py-8">
                Failed to load macro data
              </div>
            {/if}
          {:else}
            <div class="text-center text-muted-foreground py-8">
              Select a macro from the list to edit
            </div>
          {/if}
        </div>
      </div>
    {:else if configFiles[activeSubtab].isLoading}
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