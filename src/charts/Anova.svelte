<script>
  import { onMount } from "svelte";
  import { variableStore } from "../modules/store";
  import stat from "../modules/simple-statistics.min";
  export let studyId;
  export let dependentVariable;
  let anovaChart;
  let old = "";
  $: if (dependentVariable !== old) {
    old = dependentVariable;
    if (dependentVariable) {
      updateChart(dependentVariable);
    }
  }

  function updateChart(variable) {
    if (!anovaChart) return;
    anovaChart.showLoading();
    const [data, errorData] = getStatData(variable);
    anovaChart.hideLoading();
    anovaChart.setOption({
      series: [
        {
          name: "Availability",
          data: data
        },
        {
          name: "CI",
          data: errorData
        }
      ]
    });
  }
  function getStatData(dependentVariable) {
    if (!dependentVariable) return [[], []];
    const resultsByDay = [[], [], [], [], [], [], []]; // array index -> day of week starting at 0 (monday)

    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      const resultDay = resultDate.getDay();
      resultsByDay[resultDay].push(result.value);
    }

    const statData = [];
    const errorData = [];
    const alpha = 0.05;
    for (let day = 0; day < 7; ++day) {
      const results = resultsByDay[day];
      if (results && results.length) {
        const mean = stat.mean(results);
        const sd = stat.standardDeviation(results);
        const n = results.length;
        statData.push(mean);
        if (n < 2) {
          errorData.push([day, 0, 0, n, 0]);
          continue;
        }
        errorData.push([
          day,
          ...mctad.confidenceIntervalOnTheMean(mean, sd, n, alpha),
          n,
          sd
        ]);
        // console.log(mean, mctad.confidenceIntervalOnTheMean(mean, sd, n, 0.05));
      } else {
        statData.push(0);
        errorData.push([day, 0, 0, 0, 0]);
      }
    }
    return [statData, errorData];
  }

  onMount(() => {
    anovaChart = echarts.init(document.getElementById("anovaChart"));
    // const numericVariables = $variableStore.filter(
    //   v =>
    //     v.studyId === studyId &&
    //     v.isDemographic === false &&
    //     v.measure === "scale"
    // );

    // const resultsByDay = [[], [], [], [], [], [], []]; // array index -> day of week starting at 0 (monday)
    // // TODO: enable user selection
    // if (numericVariables && numericVariables.length) {
    //   const dependentVariable = numericVariables[0];
    //   for (const result of dependentVariable.results) {
    //     const resultDate = new Date(result.date);
    //     const resultDay = resultDate.getDay();

    //     resultsByDay[resultDay].push(result.value);
    //   }
    // }

    const [statData, errorData] = getStatData(dependentVariable);
    // const alpha = 0.05;
    // for (let day = 0; day < 7; ++day) {
    //   const results = resultsByDay[day];
    //   if (results && results.length) {
    //     const mean = stat.mean(results);
    //     const sd = stat.standardDeviation(results);
    //     const n = results.length;
    //     statData.push(mean);
    //     if (n < 2) {
    //       errorData.push([day, 0, 0, n, 0]);
    //       continue;
    //     }
    //     errorData.push([
    //       day,
    //       ...mctad.confidenceIntervalOnTheMean(mean, sd, n, alpha),
    //       n,
    //       sd
    //     ]);
    //     // console.log(mean, mctad.confidenceIntervalOnTheMean(mean, sd, n, 0.05));
    //   } else {
    //     statData.push(0);
    //     errorData.push([day, 0, 0, 0, 0]);
    //   }
    // }

    const categoryData = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    function renderItem(params, api) {
      var xValue = api.value(0);
      var highPoint = api.coord([xValue, api.value(1)]);
      var lowPoint = api.coord([xValue, api.value(2)]);
      var halfWidth = api.size([1, 0])[0] * 0.05;
      var style = api.style({
        stroke: "#aaa",
        fill: null
      });

      return {
        type: "group",
        children: [
          {
            type: "line",
            shape: {
              x1: highPoint[0] - halfWidth,
              y1: highPoint[1],
              x2: highPoint[0] + halfWidth,
              y2: highPoint[1]
            },
            style: style
          },
          {
            type: "line",
            shape: {
              x1: highPoint[0],
              y1: highPoint[1],
              x2: lowPoint[0],
              y2: lowPoint[1]
            },
            style: style
          },
          {
            type: "line",
            shape: {
              x1: lowPoint[0] - halfWidth,
              y1: lowPoint[1],
              x2: lowPoint[0] + halfWidth,
              y2: lowPoint[1]
            },
            style: style
          }
        ]
      };
    } // renderItem

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: function(data) {
          const mean = data[0].data;
          const [_, left, right, n, sd] = data[1].data;
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${mean.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${sd.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>CI</td>
                    <td style="padding-left:0.5rem;">[${left.toFixed(
                      4
                    )} ; ${right.toFixed(4)}]</td>
                  </tr>
                  <tr>
                    <td>Records</td>
                    <td style="padding-left:0.5rem;">${n}</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 25
      },
      xAxis: {
        data: categoryData
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
            type: "dashed"
          }
        }
      },
      series: [
        {
          type: "bar",
          name: "Availability",
          data: statData,
          itemStyle: {
            normal: {
              // color: "#61a0a7"
              color: "steelblue"
            }
          }
        },
        {
          type: "custom",
          name: "CI",
          itemStyle: {
            normal: {
              borderWidth: 1.5
            }
          },
          renderItem: renderItem,
          encode: {
            x: 0,
            y: [1, 2]
          },
          data: errorData,
          z: 10
        }
      ]
    };
    anovaChart.setOption(option);

    function resizeChart() {
      if (anovaChart !== null && !anovaChart.isDisposed()) {
        anovaChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      anovaChart.dispose();
      anovaChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });
</script>

<style>
  #anovaChart {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
</style>

<div id="anovaChart" />
