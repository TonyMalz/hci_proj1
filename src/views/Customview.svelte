<script>
  import { fade, fly } from "svelte/transition";
  import { studyStore, variableStore } from "../modules/store.js";
  import { formatDate } from "../modules/utils.js";
  import CustomChart from "../charts/CustomChart.svelte";
  import Custom3dChart from "../charts/Custom3dChart.svelte";
  let studyId;
  let combine = false;
  let selectedVariables = [];
  let studyName;
  let variables = [];
  $: if ($studyStore.length) {
    // default to first study in store
    studyId = $studyStore[0]._id;
    studyName = $studyStore.filter(v => v._id === studyId)[0].studyName;

    variables = $variableStore.filter(v => v.studyId === studyId);
  }
  function selectStudy() {
    variables = $variableStore.filter(v => v.studyId === studyId);
    selectedVariables = [];
  }
  function selectVariable() {
    // console.log(selectedVariables);
  }
  function check3dChartAvailable() {
    if (selectedVariables.length < 3) return false;
    const vars = selectedVariables.filter(v => v.measure === "scale");
    return vars.length == 3 && selectedVariables.length == 3;
  }
</script>

<style>
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .studyselect {
    font-size: 0.8rem;
  }
  .customchart {
    padding-top: 1rem;
    display: grid;
    height: 95%;
    grid-template-columns: 1fr 3fr;
    grid-gap: 1rem;
  }
  ul {
    padding: 0;
    list-style-type: none;
    color: rgb(202, 202, 202);
    font-style: italic;
  }
  :checked + label {
    color: #333;
    font-style: initial;
  }
  li {
    display: grid;
    grid-template-columns: auto 2fr 1fr;
    align-items: baseline;
    grid-gap: 0.5rem;
    padding: 0.15em 0;
  }
  li:hover {
    color: #333;
    background-color: rgb(230, 230, 230);
  }
  label {
    display: inline-block;
    cursor: pointer;
  }
  .varselect {
    padding: 1rem;
    font-weight: 300;
    border-radius: 0.25rem;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
  }
  .chart {
    display: grid;
    place-items: center;
  }
  .combine {
    cursor: pointer;
    font-weight: 600;
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    background: tomato;
    color: white;
    text-align: center;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
    margin-bottom: 1rem;
  }
  .combine:hover {
    background: #722040;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  {#if studyId}
    <div class="studyselect">
      Selected study:
      <select
        name="studyselect"
        id="studyselect"
        bind:value={studyId}
        on:change={selectStudy}>
        {#each $studyStore as study}
          <option value={study._id}>
            {study.studyName} (imported {formatDate(study.__created)})
          </option>
        {/each}
      </select>
    </div>
    <div class="customchart">
      <div class="varselect">
        Variables of {studyName}
        <ul class="varList">
          {#each variables as variable}
            <li>
              <input
                id={variable.variableName}
                type="checkbox"
                on:change={selectVariable}
                bind:group={selectedVariables}
                value={variable} />
              <label for={variable.variableName}>{variable.variableName}</label>
              <span>({variable.measure})</span>
            </li>
          {/each}
        </ul>
        {#if selectedVariables.length > 1}
          <div
            transition:fly={{ duration: 200, x: -50 }}
            class="combine"
            on:click={() => (combine = !combine)}>
            {#if combine}
              Split into separate charts
            {:else}
              Combine in one chart
              {#if check3dChartAvailable()}(3D){/if}
            {/if}
          </div>
        {/if}
      </div>
      <div class="chart">
        {#if selectedVariables.length}
          {#if check3dChartAvailable() && combine}
            <Custom3dChart {selectedVariables} />
          {:else}
            <CustomChart {selectedVariables} />
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
