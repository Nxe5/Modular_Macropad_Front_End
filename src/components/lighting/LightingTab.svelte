<!--  components/keys/LightingsTab.svelte  -->

<script>
  import LightingView from "./LightingView.svelte";
  import LightingEditor from "./LightingEditor.svelte";

  let selectedLED = null;
</script>

<div class="lightings-tab-container">
  <LightingsDisplay bind:selectedLED />
  <LightingsEditor {selectedLED} />
</div>

<style>
  .lightings-tab-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>