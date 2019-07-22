<script>
  import { fade } from "svelte/transition";
  import { studyStore, variableStore } from "../modules/store.js";
  import { formatDate } from "../modules/utils.js";
  import CustomChart from "../charts/CustomChart.svelte";

  // default to first study in store
  let studyId = $studyStore[0]._id;
  $: studyName = $studyStore.filter(v => v._id === studyId)[0].studyName;

  let variables = $variableStore.filter(v => v.studyId === studyId);
  let selectedVariables = [];
  function selectStudy() {
    variables = $variableStore.filter(v => v.studyId === studyId);
    selectedVariables = [];
  }
  function selectVariable() {
    console.log(selectedVariables);
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
  label {
    display: inline-block;
    padding-left: 0.25em;
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
</style>

<div class="container" in:fade={{ duration: 300 }}>
  <div class="studyselect">
    Select study:
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
          </li>
        {/each}
      </ul>
    </div>
    <div class="chart">
      {#if selectedVariables.length}
        <CustomChart {selectedVariables} />
      {:else}Chart{/if}
    </div>
  </div>
</div>
