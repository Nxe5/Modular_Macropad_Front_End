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
let pendingChanges = {};
let selectedComponentDetails = null;

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
    
    // Display component details
    selectedComponentDetails = {
      id: component.id,
      type: component.type,
      macroId: component.keyBinding?.startsWith('macro:') 
        ? component.keyBinding.replace('macro:', '')
        : null,
      position: component.position
    };
    
    // Check for pending changes
    if (pendingChanges[component.id]) {
      selectedComponentDetails.pendingChange = pendingChanges[component.id];
    }
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
  
  // Update selected component details if open
  if (selectedComponentDetails && selectedComponentDetails.id === componentId) {
    selectedComponentDetails.pendingChange = pendingChanges[componentId];
  }
}

// Clear pending changes
export function clearPendingChanges() {
  pendingChanges = {};
  if (selectedComponentDetails) {
    selectedComponentDetails.pendingChange = null;
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
  
  <!-- Component Details Panel -->
  {#if selectedComponentDetails}
    <div class="component-details-panel">
      <h3>Component Details</h3>
      <div class="details-content">
        <p><strong>ID:</strong> {selectedComponentDetails.id}</p>
        <p><strong>Type:</strong> {selectedComponentDetails.type}</p>
        <p><strong>Position:</strong> Row {selectedComponentDetails.position.row}, Col {selectedComponentDetails.position.column}</p>
        
        <div class="assignment-details">
          <h4>Assignments</h4>
          <p class="assignment-line">
            <span class="component-name">{selectedComponentDetails.id}:</span> 
            <span class="current-binding">{selectedComponentDetails.macroId ? getMacroName(selectedComponentDetails.macroId) || selectedComponentDetails.macroId : 'None'}</span>
          </p>
          
          {#if selectedComponentDetails.pendingChange}
            <p class="assignment-line pending">
              <span class="component-name">{selectedComponentDetails.id}:</span> 
              <span class="new-binding">{selectedComponentDetails.pendingChange.macroName || selectedComponentDetails.pendingChange.macroId}</span>
            </p>
          {/if}
        </div>
      </div>
      <button class="close-button" on:click={() => selectedComponentDetails = null}>Close</button>
    </div>
  {/if}
  
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
  display: grid;
  flex-direction: column;
  /* background-color: #f9f9f9; */
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
  position: relative;
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

.component-details-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  width: 300px;
  text-align: left;
}

.details-content {
  margin-bottom: 16px;
}

.details-content p {
  margin: 8px 0;
}

.current-assignment, .pending-assignment {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
}

.current-assignment {
  background: rgba(59, 130, 246, 0.1);
}

.pending-assignment {
  background: rgba(246, 173, 59, 0.1);
}

.close-button {
  background: #e5e7eb;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.close-button:hover {
  background: #d1d5db;
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

.assignment-details {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(240, 240, 240, 0.5);
}

.assignment-line {
  display: flex;
  margin: 6px 0;
  align-items: center;
}

.component-name {
  font-weight: bold;
  margin-right: 8px;
}

.current-binding {
  color: #3b82f6;
}

.assignment-line.pending {
  background-color: rgba(250, 240, 137, 0.3);
  padding: 4px 6px;
  border-radius: 4px;
}

.new-binding {
  color: #d97706;
  font-weight: 500;
}
</style>

