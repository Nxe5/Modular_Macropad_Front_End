<!-- components/macropad/Module.svelte  -->

<script>
export let moduleInfo;

const id = moduleInfo.id;
const name = moduleInfo.name;
const gridSize = moduleInfo.gridSize;
const components = moduleInfo.components;

import {MacropadState} from "../../stores/MacropadStore.svelte.js";
import { onMount } from 'svelte';
import { macroStore, wsStore } from '../../lib/api.ts';

// Keep track of which components have macros assigned
let macroAssignments = {};
let macros = [];
let loading = true;

// Load available macros on mount
onMount(async () => {
  try {
    loading = true;
    macros = await macroStore.fetchAll();
    loading = false;
    
    // Check which components have macro assignments
    updateMacroAssignments();
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
    console.log(id, MacropadState.selectedComponent, MacropadState.selectedComponentType);
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
  if (MacropadState.selectedComponent === component.id) {
    classes.push('selected');
  }
  
  // Add macro class if this component has a macro assigned
  if (macroAssignments[component.id]) {
    classes.push('has-macro');
  }
  
  return classes.join(' ');
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
        >
          {#if macroAssignments[component.id]}
            <div class="macro-indicator">M</div>
          {/if}
        </div>
      {:else}
        <div 
          class={getComponentClass(component)}
          style="grid-column: {component.position.column + 1}; grid-row: {component.position.row + 1}"
          on:click={() => handleCellClick(component)}
          title={macroAssignments[component.id] ? `Macro: ${getMacroName(macroAssignments[component.id])}` : ''}
        >
          {#if macroAssignments[component.id]}
            <div class="macro-indicator">M</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
.module-container {
  display: grid;
  flex-direction: column;
  /* background-color: #f9f9f9; */
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
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
  /* outline: 1px solid #dadada; */
  border-radius: 10px;
  outline-offset: 8px;
  font-size: 14px;
  text-align: center;
  padding: 6px;
}

.cell {
  position: relative;
  /* background-color: white; */
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  min-width: 40px;
  border-radius: 5px;  
}

.cell.selected {
  border: 1px solid orange;
}

.cell.has-macro {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.4);
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
</style>

