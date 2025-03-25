<script lang="ts">
  import { connectToESP32, forceReconnect } from '../services/websocket';
  import { esp32Config } from '../stores/config';
  
  let ip = $esp32Config.ip;
  let port = $esp32Config.port;
  let isSaving = false;
  let saveMessage = '';
  
  function saveSettings() {
    isSaving = true;
    saveMessage = '';
    
    try {
      // Update config store
      esp32Config.setField('ip', ip);
      esp32Config.setField('port', port);
      
      // Try connecting with new settings
      connectToESP32(ip, port);
      saveMessage = 'Settings saved and connection updated';
      
      setTimeout(() => {
        saveMessage = '';
      }, 3000);
    } catch (error) {
      saveMessage = 'Error saving settings';
    } finally {
      isSaving = false;
    }
  }
  
  function resetToDefaults() {
    esp32Config.resetToDefaults();
    ip = $esp32Config.ip;
    port = $esp32Config.port;
    forceReconnect();
    saveMessage = 'Settings reset to defaults';
    
    setTimeout(() => {
      saveMessage = '';
    }, 3000);
  }
</script>

<div class="bg-card rounded-lg p-6 shadow">
  <h3 class="text-lg font-medium mb-4">ESP32 Connection Settings</h3>
  
  <div class="space-y-4">
    <div class="grid gap-2">
      <label for="esp32-ip" class="text-sm font-medium">ESP32 IP Address</label>
      <input
        id="esp32-ip"
        type="text"
        bind:value={ip}
        class="px-3 py-2 border border-input rounded-md bg-background"
        placeholder="192.168.4.1"
      />
    </div>
    
    <div class="grid gap-2">
      <label for="esp32-port" class="text-sm font-medium">WebSocket Port</label>
      <input
        id="esp32-port"
        type="text"
        bind:value={port}
        class="px-3 py-2 border border-input rounded-md bg-background"
        placeholder="80"
      />
    </div>
    
    <div class="flex gap-2 pt-2">
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        on:click={saveSettings}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save and Connect'}
      </button>
      
      <button
        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
        on:click={resetToDefaults}
      >
        Reset to Defaults
      </button>
    </div>
    
    {#if saveMessage}
      <p class="text-sm text-muted-foreground pt-2">{saveMessage}</p>
    {/if}
  </div>
</div> 