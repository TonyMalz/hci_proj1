<script>
  import { onMount } from "svelte";
  export let variable;
  const variableName = variable.variableName;
  const chartId = `vis${variableName}nominal`;
  const trunc = (t, n = 10) => t.substr(0, n - 1) + (t.length > n ? "..." : "");

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_${variableName}_nominal`
  };
  let data = variable.results.map(v => v.value);
  if (variable.dataformat.textChoices) {
    // map values to labels
    const answerMap = {};
    for (const choice of variable.dataformat.textChoices) {
      answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
    }
    data = data.map(v => answerMap[v]);
  }

  const spec = {
    description: `Count of ${variableName} results`,
    data: {
      values: data
    },
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
        axis: { domain: false }
      }
    }
  };
  onMount(() => vegaEmbed(`#${chartId}`, spec, vegaOptions));
</script>

<div id={chartId} />
