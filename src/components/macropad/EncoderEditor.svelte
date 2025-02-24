<!-- src/lib/EncoderEditor.svelte -->
<script>
  import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Sun, Moon, Volume2, VolumeX, Clock, Zap } from 'lucide-svelte';

  // Local state (can later be replaced or synced with global variables)
  let selectedDirection = 'right';
  let scrubSpeed = 50; // 0 (slow) to 100 (fast)
  let selectedAction = null;

  // List of common encoder actions with associated icons
  const encoderActions = [
    { key: 'Arrow Left', icon: ArrowLeft },
    { key: 'Arrow Right', icon: ArrowRight },
    { key: 'Arrow Up', icon: ArrowUp },
    { key: 'Arrow Down', icon: ArrowDown },
    { key: 'Brightness Up', icon: Sun },
    { key: 'Brightness Down', icon: Moon },
    { key: 'Volume Up', icon: Volume2 },
    { key: 'Volume Down', icon: VolumeX }
  ];

  // Update the selected direction
  function selectDirection(dir) {
    selectedDirection = dir;
    // Update global variables or stores here if needed
  }

  // Update the scrubbing speed from the slider
  function onSpeedChange(e) {
    scrubSpeed = parseInt(e.target.value);
    // Update global variables or stores here if needed
  }

  // Set the chosen action
  function selectAction(action) {
    selectedAction = action;
    // Update global variables or stores here if needed
  }
</script>

<div class="encoder-options">
  <!-- Direction Toggle -->
  <div class="direction-toggle">
    <button class:selected={selectedDirection === 'left'} on:click={() => selectDirection('left')}>
      <ArrowLeft size="20" />
      <span>Left</span>
    </button>
    <button class:selected={selectedDirection === 'right'} on:click={() => selectDirection('right')}>
      <ArrowRight size="20" />
      <span>Right</span>
    </button>
  </div>

  <!-- Speed Slider -->
  <div class="speed-slider">
    <Clock size="16" title="Slow" />
    <input type="range" min="0" max="100" bind:value={scrubSpeed} on:input={onSpeedChange} />
    <Zap size="16" title="Fast" />
    <span class="speed-value">{scrubSpeed}</span>
  </div>

  <!-- Common Action Selections -->
  <div class="actions-grid">
    {#each encoderActions as action}
      <button 
        class:selected={selectedAction && selectedAction.key === action.key} 
        on:click={() => selectAction(action)}
      >
        <svelte:component this={action.icon} size="20" />
        <span>{action.key}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .encoder-options {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
    font-family: sans-serif;
  }

  .direction-toggle {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .direction-toggle button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .direction-toggle button.selected {
    background-color: #007bff;
    color: white;
  }

  .speed-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .speed-slider input[type="range"] {
    flex-grow: 1;
  }

  .speed-value {
    font-size: 0.9em;
    margin-left: 0.5rem;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .actions-grid button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .actions-grid button.selected {
    background-color: #007bff;
    color: white;
  }
</style>
