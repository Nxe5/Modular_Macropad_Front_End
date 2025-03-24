<!-- components/macropad/MacropadView.svelte  -->

<script>
	import Module from "./Module.svelte";
  import { MacropadState } from "../../stores/MacropadStore.svelte.js";
  import { onMount } from 'svelte';

  export let modules;  // Receive module prop from parent
  
  // Track shared component details across all modules
  let selectedComponent = null;
  let selectedModule = null;
  
  // Update when modules are received or changed
  $: {
    if (modules && modules.length > 0 && !selectedModule) {
      selectedModule = modules[0];
      if (selectedModule.components && selectedModule.components.length > 0) {
        selectedComponent = selectedModule.components[0];
      }
    }
  }
  
  // Handle component selection from any module
  function handleComponentSelected(event) {
    selectedComponent = event.detail.component;
    selectedModule = event.detail.module;
  }
</script>

<style lang="css">
  .macropad-view {
    display: flex;
    gap: 20px;
    padding: 10px;
    margin: 0 auto;
    position: relative;
    border-radius: 10px;
    width: 100%;
    max-width: 1500px;
    height: 100%;
  }
  
  .details-sidebar {
    width: 300px;
    min-width: 300px;
    padding: 10px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .modules-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    flex: 1;
    align-content: flex-start;
    justify-content: center;
  }

  .module-wrapper {
    flex: 0 0 auto;
    width: auto;
    min-width: 280px;
    max-width: 100%;
  }
  
  @media (max-width: 992px) {
    .macropad-view {
      flex-direction: column;
    }
    
    .details-sidebar {
      width: 100%;
      min-width: auto;
    }
  }
  
  .component-details-panel {
    text-align: left;
  }
  
  .details-content p {
    margin: 8px 0;
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
  
  .label {
    font-weight: bold;
    margin-right: 8px;
    width: 70px;
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

<div class="macropad-view">
  <!-- Component Details Sidebar -->
  <div class="details-sidebar">
    {#if selectedComponent}
      <div class="component-details-panel">
        <h3>Component Details</h3>
        <div class="details-content">
          <p><strong>ID:</strong> {selectedComponent.id}</p>
          <p><strong>Type:</strong> {selectedComponent.type}</p>
          <p><strong>Position:</strong> Row {selectedComponent.position.row}, Col {selectedComponent.position.column}</p>
          
          <div class="assignment-details">
            <h4>Bindings</h4>
            <p class="assignment-line">
              <span class="label">Current:</span> 
              <span class="current-binding">{selectedComponent.currentBinding || 'None'}</span>
            </p>
            
            <p class="assignment-line {selectedComponent.pendingBinding ? 'pending' : ''}">
              <span class="label">New:</span> 
              <span class="new-binding">{selectedComponent.pendingBinding || 'None'}</span>
            </p>
          </div>
        </div>
      </div>
    {:else}
      <p>Select a component to view details</p>
    {/if}
  </div>
  
  <!-- Modules Container -->
  <div class="modules-container">
    {#each modules as moduleInfo}
      <div class="module-wrapper">
        <Module 
          {moduleInfo} 
          on:componentSelected={handleComponentSelected}
          selectedComponentId={selectedComponent?.id} 
        />
      </div>
    {/each}
  </div>
</div>