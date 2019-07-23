<script>
  import { onMount } from "svelte";
  import { trunc } from "../modules/utils.js";
  //   import Custom2dChart from "./Custom2dChart.svelte";
  export let selectedVariables = [];
  const chartId = `viscustom`;
  let isMounted = false;
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
    const graphs = [];
    for (const selectedVar of selectedVariables) {
      graphs.push(getGraph(selectedVar));
    }
    vegaEmbed(`#${chartId}`, { hconcat: graphs }, vegaOptions);
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

</style>

<div id={chartId} />
