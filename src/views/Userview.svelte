<script>
  import { fade } from "svelte/transition";
  import Anova from "../charts/Anova.svelte";
  import WeekChart from "../charts/WeekChart.svelte";
  import BDAChart from "../charts/BDAChart.svelte";
  import ContextPie from "../charts/ContextPie.svelte";
  import ImageChart from "../charts/ImageChart.svelte";
  import { variableStore } from "../modules/store";
  export let studyId;

  let dependentVariable;
  const numericVariables = $variableStore.filter(
    v =>
      v.studyId === studyId &&
      v.isDemographic === false &&
      v.measure === "scale"
  );
  if (numericVariables && numericVariables.length) {
    dependentVariable = numericVariables[0];
  }
</script>

<style>
  .userview {
    position: relative;
    display: grid;
    grid-template-rows: min-content auto;
    grid-gap: 1rem;
  }
  .optionsContainer {
    position: relative;
    width: 100%;
    overflow: hidden;
    font-size: 0.8rem;
  }
  .widgetContainer {
    display: grid;
    position: relative;
    grid-template-columns: repeat(auto-fit, minmax(35rem, 1fr));
    grid-template-rows: min-content;
    grid-gap: 1rem;
  }

  .widget {
    position: relative;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    border-radius: 0.25rem;
    padding: 0.5em 1em;
    width: 100%;
    height: 24ch;
    overflow: auto;
  }
</style>

<div class="userview" in:fade={{ duration: 300 }}>
  <div class="optionsContainer">
    <select name="user" id="userSelect">
      <option value="1">
        User 1 | avg. availability: 6.3 | responses: 223
      </option>
      <option value="2">
        User 2 | avg. availability: 2.3 | responses: 124
      </option>
      <option value="3">User 3 | avg. availability: 3.1 | responses: 24</option>
      <option value="4">
        User 4 | avg. availability: 4.3 | responses: 424
      </option>
      <option value="5">
        User 5 | avg. availability: 3.3 | responses: 254
      </option>
    </select>

    <!-- <button id="newWidgetButton">
      New Widget
      <svg style="width:25px;height:25px">
        <path
          fill="#333"
          d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59
          20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0
          12,22A10,10 0 0,0 22,12A10,10 0 0,0
          12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z" />
      </svg>
    </button> -->
  </div>
  <div class="widgetContainer">
    <div class="widget">
      <Anova {studyId} {dependentVariable} />
    </div>
    <div class="widget">
      <WeekChart />
    </div>
    <div class="widget">
      <BDAChart />
    </div>
    <div class="widget">
      <ContextPie />
    </div>
    <div class="widget">
      <ImageChart />
    </div>
    <!--<div class="widget">
      <div class="addWidget">
        <svg style="width:50px;height:50px" viewBox="0 0 24 24">
          <path
            fill="#333"
            d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59
            20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0
            12,22A10,10 0 0,0 22,12A10,10 0 0,0
            12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z" />
        </svg>
        Add new widget
      </div>
    </div>-->
  </div>
</div>
