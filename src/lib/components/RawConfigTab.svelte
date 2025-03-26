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
  let configFiles: Record<string, ConfigFile> = {
    actions: { name: 'Actions', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    components: { name: 'Components', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    info: { name: 'Info', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    leds: { name: 'LEDs', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false },
    reports: { name: 'Reports', content: null, isLoading: true, error: null, originalContent: '', editedContent: '', hasChanges: false }
  };

  function highlightJSON(json: string): string {
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'text-foreground';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-[#FF9AC1]'; // Pastel pink for keys
          } else {
            cls = 'text-[#A8E6CF]'; // Pastel green for strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-[#FFB3BA]'; // Pastel red for booleans
        } else if (/null/.test(match)) {
          cls = 'text-[#FFD3B6]'; // Pastel orange for null
        } else {
          cls = 'text-[#B5EAD7]'; // Pastel mint for numbers
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/ /g, '&nbsp;');
  }

  function handleEdit(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const file = configFiles[activeSubtab];
    file.editedContent = textarea.value;
    file.hasChanges = file.editedContent !== file.originalContent;
  }

  function revertChanges() {
    console.log('Reverting changes for', configFiles[activeSubtab].name);
    const file = configFiles[activeSubtab];
    file.editedContent = file.originalContent;
    file.hasChanges = false;
    console.log('Changes reverted successfully');
  }

  async function saveChanges() {
    console.log('Saving changes for', configFiles[activeSubtab].name);
    const file = configFiles[activeSubtab];
    try {
      const baseUrl = `http://${$esp32Config.ip}:${$esp32Config.port}`;
      const endpoint = activeSubtab === 'leds' ? 'LEDs' : activeSubtab;
      
      console.log('Validating JSON before sending...');
      // Validate JSON before sending
      const parsedJson = JSON.parse(file.editedContent);
      
      console.log('Sending POST request to', `${baseUrl}/api/config/${endpoint}`);
      const response = await fetch(`${baseUrl}/api/config/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: file.editedContent
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${file.name} config: ${response.status} ${response.statusText}`);
      }

      console.log('Save successful, updating local state');
      // Update the content and reset changes
      file.content = parsedJson;
      file.originalContent = file.editedContent;
      file.hasChanges = false;
      console.log('Changes saved and state updated successfully');
    } catch (e) {
      console.error('Error saving changes:', e);
      file.error = e instanceof Error ? e.message : `Failed to save ${file.name} config`;
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

      file.content = await response.json();
      file.originalContent = JSON.stringify(file.content, null, 2);
      file.editedContent = file.originalContent;
      file.hasChanges = false;
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
      <div class="relative">
        <textarea
          class="w-full h-[600px] font-mono text-sm bg-background border rounded-md p-4 resize-none"
          bind:value={configFiles[activeSubtab].editedContent}
          on:input={handleEdit}
          spellcheck="false"
        />
        <div class="absolute inset-0 pointer-events-none whitespace-pre-wrap font-mono text-sm p-4 overflow-auto" style="color: transparent;">
          {@html highlightJSON(configFiles[activeSubtab].editedContent)}
        </div>
      </div>
    {:else}
      <div class="text-center text-muted-foreground py-8">
        No configuration data available
      </div>
    {/if}
  </div>
</div>

<style>
  textarea {
    caret-color: white;
  }
</style> 