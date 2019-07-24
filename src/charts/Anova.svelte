<script>
  import { onMount } from "svelte";
  import { variableStore } from "../modules/store";
  import stat from "../modules/simple-statistics.min";
  export let studyId;
  export let dependentVariable;
  let anovaChart;
  let old = "";
  let count = 0;
  let minVal = 0;
  let meanVal = 0;
  let sd = 0;
  let maxVal = 0;
  const alpha = 0.05;
  let ci = [0, 0];

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
    const results = dependentVariable.results.map(v => v.value);
    minVal = stat.min(results);
    maxVal = stat.max(results);
    meanVal = stat.mean(results);
    count = results.length;
    sd = stat.standardDeviation(results);
    ci = mctad.confidenceIntervalOnTheMean(meanVal, sd, count, alpha);
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      // 0: sunday - 6: saturday (US week format!)
      // convert to 0: monday - 6 sunday
      const resultDay = (+resultDate.getDay() + 6) % 7;
      resultsByDay[resultDay].push(result.value);
    }

    const statData = [];
    const errorData = [];

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
    const [statData, errorData] = getStatData(dependentVariable);

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
        stroke: "#314655",
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
                    <td>alpha</td>
                    <td style="padding-left:0.5rem;"> 0.05 </td>
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
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#a4b8c9" },
                { offset: 0.85, color: "#a4b8c9" },
                { offset: 1, color: "#9caebe" }
              ])
            }
          },
          label: {
            normal: {
              show: true,
              color: "#333",
              formatter: function(value, idx) {
                return value.data.toFixed(2);
              }
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

  .container {
    position: relative;
    display: grid;
    grid-template-columns: auto min-content;
    grid-gap: 1rem;
    width: 100%;
    height: 100%;
  }
  table {
    width: 37ch;
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
</style>

<div class="container">
  <div id="anovaChart" />
  <div class="statTable">
    <table>
      <tr>
        <td>Min - Max:</td>
        <td>{minVal} - {maxVal}</td>
      </tr>
      <tr>
        <td>Mean:</td>
        <td>{meanVal.toFixed(4)}</td>
      </tr>
      <tr>
        <td>SD:</td>
        <td>{sd.toFixed(4)}</td>
      </tr>
      <tr>
        <td>CI:</td>
        <td>[ {ci[0].toFixed(4)} ; {ci[1].toFixed(4)} ] (a=0.05)</td>
      </tr>
    </table>
  </div>
</div>
