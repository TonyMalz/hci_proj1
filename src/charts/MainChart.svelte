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
    console.log(numericVariables);

    const resultsByDayAndHour = [
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map()
    ];
    const resultsByDay = [[], [], [], [], [], [], []]; // array index -> day of week starting at 0 (monday)
    let minHour = 0;
    let maxHour = 0;
    // TODO: enable user selection
    const dependentVariable = numericVariables[0];
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      const resultDay = resultDate.getDay();
      const hour = resultDate.getHours();
      minHour = minHour < hour ? minHour : hour;
      maxHour = maxHour > hour ? maxHour : hour;
      resultsByDay[resultDay].push(result.value);
      const rs = resultsByDayAndHour[resultDay].get(hour) || [];
      rs.push(result.value);
      resultsByDayAndHour[resultDay].set(hour, rs);
    }

    // console.log(resultsByDay);
    // console.log(resultsByDayAndHour);
    // console.log(dependentVariable, minHour, maxHour);

    const statData = [];
    for (const day in resultsByDayAndHour) {
      for (const [hour, results] of resultsByDayAndHour[day]) {
        // statData.push({
        //   x: +day + 1, // start at 1 for monday, cast to int and do not concatenate strings (WTF Javascript?!)
        //   y: hour,
        //   mean: stat.mean(results),
        //   sd: stat.standardDeviation(results),
        //   responses: results.length
        // });
        statData.push([
          +day + 1, // start at 1 for monday, cast to int and do not concatenate strings (WTF Javascript?!)
          hour,
          stat.mean(results),
          stat.standardDeviation(results),
          results.length
        ]);
      }
    }

    console.log(statData);

    // TODO find alternative for this workaround
    const hours = [
      "08:00",
      "",
      "09:00",
      "",
      "10:00",
      "",
      "11:00",
      "",
      "12:00",
      "",
      "13:00",
      "",
      "14:00",
      "",
      "15:00",
      "",
      "16:00",
      "",
      "17:00",
      "",
      "18:00",
      "",
      "19:00",
      "",
      "20:00",
      "",
      "21:00",
      "",
      "22:00",
      "",
      "23:00",
      "",
      "24:00"
    ];
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
    const data = [
      [1, 1, 5],
      [1, 3, 3],
      [1, 5, 2],
      [1, 7, 1],
      [1, 9, 0],
      [1, 11, 0.5],
      [1, 13, 0.5],
      [1, 15, 3],
      [1, 17, 5],
      [1, 19, 5.5],
      [1, 21, 5.2],
      [1, 23, 6.1],
      [1, 25, 3],
      [1, 27, 6],
      [1, 29, 1],
      [1, 31, 2],
      [2, 1, 5],
      [2, 3, 2],
      [2, 5, 2],
      [2, 7, 0.5],
      [2, 9, 1],
      [2, 11, 1.5],
      [2, 13, 1.5],
      [2, 15, 3.5],
      [2, 17, 6],
      [2, 19, 4.5],
      [2, 21, 4.5],
      [2, 23, 5.5],
      [2, 25, 4],
      [2, 27, 5],
      [2, 29, 1.2],
      [2, 31, 5],
      [3, 1, 3],
      [3, 3, 1.5],
      [3, 5, 2],
      [3, 7, 1],
      [3, 9, 2],
      [3, 11, 2],
      [3, 13, 0.75],
      [3, 15, 2],
      [3, 17, 4],
      [3, 19, 3.5],
      [3, 21, 4],
      [3, 23, 5.75],
      [3, 25, 5],
      [3, 27, 3],
      [3, 29, 3],
      [3, 31, 2.5],
      [4, 1, 3.5],
      [4, 3, 2],
      [4, 5, 2],
      [4, 7, 2],
      [4, 9, 0.5],
      [4, 11, 1.5],
      [4, 13, 0.85],
      [4, 15, 1.5],
      [4, 17, 3],
      [4, 19, 5],
      [4, 21, 3.9],
      [4, 23, 4],
      [4, 25, 3.5],
      [4, 27, 4],
      [4, 29, 2],
      [4, 31, 3],
      [5, 1, 4],
      [5, 3, 1.4],
      [5, 5, 2],
      [5, 7, 1.5],
      [5, 9, 2],
      [5, 11, 0.5],
      [5, 13, 1.75],
      [5, 15, 2.85],
      [5, 17, 4.5],
      [5, 19, 5.1],
      [5, 21, 4.2],
      [5, 23, 3.5],
      [5, 25, 4],
      [5, 27, 4.5],
      [5, 29, 5],
      [5, 31, 4],
      [6, 1, 5],
      [6, 3, 1.5],
      [6, 5, 2],
      [6, 7, 1],
      [6, 9, 0],
      [6, 11, 0.75],
      [6, 13, 1.0],
      [6, 15, 2],
      [6, 17, 5.75],
      [6, 19, 4],
      [6, 21, 4.75],
      [6, 23, 6],
      [6, 25, 4.5],
      [6, 27, 3.23],
      [6, 29, 7],
      [6, 31, 0.5],
      [7, 1, 4.5],
      [7, 3, 1],
      [7, 5, 2],
      [7, 7, 0],
      [7, 9, 1],
      [7, 11, 1],
      [7, 13, 0.5],
      [7, 15, 3],
      [7, 17, 3],
      [7, 19, 4.75],
      [7, 21, 2],
      [7, 23, 5.5],
      [7, 25, 3.99],
      [7, 27, 6.5],
      [7, 29, 2],
      [7, 31, 1]
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
        data: [dependentVariable.variableName],
        left: "center"
      },
      tooltip: {
        position: "top",
        formatter: function(d) {
          // TODO implement function capable of translating params.value[1] into 'XX:00-XX:00'
          return `<table style="font-size:0.7rem;">
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
        // name: "Day of week",
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
          name: dependentVariable.variableName,
          type: "scatter",
          symbolSize: function(val) {
            return val[2] * 3;
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
