<script>
  import { onMount } from "svelte";
  import { trunc } from "../modules/utils.js";
  export let selectedVariables = [];
  const chartId = `viscustom2d`;

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_custom`
  };

  onMount(() => {
    if (!selectedVariables.length) return;
    let variable = selectedVariables[0];
    let data1 = variable.results.map(v => v.value);

    if (variable.dataformat.textChoices) {
      // map values to labels
      const answerMap = {};
      for (const choice of variable.dataformat.textChoices) {
        answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
      }
      data1 = data1.map(v => answerMap[v]);
    }

    variable = selectedVariables[1];
    let data2 = variable.results.map(v => v.value);

    if (variable.dataformat.textChoices) {
      // map values to labels
      const answerMap = {};
      for (const choice of variable.dataformat.textChoices) {
        answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
      }
      data2 = data2.map(v => answerMap[v]);
    }

    const graph = {
      mark: "circle",
      encoding: {
        y: {
          data: {
            values: data1
          },
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
          data: {
            values: data2
          },
          field: "data",
          type: "nominal",
          axis: {
            title: null,
            domain: false,
            ticks: false,
            labelPadding: 5
          }
        }
      }
    };

    vegaEmbed(`#${chartId}`, graph, vegaOptions);
  });
</script>

<div id={chartId} />
