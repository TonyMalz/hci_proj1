<script>
  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import StudyImporter from "../components/StudyImporter.svelte";
  import StudyCard from "../components/StudyCard.svelte";
  import StudyVariables from "../components/StudyVariables.svelte";
  import StudyUsers from "../components/StudyUsers.svelte";
  import StudyResponses from "../components/StudyResponses.svelte";
  import { studyStore } from "../modules/store.js";
  import { dbName } from "../modules/indexeddb.js";

  function dropDB() {
    if (!confirm("Drop current database?")) return;
    console.log("delete db", dbName);

    window.indexedDB.deleteDatabase(dbName);
    location.reload(true);
  }

  let studyData = {};
  let toggleVars = false;
  function showVars(event) {
    studyData = event.detail;
    toggleVars = true;
  }
  let toggleUsers = false;
  function showUsers(event) {
    studyData = event.detail;
    toggleUsers = true;
  }
  let toggleResponses = false;
  function showResponses(event) {
    studyData = event.detail;
    toggleResponses = true;
  }

  function closeDetailView(e) {
    if (e.code === "Escape") {
      toggleVars = false;
      toggleUsers = false;
      toggleResponses = false;
    }
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
    box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }
  .close {
    position: absolute;
    background: white;
    right: 1.5rem;
    top: 0.5rem;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 400;
  }
</style>

<svelte:window on:keyup={closeDetailView} />

{#if toggleVars}
  <div class="varInfo" transition:fly={{ x: -200, duration: 200 }}>
    <StudyVariables {...studyData} />
    <div class="close" on:click={() => (toggleVars = false)}>x close</div>
  </div>
{/if}

{#if toggleUsers}
  <div class="varInfo" transition:fly={{ x: -200, duration: 200 }}>
    <StudyUsers {...studyData} />
    <div class="close" on:click={() => (toggleUsers = false)}>x close</div>
  </div>
{/if}

{#if toggleResponses}
  <div class="varInfo" transition:fly={{ x: -200, duration: 200 }}>
    <StudyResponses {...studyData} />
    <div class="close" on:click={() => (toggleResponses = false)}>x close</div>
  </div>
{/if}

<div class="container" in:fade={{ duration: 300 }}>
  {#each $studyStore as study (study._id)}
    <div
      animate:flip={{ duration: 300 }}
      in:fly={{ duration: 300, y: -100 }}
      class="study">
      <StudyCard
        {...study}
        on:showVariables={showVars}
        on:showResponses={showResponses}
        on:showUsers={showUsers} />
    </div>
  {/each}
  <div class="study">
    <StudyImporter />
  </div>
</div>

<div class="debug" on:click={dropDB}>Debug: wipe database</div>
