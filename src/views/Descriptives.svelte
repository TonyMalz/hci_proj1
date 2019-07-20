<script>
  import { db } from "../modules/indexeddb";
  import { fade } from "svelte/transition";
  import { variableStore } from "../modules/store";
  import VarStats from "../components/VariableStats.svelte";

  export let studyId = 0;
</script>

<style>
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60ch, 1fr));
    grid-gap: 1rem;
  }
  .spinner {
    position: absolute;
    display: grid;
    height: 100%;
    width: 100%;
    place-items: center;
  }
  img {
    position: relative;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  {#await $variableStore.filter(v => v.studyId === studyId)}
    <div class="spinner">
      <img src="loading.svg" alt="loading page" />
    </div>
  {:then variables}
    {#each variables as variable}
      <VarStats {variable} />
    {/each}
  {/await}
</div>
