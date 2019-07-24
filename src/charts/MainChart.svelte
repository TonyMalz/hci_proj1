<script>
  import { onMount } from "svelte";
  import { variableStore } from "../modules/store";
  import MainChartSummary from "./MainChartSummary.svelte";
  import Anova from "./Anova.svelte";
  import stat from "../modules/simple-statistics.min";

  export let studyId;

  let mainChart;
  let dvs = [];
  let minVal,
    maxVal = 0;
  let dependentVariable;

  function selectHandler() {
    updateChart(dependentVariable);
  }

  function updateChart(variable) {
    if (!mainChart) return;
    mainChart.showLoading();
    const data = getStatData(variable);
    mainChart.hideLoading();
    mainChart.setOption({
      visualMap: {
        min: minVal,
        max: maxVal
      },
      legend: {
        show: true,
        data: [dependentVariable.variableName],
        left: "center"
      },
      series: [
        {
          name: dependentVariable.variableName,
          data: data
        }
      ]
    });
  }

  function getStatData(dependentVariable) {
    const resultsByDayAndHour = [
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map()
    ];
    minVal = stat.min(dependentVariable.results.map(v => v.value));
    maxVal = stat.max(dependentVariable.results.map(v => v.value));
    dependentVariable.variableName = dependentVariable.variableLabel;
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      // 0: sunday - 6: saturday (US week format!)
      // convert to 0: monday - 6 sunday
      const resultDay = (+resultDate.getDay() + 6) % 7;
      const hour = resultDate.getHours();
      const rs = resultsByDayAndHour[resultDay].get(hour) || [];
      rs.push(result.value);
      resultsByDayAndHour[resultDay].set(hour, rs);
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
    return statData;
  }

  onMount(() => {
    mainChart = echarts.init(document.getElementById("mainChart"));
    const numericVariables = $variableStore.filter(
      v =>
        v.studyId === studyId &&
        v.isDemographic === false &&
        v.measure === "scale"
    );
    dvs = numericVariables;
    let statData = [];
    if (numericVariables && numericVariables.length) {
      dependentVariable = numericVariables[0];
      statData = getStatData(dependentVariable);
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
      dataZoom: {
        type: "inside",
        yAxisIndex: [0],
        filterMode: "filter"
      },
      visualMap: {
        right: 10,
        top: "25%",
        dimension: 2,
        min: minVal,
        max: maxVal,
        itemWidth: 15,
        itemHeight: 100,
        calculable: true,
        precision: 0.1,
        text: ["Mean"],
        textGap: 10,
        textStyle: {
          color: "#333"
        },
        outOfRange: {
          color: ["rgba(0,0,0,0.1)"]
        }
      },
      legend: {
        show: true,
        data: [dependentVariable.variableName],
        left: "center"
      },
      tooltip: {
        position: "top",
        formatter: function(d) {
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td colspan=2>${days[d.value[0]]}</td>
                  </tr>
                  <tr>
                    <td>Timeslot</td>
                    <td style="padding-left:0.5rem;">[${d.value[1]}:00 - ${+d
            .value[1] + 1}:00)</td>
                  </tr>
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
                  </table>`;
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 110,
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
          name: dependentVariable.variableName,
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

  let selectColor;
</script>

<style>
  .container {
    position: relative;
    display: grid;
    grid-template-rows: min-content auto;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    grid-gap: 1rem;
  }
  .filter {
    font-size: 0.8rem;
    padding: 0;
  }
  .charts {
    display: grid;
    grid-template-columns: 2fr minmax(120px, 0.5fr);
    grid-template-rows: 2fr 1fr;
  }
  select {
    margin-right: 1rem;
  }
  .anova {
    grid-column: 1/3;
  }
</style>

<div class="container">
  <div class="filter">
    Variable:
    <select
      name="dv"
      id="dv"
      bind:value={dependentVariable}
      on:change={selectHandler}>
      {#each dvs as dv}
        <option value={dv}>{dv.variableLabel}</option>
      {/each}
    </select>
    <!-- Colour is:
    <select name="color" id="color" bind:value={selectColor}>
      <option value="0">not selected</option>
    </select> -->
  </div>
  <div class="charts">
    <div id="mainChart" style="width:100%; height:100%" />
    <MainChartSummary {studyId} {dependentVariable} />
    <div class="anova">
      <Anova {studyId} {dependentVariable} />
    </div>
  </div>
</div>
