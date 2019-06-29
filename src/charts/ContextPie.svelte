<script>
  import { onMount } from "svelte";
  let labelFontSize = window.devicePixelRatio <= 1 ? 18 : 12;
  onMount(() => {
    let ContextPieChart = echarts.init(
      document.getElementById("ContextPieChart")
    );
    const option = {
      backgroundColor: "#fff",

      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },

      visualMap: {
        show: false,
        min: 0,
        max: 60,
        inRange: {
          colorLightness: [0, 1]
        }
      },
      series: [
        {
          name: "Context Activities",
          type: "pie",
          radius: "69%",
          center: ["50%", "50%"],
          data: [
            { value: 43, name: "Television" },
            { value: 11, name: "Sports" },
            { value: 37, name: "Work" },
            { value: 23, name: "Leisure" },
            { value: 5, name: "Sleep" }
          ].sort(function(a, b) {
            return a.value - b.value;
          }),
          roseType: "radius",
          label: {
            normal: {
              textStyle: {
                fontSize: labelFontSize,
                color: "#333"
              }
            }
          },
          labelLine: {
            normal: {
              lineStyle: {
                color: "#333"
              },
              smooth: 0.2,
              length: 10,
              length2: 20
            }
          },
          itemStyle: {
            normal: {
              color: "#c23531",
              shadowBlur: 20,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          },

          animationType: "scale",
          animationEasing: "elasticOut",
          animationDelay: function(idx) {
            return Math.random() * 200;
          }
        }
      ]
    };

    ContextPieChart.setOption(option);

    function resizeChart() {
      if (ContextPieChart !== null && !ContextPieChart.isDisposed()) {
        ContextPieChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      ContextPieChart.dispose();
      ContextPieChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });
</script>

<style>
  #ContextPieChart {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
</style>

<div id="ContextPieChart" />
