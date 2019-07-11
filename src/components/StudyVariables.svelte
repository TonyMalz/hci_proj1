<script>
  import { db } from "../modules/indexeddb.js";

  export let studyId = 0;
  export let studyName = "";
  let variables = [];

  if (studyId) {
    const res = db
      .transaction("StudyVariables")
      .objectStore("StudyVariables")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      variables = e.target.result;
    };
  }

  function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
</script>

<style>
  .container {
    position: relative;
    padding: 1em;
    padding-bottom: 2em;
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
        <td class="measure"> {ucFirst(v.measure)} </td>
      </tr>
    {/each}
  </table>
</div>
