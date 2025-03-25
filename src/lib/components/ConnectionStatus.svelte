<script lang="ts">
  import { onMount } from 'svelte';
  import { RefreshCw } from 'lucide-svelte';
  import { connectionState, ConnectionState, forceReconnect } from '../services/websocket';
  import { cn } from '../utils';

  // Auto-connect on mount
  onMount(() => {
    handleConnect();
  });

  function handleConnect() {
    forceReconnect();
  }
</script>

<div class="flex items-center gap-2">
  <div class="flex items-center">
    <div
      class={cn(
        "h-2.5 w-2.5 rounded-full mr-2",
        $connectionState === ConnectionState.CONNECTED && "bg-green-500",
        $connectionState === ConnectionState.CONNECTING && "bg-yellow-500",
        ($connectionState === ConnectionState.DISCONNECTED || $connectionState === ConnectionState.ERROR) && "bg-red-500"
      )}
    ></div>
    <span class="text-sm">
      {#if $connectionState === ConnectionState.CONNECTED}
        Connected
      {:else if $connectionState === ConnectionState.CONNECTING}
        Connecting...
      {:else if $connectionState === ConnectionState.DISCONNECTED}
        Disconnected
      {:else}
        Connection Error
      {/if}
    </span>
  </div>
  
  {#if $connectionState === ConnectionState.DISCONNECTED || $connectionState === ConnectionState.ERROR}
    <button 
      class="p-1.5 rounded-md hover:bg-muted flex items-center justify-center" 
      on:click={handleConnect}
      aria-label="Reconnect to ESP32"
    >
      <RefreshCw class="h-4 w-4" />
    </button>
  {/if}
</div> 