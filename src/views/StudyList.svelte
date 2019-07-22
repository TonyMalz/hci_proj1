<script>
  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import StudyImporter from "../components/StudyImporter.svelte";
  import StudyCard from "../components/StudyCard.svelte";
  import StudyVariables from "../components/StudyVariables.svelte";
  import StudyUsers from "../components/StudyUsers.svelte";
  import StudyResponses from "../components/StudyResponses.svelte";
  import StudyMerger from "../components/StudyMerger.svelte";
  import { studyStore, msgStore, responseStore } from "../modules/store.js";
  import { dbName } from "../modules/indexeddb.js";
  import { downloadAsJson } from "../modules/utils.js";

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
      toggleNewStudy = false;
    }
  }

  let selectedStudies = [];
  function selectStudy(event) {
    const study = event.detail;
    const studyId = study.studyId;
    let alreadySelected = false;
    for (const studyItem of selectedStudies) {
      if (studyItem.studyId === studyId) {
        alreadySelected = true;
        selectedStudies = selectedStudies.filter(v => v.studyId !== studyId);
        break;
      }
    }
    if (alreadySelected) return;
    selectedStudies.push(study);
    selectedStudies = selectedStudies;
  }

  $: disabled = selectedStudies.length ? false : true;
  $: if (selectedStudies.length) {
    console.log("show study actions", selectedStudies);
  }
  $: studyCount = $studyStore.length;

  function exportSelected() {
    if (!selectedStudies.length) return;
    const exportData = [];
    for (const study of selectedStudies) {
      const studyData = $studyStore.filter(v => v._id === study.studyId)[0];
      const taskResults = $responseStore.filter(
        v => v.studyId === study.studyId
      );
      exportData.push({ dataSchema: studyData, taskResults });
    }
    downloadAsJson(exportData, `export_of_${selectedStudies.length}_studies`);
  }

  function openSelected() {
    if (!selectedStudies.length) return;
    for (const study of selectedStudies) {
      const _id = study.studyId;
      const studyName = study.studyName;
      const msg = {
        type: "navigation",
        action: "openStudyTabs",
        data: { _id, studyName }
      };
      $msgStore.push(msg);
    }
    $msgStore = $msgStore; // make sure store gets updated
  }

  let toggleNewStudy = false;
  function createNewFromSelected() {
    if (!selectedStudies.length) return;
    toggleNewStudy = true;
  }
</script>

<style>
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, 30ch);
    grid-gap: 1rem;
    align-items: flex-start;
  }
  .study {
    position: relative;
    width: 100%;
    height: 100%;
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
    /* box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.25); */
    box-shadow: 2px 3px 16px 3px rgba(0, 0, 0, 0.2);
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
  .actions {
    margin-top: -0.5rem;
    padding-bottom: 1rem;
    display: flex;
    align-items: baseline;
    font-weight: 300;
    /* color: rgb(202, 202, 202); */
  }
  .selectActions {
    padding-left: 0.5em;
  }
  .action {
    cursor: pointer;
    /* font-weight: 400; */
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    margin: 0 0.5em;
    box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.25);
    color: white;
    background-color: #72203fcb;
  }
  .action:hover {
    box-shadow: 0 2px 10px 1px rgba(0, 0, 0, 0.2);
  }
  /* .open {
    color: white;
    background-color: tomato;
  }
  .new {
    background-color: rgba(255, 99, 71, 0.479);
    background-color: rgba(247, 100, 74, 0.3);
  }
  .export {
    color: white;
    background-color: #722040;
  } */
  .info {
    padding: 0.5rem 0;
  }
</style>

<svelte:window on:keyup={closeDetailView} />

{#if toggleNewStudy}
  <div class="varInfo" transition:fly={{ x: -200, duration: 200 }}>
    <StudyMerger {selectedStudies} />
    <div class="close" on:click={() => (toggleNewStudy = false)}>x close</div>
  </div>
{/if}

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
<div class="actions">
  {#if studyCount}
    <span class="info">
      {studyCount < 2 ? studyCount + ' study' : studyCount + ' studies'}:
    </span>
  {/if}
  {#if selectedStudies.length}
    <span class="selectActions" transition:fly={{ duration: 200, x: -10 }}>
      <div class="action new" class:disabled on:click={createNewFromSelected}>
        create new study from selected ({selectedStudies.length})
      </div>
      <div class="action open" class:disabled on:click={openSelected}>
        open selected ({selectedStudies.length})
      </div>
      <div class="action export" class:disabled on:click={exportSelected}>
        export selected studies ({selectedStudies.length})
      </div>
    </span>
  {/if}

</div>
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
        on:showUsers={showUsers}
        on:selectStudy={selectStudy} />
    </div>
  {/each}
  <div class="study">
    <StudyImporter />
  </div>
</div>

<div class="debug" on:click={dropDB}>Debug: wipe database</div>
