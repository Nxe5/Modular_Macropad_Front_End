<script>
    import { createEventDispatcher } from 'svelte';
    
    export let commands = [];
    
    const dispatch = createEventDispatcher();
    
    // Command type selection
    let selectedType = 'key_press';
    
    // Key press / key down data
    let keyReport = new Array(8).fill(0);
    
    // Consumer press data
    let consumerReport = new Array(4).fill(0);
    
    // Delay data
    let delayMs = 100;
    
    // Text data
    let textContent = '';
    
    // Execute macro data
    let targetMacroId = '';
    
    // Add the current command
    function addCommand() {
        let command;
        
        switch (selectedType) {
            case 'key_press':
                command = {
                    type: 'key_press',
                    report: [...keyReport]
                };
                break;
                
            case 'key_down':
                command = {
                    type: 'key_down',
                    report: [...keyReport]
                };
                break;
                
            case 'key_up':
                command = {
                    type: 'key_up'
                };
                break;
                
            case 'consumer_press':
                command = {
                    type: 'consumer_press',
                    report: [...consumerReport]
                };
                break;
                
            case 'delay':
                command = {
                    type: 'delay',
                    ms: delayMs
                };
                break;
                
            case 'type_text':
                command = {
                    type: 'type_text',
                    text: textContent
                };
                break;
                
            case 'execute_macro':
                command = {
                    type: 'execute_macro',
                    macro_id: targetMacroId
                };
                break;
        }
        
        if (command) {
            commands = [...commands, command];
            dispatch('update', { commands });
            resetForm();
        }
    }
    
    // Remove a command from the list
    function removeCommand(index) {
        commands = commands.filter((_, i) => i !== index);
        dispatch('update', { commands });
    }
    
    // Reset the form
    function resetForm() {
        switch (selectedType) {
            case 'key_press':
            case 'key_down':
                keyReport = new Array(8).fill(0);
                break;
                
            case 'consumer_press':
                consumerReport = new Array(4).fill(0);
                break;
                
            case 'delay':
                delayMs = 100;
                break;
                
            case 'type_text':
                textContent = '';
                break;
                
            case 'execute_macro':
                targetMacroId = '';
                break;
        }
    }
    
    // Handle input changes for byte arrays
    function handleByteInput(index, value, isKeyReport = true) {
        // Parse hex value
        let byteValue;
        try {
            if (value.startsWith('0x')) {
                byteValue = parseInt(value.substring(2), 16);
            } else {
                byteValue = parseInt(value, 16);
            }
        } catch (e) {
            return; // Invalid input
        }
        
        // Validate range
        if (isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
            return;
        }
        
        // Update the report
        if (isKeyReport) {
            keyReport[index] = byteValue;
            keyReport = [...keyReport]; // Trigger reactivity
        } else {
            consumerReport[index] = byteValue;
            consumerReport = [...consumerReport]; // Trigger reactivity
        }
    }
    
    // Common keyboard key codes for quick selection
    const commonKeys = [
        { name: 'A', code: '0x04' },
        { name: 'B', code: '0x05' },
        { name: 'C', code: '0x06' },
        { name: 'D', code: '0x07' },
        { name: 'Ctrl', code: '0xE0' },
        { name: 'Shift', code: '0xE1' },
        { name: 'Alt', code: '0xE2' },
        { name: 'Enter', code: '0x28' },
        { name: 'Esc', code: '0x29' },
        { name: 'Backspace', code: '0x2A' },
        { name: 'Tab', code: '0x2B' },
        { name: 'Space', code: '0x2C' }
    ];
    
    // Common consumer codes
    const consumerControls = [
        { name: 'Play/Pause', code: '0xCD' },
        { name: 'Mute', code: '0xE2' },
        { name: 'Volume Up', code: '0xE9' },
        { name: 'Volume Down', code: '0xEA' },
        { name: 'Media Next', code: '0xB5' },
        { name: 'Media Previous', code: '0xB6' }
    ];
    
    // Select a common key
    function selectCommonKey(keyCode) {
        // Clear the report first
        keyReport = new Array(8).fill(0);
        
        // For modifiers (Ctrl, Shift, Alt), set the first byte
        if (keyCode === '0xE0' || keyCode === '0xE1' || keyCode === '0xE2') {
            keyReport[0] = parseInt(keyCode.substring(2), 16);
        } else {
            // For regular keys, set the third byte
            keyReport[2] = parseInt(keyCode.substring(2), 16);
        }
        
        keyReport = [...keyReport]; // Trigger reactivity
    }
    
    // Select a consumer control
    function selectConsumerControl(controlCode) {
        consumerReport = new Array(4).fill(0);
        consumerReport[0] = parseInt(controlCode.substring(2), 16);
        consumerReport = [...consumerReport]; // Trigger reactivity
    }
</script>

<div class="command-editor">
    <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1" for="command-type">
            Command Type
        </label>
        <select
            id="command-type"
            class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            bind:value={selectedType}
        >
            <option value="key_press">Key Press (press and release)</option>
            <option value="key_down">Key Down (press and hold)</option>
            <option value="key_up">Key Up (release all keys)</option>
            <option value="consumer_press">Consumer Control</option>
            <option value="delay">Delay</option>
            <option value="type_text">Type Text</option>
            <option value="execute_macro">Execute Macro</option>
        </select>
    </div>
    
    <!-- Type-specific fields -->
    {#if selectedType === 'key_press' || selectedType === 'key_down'}
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Key Report (HID Keyboard Report)
            </label>
            
            <div class="grid grid-cols-4 gap-2 mb-3">
                {#each keyReport as byte, index}
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">
                            Byte {index}
                        </label>
                        <input 
                            type="text"
                            class="w-full p-1 border border-gray-300 rounded"
                            value={`0x${byte.toString(16).padStart(2, '0').toUpperCase()}`}
                            on:change={(e) => handleByteInput(index, e.target.value, true)}
                        />
                    </div>
                {/each}
            </div>
            
            <div class="bg-gray-100 p-3 rounded-md">
                <h3 class="text-sm font-medium mb-2">Common Keys</h3>
                <div class="flex flex-wrap gap-2">
                    {#each commonKeys as key}
                        <button 
                            class="px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
                            on:click={() => selectCommonKey(key.code)}
                        >
                            {key.name}
                        </button>
                    {/each}
                </div>
                <p class="text-xs text-gray-500 mt-2">
                    Byte 0: Modifiers, Byte 2: Key code
                </p>
            </div>
        </div>
    {:else if selectedType === 'consumer_press'}
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Consumer Report
            </label>
            
            <div class="grid grid-cols-4 gap-2 mb-3">
                {#each consumerReport as byte, index}
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">
                            Byte {index}
                        </label>
                        <input 
                            type="text"
                            class="w-full p-1 border border-gray-300 rounded"
                            value={`0x${byte.toString(16).padStart(2, '0').toUpperCase()}`}
                            on:change={(e) => handleByteInput(index, e.target.value, false)}
                        />
                    </div>
                {/each}
            </div>
            
            <div class="bg-gray-100 p-3 rounded-md">
                <h3 class="text-sm font-medium mb-2">Common Consumer Controls</h3>
                <div class="flex flex-wrap gap-2">
                    {#each consumerControls as control}
                        <button 
                            class="px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
                            on:click={() => selectConsumerControl(control.code)}
                        >
                            {control.name}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {:else if selectedType === 'delay'}
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="delay-ms">
                Delay (milliseconds)
            </label>
            <input 
                id="delay-ms"
                type="number"
                min="1"
                max="10000"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                bind:value={delayMs}
            />
            <p class="text-xs text-gray-500 mt-1">
                Delay between 1 and 10000 milliseconds
            </p>
        </div>
    {:else if selectedType === 'type_text'}
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="text-content">
                Text to Type
            </label>
            <textarea 
                id="text-content"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                bind:value={textContent}
            ></textarea>
        </div>
    {:else if selectedType === 'execute_macro'}
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1" for="target-macro">
                Target Macro ID
            </label>
            <input 
                id="target-macro"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                bind:value={targetMacroId}
                placeholder="Enter the ID of the macro to execute"
            />
            <p class="text-xs text-gray-500 mt-1">
                This will execute another macro as part of this sequence
            </p>
        </div>
    {/if}
    
    <div class="flex justify-end">
        <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            disabled={
                (selectedType === 'type_text' && !textContent) ||
                (selectedType === 'execute_macro' && !targetMacroId)
            }
            on:click={addCommand}
        >
            Add Command
        </button>
    </div>
    
    {#if commands.length > 0}
        <div class="mt-6">
            <h3 class="font-medium mb-2">Command Sequence</h3>
            <ul class="border rounded-md divide-y">
                {#each commands as command, index}
                    <li class="p-3 flex justify-between items-center hover:bg-gray-50">
                        <div>
                            <span class="font-medium">{command.type}</span>
                            
                            {#if command.type === 'key_press' || command.type === 'key_down'}
                                <span class="text-xs text-gray-500 ml-2">
                                    [{command.report.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]
                                </span>
                            {:else if command.type === 'consumer_press'}
                                <span class="text-xs text-gray-500 ml-2">
                                    [{command.report.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]
                                </span>
                            {:else if command.type === 'delay'}
                                <span class="text-xs text-gray-500 ml-2">{command.ms}ms</span>
                            {:else if command.type === 'type_text'}
                                <span class="text-xs text-gray-500 ml-2">"{command.text}"</span>
                            {:else if command.type === 'execute_macro'}
                                <span class="text-xs text-gray-500 ml-2">macro_id: {command.macro_id}</span>
                            {/if}
                        </div>
                        
                        <button
                            class="text-red-500 hover:text-red-700"
                            on:click={() => removeCommand(index)}
                        >
                            ×
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div> 