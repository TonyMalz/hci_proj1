<script>
  import { onMount } from "svelte";
  onMount(() => {
    const mainChartSummary = echarts.init(document.getElementById("mainChartSummary"));

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: "Average availability : <br/>{b}h : {c}"
        },
        grid: {
            left: '3%',
            right: '40%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'Avg. Avail.'
        },
        yAxis: {
            type: 'category',
            axisLine: {onZero: true},
            boundaryGap: false,
            name: 'Time of day',
            data: ['08:00', '', '09:00', '', '10:00', '', '11:00', '', '12:00', '', '13:00', '', '14:00', '', '15:00',
            '', '16:00', '', '17:00', '', '18:00', '', '19:00', '', '20:00', '', '21:00', '', '22:00', '', '23:00', '', '24:00']
        },
        series: [
            {
                name: 'Average availability',
                type: 'line',
                smooth: false, // disable interpolation
                lineStyle: {
                    normal: {
                        width: 3,
                        shadowColor: 'rgba(0,0,0,0.4)',
                        shadowBlur: 10,
                        shadowOffsetY: 10
                    }
                },
                data:[1, 2.5, 3.8, 7, 5, 4, 4, 4, 4, 5, 5, 5, 2, 2, 2, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 3, 3, 3, 3, 2.5, 2, 5, 6, 4, 3.75, 2]
            }
        ]
    };
    
    // use configuration item and data specified to show chart
    mainChartSummary.setOption(option);
    window.addEventListener("resize", () => {
      if (mainChartSummary !== null) {
        mainChartSummary.resize();
      }
    });
  });
</script>

<div id="mainChartSummary" style="width:100%; height:100%" />