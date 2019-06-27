<script>
  import { fade } from "svelte/transition";
  import Anova from "../charts/Anova.svelte";
  import WeekChart from "../charts/WeekChart.svelte";
  import BDAChart from "../charts/BDAChart.svelte";
  import ContextPie from "../charts/ContextPie.svelte";
  import StudyImporter from "../components/StudyImporter.svelte";
</script>

<style>
  .userview {
    display: grid;
    height: 100%;
    grid-template-rows: 55px auto;
    grid-gap: 1rem;
  }
  .optionsContainer {
    display: flex;
    flex-wrap: wrap;
    overflow: auto;
  }
  #newWidgetButton {
    margin-left: auto;
    width: 10%;
  }
  .widgetContainer {
    display: flex;
    flex-wrap: wrap;
    overflow: auto;
  }
  .widgetContainer > * {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 45%;
  }
  .widget {
    border: 1px solid #ccc;
    height: 45%;
    padding: 1em;
    margin: 1em;
    border-radius: 4px;
  }
  /*.addWidget {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    cursor: pointer;
    grid-gap: 1em;
  }*/
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
    <StudyImporter />
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
      <Anova />
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
