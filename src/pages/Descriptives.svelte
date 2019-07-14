<script>
  import { db } from "../modules/indexeddb";
  import { fade } from "svelte/transition";
  import { variableStore } from "../modules/store";
  import VarStats from "../components/VariableStats.svelte";

  export let studyId = 0;
  // FIXME: always selects first study since tab nav does not work dynamically yet
  const studyIdPromise = new Promise((resolve, rej) => {
    const tx = db.transaction("Studies");
    tx.objectStore("Studies").getAll().onsuccess = e => {
      const studies = e.target.result;
      resolve(studies[0]._id);
    };
  });
</script>

<style>
  .container {
    position: relative;
    height: 100%;
  }
  .spinner {
    display: grid;
    height: 100%;
    place-items: center;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  {#await studyIdPromise}
    <div class="spinner">
      <img src="loading.svg" alt="loading page" />
    </div>
  {:then studyId}
    {#each $variableStore.filter(v => v.studyId === studyId) as variable}
      <VarStats {variable} />
    {/each}
  {/await}
</div>
