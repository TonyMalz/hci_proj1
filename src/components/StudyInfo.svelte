<script>
  import { activeTabIdx, tabStore, studyStore } from "../modules/store.js";
  import { db } from "../modules/indexeddb";

  let name = "Test Study";
  let time = "78%";
  let participants = 27;
  let datasets = 1326;
  let activeTab = 0;
  activeTabIdx.subscribe(idx => {
    const currentStudyId = $tabStore[idx].studyId;
    if (currentStudyId) {
      const currentStudy = $studyStore.filter(v => v._id === currentStudyId)[0];
      // console.log("info", currentStudy);
      name = currentStudy.studyName;
      //FIXME: use stores instead of db
      let res = db
        .transaction("StudyResponses")
        .objectStore("StudyResponses")
        .index("studyId")
        .count(currentStudyId);
      res.onsuccess = e => {
        const count = e.target.result;
        datasets = count;
      };

      res = db
        .transaction("Users")
        .objectStore("Users")
        .index("studyId")
        .count(currentStudyId);
      res.onsuccess = e => {
        const count = e.target.result;
        participants = count;
      };
    }
  });
</script>

<style>
  #info {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 3fr 1fr 1fr 1fr;
    grid-gap: 1em;
  }
  .appTitle {
    font-weight: bold;
    width: 100%;
    height: 100%;
  }
</style>

{#if $activeTabIdx}
  <div id="info">
    <div>Study name: {name}</div>
    <div>Total study time elapsed: {time}</div>
    <div>Number of participants: {participants}</div>
    <div>Datasets collected: {datasets}</div>
  </div>
{:else}
  <div class="appTitle">SensQVis</div>
{/if}
