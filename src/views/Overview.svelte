<script>
  import MainChart from "../charts/MainChart.svelte";
  import Sherlock from "../charts/Sherlock.svelte";

  import { fade } from "svelte/transition";

  export let studyId;
</script>

<style>
  .overview {
    height: 100%;
    display: grid;
    grid-template-columns: 3fr 1fr;
    grid-gap: 1em;
  }
  .mainChart {
    height: 100%;
  }
  aside {
    width: 97%;
    /* height: 97%; */
    box-shadow: 0px 0px 14px 1px #e8e8e8;
    padding: 1em;
    border-radius: 4px;
  }
</style>

<div class="overview" in:fade={{ duration: 300 }}>
  <div class="mainChart">
    <MainChart {studyId} />
  </div>
  <aside>
    <Sherlock />
  </aside>
</div>
