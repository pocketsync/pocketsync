<template>
  <div class="w-full h-full">
    
    <div :class="{ 'hidden': activityData.length > 0 }" class="flex items-center justify-center h-full">
      <p class="text-gray-500 dark:text-gray-400">No sync activity data available</p>
    </div>
    <canvas ref="chartRef" :class="{ 'hidden': activityData.length === 0 }" :style="{ 'display': activityData.length === 0 ? 'none' : 'block' }"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type { SyncActivityDataPoint } from '~/api-client/model/sync-activity-data-point';

const props = defineProps<{
  activityData: SyncActivityDataPoint[];
  timeRange: string;
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: any = null;

// Format the timestamp based on the time range
const formatTimestamp = (timestamp: string, timeRange: string) => {
  const date = new Date(timestamp);
  
  switch (timeRange) {
    case '24h':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    case '30d':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

// Prepare chart data
const chartData = computed(() => {
  const labels = props.activityData.map(point => formatTimestamp(point.timestamp, props.timeRange));
  const data = props.activityData.map(point => point.count);
  
  return {
    labels,
    datasets: [
      {
        label: 'Sync Operations',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
});

// Chart configuration
const chartConfig = computed(() => {
  return {
    type: 'line',
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (tooltipItems: any[]) => {
              const item = tooltipItems[0];
              const dataPoint = props.activityData[item.dataIndex];
              return new Date(dataPoint.timestamp).toLocaleString();
            },
            label: (context: any) => {
              return `${context.parsed.y} sync operations`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(107, 114, 128, 0.8)',
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(107, 114, 128, 0.8)',
            font: {
              size: 11
            },
            precision: 0
          }
        }
      }
    }
  };
});

// Initialize and update chart
const initChart = async () => {
  if (!chartRef.value) return;
  
  // Dynamically import Chart.js only when needed
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  
  // Create the chart
  chart = new Chart(chartRef.value, chartConfig.value);
};

// Update chart when data changes
const updateChart = () => {
  if (!chart) return;
  
  chart.data = chartData.value;
  chart.update();
};

// Watch for changes in props
watch(() => props.activityData, updateChart, { deep: true });
watch(() => props.timeRange, updateChart);

// Initialize chart on mount
onMounted(async () => {
  await initChart();
});

// Clean up chart on unmount
onUnmounted(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>
