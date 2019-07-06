<script>
  import { fade } from "svelte/transition";
  import StudyImporter from "../components/StudyImporter.svelte";
  import StudyCard from "../components/StudyCard.svelte";
  import { studyStore } from "../modules/store.js";
  import { dbName } from "../modules/indexeddb.js";

  function dropDB() {
    if (!confirm("Drop current database?")) return;
    console.log("delete db", dbName);

    const res = window.indexedDB.deleteDatabase(dbName);
    location.reload(true);
  }
</script>

<style>
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, 25ch);
    grid-gap: 1rem;
  }
  .study {
    position: relative;
    height: 15ch;
  }
  .debug {
    text-align: center;
    border: 1px dashed rgb(212, 212, 212);
    color: rgb(212, 212, 212);
    cursor: pointer;
    display: inline-block;
    margin: 1rem 0;
    padding: 0.5rem;
    border-radius: 4px;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  {#each $studyStore as study}
    <div class="study">
      <StudyCard {...study} />
    </div>
  {/each}
  <div class="study">
    <StudyImporter />
  </div>
</div>
<div class="debug" on:click={dropDB}>Debug: wipe database</div>
