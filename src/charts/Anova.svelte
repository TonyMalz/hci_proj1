<script>
  import { onMount } from "svelte";
  onMount(() => {
    let anovaChart = echarts.init(document.getElementById("anovaChart"));
    const categoryData = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    const errorData = [];
    const barData = [];
    const dataCount = 7;
    for (var i = 0; i < dataCount; i++) {
      var val = Math.random() * 7;
      //categoryData.push("Day" + (i + 1));
      errorData.push([
        i,
        echarts.number.round(Math.max(0, val - Math.random() * 3)),
        echarts.number.round(val + Math.random() * 3)
      ]);
      barData.push(echarts.number.round(val, 2));
    }

    function renderItem(params, api) {
      var xValue = api.value(0);
      var highPoint = api.coord([xValue, api.value(1)]);
      var lowPoint = api.coord([xValue, api.value(2)]);
      var halfWidth = api.size([1, 0])[0] * 0.05;
      var style = api.style({
        stroke: "#777",
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
        }
      },
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 25
      },
      // dataZoom: [
      //   {
      //     type: "slider",
      //     start: 1,
      //     end: 40
      //   },
      //   {
      //     type: "inside",
      //     start: 1,
      //     end: 30
      //   }
      // ],
      xAxis: {
        data: categoryData
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        }
      },
      series: [
        {
          type: "bar",
          name: "Availability",
          data: barData,
          itemStyle: {
            normal: {
              color: "#61a0a7"
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
    width: 95%;
    height: 99%;
    padding: 0;
    margin: 0;
  }
</style>

<div id="anovaChart" />
