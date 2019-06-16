<script>
  import MainChart from "./MainChart.svelte";
  import MainChartSummary from "./MainChartSummary.svelte";
  import Sherlock from "./Sherlock.svelte";
  import Anova from "./Anova.svelte";
  import { fade } from "svelte/transition";
</script>

<style>
  .overview {
    height: 100%;
    display: grid;
    grid-template:
      "main-chart main-chart-summary filters ai-charts"
      "anova anova filters ai-charts";
    grid-template-columns: 2.5fr 0.5fr 0.75fr 1fr;
    grid-template-rows: 2.5fr 1fr;
    grid-gap: 1em;
  }
  .mainChartSummary {
    width: 97%;
    height: 97%;
    grid-area: main-chart-summary;
    padding: 1em;
  }
  leftOAside {
    width: 97%;
    height: 97%;
    box-shadow: 0px 0px 14px 1px #e8e8e8;
    grid-area: filters;
    padding: 1em;
  }
  .mainChart {
    grid-area: main-chart;
  }
  .anova {
    grid-area: anova;
    /* border: 1px dashed gray; */
    width: 100%;
  }
  aside {
    grid-area: ai-charts;
    width: 97%;
    height: 97%;
    box-shadow: 0px 0px 14px 1px #e8e8e8;
    padding: 1em;
    border-radius: 4px;
  }
</style>

<div class="overview" in:fade={{ duration: 300 }}>
  <div class="mainChart">
    <MainChart />
  </div>
  <div class="mainChartSummary">
    <MainChartSummary />
  </div>
  <leftOAside>
    <!-- TODO implement filters -->
    Filters go here
  </leftOAside>
  <aside>
    <Sherlock />
  </aside>
  <div class="anova">
    <Anova />
  </div>
</div>
