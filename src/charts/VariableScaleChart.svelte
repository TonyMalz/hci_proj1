<script>
  import { onMount } from "svelte";
  export let variable;
  const variableName = variable.variableName;
  const chartId = `vis${variableName}scale`;

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_${variableName}_scale`
  };
  let data = variable.results.map(v => v.value);

  const graph1 = {
    description: `Ditribution of ${variableName}`,
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

  const graph2 = {
    description: `Binned ditribution of ${variableName}`,
    mark: "bar",
    encoding: {
      x: {
        bin: true,
        field: "data",
        type: "quantitative",
        axis: { domain: false, title: `${variableName} (binned)` }
      },
      y: {
        aggregate: "count",
        type: "quantitative",
        axis: {
          domain: false,
          ticks: false,
          labelPadding: 5,
          titlePadding: 10
        }
      }
    }
  };
  const spec = {
    data: {
      values: data
    },
    vconcat: [graph1, graph2]
  };
  onMount(() => vegaEmbed(`#${chartId}`, spec, vegaOptions));
</script>

<div id={chartId} />
