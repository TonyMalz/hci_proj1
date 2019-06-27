<script>
  import { fade } from "svelte/transition";
  import Anova from "../charts/Anova.svelte";
  import WeekChart from "../charts/WeekChart.svelte";
  import BDAChart from "../charts/BDAChart.svelte";
  import ContextPie from "../charts/ContextPie.svelte";
</script>

<style>
  .userview {
    display: grid;
    height: 100%;
    grid-template-rows: 250px auto;
    grid-gap: 1rem;
  }
  .widgetContainer {
    display: flex;
    flex-wrap: wrap;
    overflow: auto;
  }
  .newView {
    border: 1px solid #ccc;
    height: 150px;
    width: 150px;
    border-radius: 2px;
    margin: 1em;
    padding: 60px 0;
    text-align: center;
  }
</style>

<div class="userview" in:fade={{ duration: 300 }}>
  <div class="widgetContainer">
    <div class="newView">Main View</div>
    <div class="newView">User View</div>
  </div>
</div>
