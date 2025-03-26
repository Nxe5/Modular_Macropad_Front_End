<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fetchWithFallback } from '$lib/utils/fetch';
  
  const dispatch = createEventDispatcher();
  
  interface Command {
    type: string;
    report?: string[];
    text?: string;
    milliseconds?: number;
    x?: number;
    y?: number;
    speed?: number;
    button?: string | number;
    clicks?: number;
    amount?: number;
    count?: number;
    min_time?: number;
    max_time?: number;
  }
  
  interface Macro {
    id: string;
    name: string;
    description: string;
    commands: Command[];
  }
  
  let macros: Macro[] = [];
  let selectedMacro: Macro | null = null;
  let newMacroName = '';
  let newMacroDescription = '';
  let isCreatingMacro = false;
  let isBuildMode = true; // true for build, false for record
  let isLoading = true;
  let error: string | null = null;
  
  // Commands for the selected macro
  let commands: Command[] = [];
  let currentCommand = {
    type: 'key_press',
    report: ["0x00", "0x00", "0x00", "0x00", "0x00", "0x00", "0x00", "0x00"]
  };
  
  // Keyboard key definitions
  const modifierKeys: Record<string, string> = {
    "Left Ctrl": "0x01",
    "Left Shift": "0x02",
    "Left Alt": "0x04",
    "Left GUI": "0x08",
    "Right Ctrl": "0x10",
    "Right Shift": "0x20",
    "Right Alt": "0x40",
    "Right GUI": "0x80"
  };
  
  const basicKeys: Record<string, string> = {
    "A": "0x04", "B": "0x05", "C": "0x06", "D": "0x07", "E": "0x08", "F": "0x09",
    "G": "0x0A", "H": "0x0B", "I": "0x0C", "J": "0x0D", "K": "0x0E", "L": "0x0F",
    "M": "0x10", "N": "0x11", "O": "0x12", "P": "0x13", "Q": "0x14", "R": "0x15",
    "S": "0x16", "T": "0x17", "U": "0x18", "V": "0x19", "W": "0x1A", "X": "0x1B",
    "Y": "0x1C", "Z": "0x1D", 
    "1": "0x1E", "2": "0x1F", "3": "0x20", "4": "0x21", "5": "0x22",
    "6": "0x23", "7": "0x24", "8": "0x25", "9": "0x26", "0": "0x27",
    "Enter": "0x28", "Escape": "0x29", "Backspace": "0x2A", "Tab": "0x2B", "Space": "0x2C",
    "Minus": "0x2D", "Equals": "0x2E", "L Bracket": "0x2F", "R Bracket": "0x30",
    "Backslash": "0x31", "Hash": "0x32", "Semicolon": "0x33", "Quote": "0x34",
    "Grave": "0x35", "Comma": "0x36", "Period": "0x37", "Slash": "0x38"
  };
  
  const functionKeys: Record<string, string> = {
    "F1": "0x3A", "F2": "0x3B", "F3": "0x3C", "F4": "0x3D", "F5": "0x3E", 
    "F6": "0x3F", "F7": "0x40", "F8": "0x41", "F9": "0x42", "F10": "0x43", 
    "F11": "0x44", "F12": "0x45"
  };
  
  // Selected modifier and key
  let selectedModifier: string | null = null;
  let selectedKey: string | null = null;
  
  // Text for type_text command
  let textToType = '';
  
  // Delay for delay command
  let delayMs = 100;
  
  // Active command tab
  let activeCommandTab: 'keyboard' | 'mouse' | 'timing' | 'advanced' = 'keyboard';
  
  // Mouse button options
  const mouseButtons = [
    { value: 'left', label: 'Left Button' },
    { value: 'right', label: 'Right Button' },
    { value: 'middle', label: 'Middle Button' },
    { value: 'back', label: 'Back Button' },
    { value: 'forward', label: 'Forward Button' }
  ];

  // Variables for mouse controls
  let mouseX = 10;
  let mouseY = 10;
  let mouseSpeed = 5;
  let mouseButton = 'left';
  let mouseClicks = 1;
  let scrollAmount = 1;
  
  // Variables for repeat functionality
  let repeatCount = 2;
  
  // Variables for random delay
  let minDelay = 50;
  let maxDelay = 150;
  
  onMount(async () => {
    await loadMacros();
  });
  
  async function loadMacros() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetchWithFallback('/api/config/macros', '/config/macros.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch macros: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      macros = data.macros || [];
      isLoading = false;
    } catch (err: any) {
      error = err.message;
      isLoading = false;
    }
  }
  
  function toggleMode() {
    isBuildMode = !isBuildMode;
  }
  
  function selectMacro(macro: Macro) {
    selectedMacro = macro;
    commands = [...(macro.commands || [])];
  }
  
  function startCreateMacro() {
    isCreatingMacro = true;
    newMacroName = '';
    newMacroDescription = '';
  }
  
  function cancelCreateMacro() {
    isCreatingMacro = false;
  }
  
  async function saveMacro() {
    if (!selectedMacro) {
      alert('No macro selected');
      return;
    }
    
    const macroToSave = {
      ...selectedMacro,
      commands: commands
    };
    
    try {
      const response = await fetch('/api/macros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(macroToSave)
      });
      
      if (response.ok) {
        alert('Macro saved successfully');
        // Refresh macros list
        dispatch('refresh');
      } else {
        alert('Failed to save macro');
      }
    } catch (error) {
      console.error('Error saving macro:', error);
      alert('Error saving macro');
    }
  }
  
  async function createMacro() {
    if (!newMacroName) return;
    
    const id = 'macro_' + Date.now();
    const newMacro: Macro = {
      id,
      name: newMacroName,
      description: newMacroDescription,
      commands: []
    };
    
    const updatedMacros = [...macros, newMacro];
    
    await saveMacrosToServer({
      macros: updatedMacros
    });
    
    isCreatingMacro = false;
    selectMacro(newMacro);
  }
  
  async function saveMacrosToServer(data: { macros: Macro[] }) {
    try {
      const response = await fetch('/api/config/macros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save macros: ${response.status} ${response.statusText}`);
      }
      
      await loadMacros();
    } catch (err: any) {
      error = err.message;
    }
  }
  
  function addKeyPressCommand() {
    if (!selectedModifier && !selectedKey) return;
    
    const report = ["0x00", "0x00", "0x00", "0x00", "0x00", "0x00", "0x00", "0x00"];
    
    // Set modifier byte if selected
    if (selectedModifier) {
      report[0] = modifierKeys[selectedModifier];
    }
    
    // Set key byte if selected
    if (selectedKey) {
      // Find key code
      let keyCode = null;
      if (basicKeys[selectedKey]) {
        keyCode = basicKeys[selectedKey];
      } else if (functionKeys[selectedKey]) {
        keyCode = functionKeys[selectedKey];
      }
      
      if (keyCode) {
        report[2] = keyCode;
      }
    }
    
    commands = [...commands, {
      type: 'key_press',
      report
    }];
    
    selectedModifier = null;
    selectedKey = null;
  }
  
  function addTypeTextCommand() {
    if (!textToType) return;
    
    commands = [...commands, {
      type: 'type_text',
      text: textToType
    }];
    
    textToType = '';
  }
  
  function addDelayCommand() {
    commands = [...commands, {
      type: 'delay',
      milliseconds: delayMs
    }];
  }
  
  function removeCommand(index: number) {
    commands = commands.filter((_, i) => i !== index);
  }
  
  function startRecording() {
    alert('Recording functionality is not yet implemented');
  }
  
  function addMouseMoveCommand() {
    commands = [...commands, {
      type: 'mouse_move',
      x: mouseX,
      y: mouseY,
      speed: mouseSpeed
    }];
  }
  
  function addMouseClickCommand() {
    commands = [...commands, {
      type: 'mouse_click',
      button: mouseButton,
      clicks: mouseClicks
    }];
  }
  
  function addMouseScrollCommand() {
    commands = [...commands, {
      type: 'mouse_scroll',
      amount: scrollAmount
    }];
  }
  
  function addRepeatStartCommand() {
    commands = [...commands, {
      type: 'repeat_start',
      count: repeatCount
    }];
  }
  
  function addRepeatEndCommand() {
    commands = [...commands, {
      type: 'repeat_end'
    }];
  }
  
  function addRandomDelayCommand() {
    commands = [...commands, {
      type: 'random_delay',
      min_time: minDelay,
      max_time: maxDelay
    }];
  }
  
  function getCommandDescription(command: Command): string {
    switch (command.type) {
      case 'key_press':
        // Try to parse the report for display
        let desc = 'Key Press: ';
        const report = command.report || [];
        const modByte = parseInt(report[0], 16);
        const keyByte = parseInt(report[2], 16);
        
        // Add modifiers
        const mods = [];
        if (modByte & 0x01) mods.push('Ctrl');
        if (modByte & 0x02) mods.push('Shift');
        if (modByte & 0x04) mods.push('Alt');
        if (modByte & 0x08) mods.push('GUI');
        
        // Find key name
        let keyName = 'Unknown';
        for (const [name, code] of Object.entries(basicKeys)) {
          if (parseInt(code, 16) === keyByte) {
            keyName = name;
            break;
          }
        }
        if (keyName === 'Unknown') {
          for (const [name, code] of Object.entries(functionKeys)) {
            if (parseInt(code, 16) === keyByte) {
              keyName = name;
              break;
            }
          }
        }
        
        if (mods.length > 0) {
          desc += mods.join('+') + '+';
        }
        desc += keyName;
        return desc;
        
      case 'type_text':
        return `Type: "${command.text}"`;
        
      case 'delay':
        return `Delay: ${command.milliseconds}ms`;
        
      case 'mouse_move':
        return `Move Mouse: x=${command.x}, y=${command.y}, speed=${command.speed}`;
        
      case 'mouse_click':
        return `Mouse ${command.button} Click: ${command.clicks} click(s)`;
        
      case 'mouse_scroll':
        return `Mouse Scroll: ${command.amount ? (command.amount > 0 ? 'up' : 'down') : 'none'} (${command.amount || 0})`;
        
      case 'repeat_start':
        return `Repeat Start: ${command.count} times`;
        
      case 'repeat_end':
        return `Repeat End`;
        
      case 'random_delay':
        return `Random Delay: ${command.min_time}-${command.max_time}ms`;
        
      default:
        return command.type;
    }
  }

  function formatHexValue(value: any): string {
    if (typeof value === 'string') {
      return value.startsWith('0x') ? value : `0x${parseInt(value).toString(16).padStart(2, '0').toUpperCase()}`;
    } else if (typeof value === 'number') {
      return `0x${value.toString(16).padStart(2, '0').toUpperCase()}`;
    }
    return '0x00';
  }
</script>

<div class="space-y-6">
  <!-- Mode toggle -->
  <div class="flex justify-center">
    <div class="inline-flex rounded-md shadow-sm">
      <button
        class={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-md ${isBuildMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        on:click={() => (isBuildMode = true)}
      >
        Build
      </button>
      <button
        class={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-md ${!isBuildMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        on:click={() => (isBuildMode = false)}
      >
        Record
      </button>
    </div>
  </div>
  
  {#if isLoading}
    <div class="text-center p-4">Loading macros...</div>
  {:else if error}
    <div class="text-destructive p-4 border border-destructive rounded-md">
      Error: {error}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Macro list -->
      <div class="md:col-span-1 bg-card rounded-lg border p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">Macros</h3>
          <button 
            class="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80"
            on:click={startCreateMacro}
          >
            New Macro
          </button>
        </div>
        
        {#if macros.length === 0}
          <p class="text-muted-foreground text-sm">No macros found.</p>
        {:else}
          <ul class="space-y-2">
            {#each macros as macro}
              <li>
                <button
                  class={`w-full text-left p-2 rounded hover:bg-muted ${selectedMacro?.id === macro.id ? 'bg-muted border border-border' : ''}`}
                  on:click={() => selectMacro(macro)}
                >
                  <div class="font-medium">{macro.name}</div>
                  {#if macro.description}
                    <div class="text-xs text-muted-foreground">{macro.description}</div>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        
        {#if isCreatingMacro}
          <div class="mt-4 border rounded p-3 bg-muted">
            <h4 class="font-medium mb-2">New Macro</h4>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-muted-foreground block">Name</label>
                <input 
                  type="text" 
                  bind:value={newMacroName} 
                  class="w-full rounded-md border p-1.5 text-sm" 
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground block">Description</label>
                <input 
                  type="text" 
                  bind:value={newMacroDescription} 
                  class="w-full rounded-md border p-1.5 text-sm" 
                />
              </div>
              <div class="flex space-x-2">
                <button 
                  class="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  on:click={createMacro}
                  disabled={!newMacroName}
                >
                  Create
                </button>
                <button 
                  class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded"
                  on:click={cancelCreateMacro}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Editor panel -->
      <div class="md:col-span-2">
        {#if isBuildMode}
          {#if selectedMacro}
            <div class="bg-card rounded-lg border p-4">
              <h3 class="font-medium mb-2">Editing: {selectedMacro.name}</h3>
              
              <!-- Command list -->
              <div class="mb-4">
                <h4 class="text-sm font-medium mb-2">Commands</h4>
                {#if commands.length === 0}
                  <p class="text-sm text-muted-foreground">No commands added yet.</p>
                {:else}
                  <ul class="space-y-2 mb-4">
                    {#each commands as command, index}
                      <li class="flex justify-between items-center p-2 bg-muted rounded">
                        <span class="text-sm">{getCommandDescription(command)}</span>
                        <div class="report-display">
                          Report: [
                          {#if command.report && Array.isArray(command.report)}
                            {#each command.report as value, i}
                              {i > 0 ? ', ' : ''}
                              {formatHexValue(value)}
                            {/each}
                          {/if}
                          ]
                        </div>
                        <button 
                          class="text-xs px-2 py-1 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded"
                          on:click={() => removeCommand(index)}
                        >
                          Remove
                        </button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
              
              <!-- Command builder -->
              <div class="border-t pt-4">
                <h4 class="text-sm font-medium mb-2">Add Command</h4>
                
                <div class="grid grid-cols-1 gap-4 mb-4">
                  <!-- Tabs for command categories -->
                  <div class="flex border-b border-border">
                    <button 
                      class="px-3 py-2 border-b-2 border-primary text-primary font-medium"
                      on:click={() => activeCommandTab = 'keyboard'}
                    >
                      Keyboard
                    </button>
                    <button 
                      class="px-3 py-2 border-b-2 border-transparent hover:border-border hover:text-foreground"
                      on:click={() => activeCommandTab = 'mouse'}
                    >
                      Mouse
                    </button>
                    <button 
                      class="px-3 py-2 border-b-2 border-transparent hover:border-border hover:text-foreground"
                      on:click={() => activeCommandTab = 'timing'}
                    >
                      Timing
                    </button>
                    <button 
                      class="px-3 py-2 border-b-2 border-transparent hover:border-border hover:text-foreground"
                      on:click={() => activeCommandTab = 'advanced'}
                    >
                      Advanced
                    </button>
                  </div>
                  
                  <!-- Keyboard command options -->
                  {#if activeCommandTab === 'keyboard'}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Key Press</label>
                        <div class="space-y-2">
                          <select class="w-full rounded-md border p-1.5 text-sm" bind:value={selectedModifier}>
                            <option value={null}>No Modifier</option>
                            {#each Object.keys(modifierKeys) as mod}
                              <option value={mod}>{mod}</option>
                            {/each}
                          </select>
                          
                          <select class="w-full rounded-md border p-1.5 text-sm" bind:value={selectedKey}>
                            <option value={null}>Select Key</option>
                            <optgroup label="Basic Keys">
                              {#each Object.keys(basicKeys) as key}
                                <option value={key}>{key}</option>
                              {/each}
                            </optgroup>
                            <optgroup label="Function Keys">
                              {#each Object.keys(functionKeys) as key}
                                <option value={key}>{key}</option>
                              {/each}
                            </optgroup>
                          </select>
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addKeyPressCommand}
                            disabled={!selectedModifier && !selectedKey}
                          >
                            Add Key Press
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Type Text</label>
                        <div class="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Text to type"
                            bind:value={textToType} 
                            class="w-full rounded-md border p-1.5 text-sm" 
                          />
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addTypeTextCommand}
                            disabled={!textToType}
                          >
                            Add Type Text
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Mouse command options -->
                  {#if activeCommandTab === 'mouse'}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Mouse Move</label>
                        <div class="space-y-2">
                          <div class="flex gap-2">
                            <div>
                              <label class="text-xs text-muted-foreground">X</label>
                              <input 
                                type="number" 
                                bind:value={mouseX} 
                                min="-100"
                                max="100"
                                class="w-full rounded-md border p-1.5 text-sm" 
                              />
                            </div>
                            <div>
                              <label class="text-xs text-muted-foreground">Y</label>
                              <input 
                                type="number" 
                                bind:value={mouseY} 
                                min="-100"
                                max="100"
                                class="w-full rounded-md border p-1.5 text-sm" 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label class="text-xs text-muted-foreground">Speed (1-10)</label>
                            <input 
                              type="range" 
                              bind:value={mouseSpeed} 
                              min="1"
                              max="10"
                              class="w-full" 
                            />
                            <div class="text-center text-xs">{mouseSpeed}</div>
                          </div>
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addMouseMoveCommand}
                          >
                            Add Mouse Move
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Mouse Click</label>
                        <div class="space-y-2">
                          <select class="w-full rounded-md border p-1.5 text-sm" bind:value={mouseButton}>
                            {#each mouseButtons as button}
                              <option value={button.value}>{button.label}</option>
                            {/each}
                          </select>
                          
                          <div>
                            <label class="text-xs text-muted-foreground">Clicks</label>
                            <input 
                              type="number" 
                              bind:value={mouseClicks} 
                              min="1"
                              max="3"
                              class="w-full rounded-md border p-1.5 text-sm" 
                            />
                          </div>
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addMouseClickCommand}
                          >
                            Add Mouse Click
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Mouse Scroll</label>
                        <div class="space-y-2">
                          <div>
                            <label class="text-xs text-muted-foreground">Amount (+ up, - down)</label>
                            <input 
                              type="number" 
                              bind:value={scrollAmount} 
                              min="-10"
                              max="10"
                              class="w-full rounded-md border p-1.5 text-sm" 
                            />
                          </div>
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addMouseScrollCommand}
                          >
                            Add Mouse Scroll
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Timing command options -->
                  {#if activeCommandTab === 'timing'}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Fixed Delay</label>
                        <div class="space-y-2">
                          <input 
                            type="number" 
                            placeholder="Milliseconds"
                            bind:value={delayMs} 
                            min="1"
                            class="w-full rounded-md border p-1.5 text-sm" 
                          />
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addDelayCommand}
                          >
                            Add Fixed Delay
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Random Delay</label>
                        <div class="space-y-2">
                          <div class="flex gap-2">
                            <div>
                              <label class="text-xs text-muted-foreground">Min (ms)</label>
                              <input 
                                type="number" 
                                bind:value={minDelay} 
                                min="1"
                                class="w-full rounded-md border p-1.5 text-sm" 
                              />
                            </div>
                            <div>
                              <label class="text-xs text-muted-foreground">Max (ms)</label>
                              <input 
                                type="number" 
                                bind:value={maxDelay} 
                                min="{minDelay + 1}"
                                class="w-full rounded-md border p-1.5 text-sm" 
                              />
                            </div>
                          </div>
                          
                          <button 
                            class="w-full text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                            on:click={addRandomDelayCommand}
                            disabled={maxDelay <= minDelay}
                          >
                            Add Random Delay
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Advanced command options -->
                  {#if activeCommandTab === 'advanced'}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="text-xs text-muted-foreground block mb-1">Repeat Block</label>
                        <div class="space-y-2">
                          <div>
                            <label class="text-xs text-muted-foreground">Repeat Count</label>
                            <input 
                              type="number" 
                              bind:value={repeatCount} 
                              min="2"
                              class="w-full rounded-md border p-1.5 text-sm" 
                            />
                          </div>
                          
                          <div class="flex gap-2">
                            <button 
                              class="flex-1 text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                              on:click={addRepeatStartCommand}
                            >
                              Start Repeat
                            </button>
                            <button 
                              class="flex-1 text-xs px-2 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                              on:click={addRepeatEndCommand}
                            >
                              End Repeat
                            </button>
                          </div>
                          
                          <div class="text-xs text-muted-foreground">
                            Add a 'Repeat Start' command, then add the commands you want to repeat, then add a 'Repeat End' command.
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
                
                <div class="flex justify-end">
                  <button 
                    class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    on:click={saveMacro}
                  >
                    Save Macro
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <div class="bg-card rounded-lg border p-4 flex items-center justify-center h-full">
              <p class="text-muted-foreground">Select a macro to edit or create a new one.</p>
            </div>
          {/if}
        {:else}
          <!-- Record mode UI -->
          <div class="bg-card rounded-lg border p-4">
            <h3 class="font-medium mb-4">Record Macro</h3>
            
            <p class="mb-4 text-sm">
              Recording lets you create macros by capturing your keypresses in real-time. Press the button below to start recording.
            </p>
            
            <div class="text-center">
              <button 
                class="px-6 py-3 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                on:click={startRecording}
              >
                Start Recording
              </button>
            </div>
            
            <div class="mt-4 bg-muted p-4 rounded text-sm">
              <p>Note: When recording is active, all keystrokes will be captured until you press the Stop Recording button or the ESC key.</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 