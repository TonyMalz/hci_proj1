<script>
  import {
    activeTabIdx,
    tabStore,
    studyStore,
    responseStore,
    userStore
  } from "../modules/store.js";
  import { formatDate } from "../modules/utils";
  import { db } from "../modules/indexeddb";

  let name = "Test Study";
  let participants = 27;
  let datasets = 1326;
  let activeTab = 0;
  let endDate;
  let startDate;
  let currentStudyId;

  activeTabIdx.subscribe(idx => {
    currentStudyId = $tabStore[idx].studyId;
    if (currentStudyId) {
      const currentStudy = $studyStore.filter(v => v._id === currentStudyId)[0];
      name = currentStudy.studyName;
      //calc last day of study
      let days =
        Math.max(
          currentStudy.minimumStudyDurationPerPerson,
          currentStudy.maximumStudyDurationPerPerson
        ) || 0;
      endDate = new Date(currentStudy.latestBeginOfDataGathering);
      endDate.setDate(endDate.getDate() + days);
      startDate = currentStudy.earliestBeginOfDataGathering;
      datasets = $responseStore.filter(v => v.studyId == currentStudyId).length;
      participants = $userStore.filter(v => v.studyId == currentStudyId).length;
    }
  });
</script>

<style>
  #info {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    grid-gap: 1em;
    justify-items: center;
  }
  .appTitle {
    font-weight: bold;
    width: 100%;
    height: 100%;
  }
  .name {
    justify-self: start;
  }
</style>

{#if currentStudyId}
  <div id="info">
    <div class="name">Study name: {name}</div>
    <div>
      Duration: {formatDate(startDate, false)} - {formatDate(endDate, false)}
    </div>
    <div>Number of participants: {participants}</div>
    <div>Datasets collected: {datasets}</div>
  </div>
{:else}
  <div class="appTitle">SensQVis</div>
{/if}
