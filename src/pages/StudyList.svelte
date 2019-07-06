<script>
  import { fly, fade } from "svelte/transition";
  import StudyImporter from "../components/StudyImporter.svelte";
  import StudyCard from "../components/StudyCard.svelte";
  import StudyVariables from "../components/StudyVariables.svelte";
  import { studyStore } from "../modules/store.js";
  import { dbName } from "../modules/indexeddb.js";

  function dropDB() {
    if (!confirm("Drop current database?")) return;
    console.log("delete db", dbName);

    const res = window.indexedDB.deleteDatabase(dbName);
    location.reload(true);
  }

  let varData = {};
  let toggle = false;
  function showVars(event) {
    varData = event.detail;
    console.log(varData);
    toggle = true;
  }
</script>

<style>
  .container {
    position: relative;
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
  .varInfo {
    background-color: white;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    border-radius: 0.25rem;
    box-shadow: 1px 3px 6px 0px rgb(64, 64, 64);
  }
  .close {
    position: absolute;
    right: 0.5rem;
    top: 0.3rem;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 400;
  }
</style>

{#if toggle}
  <div class="varInfo" transition:fly={{ x: -200, duration: 200 }}>
    <StudyVariables {...varData} />
    <div class="close" on:click={() => (toggle = false)}>x close</div>
  </div>
{/if}

<div class="container" in:fade={{ duration: 300 }}>
  {#each $studyStore as study}
    <div class="study">
      <StudyCard {...study} on:showVariables={showVars} />
    </div>
  {/each}
  <div class="study">
    <StudyImporter />
  </div>
</div>

<div class="debug" on:click={dropDB}>Debug: wipe database</div>
