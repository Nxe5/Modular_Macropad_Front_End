<!-- components/macropad/Module.svelte  -->

<script>
import { createEventDispatcher } from 'svelte';
export let moduleInfo;
export let selectedComponentId = null;

const id = moduleInfo.id;
const name = moduleInfo.name;
const gridSize = moduleInfo.gridSize;
const components = moduleInfo.components;

import {MacropadState} from "../../stores/MacropadStore.svelte.js";
import { onMount } from 'svelte';
import { macroStore } from '../../lib/api.ts';
import wsStore from '../../lib/api/websocket.js';

// Create event dispatcher
const dispatch = createEventDispatcher();

// Keep track of which components have macros assigned
let macroAssignments = {};
let macros = [];
let loading = true;
let pendingChanges = {};

// Load available macros on mount
onMount(async () => {
  try {
    loading = true;
    macros = await macroStore.fetchAll();
    loading = false;
    
    // Check which components have macro assignments
    updateMacroAssignments();
    
    // Select the first component by default
    if (components.length > 0) {
      handleCellClick(components[0]);
    }
  } catch (err) {
    console.error('Failed to load macros:', err);
    loading = false;
  }
});

// Update the internal mapping of components to macros
function updateMacroAssignments() {
  macroAssignments = {};
  
  // Look through components to see which ones have macro bindings
  components.forEach(component => {
    if (component.keyBinding && component.keyBinding.startsWith('macro:')) {
      const macroId = component.keyBinding.replace('macro:', '');
      macroAssignments[component.id] = macroId;
    }
  });
}

// Handler for clicking on a component in the grid
function handleCellClick(component) {
    MacropadState.selectedComponent = component.id;
    MacropadState.selectedComponentType = component.type;
    
    // Create component details
    const componentDetails = {
      id: component.id,
      type: component.type,
      position: component.position,
      currentBinding: component.keyBinding?.startsWith('macro:') 
        ? getMacroName(component.keyBinding.replace('macro:', ''))
        : component.keyBinding || null,
      pendingBinding: pendingChanges[component.id] 
        ? (pendingChanges[component.id].macroName || pendingChanges[component.id].macroId)
        : null
    };
    
    // Dispatch event with component details
    dispatch('componentSelected', {
      component: componentDetails,
      module: moduleInfo
    });
}

// Function to get macro name from ID
function getMacroName(macroId) {
  if (!macroId || !macros.length) return null;
  const macro = macros.find(m => m.id === macroId);
  return macro ? macro.name : null;
}

// Function to get the component style class based on its state
function getComponentClass(component) {
  const classes = ['cell', component.id, component.type];
  
  // Add selected class if this component is selected
  if (selectedComponentId === component.id || MacropadState.selectedComponent === component.id) {
    classes.push('selected');
  }
  
  // Add macro class if this component has a macro assigned
  if (macroAssignments[component.id]) {
    classes.push('has-macro');
  }
  
  // Add pending change class
  if (pendingChanges[component.id]) {
    classes.push('has-pending-change');
  }
  
  return classes.join(' ');
}

// Track pending changes
export function setPendingChange(componentId, newMacroId) {
  pendingChanges[componentId] = {
    macroId: newMacroId,
    macroName: getMacroName(newMacroId)
  };
  
  // Find the component and re-trigger click to update details
  const component = components.find(c => c.id === componentId);
  if (component) {
    handleCellClick(component);
  }
}

// Clear pending changes
export function clearPendingChanges() {
  pendingChanges = {};
  
  // Re-trigger click on current component to update details
  const currentComponentId = MacropadState.selectedComponent;
  const component = components.find(c => c.id === currentComponentId);
  if (component) {
    handleCellClick(component);
  }
}
</script>

<div class="module-container">
  <h2>{name}</h2>
  <h5>{id}</h5>
  <div class="module" style="grid-template-columns: repeat({gridSize.columns}, 40px); grid-template-rows: repeat({gridSize.rows}, 40px)">
    {#each components as component}
      {#if component.size}
        <div
          class={getComponentClass(component)}
          style="
            grid-area: {component.position.row + 1} / {component.position.column + 1} / span {component.size.rows} / span {component.size.columns};
          "
          on:click={() => handleCellClick(component)}
          title={macroAssignments[component.id] ? `Macro: ${getMacroName(macroAssignments[component.id])}` : ''}
          role="button"
          tabindex="0"
          on:keydown={e => e.key === 'Enter' && handleCellClick(component)}
        >
          {#if macroAssignments[component.id]}
            <div class="macro-indicator">M</div>
          {/if}
          {#if pendingChanges[component.id]}
            <div class="pending-change-indicator">!</div>
          {/if}
        </div>
      {:else}
        <div 
          class={getComponentClass(component)}
          style="grid-column: {component.position.column + 1}; grid-row: {component.position.row + 1}"
          on:click={() => handleCellClick(component)}
          title={macroAssignments[component.id] ? `Macro: ${getMacroName(macroAssignments[component.id])}` : ''}
          role="button"
          tabindex="0"
          on:keydown={e => e.key === 'Enter' && handleCellClick(component)}
        >
          {#if macroAssignments[component.id]}
            <div class="macro-indicator">M</div>
          {/if}
          {#if pendingChanges[component.id]}
            <div class="pending-change-indicator">!</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  
  <!-- Pending Changes Summary -->
  {#if Object.keys(pendingChanges).length > 0}
    <div class="pending-changes-summary">
      <h3>Pending Changes</h3>
      <ul>
        {#each Object.entries(pendingChanges) as [componentId, change]}
          <li>
            {componentId}: {change.macroName || change.macroId}
          </li>
        {/each}
      </ul>
      <div class="summary-note">Changes will take effect after saving</div>
    </div>
  {/if}
</div>

<style>
.module-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
  position: relative;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: fit-content;
  margin: 0 auto;
}

h2 {
  margin: 0;
  padding: 0;
  font-size: 22px;
}

h5 {
  margin: 0;
  margin-bottom: 10px;
  padding: 0;
  font-size: 12px;
}

.module {
  display: grid;
  gap: 5px;
  border: 1px solid #dadada;
  border-radius: 10px;
  outline-offset: 8px;
  font-size: 14px;
  text-align: center;
  padding: 6px;
  width: fit-content;
}

.cell {
  position: relative;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  min-width: 40px;
  border-radius: 5px;
  cursor: pointer;
}

.cell:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.cell:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.cell.selected {
  border: 1px solid orange;
  background-color: rgba(255, 166, 0, 0.1);
}

.cell.has-macro {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.cell.has-pending-change {
  background-color: rgba(246, 173, 59, 0.1);
  border: 1px solid rgba(246, 173, 59, 0.4);
}

.macro-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background-color: #3b82f6;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.pending-change-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background-color: #f59e0b;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.pending-changes-summary {
  margin-top: 16px;
  border: 1px solid rgba(246, 173, 59, 0.4);
  border-radius: 8px;
  padding: 12px;
  background: rgba(246, 173, 59, 0.05);
  text-align: left;
}

.pending-changes-summary h3 {
  margin-top: 0;
  color: #c2410c;
  font-size: 16px;
}

.pending-changes-summary ul {
  margin: 8px 0;
  padding-left: 20px;
}

.summary-note {
  font-size: 12px;
  font-style: italic;
  color: #666;
  margin-top: 8px;
}
</style>

