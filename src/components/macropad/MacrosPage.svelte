<script>
    import { onMount } from 'svelte';
    import { macroStore, wsStore } from '../../lib/api.ts';
    import CommandEditor from './CommandEditor.svelte';
    
    // State
    let macros = [];
    let loading = true;
    let error = null;
    let selectedMacro = null;
    let editMode = false;
    let isConnected = false;
    let createMode = false;
    
    // Assignment popup state
    let showAssignPopup = false;
    let macroToAssign = null;
    
    // Form state
    let editId = '';
    let editName = '';
    let editDescription = '';
    let editCommands = [];
    
    // Subscribe to websocket connection status
    const unsubscribe = wsStore.subscribe(state => {
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
            unsubscribe();
        };
    });
    
    function startEdit(macro) {
        selectedMacro = macro;
        editId = macro.id;
        editName = macro.name;
        editDescription = macro.description || '';
        editCommands = [...(macro.commands || [])];
        editMode = true;
        createMode = false;
    }
    
    function startCreate() {
        selectedMacro = null;
        editId = '';
        editName = '';
        editDescription = '';
        editCommands = [];
        editMode = true;
        createMode = true;
    }
    
    function cancelEdit() {
        editMode = false;
        createMode = false;
        selectedMacro = null;
    }
    
    async function executeMacro(macro) {
        try {
            await macroStore.executeMacro(macro.id);
        } catch (err) {
            error = err.message || 'Failed to execute macro';
        }
    }
    
    async function deleteMacro(macro) {
        if (!confirm(`Are you sure you want to delete the macro "${macro.name}"?`)) {
            return;
        }
        
        try {
            await macroStore.deleteMacro(macro.id);
            macros = macros.filter(m => m.id !== macro.id);
        } catch (err) {
            error = err.message || 'Failed to delete macro';
        }
    }
    
    async function saveMacro() {
        const macroData = {
            id: editId,
            name: editName,
            description: editDescription,
            commands: editCommands
        };
        
        try {
            if (createMode) {
                const newMacro = await macroStore.createMacro(macroData);
                macros = [...macros, newMacro];
            } else {
                const updatedMacro = await macroStore.updateMacro(editId, macroData);
                macros = macros.map(m => m.id === editId ? updatedMacro : m);
            }
            
            editMode = false;
            createMode = false;
            selectedMacro = null;
        } catch (err) {
            error = err.message || 'Failed to save macro';
        }
    }
    
    function handleCommandsUpdate(event) {
        editCommands = event.detail.commands;
    }
    
    function openAssignPopup(macro) {
        macroToAssign = macro;
        showAssignPopup = true;
    }
    
    function closeAssignPopup() {
        showAssignPopup = false;
        macroToAssign = null;
    }
    
    async function assignToButton(buttonId) {
        if (!macroToAssign) return;
        
        try {
            // Send WebSocket message to assign the macro
            await wsStore.assignMacroToButton(macroToAssign.id, buttonId);
            
            closeAssignPopup();
        } catch (err) {
            error = err.message || 'Failed to assign macro to button';
        }
    }
</script>

<div class="macros-page p-4">
    <h2 class="text-2xl font-bold mb-4">Macros</h2>
    
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
    
    {#if !isConnected}
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>Notice:</strong> Not connected to the device. Macro execution will not work until connection is established.
            <button 
                class="ml-2 px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                on:click={() => wsStore.connect()}
            >
                Reconnect
            </button>
        </div>
    {/if}
    
    {#if loading}
        <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    {:else if editMode}
        <!-- Edit/Create Macro Form -->
        <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium mb-4">
                {createMode ? 'Create New Macro' : 'Edit Macro'}
            </h3>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1" for="macro-id">
                    ID
                </label>
                <input 
                    id="macro-id"
                    type="text" 
                    class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    bind:value={editId}
                    placeholder="Unique identifier (no spaces, lowercase)"
                    disabled={!createMode}
                />
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1" for="macro-name">
                    Name
                </label>
                <input 
                    id="macro-name"
                    type="text" 
                    class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    bind:value={editName}
                    placeholder="Display name"
                />
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1" for="macro-description">
                    Description (optional)
                </label>
                <textarea 
                    id="macro-description"
                    class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    bind:value={editDescription}
                    placeholder="Description of what this macro does"
                    rows="2"
                ></textarea>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Commands
                </label>
                
                <CommandEditor 
                    commands={editCommands}
                    on:update={handleCommandsUpdate}
                />
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
                <button
                    class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                    on:click={cancelEdit}
                >
                    Cancel
                </button>
                <button
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                    disabled={!editId || !editName || editCommands.length === 0}
                    on:click={saveMacro}
                >
                    {createMode ? 'Create' : 'Save'}
                </button>
            </div>
        </div>
    {:else}
        <!-- Macros List -->
        <div class="flex justify-between mb-6">
            <div class="flex items-center">
                <div class={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span class="text-sm text-gray-600">
                    WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
            
            <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                on:click={startCreate}
            >
                Create Macro
            </button>
        </div>
        
        {#if macros.length === 0}
            <div class="bg-gray-100 rounded-lg p-8 text-center">
                <p class="text-gray-500">No macros defined yet.</p>
                <button
                    class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    on:click={startCreate}
                >
                    Create Your First Macro
                </button>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each macros as macro}
                    <div class="bg-white shadow rounded-lg overflow-hidden">
                        <div class="p-4">
                            <div class="flex justify-between items-start">
                                <h3 class="text-lg font-medium">{macro.name}</h3>
                                
                                <div class="flex space-x-2">
                                    <button
                                        class="text-blue-600 hover:text-blue-800"
                                        on:click={() => startEdit(macro)}
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    
                                    <button
                                        class="text-red-600 hover:text-red-800"
                                        on:click={() => deleteMacro(macro)}
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {#if macro.description}
                                <p class="text-sm text-gray-600 mt-1">{macro.description}</p>
                            {/if}
                            
                            <p class="text-xs text-gray-500 mt-2">ID: {macro.id}</p>
                            
                            <p class="text-xs text-gray-500 mt-1">
                                {(macro.commands || []).length} commands
                            </p>
                        </div>
                        
                        <div class="bg-gray-50 px-4 py-3 border-t flex justify-between">
                            <button
                                class="flex-1 bg-green-500 text-white px-2 py-2 rounded-l hover:bg-green-600 flex justify-center items-center"
                                on:click={() => executeMacro(macro)}
                                disabled={!isConnected}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                                </svg>
                                Execute
                            </button>
                            
                            <button
                                class="flex-1 bg-indigo-500 text-white px-2 py-2 rounded-r hover:bg-indigo-600 flex justify-center items-center ml-2"
                                on:click={() => openAssignPopup(macro)}
                                disabled={!isConnected}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                                Assign
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>

{#if showAssignPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-medium mb-4">Assign "{macroToAssign.name}" to Button</h3>
        
        <p class="text-sm text-gray-600 mb-4">
            Select a button to assign this macro to. This will update the button's configuration.
        </p>
        
        <div class="grid grid-cols-3 gap-2 mb-4">
            {#each Array(9) as _, index}
                <button
                    class="p-4 bg-gray-100 hover:bg-blue-100 border border-gray-300 rounded text-center"
                    on:click={() => assignToButton(`button-0-${index}`)}
                >
                    Button {index + 1}
                </button>
            {/each}
        </div>
        
        <div class="flex justify-end">
            <button
                class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                on:click={closeAssignPopup}
            >
                Cancel
            </button>
        </div>
    </div>
</div>
{/if}

<style>
    /* Add any component-specific styles here */
</style> 