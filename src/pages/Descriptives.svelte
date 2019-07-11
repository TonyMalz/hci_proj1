<script>
  import { db } from "../modules/indexeddb.js";
  import stat from "../modules/simple-statistics.min.js";

  export let studyId = 0;
  export let studyName = "";
  let variables = [];
  const varMap = [];
  const varResults = [];
  const varStats = [];
  const varOptions = [];
  const tx = db.transaction(["Studies", "StudyVariables", "TaskResults"]);

  let res = tx.objectStore("Studies").getAll();
  res.onsuccess = e => {
    const studies = e.target.result;
    studyId = studies[0]._id;
    getStudyVariables(studyId);
  };

  const getStudyVariables = studyId => {
    const res = tx
      .objectStore("StudyVariables")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      variables = e.target.result;
      for (const variable of variables) {
        varMap[variable.variableName] = variable.measure;
        varResults[variable.variableName] = [];
        varStats[variable.variableName] = {};
        if (variable.measure === "nominal") {
          varOptions[variable.variableName] = variable.dataformat.textChoices;
        }
      }
      getTaskResults(studyId);
    };
  };

  const getTaskResults = studyId => {
    const res = tx
      .objectStore("TaskResults")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      const results = e.target.result;
      for (const result of results) {
        const varName = result.stepItem.variableName;
        const value = result.stepItem.value;
        varResults[varName].push(value);
      }
      for (const varName in varResults) {
        const data = varResults[varName];
        switch (varMap[varName]) {
          case "nominal":
            // get counts of each value in array (value:count)
            const counts = data.reduce((v, k) => {
              v[k] = ++v[k] || 1;
              return v;
            }, {});
            varStats[varName].mode = stat.modeFast(data);
            varStats[varName].options = [];
            for (const key in counts) {
              for (const { text, value } of varOptions[varName]) {
                if (value == key) {
                  varStats[varName].options.push({
                    label: text,
                    count: counts[key]
                  });
                }
              }
            }
            break;
          case "scale":
            varStats[varName].mode = stat.modeFast(data);
            varStats[varName].min = stat.min(data);
            varStats[varName].max = stat.max(data);
            varStats[varName].median = stat.median(data);
            varStats[varName].mean = +stat.mean(data).toFixed(4);
            varStats[varName].sd = +stat.standardDeviation(data).toFixed(4);
            break;

          default:
            break;
        }
      }
      console.log(varStats);
    };
  };

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
  <table>
    <tr>
      <th>Variable Name</th>
      <th>Label</th>
      <th>Measure</th>
      <th>Statistics</th>
    </tr>
    {#each variables as v}
      <tr>
        <td class="name"> {v.variableName} </td>
        <td class="label"> {v.variableLabel} </td>
        <td class="measure"> {ucFirst(v.measure)} </td>
        <td />
      </tr>
    {/each}
  </table>
</div>
