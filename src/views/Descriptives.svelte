<script>
  import { db } from "../modules/indexeddb";
  import { fade } from "svelte/transition";
  import { variableStore } from "../modules/store";
  import VarStats from "../components/VariableStats.svelte";

  export let studyId = 0;

  const studyVariables =
    $variableStore.filter(v => v.studyId === studyId) || [];
  let variables = studyVariables;

  const filterOptions = [
    "Demographics",
    "Non-demographics",
    "Nominal",
    "Ordinal",
    "Scale",
    "Qualitative"
  ];
  let selected = filterOptions;

  function filter() {
    let vars = studyVariables.filter(v => {
      let bool = false;
      // 1. check demographic type
      for (const filter of selected) {
        switch (filter) {
          case "Demographics":
            bool |= v.isDemographic === true;
            break;
          case "Non-demographics":
            bool |= v.isDemographic === false;
            break;
        }
      }
      return bool;
    });
    // 2. filter remaining vars on measure
    variables = vars.filter(v => {
      let bool = false;
      for (const filter of selected) {
        bool |= v.measure === filter.toLowerCase();
      }
      return bool;
    });
  }
</script>

<style>
  .container {
    position: relative;
    display: grid;
    grid-template-rows: min-content auto;
    grid-gap: 1rem;
  }
  .stats {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60ch, 1fr));
    grid-gap: 1rem;
  }
  .filter {
    display: flex;
    align-items: baseline;
    font-weight: 300;
    color: rgb(202, 202, 202);
  }
  label {
    display: inline-block;
    cursor: pointer;
  }
  input {
    margin-left: 1.25rem;
    margin-right: 0.25em;
  }
  :checked + label,
  span {
    /* font-weight: 400; */
    position: relative;
    color: #333;
  }
  span {
    min-width: 10ch;
  }
</style>

<div class="container" in:fade={{ duration: 300 }}>
  <div class="filter">
    <span>{variables.length} Variables:</span>
    {#each filterOptions as option, i}
      <input
        id={i}
        type="checkbox"
        bind:group={selected}
        on:change={filter}
        value={option} />
      <label for={i}>{option}</label>
    {/each}

  </div>
  <div class="stats">
    {#each variables as variable}
      <VarStats {variable} />
    {/each}
  </div>
</div>
