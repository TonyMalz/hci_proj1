<script>
  import { db } from "../modules/indexeddb.js";
  import { variableStore } from "../modules/store.js";
  export let studyId = 0;
  export let studyName = "";

  function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
</script>

<style>
  .container {
    position: relative;
    padding: 1em;
    padding-bottom: 2em;
    height: 85vh;
    overflow-y: auto;
  }
  table {
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.8em 0.6em;
    border-bottom: 1px solid #ddd;
  }
  th {
    font-weight: 600;
  }
  tr:hover {
    background-color: #f5f5f5;
  }
</style>

<div class="container">
  <p>
    Variables of
    <strong>{studyName}</strong>
  </p>
  <table>
    <tr>
      <th>Name</th>
      <th>Label</th>
      <th>Measure</th>
    </tr>
    {#each $variableStore.filter(v => v.studyId == studyId) as v}
      <tr>
        <td class="name">{v.variableName}</td>
        <td class="label">{v.variableLabel}</td>
        <td class="measure">{ucFirst(v.measure)}</td>
      </tr>
    {/each}
  </table>
</div>
