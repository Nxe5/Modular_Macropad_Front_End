<!-- components/macropad/MacropadOptions.svelte  -->

<script>
    import { MacropadState } from '../../stores/MacropadStore.svelte.js';
    import BasicOptions from './BasicOptions.svelte'
  import ExtendedOptions from './ExtendedOptions.svelte'

    const navOptions = {
    button: ['Basic', 'Extended', 'Macros'],
    display: ['Display'],
    encoder: ['Encoder'],
    'encoder-btn': ['Basic', 'Extended', 'Macros', 'Encoder']
    };

    let availableOptions = $derived(navOptions[MacropadState.selectedComponentType] || []);
    
    let selectedTab = $state(''); // Track active tab
    
    function selectTab(tab) {
    selectedTab = tab;
    }
</script>

<nav class="macropad-options">
 {#if MacropadState.selectedComponentType}
   <div class="nav-tabs">
     {#each availableOptions as option}
     {console.log(option)}
       <button 
         class="nav-tab {selectedTab === option ? 'active' : ''}"
         on:click={() => selectTab(option)}
       >
         {option}
       </button>
     {/each}
   </div>

   <div class="tab-content">
     {#if selectedTab === 'Basic' }
       <div class="basic-options">
         <BasicOptions />
         
       </div>
     {:else if selectedTab === 'Extended'}
          <div class="extended-options">
         <ExtendedOptions />
         
       </div>
     {:else if selectedTab === 'Macros'}
       <div class="macro-options">
         <h2>Macro Programming</h2>
       </div>
     {:else if selectedTab === 'Display'}
       <div class="display-options">
         <h2>Display Settings</h2>

        </div>
     {:else if selectedTab === 'Encoder'}
       <div class="encoder-options">
         <h2>Encoder Settings</h2>
        </div>
     {/if}
   </div>
 {:else}
   <div class="no-selection">
     Select a component to view options
   </div>
 {/if}
</nav>

<style>
 .macropad-options {
    display: grid;
    gap: 5px;
    padding: 10px;
    margin: 0 auto;
    position: relative;
    border-radius: 10px;
 }

.nav-tabs {
  display: flex;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #dadada;
  margin-bottom: 20px;
  justify-content: center; /* Centers items horizontally */
  width: 100%; /* Ensures the container takes full width */
}

 .nav-tab {
   padding: 8px 16px;
   border-radius: 5px;
   cursor: pointer;
   background: white;
   border: 1px solid #dadada;
 }

 .nav-tab:hover {
   background: #f5f5f5;
 }

 .nav-tab.active {
   background: #e0e0e0;
   border-color: #b0b0b0;
 }

 .tab-content {
   padding: 10px;
 }

 .no-selection {
   text-align: center;
   color: #666;
   padding: 20px;
 }

 h2 {
   margin: 0 0 15px 0;
   font-size: 1.2em;
 }

 label {
   display: block;
   margin-bottom: 5px;
 }

 input {
   padding: 8px;
   border: 1px solid #dadada;
   border-radius: 4px;
   width: 100%;
   max-width: 300px;
 }
</style>