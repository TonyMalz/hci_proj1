<script>
  import { formatDate } from "../modules/utils.js";
  import { fade } from "svelte/transition";
  import { db } from "../modules/indexeddb.js";
  export let _id,
    studyName,
    description,
    tasks,
    __created,
    minimumStudyDurationPerPerson,
    maximumStudyDurationPerPerson,
    earliestBeginOfDataGathering,
    latestBeginOfDataGathering;
  let countTasks = tasks.length;
  let responses = 0;
  //FIXME: use store instead of db
  const res = db
    .transaction("StudyResponses")
    .objectStore("StudyResponses")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    console.log("response count:", count);
    responses = count;
  };
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
    font-size: 0.7rem;
    font-style: italic;
  }
  .start {
    padding-top: 0.7em;
    font-size: 0.7rem;
  }
</style>

<div class="card" in:fade={{ duration: 400 }}>
  <h4>{studyName}</h4>
  <div class="tasks">Tasks: {countTasks} Responses: {responses}</div>
  <div class="start">
    Start: {formatDate(new Date(earliestBeginOfDataGathering))}
  </div>
  <div class="created">imported: {formatDate(__created)} </div>
</div>
