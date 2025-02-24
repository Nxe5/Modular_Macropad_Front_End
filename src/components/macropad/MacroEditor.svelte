<!-- src/lib/MacroEditor.svelte -->
<script>
    let activeTab = 'commands';
    let reports = [new Array(8).fill(0)];
    let selectedCategory = 'basic';
    let selectedCommand = '';

    // Ducky Script state
    let duckyLines = [];
    let selectedDuckyCommand = 'REM';
    let duckyValue = '';

    const duckyCommands = [
        'REM',
        'DELAY',
        'DEFAULT_DELAY',
        'GUI',
        'STRING',
        'ENTER',
        'CTRL',
        'ALT',
        'SHIFT'
    ];

    function needsValue(command) {
        return ['STRING', 'DELAY', 'DEFAULT_DELAY', 'REM'].includes(command);
    }

    function addDuckyLine() {
        if (needsValue(selectedDuckyCommand) && !duckyValue) return;
        duckyLines = [...duckyLines, { command: selectedDuckyCommand, value: duckyValue }];
        duckyValue = '';
    }

    function removeDuckyLine(index) {
        duckyLines = duckyLines.filter((_, i) => i !== index);
    }

    const categories = {
        basic: {
            name: 'Basic Keys',
            description: 'Common keyboard keys',
            commands: {
                ...Object.fromEntries(
                    Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(
                        (char, i) => [char.toLowerCase(), { 
                            code: 0x04 + i, 
                            name: char 
                        }]
                    )
                ),
                ...Object.fromEntries(
                    Array.from('1234567890').map(
                        (num, i) => [`num${num}`, {
                            code: 0x1E + i,
                            name: num
                        }]
                    )
                )
            }
        },
        modifiers: {
            name: 'Modifier Keys',
            description: 'Control, Alt, Shift, etc.',
            commands: {
                leftCtrl: { code: 0xE0, name: 'Left Ctrl' },
                rightCtrl: { code: 0xE4, name: 'Right Ctrl' },
                leftShift: { code: 0xE1, name: 'Left Shift' },
                rightShift: { code: 0xE5, name: 'Right Shift' },
                leftAlt: { code: 0xE2, name: 'Left Alt' },
                rightAlt: { code: 0xE6, name: 'Right Alt' },
                leftGui: { code: 0xE3, name: 'Left GUI' },
                rightGui: { code: 0xE7, name: 'Right GUI' }
            }
        },
        media: {
            name: 'Media Controls',
            description: 'Media and browser controls',
            commands: {
                volUp: { code: 0xE9, name: 'Volume Up', type: 'consumer' },
                volDown: { code: 0xEA, name: 'Volume Down', type: 'consumer' },
                mute: { code: 0xE2, name: 'Mute', type: 'consumer' },
                playPause: { code: 0xCD, name: 'Play/Pause', type: 'consumer' },
                nextTrack: { code: 0xB5, name: 'Next Track', type: 'consumer' },
                prevTrack: { code: 0xB6, name: 'Previous Track', type: 'consumer' },
                stop: { code: 0xB7, name: 'Stop', type: 'consumer' },
                browser: { code: 0xB2, name: 'Web Browser', type: 'consumer' },
                email: { code: 0xB4, name: 'Email', type: 'consumer' },
                calculator: { code: 0xB3, name: 'Calculator', type: 'consumer' }
            }
        },
        // ... [rest of the categories remain the same]
    };

    function formatCommandDisplay(command) {
        if (command.type === 'delay') {
            return `DELAY ${command.value}ms`;
        }
        return `${command.name} (0x${command.code.toString(16).padStart(2, '0').toUpperCase()})`;
    }

    function addCommand(command) {
        const newReport = new Array(8).fill(0);
        
        switch (command.type) {
            case 'consumer':
                newReport[0] = command.code;
                break;
            case 'system':
                newReport[1] = command.code;
                break;
            case 'mouse':
            case 'mouse_wheel':
                newReport[0] = command.code;
                break;
            case 'delay':
                return;
            default:
                newReport[2] = command.code;
        }
        
        reports = [...reports, newReport];
    }

    function removeReport(index) {
        reports = reports.filter((_, i) => i !== index);
    }

    function updateByte(reportIndex, byteIndex, value) {
        const numValue = parseInt(value.replace(/^0x/, ''), 16);
        if (isNaN(numValue) || numValue < 0 || numValue > 255) return;
        
        const newReports = [...reports];
        newReports[reportIndex][byteIndex] = numValue;
        reports = newReports;
    }
</script>

<div class="macro-creator">
    <div class="tabs">
        <button 
            class:active={activeTab === 'commands'}
            on:click={() => activeTab = 'commands'}
        >
            Commands
        </button>
        <button 
            class:active={activeTab === 'ducky'}
            on:click={() => activeTab = 'ducky'}
        >
            Ducky Script
        </button>
        <button 
            class:active={activeTab === 'manual'}
            on:click={() => activeTab = 'manual'}
        >
            Manual
        </button>
    </div>

    {#if activeTab === 'commands'}
        <div class="commands-tab">
            <div class="category-select">
                <select bind:value={selectedCategory}>
                    {#each Object.entries(categories) as [key, category]}
                        <option value={key}>{category.name}</option>
                    {/each}
                </select>
                <p class="category-description">
                    {categories[selectedCategory].description}
                </p>
            </div>

            <div class="commands-grid">
                {#each Object.entries(categories[selectedCategory].commands) as [key, command]}
                    <button 
                        class="command-button"
                        on:click={() => addCommand(command)}
                    >
                        {formatCommandDisplay(command)}
                    </button>
                {/each}
            </div>
        </div>
        
        <div class="sequence-view">
            <h3>Command Sequence</h3>
            {#each reports as report, reportIndex}
                <div class="report-row">
                    <span class="report-number">#{reportIndex + 1}</span>
                    <span class="report-content">
                        {report.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
                    </span>
                    <button 
                        class="remove-btn"
                        on:click={() => removeReport(reportIndex)}
                    >
                        ×
                    </button>
                </div>
            {/each}
        </div>

    {:else if activeTab === 'ducky'}
        <div class="ducky-tab">
            <div class="ducky-line-adder">
                <select bind:value={selectedDuckyCommand}>
                    {#each duckyCommands as command}
                        <option value={command}>{command}</option>
                    {/each}
                </select>
                
                {#if needsValue(selectedDuckyCommand)}
                    <input 
                        type={selectedDuckyCommand === 'DELAY' || selectedDuckyCommand === 'DEFAULT_DELAY' ? 'number' : 'text'}
                        placeholder={
                            selectedDuckyCommand === 'REM' ? 'Comment' :
                            selectedDuckyCommand === 'DELAY' ? 'Milliseconds' :
                            selectedDuckyCommand === 'DEFAULT_DELAY' ? 'Default delay in ms' :
                            'Text to type'
                        }
                        bind:value={duckyValue}
                    />
                {/if}
                
                <button on:click={addDuckyLine}>Add Command</button>
            </div>

            <div class="ducky-lines">
                {#each duckyLines as line, i}
                    <div class="ducky-line">
                        <span class="quack">QUACK</span>
                        <span class="command">{line.command}</span>
                        {#if line.value}
                            <span class="value">{line.value}</span>
                        {/if}
                        <button 
                            class="remove-btn"
                            on:click={() => removeDuckyLine(i)}
                        >
                            ×
                        </button>
                    </div>
                {/each}
            </div>
        </div>

    {:else}
        <div class="manual-tab">
            {#each reports as report, reportIndex}
                <div class="report-row">
                    <span class="report-number">#{reportIndex + 1}</span>
                    {#each report as byte, byteIndex}
                        <input 
                            type="text"
                            value={'0x' + byte.toString(16).padStart(2, '0').toUpperCase()}
                            on:input={(e) => updateByte(reportIndex, byteIndex, e.target.value)}
                            class="byte-input"
                        />
                    {/each}
                    <button 
                        class="remove-btn"
                        on:click={() => removeReport(reportIndex)}
                    >
                        ×
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    <button class="add-btn" on:click={() => reports = [...reports, new Array(8).fill(0)]}>
        Add Report
    </button>
</div>

<style>
    .macro-creator {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .tabs button {
        padding: 0.5rem 1rem;
        border: none;
        background: #eee;
        cursor: pointer;
        border-radius: 4px;
    }

    .tabs button.active {
        background: #007bff;
        color: white;
    }

    .category-select {
        margin-bottom: 1rem;
    }

    .category-description {
        color: #666;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .commands-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .command-button {
        padding: 0.5rem;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        font-size: 0.9rem;
    }

    .command-button:hover {
        background: #e9ecef;
    }

    .sequence-view, .ducky-tab {
        margin-top: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .report-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        background: white;
        border-radius: 4px;
    }

    .report-number {
        min-width: 2rem;
        font-weight: bold;
    }

    .report-content {
        font-family: monospace;
        flex-grow: 1;
    }

    .byte-input {
        width: 4rem;
        padding: 0.25rem;
        font-family: monospace;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .remove-btn {
        padding: 0.25rem 0.5rem;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .add-btn {
        width: 100%;
        padding: 0.5rem;
        margin-top: 1rem;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .ducky-line-adder {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .ducky-line-adder select {
        min-width: 150px;
    }

    .ducky-line-adder input {
        flex-grow: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .ducky-lines {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .ducky-line {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .quack {
        width: 60px;
        color: #666;
        font-family: monospace;
        user-select: none;
    }

    .command {
        min-width: 120px;
        font-weight: bold;
        color: #007bff;
    }

    .value {
        flex-grow: 1;
        font-family: monospace;
    }
</style>