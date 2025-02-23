<script>
export let module;
export let selectedComponent = null; 
export let selectedType = null; 

const id = module.id;
const name = module.name;
const gridSize = module.gridSize;
const components = module.components;

function handleCellClick(component) {
    selectedComponent = component.id
    selectedType = component.type
    console.log(id, selectedComponent, selectedType)
}

</script>

<div class="module-container">
  <h2>{name}</h2>
  <h5>{id}</h5>
  <div class="module" style="grid-template-columns: repeat({gridSize.columns}, 40px); grid-template-rows: repeat({gridSize.rows}, 40px)">
    {#each components as component}
      {#if component.size}
        <div
          class="cell {selectedComponent === component.id ? 'selected' : ''}"
          style="
            grid-area: {component.position.row + 1} / {component.position.column + 1} / span {component.size.rows} / span {component.size.columns};
          "
          on:click={()=>handleCellClick(component)}
        >
          {component.id}
        </div>
      {:else}
        <div 
          class="cell {selectedComponent === component.id ? 'selected' : ''}"
          style="grid-column: {component.position.column + 1}; grid-row: {component.position.row + 1}"
          on:click={()=>handleCellClick(component)}
        >
          {component.id}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
.module-container {
  display: grid;
  flex-direction: column;
  /* background-color: #f9f9f9; */
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
}

h2 {
  margin: 0;
  padding: 0;
  font-size: 22px;
}

h5 {
  margin: 0;
  margin-bottom: 10px;
  padding: 0;
  font-size: 12px;
}

.module {
  display: grid;
  gap: 5px;
  border: 1px solid #dadada;
  outline: 1px solid #dadada;
  border-radius: 10px;
  outline-offset: 8px;
  font-size: 14px;
  text-align: center;
  padding: 6px;
}

.cell {
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  min-width: 40px;
  border-radius: 5px;  
}

.cell.selected {
 border: 1px solid orange;
}

</style>

