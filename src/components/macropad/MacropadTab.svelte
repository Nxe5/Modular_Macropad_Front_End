<!-- components/macropad/MacropadTab.svelte  -->

<script>
  import MacropadView from './MacropadView.svelte';
  import MacropadOptions from './MacropadOptions.svelte';
  

  let mainModuleExample = {
  id: 'A1:B2:C3:D4:E5:F6',  // Unique MAC address as the ID for the main module
  name: 'Main Module',  // Name for the main module
  description: 'This is the main module with a display, rotary encoder, and buttons.',  // Description for the main module
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
      type: 'encoder-btn',
      position: { row: 0, column: 4 },
      keyBinding: "Volume Up"  // For simplicity, a predefined action like "Volume Up"
    },
    {
      id: 'btn-1', // Unique ID for the button
      type: 'button',
      position: { row: 0, column: 3 },
      keyBinding: "DELAY 500; PRESS Ctrl; PRESS Z; RELEASE Ctrl; RELEASE Z"  // Undo action (Ctrl+Z)
    },
    {
      id: 'btn-2', // Unique ID for the button
      type: 'button',
      position: { row: 1, column: 3 },
      keyBinding: "DELAY 100; PRESS Alt; PRESS F4; RELEASE Alt; RELEASE F4"  // Close Window (Alt+F4)
    },
    {
      id: 'btn-3', // Unique ID for the button
      type: 'button',
      position: { row: 1, column: 4 },
      keyBinding: "DELAY 500; PRESS Ctrl; PRESS C; RELEASE Ctrl; RELEASE C"  // Copy (Ctrl+C)
    },
    { id: 'btn-4', type: 'button', position: { row: 2, column: 0 }, keyBinding: "DELAY 200; PRESS Space; RELEASE Space" },
    { id: 'btn-5', type: 'button', position: { row: 2, column: 1 }, keyBinding: "Ctrl+V" },
    { id: 'btn-6', type: 'button', position: { row: 2, column: 2 }, keyBinding: "Ctrl+A" },
    { id: 'btn-7', type: 'button', position: { row: 2, column: 3 }, keyBinding: "DELAY 200; PRESS Shift; PRESS Esc; RELEASE Shift; RELEASE Esc" },
    { id: 'btn-8', type: 'button', position: { row: 2, column: 4 }, keyBinding: "DELAY 300; PRESS Ctrl; PRESS S; RELEASE Ctrl; RELEASE S" },
    { id: 'btn-9', type: 'button', position: { row: 3, column: 0 }, keyBinding: "F5" },
    { id: 'btn-10', type: 'button', position: { row: 3, column: 1 }, keyBinding: "F11" },
    { id: 'btn-11', type: 'button', position: { row: 3, column: 2 }, keyBinding: "Alt+Tab" },
    { id: 'btn-12', type: 'button', position: { row: 3, column: 3 }, keyBinding: "Ctrl+Shift+Esc" },
    { id: 'btn-13', type: 'button', position: { row: 3, column: 4 }, keyBinding: "Ctrl+P" },
    { id: 'btn-14', type: 'button', position: { row: 4, column: 0 }, keyBinding: "Alt+F4" },
    { id: 'btn-15', type: 'button', position: { row: 4, column: 1 }, keyBinding: "Ctrl+W" },
    { id: 'btn-16', type: 'button', position: { row: 4, column: 2 }, keyBinding: "Ctrl+Shift+T" },
    { id: 'btn-17', type: 'button', position: { row: 4, column: 3 }, keyBinding: "Ctrl+N" },
    { id: 'btn-18', type: 'button', position: { row: 4, column: 4 }, keyBinding: "Ctrl+Shift+S" }
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
