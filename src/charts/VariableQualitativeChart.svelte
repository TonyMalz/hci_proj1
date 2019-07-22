<script>
  import { formatDate, trunc } from "../modules/utils";
  export let variable = {};
  let details = false;
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
  th {
    padding-top: 1rem;
    text-align: left;
    font-weight: 600;
  }
  thead {
    position: sticky;
    top: 0;
    width: 100%;
    background: white;
  }
  label {
    font-size: 0.7rem;
    cursor: pointer;
  }
  input {
    position: absolute;
    visibility: hidden;
  }
</style>

<label for="showmore">
  <input type="checkbox" id="showmore" bind:checked={details} />
  <u>Show {details ? 'less' : 'more'} data</u>
</label>
<table>
  <thead>
    <tr>
      <th>Answer</th>

      {#if details}
        <th colspan="10">other responses</th>
      {:else}
        <th>User</th>
        <th>Date</th>
      {/if}
    </tr>
  </thead>
  {#each variable.results as result}
    {#if result.value.trim().length}
      <tr>
        <td>{result.value}</td>
        {#if details}
          {#each result.taskResults.stepResults as step}
            {#each step.stepItemResults as item}
              {#if item.variableName !== variable.variableName}
                <td>{item.value} ({trunc(item.variableName)})</td>
              {/if}
            {/each}
          {/each}
        {:else}
          <td>{trunc(result.uid)}</td>
          <td>{formatDate(result.date)}</td>
        {/if}
      </tr>
    {/if}
  {:else}No answers given yet{/each}
</table>
