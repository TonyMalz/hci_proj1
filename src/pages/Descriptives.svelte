<script>
  import { db } from "../modules/indexeddb.js";
  import stat from "../modules/simple-statistics.min.js";
  import { fade } from "svelte/transition";
  const trunc = (t, n = 20) => {
    return t.substr(0, n - 1) + (t.length > n ? "..." : "");
  };
  export let studyId = 0;
  export let studyName = "";
  let variables = [];
  const varMap = [];
  const varResults = [];
  const varStats = [];
  const varOptions = [];
  let stats = [];
  const tx = db.transaction(["Studies", "StudyVariables", "TaskResults"]);
  let res = tx.objectStore("Studies").getAll();
  res.onsuccess = e => {
    const studies = e.target.result;
    studyId = studies[0]._id;
    if (studyId) getStudyVariables(studyId);
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
          // get text choices of categorical/nominal question types
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
            const mode = stat.modeFast(data);
            varStats[varName].mode = mode;
            varStats[varName].count = data.length;
            varStats[varName].choices = [];
            // get all labels of options of TextChoice questions and add info on how many times they were answered
            for (const key in counts) {
              for (const { valueLabel, value, text } of varOptions[varName]) {
                if (value == mode) {
                  varStats[varName].modeLabel = trunc(valueLabel || text);
                }
                //do not exactly match since values are always of type string
                if (value == key) {
                  varStats[varName].choices.push({
                    label: trunc(valueLabel || text), //FIXME: importformat is currently not consistent
                    count: counts[key]
                  });
                }
              }
            }
            break;
          case "scale":
            varStats[varName].mode = stat.modeFast(data);
            varStats[varName].count = data.length;
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
      for (const varName in varStats) {
        const statistics = varStats[varName];
        stats = [...stats, { varName, statistics }];
        if (varMap[varName] == "nominal") {
          const spec = {
            description: `Count of ${varName} choices`,
            data: {
              values: statistics.choices
            },
            mark: "bar",
            encoding: {
              y: { field: "label", type: "nominal", axis: { title: null } },
              x: {
                field: "count",
                type: "quantitative",
                axis: { title: "Count of records" }
              }
            }
          };
          vegaEmbed(`#vis${varName}`, spec);
        } else if (varMap[varName] == "scale") {
          console.log(varResults[varName]);
          const spec = {
            description: `Ditribution of ${varName}`,
            data: {
              values: varResults[varName]
            },
            mark: "tick",
            encoding: {
              x: {
                field: "data",
                type: "quantitative",
                axis: { title: varName }
              }
            }
          };
          vegaEmbed(`#vis${varName}`, spec);
          const spec2 = {
            description: `Ditribution of ${varName}`,
            data: {
              values: varResults[varName]
            },
            mark: "bar",
            encoding: {
              x: {
                bin: true,
                field: "data",
                type: "quantitative"
              },
              y: {
                aggregate: "count",
                type: "quantitative"
              }
            }
          };
          vegaEmbed(`#vis2${varName}`, spec2);
        }
      }
    };
  };

  function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
</script>

<style>
  .container {
    position: relative;
    height: 100%;
    overflow-y: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.7rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.8em 0;
    border-bottom: 1px solid #ddd;
  }
  td + td,
  th + th {
    padding-left: 2em;
  }
  th {
    font-weight: 600;
  }
  tr:hover {
    background-color: #f5f5f5;
  }
</style>

<div class="container" in:fade={{ duration: 400 }}>
  (It's ugly, will be fixed soon...)
  <table>
    <tr>
      <th>Variable Name</th>
      <th>Label</th>
      <th>Measure</th>
      <th colspan="2" style="padding-left:17%;width:80%">Statistics</th>
    </tr>
    {#each variables as v}
      <tr>
        <td class="name"> {v.variableName} </td>
        <td class="label"> {v.variableLabel} </td>
        <td class="measure"> {ucFirst(v.measure)} </td>
        <td style="text-align:right;width:40%;">
          <div id="vis{v.variableName}" />
          <div id="vis2{v.variableName}" />
        </td>
        <td>
          <table>
            {#each stats as { varName, statistics }}
              {#if varName == v.variableName}
                {#if v.measure == 'nominal'}
                  <tr>
                    <td>count</td>
                    <td>
                       {statistics.count}
                      <!-- (
                      {#each statistics.choices as choice}
                        {choice.label}={choice.count},
                      {/each}
                      ) -->
                    </td>
                  </tr>
                  <tr>
                    <td>mode</td>
                    <td>{statistics.mode} ({statistics.modeLabel})</td>
                  </tr>
                {:else if v.measure == 'scale'}
                  <tr>
                    <td>count</td>
                    <td>{statistics.count} </td>
                  </tr>
                  <tr>
                    <td>min - max</td>
                    <td>{statistics.min} - {statistics.max} </td>
                  </tr>
                  <tr>
                    <td>mode</td>
                    <td>{statistics.mode}</td>
                  </tr>
                  <tr>
                    <td>median</td>
                    <td>{statistics.median}</td>
                  </tr>
                  <tr>
                    <td>mean</td>
                    <td>{statistics.mean}</td>
                  </tr>
                  <tr>
                    <td>sd</td>
                    <td>{statistics.sd}</td>
                  </tr>
                {/if}
              {/if}
            {/each}
          </table>
        </td>
      </tr>
    {/each}
  </table>
</div>
