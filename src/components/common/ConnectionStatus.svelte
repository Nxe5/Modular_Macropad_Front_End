<script>
    import wsStore from '../../lib/api/websocket.js';
    import { onMount } from 'svelte';
    
    export let showLabel = true;
    export let position = 'top-right'; // Options: top-right, top-left, inline
    
    let connected = false;
    let connecting = false;
    let reconnectAttempts = 0;
    
    // Subscribe to websocket status
    const unsubscribe = wsStore.subscribe(state => {
        connected = state.connected;
    });
    
    // Connect on component mount
    onMount(() => {
        // Try to connect immediately if not already connected
        if (!connected) {
            wsStore.connect();
        }
        
        // Check again after a short delay (in case the initial check happened before subscription was ready)
        const checkTimer = setTimeout(() => {
            if (!connected) {
                console.log('Connection check - still not connected, trying again');
                wsStore.connect();
            }
        }, 1000);
        
        return () => {
            clearTimeout(checkTimer);
            unsubscribe();
        };
    });
    
    // Function to reconnect
    function reconnect() {
        if (connecting) return;
        
        connecting = true;
        reconnectAttempts++;
        
        // Force disconnect first
        wsStore.disconnect();
        
        // Then reconnect after a brief delay
        setTimeout(() => {
            wsStore.connect();
            connecting = false;
        }, 300);
    }
</script>

<div class={`connection-status ${position} flex items-center gap-2`}>
    <div class={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
    {#if showLabel}
        <span class="text-sm">
            {connected ? 'Connected' : 'Disconnected'}
        </span>
    {/if}
    
    {#if !connected}
        <button 
            class="reconnect-btn"
            on:click={reconnect}
            aria-label="Reconnect to Macropad"
            title="Reconnect to Macropad"
            disabled={connecting}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                 class={`reconnect-icon ${connecting ? 'animate-spin' : ''}`}>
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7l3-3"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7l-3 3"></path>
            </svg>
        </button>
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
    
    .reconnect-btn {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: #ef4444;
        transition: transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .reconnect-btn:hover:not([disabled]) {
        transform: rotate(30deg);
        color: #b91c1c;
    }
    
    .reconnect-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .reconnect-icon {
        width: 1rem;
        height: 1rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style> 