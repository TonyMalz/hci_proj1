<script>
  import stat from "../modules/simple-statistics.min";
  import VariableNominalChart from "../charts/VariableNominalChart.svelte";
  import VariableScaleChart from "../charts/VariableScaleChart.svelte";

  export let variable = {};
  // helper functions
  const uc = str => str.charAt(0).toUpperCase() + str.slice(1);

  // get answer results for this variable
  const data = variable.results.map(v => v.value);
</script>

<style>
  .card {
    display: grid;
    box-shadow: 0 0 6px 0 rgb(214, 214, 214);
    border-radius: 0.25rem;
    grid-template-columns: min-content 1fr;
    grid-gap: 2rem;

    padding: 1em;
  }
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

  .choices tr:hover,
  thead tr:hover {
    background-color: initial;
  }

  .charts {
    display: grid;
    height: 100%;
    place-items: center;
  }
</style>

<div class="card">
  <div class="charts">
    {#if variable.measure == 'nominal'}
      <VariableNominalChart {variable} />
    {/if}
    {#if variable.measure == 'scale'}
      <VariableScaleChart {variable} />
    {/if}
  </div>
  <div class="text">
    <div class="name">{variable.variableName}</div>
    <div class="label">{variable.variableLabel}</div>
    <div class="measure">{uc(variable.measure)}</div>
    {#if variable.dataformat.hasOwnProperty('textChoices')}
      <div class="choices">
        <table>
          <thead>
            <tr>
              <th colspan="2">Answer Options</th>
            </tr>
          </thead>
          {#each variable.dataformat.textChoices as choice}
            <tr>
              <td>({choice.value}) {choice.valueLabel || choice.text}</td>
            </tr>
          {/each}
        </table>
      </div>
    {/if}
    <div class="stats">
      <table>
        <thead>
          <tr>
            <th colspan="2">Statistics</th>
          </tr>
        </thead>
        <tr>
          <td>Count of records:</td>
          <td>{data.length}</td>
        </tr>
        {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
          <tr>
            <td>Min - Max:</td>
            <td>{stat.min(data)} - {stat.max(data)}</td>
          </tr>
        {/if}
        <tr>
          <td>Mode:</td>
          <td>{stat.modeFast(data)}</td>
        </tr>
        {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
          <tr>
            <td>Median:</td>
            <td>{stat.median(data)}</td>
          </tr>
        {/if}
        {#if variable.measure == 'scale'}
          <tr>
            <td>Mean:</td>
            <td>
              {stat.mean(data).toFixed(4)} (sd = {stat
                .standardDeviation(data)
                .toFixed(4)})
            </td>
          </tr>
        {/if}

      </table>
    </div>
  </div>

</div>
