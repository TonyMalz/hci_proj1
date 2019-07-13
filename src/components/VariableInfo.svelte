<script>
  import { variableStore } from "../modules/store.js";
  export let varName = "Varname";
  export let studyId = 0;
  const variable = $variableStore.filter(
    v => v.studyId === 1 && v.name === "Age"
  )[0];
</script>

<style>
  .card {
    display: grid;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    border-radius: 0.25rem;
    padding: 1em;
  }
</style>

<div class="card">
  <div class="name">{variable.name}</div>
  <div class="label">{variable.label}</div>
  <div class="measure">{variable.measure}</div>
  <div class="choices" />
  <div class="stats" />
  <div class="graphs" />
</div>
