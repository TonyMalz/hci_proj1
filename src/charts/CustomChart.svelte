<script>
  import { onMount } from "svelte";
  import { trunc } from "../modules/utils.js";
  //   import Custom2dChart from "./Custom2dChart.svelte";
  export let selectedVariables = [];
  const chartId = `viscustom`;
  let isMounted = false;
  let combine = false;
  $: updateGraphs(selectedVariables);

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_custom`
  };

  function updateGraphs(selectedVariables) {
    if (!isMounted) return;
    if (!selectedVariables.length) return;
    let spec = getGraph(selectedVariables[0]);
    if (selectedVariables.length === 2) {
      spec = { hconcat: [spec, getGraph(selectedVariables[1])] };
    }

    vegaEmbed(`#${chartId}`, spec, vegaOptions);
  }
  function getGraph(variable) {
    const variableName = variable.variableName;
    let data = variable.results.map(v => v.value);

    if (variable.dataformat.textChoices) {
      // map values to labels
      const answerMap = {};
      for (const choice of variable.dataformat.textChoices) {
        answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
      }
      data = data.map(v => answerMap[v]);
    }
    const graphs = [];
    const graph = {
      data: {
        values: data
      },
      description: `Count of ${variableName} results`,
      title: { text: variableName, fontSize: 16 },
      mark: "bar",
      encoding: {
        y: {
          field: "data",
          type: "nominal",
          axis: {
            title: null,
            domain: false,
            ticks: false,
            labelPadding: 5
          }
        },
        x: {
          aggregate: "count",
          type: "quantitative",
          axis: { domain: false, titleFontWeight: 300 }
        }
      }
    };
    graphs.push(graph);

    if (variable.measure === "scale") {
      const graph = {
        data: {
          values: data
        },
        mark: "tick",
        encoding: {
          x: {
            field: "data",
            type: "quantitative",
            //scale: { domain: [Math.min(...data), Math.max(...data)] },
            axis: { title: variableName, domain: false }
          }
        }
      };
      graphs.push(graph);

      const graphUID = {
        data: {
          values: variable.results
        },
        mark: "bar",
        encoding: {
          y: {
            field: "value",
            aggregate: "mean",
            type: "quantitative",
            //scale: { domain: [Math.min(...data), Math.max(...data)] },
            axis: { title: variableName, domain: false }
          },
          x: {
            field: "uid",
            type: "nominal"
            //scale: { domain: [Math.min(...data), Math.max(...data)] },
          }
        }
      };
      graphs.push(graphUID);

      if (!variable.isDemographic) {
        const graphTime = {
          data: {
            values: variable.results
          },
          mark: {
            type: "line",
            interpolate: "monotone"
          },
          encoding: {
            y: {
              field: "value",
              aggregate: "mean",
              type: "quantitative",
              //scale: { domain: [Math.min(...data), Math.max(...data)] },
              axis: { title: variableName, domain: false }
            },
            x: {
              field: "date",
              type: "temporal",
              timeUnit: "day"
              //scale: { domain: [Math.min(...data), Math.max(...data)] },
            }
          }
        };
        graphs.push(graphTime);
      }
    }

    const spec = {
      vconcat: graphs
    };
    return spec;
  }
  onMount(() => {
    isMounted = true;
    if (!selectedVariables.length) return;
    let spec = getGraph(selectedVariables[0]);
    if (selectedVariables.length === 2) {
      spec = { hconcat: [spec, getGraph(selectedVariables[1])] };
    }
    vegaEmbed(`#${chartId}`, spec, vegaOptions);
  });
</script>

<style>
  .combine {
    cursor: pointer;
    font-weight: 600;
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    background: tomato;
    color: white;
    text-align: center;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
    margin-bottom: 1rem;
  }
  .combine:hover {
    background: #722040;
  }
</style>

{#if selectedVariables.length == 2 && !combine}
  <div class="combine" on:click={() => (combine = true)}>
    Combine in one chart
  </div>
{/if}
{#if combine}
  CombinedChart
{:else}
  <div id={chartId} />
{/if}
