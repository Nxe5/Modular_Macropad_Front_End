<script>
    import { wsStore } from '../../lib/api.ts';
    
    export let showLabel = true;
    export let position = 'top-right'; // Options: top-right, top-left, inline
    
    let connected = false;
    
    // Subscribe to websocket status
    const unsubscribe = wsStore.subscribe(state => {
        connected = state.connected;
    });
    
    // Clean up subscription when component is destroyed
    import { onDestroy } from 'svelte';
    onDestroy(unsubscribe);
</script>

<div class={`connection-status ${position} flex items-center gap-2`}>
    <div class={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
    {#if showLabel}
        <span class="text-sm">
            {connected ? 'Connected' : 'Disconnected'}
        </span>
    {/if}
</div>

<style>
    .connection-status.top-right {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 0.5rem;
        border-radius: 9999px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .connection-status.top-left {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 50;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 0.5rem;
        border-radius: 9999px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .connection-status.inline {
        display: inline-flex;
    }
</style> 