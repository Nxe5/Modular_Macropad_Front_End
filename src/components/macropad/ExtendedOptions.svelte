<!-- components/macropad/ExtendedSettings.svelte -->
<script>
  import { Volume2, VolumeX, Play, StopCircle, SkipForward, SkipBack, Sun, Moon, Printer, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-svelte';

  export let selectedKey;
  export let assignKey;

  const extendedKeys = [
    [
      { key: 'Volume Up', size: 1 }, { key: 'Volume Down', size: 1 }, { key: 'Mute', size: 1 }, 
      { key: 'Play/Pause', size: 1 }, { key: 'Stop', size: 1 }
    ],
    [
      { key: 'Next Track', size: 1 }, { key: 'Previous Track', size: 1 }, 
      { key: 'Brightness Up', size: 1 }, { key: 'Brightness Down', size: 1 }
    ],
    [
      { key: 'Print Screen', size: 1 }, { key: 'Scroll Lock', size: 1 }, { key: 'Pause/Break', size: 1 }
    ],
    [
      { key: 'Insert', size: 1 }, { key: 'Home', size: 1 }, { key: 'End', size: 1 }, 
      { key: 'Page Up', size: 1 }, { key: 'Page Down', size: 1 }
    ],
    [
      { key: 'Left Arrow', size: 1 }, { key: 'Right Arrow', size: 1 }, 
      { key: 'Up Arrow', size: 1 }, { key: 'Down Arrow', size: 1 }
    ]
  ];

  // Map key names to lucide-svelte icon components if available.
  // For keys without a matching icon, the value is null.
  const iconMapping = {
    "Volume Up": Volume2,
    "Volume Down": VolumeX,
    "Mute": VolumeX, // Using VolumeX for mute as a fallback.
    "Play/Pause": Play, // Could be enhanced with a toggle.
    "Stop": StopCircle,
    "Next Track": SkipForward,
    "Previous Track": SkipBack,
    "Brightness Up": Sun,
    "Brightness Down": Moon,
    "Print Screen": Printer,
    "Scroll Lock": null,
    "Pause/Break": null,
    "Insert": null,
    "Home": null,
    "End": null,
    "Page Up": null,
    "Page Down": null,
    "Left Arrow": ArrowLeft,
    "Right Arrow": ArrowRight,
    "Up Arrow": ArrowUp,
    "Down Arrow": ArrowDown,
  };
</script>

<div class="keyboard-container">
  {#each extendedKeys as row}
    <div class="keyboard-row">
      {#each row as keyData}
        <button
          class="keyboard-key"
          style="flex: {keyData.size}"
          on:click={() => assignKey(selectedKey, keyData.key)}
        >
          {#if iconMapping[keyData.key]}
            <!-- Render the corresponding lucide-svelte icon -->
            <svelte:component this={iconMapping[keyData.key]} size="16" />
          {:else}
            {keyData.key}
          {/if}
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .keyboard-container {
    display: grid;
    flex-direction: column;
    gap: 5px;
    padding: 10px;
    background-color: #222;
    border-radius: 8px;
    width: fit-content;
    margin: 0 auto;
  }

  .keyboard-row {
    display: flex;
    gap: 5px;
  }

  .keyboard-key {
    background-color: #444;
    color: white;
    padding: 5px 8px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.75em;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 30px; /* Ensures a consistent width even for longer labels */
  }

  .keyboard-key:hover {
    background-color: #666;
  }
</style>
