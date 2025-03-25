import { writable } from 'svelte/store';

interface ESP32Config {
  ip: string;
  port: string;
}

// Default connection settings
const defaultConfig: ESP32Config = {
  ip: '192.168.4.1',
  port: '80',
};

// Try to load from localStorage or use defaults
function createConfigStore() {
  const storedConfig = localStorage.getItem('esp32Config');
  const initialConfig = storedConfig ? JSON.parse(storedConfig) : defaultConfig;
  
  const { subscribe, set, update } = writable<ESP32Config>(initialConfig);
  
  return {
    subscribe,
    update,
    set,
    // Update specific field
    setField: (field: keyof ESP32Config, value: string) => {
      update(config => {
        const newConfig = { ...config, [field]: value };
        localStorage.setItem('esp32Config', JSON.stringify(newConfig));
        return newConfig;
      });
    },
    // Reset to defaults
    resetToDefaults: () => {
      set(defaultConfig);
      localStorage.setItem('esp32Config', JSON.stringify(defaultConfig));
    }
  };
}

export const esp32Config = createConfigStore(); 