<script>
  import { formatDate } from "../modules/utils.js";
  import { fade } from "svelte/transition";
  import { db } from "../modules/indexeddb.js";
  import { studyStore } from "../modules/store.js";
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

  const dispatch = createEventDispatcher();
  function showVariables() {
    dispatch("showVariables", { studyId: _id, studyName });
  }
  function showUsers() {
    dispatch("showUsers", { studyId: _id, studyName });
  }
  function showResponses() {
    dispatch("showResponses", { studyId: _id, studyName });
  }

  let taskCount = tasks.length;
  let responses = 0;
  let userCount = 0;

  let variableCount = 0;

  //calc last day of study
  console.log(latestBeginOfDataGathering);
  console.log(new Date(latestBeginOfDataGathering));
  let days =
    Math.max(minimumStudyDurationPerPerson, maximumStudyDurationPerPerson) || 0;
  console.log(days);
  let endDate = new Date(latestBeginOfDataGathering);
  endDate.setDate(endDate.getDate() + days);
  console.log("end date", endDate);

  //FIXME: use stores instead of db
  let res = db
    .transaction("StudyResponses")
    .objectStore("StudyResponses")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    console.log("response count:", count);
    responses = count;
  };

  res = db
    .transaction("Users")
    .objectStore("Users")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    console.log("user count:", count);
    userCount = count;
  };

  res = db
    .transaction("StudyVariables")
    .objectStore("StudyVariables")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    console.log("var count:", count);
    variableCount = count;
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

    // notify study store
    const res = tx.objectStore("Studies").getAll();
    //FIXME: don't overwrite, just replace/add study in store?
    res.onsuccess = e => studyStore.set(e.target.result);
  }
</script>

<style>
  .card {
    border-radius: 0.25rem;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    text-align: center;
    position: absolute;
    width: 100%;
    height: 100%;
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
    margin: 1em;
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
    padding-top: 0.25rem;
  }
  .vars {
    cursor: pointer;
    text-decoration-line: initial;
  }
  .vars:hover {
    text-decoration-line: underline;
  }
</style>

<div class="card" in:fade={{ duration: 400 }}>
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
  <h4>{studyName}</h4>
  <div class="mainInfo">
    <span class="vars" on:click={showUsers}>Users: {userCount}</span>
    <span class="vars" on:click={showResponses}>Responses: {responses}</span>
    <br />
    <span class="vars" on:click={showVariables}>
      Variables: {variableCount}
    </span>
  </div>
  <div class="date">
    <span>Start:</span>
     {formatDate(new Date(earliestBeginOfDataGathering))}
    <span>End:</span>
     {formatDate(endDate)}
  </div>
  <div class="created">imported: {formatDate(__created)} </div>
</div>
