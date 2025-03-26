<script lang="ts">
  export let moduleName: string;
  export let moduleSize: string;
  export let gridSize: { rows: number; columns: number };
  export let components: Array<{
    id: string;
    type: string;
    size: { rows: number; columns: number };
    start_location: { row: number; column: number };
  }>;
  export let selectedComponentId: string | null = null;
  export let onComponentSelect: (componentId: string) => void;
  export let version: string;
  export let id: string;

  // Create a grid array to track component positions
  $: grid = (() => {
    if (!gridSize) return [];
    
    const newGrid = Array(gridSize.rows).fill(null).map(() => 
      Array(gridSize.columns).fill(null)
    );

    if (!components) return newGrid;

    // Place components in the grid
    components.forEach(component => {
      const { start_location, size, id, type } = component;
      // Only mark the starting cell of each component
      if (start_location.row < gridSize.rows && start_location.column < gridSize.columns) {
        newGrid[start_location.row][start_location.column] = { 
          id, 
          type,
          size,
          start_location
        };
      }
    });

    return newGrid;
  })();
</script>

<div class="flex flex-col items-center space-y-4">
  <div class="text-center space-y-1">
    <h3 class="text-lg font-semibold">{moduleName}</h3>
    <div class="text-sm text-muted-foreground space-y-0.5">
      <p>Version: {version}</p>
      <p>Grid: {gridSize.rows}x{gridSize.columns}</p>
      <p>ID: {id}</p>
    </div>
  </div>
  
  {#if gridSize && grid.length > 0}
    <div class="relative w-[250px] h-[250px] border-2 border-border rounded-lg overflow-hidden">
      <div class="absolute inset-2 grid" style="grid-template-columns: repeat({gridSize.columns}, 1fr); grid-template-rows: repeat({gridSize.rows}, 1fr); gap: 4px;">
        {#each grid as row, rowIndex}
          {#each row as cell, colIndex}
            {#if cell}
              <div
                class="absolute cursor-pointer transition-colors
                  bg-primary/10 hover:bg-primary/20
                  {cell.id === selectedComponentId ? 'border-2 border-orange-500' : 'border border-border'}
                  rounded-lg"
                style="
                  top: {(cell.start_location.row / gridSize.rows) * 100}%;
                  left: {(cell.start_location.column / gridSize.columns) * 100}%;
                  width: calc({(cell.size.columns / gridSize.columns) * 100}% - 4px);
                  height: calc({(cell.size.rows / gridSize.rows) * 100}% - 4px);
                "
                on:click={() => onComponentSelect(cell.id)}
              >
                <div class="h-full flex items-center justify-center text-xs font-medium">
                  {cell.type}
                </div>
              </div>
            {/if}
          {/each}
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-center text-muted-foreground py-4">
      Loading grid...
    </div>
  {/if}
</div> 