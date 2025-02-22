<script>
  import MacropadView from './MacropadView.svelte';
  import MacropadOptions from './MacropadOptions.svelte';

  let mainModuleExample = {
  id: 'A1:B2:C3:D4:E5:F6',  // Unique MAC address as the ID for the main module
  gridSize: { rows: 5, columns: 5 },  // 5x5 grid for the main module
  components: [
    {
      id: 'display-1', // Unique ID for the display
      type: 'display',
      position: { row: 0, column: 0 },
      size: { rows: 2, columns: 3 },
      keyBinding: null  // No key binding for display
    },
    {
      id: 'rotary-btn-1', // Unique ID for the rotary encoder with button
      type: 'rotary-btn',
      position: { row: 0, column: 4 },
      keyBinding: "Volume Up"  // For simplicity, a predefined action like "Volume Up"
    },
    {
      id: 'button-1', // Unique ID for the button
      type: 'button',
      position: { row: 1, column: 1 },
      keyBinding: "DELAY 500; PRESS Ctrl; PRESS Z; RELEASE Ctrl; RELEASE Z"  // Undo action (Ctrl+Z)
    },
    {
      id: 'button-2', // Unique ID for the button
      type: 'button',
      position: { row: 1, column: 2 },
      keyBinding: "DELAY 100; PRESS Alt; PRESS F4; RELEASE Alt; RELEASE F4"  // Close Window (Alt+F4)
    },
    {
      id: 'button-3', // Unique ID for the button
      type: 'button',
      position: { row: 1, column: 3 },
      keyBinding: "DELAY 500; PRESS Ctrl; PRESS C; RELEASE Ctrl; RELEASE C"  // Copy (Ctrl+C)
    },
    { id: 'button-4', position: { row: 2, column: 0 }, keyBinding: "DELAY 200; PRESS Space; RELEASE Space" },
    { id: 'button-5', position: { row: 2, column: 1 }, keyBinding: "Ctrl+V" },
    { id: 'button-6', position: { row: 2, column: 2 }, keyBinding: "Ctrl+A" },
    { id: 'button-7', position: { row: 2, column: 3 }, keyBinding: "DELAY 200; PRESS Shift; PRESS Esc; RELEASE Shift; RELEASE Esc" },
    { id: 'button-8', position: { row: 2, column: 4 }, keyBinding: "DELAY 300; PRESS Ctrl; PRESS S; RELEASE Ctrl; RELEASE S" },
    { id: 'button-9', position: { row: 3, column: 0 }, keyBinding: "F5" },
    { id: 'button-10', position: { row: 3, column: 1 }, keyBinding: "F11" },
    { id: 'button-11', position: { row: 3, column: 2 }, keyBinding: "Alt+Tab" },
    { id: 'button-12', position: { row: 3, column: 3 }, keyBinding: "Ctrl+Shift+Esc" },
    { id: 'button-13', position: { row: 3, column: 4 }, keyBinding: "Ctrl+P" },
    { id: 'button-14', position: { row: 4, column: 0 }, keyBinding: "Alt+F4" },
    { id: 'button-15', position: { row: 4, column: 1 }, keyBinding: "Ctrl+W" },
    { id: 'button-16', position: { row: 4, column: 2 }, keyBinding: "Ctrl+Shift+T" },
    { id: 'button-17', position: { row: 4, column: 3 }, keyBinding: "Ctrl+N" },
    { id: 'button-18', position: { row: 4, column: 4 }, keyBinding: "Ctrl+Shift+S" }
  ]
};

  let modules = [mainModuleExample];
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .top-section {
    flex: 1;
  }

  .bottom-section {
    flex: 1;
  }
</style>

<div class="container">
  <div class="top-section">
    <!-- Pass the module prop to MacropadView component -->
    <MacropadView {modules} />
  </div>
  <div class="bottom-section">
    <MacropadOptions />
  </div>
</div>
