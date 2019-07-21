<script>
  import { formatDate, downloadAsJson } from "../modules/utils.js";
  import { fade } from "svelte/transition";
  import { db } from "../modules/indexeddb.js";
  import { studyStore, msgStore, variableStore } from "../modules/store.js";
  import { createEventDispatcher } from "svelte";

  export let _id,
    studyName,
    description,
    tasks,
    __created,
    minimumStudyDurationPerPerson,
    maximumStudyDurationPerPerson,
    earliestBeginOfDataGathering,
    latestBeginOfDataGathering;

  const studyId = _id;
  const dispatch = createEventDispatcher();
  function showVariables() {
    dispatch("showVariables", { studyId, studyName });
  }
  function showUsers() {
    dispatch("showUsers", { studyId, studyName });
  }
  function showResponses() {
    dispatch("showResponses", { studyId, studyName });
  }

  let selected = false;
  function selectStudy() {
    dispatch("selectStudy", { studyId, studyName });
    selected = !selected;
  }

  function showStudy() {
    const msg = {
      type: "navigation",
      action: "openStudyTabs",
      data: { _id, studyName }
    };
    $msgStore.push(msg);
    $msgStore = $msgStore; // make sure store gets updated
  }

  let responses = 0;
  let userCount = 0;

  //calc last day of study
  let days =
    Math.max(minimumStudyDurationPerPerson, maximumStudyDurationPerPerson) || 0;
  let endDate = new Date(latestBeginOfDataGathering);
  endDate.setDate(endDate.getDate() + days);

  //FIXME: use stores instead of db
  let res = db
    .transaction("StudyResponses")
    .objectStore("StudyResponses")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    responses = count;
  };

  res = db
    .transaction("Users")
    .objectStore("Users")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    userCount = count;
  };

  function deleteStudy() {
    if (!confirm("Do you really want to delete this study?")) return;
    const tx = db.transaction(
      [
        "Studies",
        "StudyResponses",
        "StudyTasks",
        "StudyVariables",
        "Users",
        "TaskResults"
      ],
      "readwrite"
    );

    const deleteRows = e => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    const deleteByIndex = store => {
      tx
        .objectStore(store)
        .index("studyId")
        .openCursor(_id).onsuccess = deleteRows;
    };

    tx.objectStore("Studies").delete(_id);
    [
      "StudyResponses",
      "StudyTasks",
      "StudyVariables",
      "Users",
      "TaskResults"
    ].forEach(store => {
      deleteByIndex(store);
    });

    // notify stores
    tx.objectStore("Studies").getAll().onsuccess = e =>
      studyStore.set(e.target.result);
    tx.objectStore("StudyVariables").getAll().onsuccess = e =>
      variableStore.set(e.target.result);
  }

  function exportStudy() {
    const studyData = $studyStore.filter(v => v._id === studyId)[0];
    if (studyData) {
      console.log("export study", studyId);

      const res = db
        .transaction("StudyResponses")
        .objectStore("StudyResponses")
        .index("studyId")
        .getAll(studyId);
      res.onsuccess = e => {
        const taskResults = e.target.result;
        downloadAsJson(
          { dataSchema: studyData, taskResults },
          `export_study_${studyId}_${studyName.replace(/\s+/g, "_")}`
        );
      };
      res.onerror = e => {
        downloadAsJson(
          { dataSchema: studyData },
          `export_study_${studyId}_${studyName.replace(/\s+/g, "_")}`
        );
      };
    }
  }
</script>

<style>
  .card {
    border-radius: 0.25rem;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    text-align: center;
    position: relative;
    width: 100%;
    height: 100%;
  }
  .card:hover {
    box-shadow: 0 3px 14px 3px rgba(0, 0, 0, 0.2);
  }
  .created {
    position: absolute;
    top: 2.4rem;
    left: 25%;
    font-size: 0.7rem;
    font-style: italic;
    color: rgb(172, 172, 172);
    font-weight: 300;
  }
  .date {
    margin-top: 0.5rem;
    font-size: 0.7rem;
  }
  .date > span {
    color: rgb(172, 172, 172);
  }
  h4 {
    margin: 0;
    padding: 1em;
    cursor: pointer;
  }
  h4:hover {
    text-decoration-line: underline;
  }
  .delete {
    position: absolute;
    right: -0.5rem;
    top: -0.5rem;
    transition: opacity 0.15s ease-in;
    cursor: pointer;
  }
  .card > .delete {
    opacity: 0;
  }
  .card:hover > .delete {
    opacity: 1;
  }
  .mainInfo {
    padding-top: 0.5rem;
  }
  .vars {
    cursor: pointer;
    text-decoration-line: initial;
  }
  .vars:hover {
    text-decoration-line: underline;
  }
  .actions {
    margin-top: 0.5rem;

    font-size: 0.7rem;
    font-weight: 600;
    display: grid;
    grid-template-columns: 1fr 1fr;

    color: white;
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
  .actions > div {
    cursor: pointer;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
  }
  .actions > div:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  .export {
    border-bottom-left-radius: 0.25rem;
  }
  .select {
    border-bottom-right-radius: 0.25rem;
  }
  .selected {
    box-shadow: 0 0px 0px 0.2rem #72203f71 !important;
  }
</style>

<div class="card" class:selected>
  <div class="delete" on:click={deleteStudy}>
    <svg style="width:24px;height:24px;" viewBox="0 0 24 24">
      <path
        fill="#777"
        d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59
        20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22
        12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2
        12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z" />
    </svg>
  </div>
  <h4 on:click|stopPropagation={showStudy}>{studyName}</h4>
  <div class="mainInfo">
    <span class="vars" on:click={showUsers}>Users: {userCount}</span>
    <span class="vars" on:click={showResponses}>Responses: {responses}</span>
    <br />
    <span class="vars" on:click={showVariables}>
      {#await $variableStore.filter(v => v.studyId == _id).length then variableCount}
        Variables: {variableCount}
      {/await}
    </span>
  </div>
  <div class="date">
    <span>Duration:</span>
    {formatDate(earliestBeginOfDataGathering, false)} - {formatDate(endDate, false)}
  </div>
  <div class="created">imported: {formatDate(__created)}</div>
  <div class="actions">
    <div class="export" on:click={exportStudy}>export</div>
    <div class="select" on:click={selectStudy}>
      {selected ? 'unselect' : 'select'}
    </div>
  </div>
</div>
