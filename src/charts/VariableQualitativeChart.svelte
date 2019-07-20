<script>
  import { formatDate, trunc } from "../modules/utils";
  export let variable = {};
  let data = variable.results.map(v => v.value);
</script>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  td {
    padding: 0.8em 0;
    border-bottom: 1px solid #ddd;
  }
  tr:hover {
    background-color: #f5f5f5;
  }
  /* th {
    padding-top: 1rem;
    text-align: left;
    font-weight: 600;
  } */
</style>

<table>
  {#each variable.results as result}
    <tr>
      <td>{result.value}</td>
      <td>{trunc(result.uid)}</td>
      <td>{formatDate(result.date)}</td>
    </tr>
    <!-- content here -->
  {:else}No answers given yet{/each}
</table>
