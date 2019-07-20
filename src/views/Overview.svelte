<script>
  import MainChart from "../charts/MainChart.svelte";
  import Sherlock from "../charts/Sherlock.svelte";
  import Anova from "../charts/Anova.svelte";
  import { fade } from "svelte/transition";

  export let studyId;
</script>

<style>
  .overview {
    height: 100%;
    display: grid;
    grid-template:
      "main-chart ai-charts"
      "anova ai-charts";
    grid-template-columns: 3fr 1fr;
    grid-template-rows: 2.1fr 0.9fr;
    grid-gap: 1em;
  }
  .mainChart {
    height: 100%;
    grid-area: main-chart;
  }
  .anova {
    grid-area: anova;
    width: 100%;
    height: 100%;
  }
  aside {
    grid-area: ai-charts;
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
  <div class="anova">
    <Anova {studyId} />
  </div>
</div>
