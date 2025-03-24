<!-- src/lib/MacroEditor.svelte -->
<script>
    import { onMount } from 'svelte';
    import { macroStore, wsStore, configStore } from '../../lib/api.ts';
    import { MacropadState } from '../../stores/MacropadStore.svelte.js';
    
    // State
    let macros = [];
    let loading = true;
    let error = null;
    let isConnected = false;
    let isSaving = false;
    let moduleComponent = null;
    
    // Get the selected component
    $: selectedComponent = MacropadState.selectedComponent;
    $: selectedComponentMacro = getAssignedMacro(selectedComponent);
    
    // Load config store state
    let configState;
    const unsubscribeConfig = configStore.subscribe(state => {
        configState = state;
        isSaving = state.loading;
        if (state.error) {
            error = `Failed to save configuration: ${state.error}`;
        }
    });
    
    // Subscribe to websocket connection status
    const unsubscribeWs = wsStore.subscribe(state => {
        isConnected = state.connected;
    });
    
    onMount(async () => {
        try {
            loading = true;
            macros = await macroStore.fetchAll();
            loading = false;
            
            // Find the Module component to access its methods
            setTimeout(() => {
                const moduleEl = document.querySelector('.module-container');
                if (moduleEl && moduleEl.__svelte) {
                    moduleComponent = moduleEl.__svelte;
                    console.log('Module component found:', moduleComponent);
                }
            }, 500);
        } catch (err) {
            error = err.message || 'Failed to load macros';
            loading = false;
        }
        
        return () => {
            unsubscribeWs();
            unsubscribeConfig();
        };
    });
    
    // Helper function to get modules from the MacropadTab component
    function getModules() {
        return document.querySelector('.macropad-view')?.parentNode?.__svelte?.ctx?.get(0);
    }
    
    // Helper function to find a component by ID in modules
    function findComponent(componentId) {
        const modules = getModules();
        if (!modules) return null;
        
        for (const module of modules) {
            for (const component of module.components) {
                if (component.id === componentId) {
                    return component;
                }
            }
        }
        return null;
    }
    
    // Helper function to get the assigned macro (if any) for a component
    function getAssignedMacro(componentId) {
        if (!componentId) return null;
        
        const component = findComponent(componentId);
        if (!component || !component.keyBinding || !component.keyBinding.startsWith('macro:')) {
            return null;
        }
        
        const macroId = component.keyBinding.replace('macro:', '');
        if (!macros.length) return { id: macroId, name: 'Loading...' };
        
        const macro = macros.find(m => m.id === macroId);
        return macro || null;
    }
    
    // Function to save the configuration
    async function saveConfiguration() {
        const modules = getModules();
        if (!modules) {
            alert('Could not access module configuration. Please try again.');
            return false;
        }
        
        try {
            if (isConnected) {
                await configStore.saveConfigWs(modules);
            } else {
                await configStore.saveConfig(modules);
            }
            
            // Clear pending changes after saving
            if (moduleComponent) {
                moduleComponent.clearPendingChanges();
            }
            
            return true;
        } catch (err) {
            error = err.message || 'Failed to save configuration';
            return false;
        }
    }
    
    // Function to assign a macro to the selected component
    async function assignMacro(macroId) {
        // Find the selected component in all modules
        if (selectedComponent) {
            const component = findComponent(selectedComponent);
            
            if (component) {
                // Track the pending change first
                if (moduleComponent) {
                    moduleComponent.setPendingChange(selectedComponent, macroId);
                }
                
                // Update the keyBinding to reference the macro
                component.keyBinding = `macro:${macroId}`;
                
                // Save the configuration
                const success = await saveConfiguration();
                
                if (success) {
                    // Refresh the component display
                    refreshComponent();
                    
                    // Success message
                    const macro = macros.find(m => m.id === macroId);
                    if (macro) {
                        alert(`Macro "${macro.name}" successfully assigned to component ${selectedComponent}`);
                    }
                }
            } else {
                // Component not found error
                alert(`Component ${selectedComponent} not found in any module`);
            }
        }
    }
    
    // Function to remove a macro assignment
    async function removeMacroAssignment() {
        if (selectedComponent) {
            const component = findComponent(selectedComponent);
            
            if (component && component.keyBinding && component.keyBinding.startsWith('macro:')) {
                // Add to pending changes
                if (moduleComponent) {
                    moduleComponent.setPendingChange(selectedComponent, null);
                }
                
                // Save original keyBinding for error recovery
                const originalKeyBinding = component.keyBinding;
                
                // Clear the keyBinding
                component.keyBinding = '';
                
                // Save the configuration
                const success = await saveConfiguration();
                
                if (success) {
                    // Refresh the component display
                    refreshComponent();
                    
                    // Success message
                    alert(`Macro assignment removed from component ${selectedComponent}`);
                } else {
                    // Restore original binding on error
                    component.keyBinding = originalKeyBinding;
                }
            } else {
                alert(`Component ${selectedComponent} does not have a macro assigned`);
            }
        }
    }
    
    // Execute a macro manually
    async function executeMacro(macroId) {
        try {
            await macroStore.executeMacro(macroId);
            alert(`Macro executed successfully`);
        } catch (err) {
            error = err.message || 'Failed to execute macro';
        }
    }
    
    // Refresh display of components
    function refreshComponent() {
        // Force a redraw of the component in the UI
        const modules = getModules();
        if (modules) {
            const updatedModules = [...modules];
            document.querySelector('.macropad-view')?.parentNode?.__svelte?.ctx?.set(0, updatedModules);
        }
    }
    
    // Function to preview a macro assignment without saving
    function previewMacroAssignment(macroId) {
        if (selectedComponent && moduleComponent) {
            moduleComponent.setPendingChange(selectedComponent, macroId);
        }
    }
    
    // Function to cancel all pending changes
    function cancelPendingChanges() {
        if (moduleComponent) {
            moduleComponent.clearPendingChanges();
        }
    }
</script>

<div class="macro-editor">
    <h2>Macro Editor</h2>
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
    
    {#if loading}
        <div class="loading">Loading macros...</div>
    {:else if !selectedComponent}
        <div class="no-selection">
            <p>Select a key on the grid to assign a macro</p>
        </div>
    {:else}
        <div class="editor-content">
            <h3>Selected Component: {selectedComponent}</h3>
            
            {#if selectedComponentMacro}
                <div class="current-assignment">
                    <h4>Current Assignment</h4>
                    <p>Macro: {selectedComponentMacro.name}</p>
                    <p>ID: {selectedComponentMacro.id}</p>
                    
                    <div class="actions">
                        <button 
                            class="button button-secondary" 
                            on:click={() => executeMacro(selectedComponentMacro.id)}
                            disabled={isSaving}
                        >
                            Test Macro
                        </button>
                        
                        <button 
                            class="button button-danger" 
                            on:click={removeMacroAssignment}
                            disabled={isSaving}
                        >
                            Remove Assignment
                        </button>
                    </div>
                </div>
            {:else}
                <p>No macro currently assigned</p>
            {/if}
            
            <div class="macro-list">
                <h4>Available Macros</h4>
                {#if macros.length === 0}
                    <p>No macros available. Create some first!</p>
                {:else}
                    <ul>
                        {#each macros as macro}
                            <li>
                                <div class="macro-item">
                                    <div class="macro-info">
                                        <strong>{macro.name}</strong>
                                        <span class="macro-id">{macro.id}</span>
                                    </div>
                                    
                                    <div class="macro-actions">
                                        <button 
                                            class="button button-small" 
                                            on:click={() => assignMacro(macro.id)}
                                            disabled={isSaving}
                                        >
                                            Assign
                                        </button>
                                        
                                        <button 
                                            class="button button-small button-secondary" 
                                            on:click={() => previewMacroAssignment(macro.id)}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
            
            <div class="pending-actions">
                <button 
                    class="button button-secondary" 
                    on:click={cancelPendingChanges}
                >
                    Cancel All Changes
                </button>
                
                <button 
                    class="button" 
                    on:click={saveConfiguration}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .macro-editor {
        padding: 15px;
        border-radius: 8px;
        background-color: white;
        border: 1px solid #e5e7eb;
    }
    
    h2, h3, h4 {
        margin-top: 0;
    }
    
    .loading, .no-selection {
        padding: 20px;
        text-align: center;
        color: #6b7280;
    }
    
    .error-message {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 4px;
    }
    
    .editor-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .current-assignment {
        padding: 15px;
        background-color: #f3f4f6;
        border-radius: 6px;
    }
    
    .actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    .macro-list {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 10px;
    }
    
    .macro-list h4 {
        margin-bottom: 10px;
    }
    
    .macro-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .macro-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .macro-item:last-child {
        border-bottom: none;
    }
    
    .macro-id {
        display: block;
        font-size: 0.8em;
        color: #6b7280;
    }
    
    .macro-actions {
        display: flex;
        gap: 5px;
    }
    
    .button {
        padding: 8px 12px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .button:hover {
        background-color: #2563eb;
    }
    
    .button:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
    }
    
    .button-secondary {
        background-color: #6b7280;
    }
    
    .button-secondary:hover {
        background-color: #4b5563;
    }
    
    .button-danger {
        background-color: #ef4444;
    }
    
    .button-danger:hover {
        background-color: #dc2626;
    }
    
    .button-small {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    .pending-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
</style>