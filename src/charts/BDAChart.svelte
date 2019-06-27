<script>
  import { onMount } from "svelte";

  onMount(() => {
    const BDAChart = echarts.init(document.getElementById("BDAChart"));
    const option = {
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 29
      },
      xAxis: {
        type: "category",
        data: ["Before", "During", "After"]
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        }
      },
      series: [
        {
          data: [4.6, 5.8, 4.9],
          type: "line",
          symbol: "triangle",
          symbolSize: 10
        },
        {
          data: [3.6, 6.8, 4.9],
          type: "line",
          symbol: "circle",
          symbolSize: 10
        },
        {
          data: [3.2, 2.8, 1.1],
          type: "line",
          symbol: "square",
          symbolSize: 10
        }
      ]
    };

    BDAChart.setOption(option);

    window.addEventListener("resize", () => {
      if (BDAChart !== null) {
        BDAChart.resize();
      }
    });
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
