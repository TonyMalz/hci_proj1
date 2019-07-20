<script>
  import { onMount } from "svelte";
  import { variableStore } from "../modules/store";
  import stat from "../modules/simple-statistics.min";
  export let studyId;
  export let dependentVariable;
  let mainChartSummary;
  let old = "";
  $: if (dependentVariable !== old) {
    old = dependentVariable;
    if (dependentVariable) {
      updateChart(dependentVariable);
    }
  }

  function updateChart(variable) {
    if (!mainChartSummary) return;
    mainChartSummary.showLoading();
    const data = getStatData(variable);
    mainChartSummary.hideLoading();
    mainChartSummary.setOption({
      series: [
        {
          data: data
        }
      ]
    });
  }
  function getStatData(dependentVariable) {
    if (!dependentVariable) return [];
    const resultsByHour = new Map();
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      const hour = resultDate.getHours();
      const rs = resultsByHour.get(hour) || [];
      rs.push(result.value);
      resultsByHour.set(hour, rs);
    }

    const data = [];
    for (let i = 0; i < 24; i++) {
      const results = resultsByHour.get(i) || [0];
      data.push([
        stat.mean(results),
        i,
        stat.standardDeviation(results),
        results.length
      ]);
    }
    return data;
  }

  onMount(() => {
    mainChartSummary = echarts.init(
      document.getElementById("mainChartSummary")
    );
    const data = getStatData(dependentVariable);
    const option = {
      tooltip: {
        trigger: "axis",
        formatter: function(data) {
          const d = data[0].data;
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${d[0].toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${d[2].toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Responses</td>
                    <td style="padding-left:0.5rem;">${d[3]}</td>
                  </tr>
                  <tr>
                    <td>Timeslot</td>
                    <td style="padding-left:0.5rem;">[${d[1]}:00 - ${+d[1] +
            1}:00)</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 50,
        containLabel: true
      },
      dataZoom: {
        type: "inside",
        yAxisIndex: [0],
        filterMode: "filter"
      },
      xAxis: {
        type: "value",
        name: "Avg."
      },
      yAxis: {
        type: "category",
        axisLine: { onZero: true },
        boundaryGap: false,
        name: "Time of day",
        max: 24,
        axisLabel: {
          formatter: function(value, idx) {
            let hour = ~~value;
            let minutes = ~~((value - hour) * 60);
            hour = hour < 10 ? "0" + hour : hour;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            if (idx == 24) {
              return "24:00";
            }
            return `${hour}:${minutes}`;
          }
        },
        splitNumber: 8
      },
      series: [
        {
          // name: "Average availability",
          type: "line",
          smooth: false, // disable interpolation
          lineStyle: {
            normal: {
              width: 3,
              shadowColor: "rgba(0,0,0,0.4)",
              shadowBlur: 10,
              shadowOffsetY: 10
            }
          },
          data
        }
      ]
    };

    // use configuration item and data specified to show chart
    mainChartSummary.setOption(option);
    function resizeChart() {
      if (mainChartSummary !== null && !mainChartSummary.isDisposed()) {
        mainChartSummary.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      mainChartSummary.dispose();
      mainChartSummary = null;
      window.removeEventListener("resize", resizeChart);
    };
  });
</script>

<div id="mainChartSummary" style="width:100%; height:100%" />
