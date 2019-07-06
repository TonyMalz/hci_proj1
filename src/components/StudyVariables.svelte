<script>
  import { db } from "../modules/indexeddb.js";
  import { onMount } from "svelte";

  export let studyId = 0;
  export let studyName = "";
  let variables = [];

  onMount(() => {
    if (studyId) {
      const res = db
        .transaction("StudyVariables")
        .objectStore("StudyVariables")
        .getAll();
      res.onsuccess = e => {
        variables = e.target.result;
        console.log(vars);
      };
    }
  });
</script>

<style>
  .container {
    position: relative;
    padding: 1em;
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
    {#each variables as v}
      <tr>
        <td class="name"> {v.variableName} </td>
        <td class="label"> {v.variableLabel} </td>
        <td class="measure"> {v.measure} </td>
      </tr>
    {/each}
  </table>
</div>
