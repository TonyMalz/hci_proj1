<script>
  import { onMount } from "svelte";
  import { variableStore } from "../modules/store";
  import stat from "../modules/simple-statistics.min";

  export let studyId;

  onMount(() => {
    let mainChart = echarts.init(document.getElementById("mainChart"));
    const numericVariables = $variableStore.filter(
      v =>
        v.studyId === studyId &&
        v.isDemographic === false &&
        v.measure === "scale"
    );

    const resultsByDayAndHour = [
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map()
    ];
    // const resultsByDay = [[], [], [], [], [], [], []]; // array index -> day of week starting at 0 (monday)
    // TODO: enable user selection
    let varName = "";
    let minVal,
      maxVal = 0;
    if (numericVariables) {
      const dependentVariable = numericVariables[0];
      minVal = stat.min(dependentVariable.results.map(v => v.value));
      maxVal = stat.max(dependentVariable.results.map(v => v.value));
      varName = dependentVariable.variableName;
      for (const result of dependentVariable.results) {
        const resultDate = new Date(result.date);
        const resultDay = resultDate.getDay();
        const hour = resultDate.getHours();
        // resultsByDay[resultDay].push(result.value);
        const rs = resultsByDayAndHour[resultDay].get(hour) || [];
        rs.push(result.value);
        resultsByDayAndHour[resultDay].set(hour, rs);
      }
    }

    const statData = [];
    for (const day in resultsByDayAndHour) {
      for (const [hour, results] of resultsByDayAndHour[day]) {
        statData.push([
          +day + 1, // start at 1 for monday, cast to int and do not concatenate strings (WTF Javascript?!)
          hour,
          stat.mean(results),
          stat.standardDeviation(results),
          results.length
        ]);
      }
    }

    const days = [
      "",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    const option = {
      dataset: {
        source: statData
      },

      dataZoom: {
        type: "inside",
        yAxisIndex: [0],
        filterMode: "filter"
      },
      legend: {
        data: [varName],
        left: "center"
      },
      tooltip: {
        position: "top",
        formatter: function(d) {
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${d.value[2].toFixed(
                      4
                    )}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${d.value[3].toFixed(
                      4
                    )}</td>
                  </tr>
                  <tr>
                    <td>Responses</td>
                    <td style="padding-left:0.5rem;">${d.value[4]}</td>
                  </tr>
                  <tr>
                    <td>Timeslot</td>
                    <td style="padding-left:0.5rem;">[${d.value[1]}:00 - ${+d
            .value[1] + 1}:00)</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 30,
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: days,
        splitLine: {
          show: false,
          lineStyle: {
            color: "#999",
            type: "dashed"
          }
        },
        axisLine: {
          show: true
        }
      },
      yAxis: {
        splitLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
            type: "dashed"
          }
        },
        type: "value",
        boundaryGap: false,
        max: 24,
        name: "Time of day",
        axisLabel: {
          formatter: function(value, idx) {
            let hour = ~~value;
            let minutes = ~~((value - hour) * 60);
            hour = hour < 10 ? "0" + hour : hour;
            minutes = minutes < 10 ? "0" + minutes : minutes;

            return `${hour}:${minutes}`;
          }
        },
        splitNumber: 8
      },
      series: [
        {
          name: varName,
          type: "scatter",
          symbolSize: function(val) {
            return ((val[2] - minVal) / (maxVal - minVal)) * 24 + 5;
          },
          data: statData,
          animationDelay: function(idx) {
            return idx * 5;
          }
        }
      ]
    };

    // use configuration item and data specified to show chart
    mainChart.setOption(option);

    function resizeChart() {
      if (mainChart !== null && !mainChart.isDisposed()) {
        mainChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      mainChart.dispose();
      mainChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });
</script>

<div id="mainChart" style="width:100%; height:100%" />
