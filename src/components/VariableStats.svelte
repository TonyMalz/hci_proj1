<script>
  import stat from "../modules/simple-statistics.min";
  import VariableNominalChart from "../charts/VariableNominalChart.svelte";
  import VariableScaleChart from "../charts/VariableScaleChart.svelte";
  import VariableQualitativeChart from "../charts/VariableQualitativeChart.svelte";
  import { uc } from "../modules/utils";

  export let variable = {};
  // get answer results for this variable
  $: data = variable.results.map(v => v.value);
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

  .choices tr:hover {
    background-color: initial;
  }

  .charts {
    display: grid;
    height: 100%;
    place-items: center;
  }

  .label,
  .measure {
    font-weight: 300;
    font-size: 0.7rem;
  }
  .measure {
    font-style: italic;
  }
  h4 {
    font-size: 0.7rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0;
  }
  .answerLog {
    position: relative;
    height: 20ch;
    overflow: auto;
    /* box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.25); */
  }
  .sep {
    color: rgb(214, 214, 214);
    padding: 0 0.5em;
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
        <h4>Answer options</h4>
        <table>
          {#each variable.dataformat.textChoices as choice}
            <tr>
              <td>({choice.value}) {choice.valueLabel || choice.text}</td>
            </tr>
          {/each}
        </table>
      </div>
    {/if}
    <div class="stats">
      <h4>Statistics</h4>
      <table>
        <tr>
          <td style="width:22ch">Count of records:</td>
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
        {#if variable.measure == 'qualitative'}
          <tr>
            <td>Text length:</td>
            <td>
              {stat.min(data.map(v => v.length))} (min)
              <span class="sep">|</span>
              {stat.mean(data.map(v => v.length))} (avg)
              <span class="sep">|</span>
              {stat.max(data.map(v => v.length))} (max)
            </td>
          </tr>
        {/if}
      </table>
      {#if variable.measure == 'qualitative'}
        <h4>Answers given by users</h4>
        <div class="answerLog">
          <VariableQualitativeChart {variable} />
        </div>
      {/if}
    </div>

  </div>

</div>
