<script>
  import { onMount } from "svelte";

  onMount(() => {
    let BDAChart = echarts.init(document.getElementById("BDAChart"));
    const option = {
      grid: {
        left: 36,
        top: 30,
        right: 10,
        bottom: 30
      },
      legend: { show: true },
      xAxis: {
        type: "category",
        data: ["Before", "During", "After"]
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: true
        },
        name: "Availability"
      },
      series: [
        {
          name: "Work",
          data: [4.6, 5.8, 4.9],
          type: "line",
          symbol: "triangle",
          symbolSize: 10
        },
        {
          name: "Leisure",
          data: [3.6, 6.8, 4.9],
          type: "line",
          symbol: "circle",
          symbolSize: 10
        },
        {
          name: "Television",
          data: [3.2, 2.8, 1.1],
          type: "line",
          symbol: "square",
          symbolSize: 10
        }
      ]
    };

    BDAChart.setOption(option);

    function resizeChart() {
      if (BDAChart !== null && !BDAChart.isDisposed()) {
        BDAChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      BDAChart.dispose();
      BDAChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });
</script>

<style>
  #BDAChart {
    width: 95%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
</style>

<div id="BDAChart" />
