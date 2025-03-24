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
                    // Restore original keyBinding on save failure
                    component.keyBinding = originalKeyBinding;
                }
            } else {
                // No macro assigned
                alert(`No macro assigned to component ${selectedComponent}`);
            }
        }
    }
    
    // Helper function to refresh the component display
    function refreshComponent() {
        setTimeout(() => {
            // Force a UI refresh by deselecting and reselecting the component
            const type = MacropadState.selectedComponentType;
            MacropadState.selectedComponent = null;
            MacropadState.selectedComponentType = null;
            setTimeout(() => {
                MacropadState.selectedComponent = selectedComponent;
                MacropadState.selectedComponentType = type;
            }, 10);
        }, 10);
    }
    
    // Function to execute a macro for testing
    async function executeMacro(macroId) {
        try {
            if (isConnected) {
                await wsStore.executeMacro(macroId);
            } else {
                await macroStore.executeMacro(macroId);
            }
        } catch (err) {
            error = err.message || 'Failed to execute macro';
        }
    }
    
    // Function to navigate to the macro editor
    function goToMacroEditor() {
        // Navigate to the Macros tab
        document.querySelector('button[data-tab="macros"]')?.click();
    }
</script>

<div class="macro-assignment-panel">
    <h3 class="text-lg font-medium mb-4">Assign Macro to Component</h3>
    
    {#if !selectedComponent}
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p>No component selected. Please select a component first.</p>
    </div>
    {:else}
        <div class="mb-4">
            <div class="flex justify-between items-center">
                <p>Component: <strong>{selectedComponent}</strong></p>
                
                {#if configState?.lastSaved}
                    <span class="text-xs text-gray-500">
                        Last saved: {new Date(configState.lastSaved).toLocaleTimeString()}
                    </span>
                {/if}
            </div>

            {#if selectedComponentMacro}
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm font-medium text-blue-800">Assigned Macro: {selectedComponentMacro.name}</p>
                            <p class="text-xs text-blue-600">ID: {selectedComponentMacro.id}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button
                                class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 flex items-center"
                                on:click={() => executeMacro(selectedComponentMacro.id)}
                                disabled={!isConnected}
                            >
                                Test
                            </button>
                            
                    <button 
                                class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 flex items-center"
                                on:click={removeMacroAssignment}
                                disabled={isSaving}
                    >
                                Remove
                    </button>
                        </div>
                    </div>
            </div>
            {/if}
        </div>
        
        {#if !isConnected}
            <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <strong>Notice:</strong> Not connected to the device. Macro execution testing will not work.
            </div>
        {/if}
        
        {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
                    <button 
                    class="float-right font-bold"
                    on:click={() => error = null}
                    >
                        ×
                    </button>
                </div>
        {/if}
        
        {#if loading || isSaving}
            <div class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p class="ml-3 text-gray-600">{isSaving ? 'Saving...' : 'Loading...'}</p>
            </div>
        {:else if macros.length === 0}
            <div class="bg-gray-100 rounded-lg p-6 text-center">
                <p class="text-gray-500 mb-4">No macros available. Create some macros first.</p>
                <button
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    on:click={goToMacroEditor}
                >
                    Go to Macro Editor
                </button>
            </div>
        {:else}
            <h4 class="font-medium text-gray-700 mb-2">{selectedComponentMacro ? 'Assign Different Macro' : 'Available Macros'}</h4>
            
            <div class="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto p-2">
                {#each macros as macro}
                    {#if !selectedComponentMacro || selectedComponentMacro.id !== macro.id}
                        <div class="bg-white shadow rounded-lg overflow-hidden">
                            <div class="p-3">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-medium">{macro.name}</h4>
        </div>

                                {#if macro.description}
                                    <p class="text-sm text-gray-600 mt-1">{macro.description}</p>
                {/if}
                
                                <p class="text-xs text-gray-500 mt-1">
                                    {(macro.commands || []).length} commands
                                </p>
            </div>

                            <div class="bg-gray-50 px-3 py-2 border-t flex justify-between">
                                <button
                                    class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center"
                                    on:click={() => executeMacro(macro.id)}
                                    disabled={!isConnected}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                                    </svg>
                                    Test
                                </button>
                                
                        <button 
                                    class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                    on:click={() => assignMacro(macro.id)}
                                    disabled={isSaving}
                        >
                                    Assign
                        </button>
                    </div>
                        </div>
                    {/if}
                {/each}
        </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
                    <button 
                    class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
                    on:click={goToMacroEditor}
                    >
                    Manage Macros
                    </button>
                </div>
        {/if}
    {/if}
</div>

<style>
    .macro-assignment-panel {
        padding: 1rem;
        background-color: #f9fafb;
        border-radius: 0.5rem;
    }
</style>