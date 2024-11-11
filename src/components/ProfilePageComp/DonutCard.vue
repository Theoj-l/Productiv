<script setup>
import { ref, computed } from 'vue';
import { DonutChart } from '@/components/ui/chart-donut';
import { monthColors } from '@/components/ui/chart-donut/DonutChart.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { getLocalTimeZone, today } from '@internationalized/date';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { useUserStore } from '@/stores/UserObjStore.js';

const dvAr = computed(() => useUserStore().tag_time_obj);
const dvArr = ref(dvAr.value);
console.log(dvArr)

const selectedMode = ref('Today');
const selectedModeTop3 = ref('Today');
const value = ref({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()).add({ days: 7 }),
});
const showRangeCalendar = ref(false);
const showRangeCalendarTop3 = ref(false);

const longDateIs = ref(false);

const subjectColorMap = ref({});

const dateHeader = computed(() => {
  return getDateHeader(selectedMode.value);
});

const dateHeaderTop3 = computed(() => {
  return getDateHeader(selectedModeTop3.value);
});

function getDateHeader(mode) {
  const currentDate = new Date();
  if (mode === 'Today') {
    longDateIs.value = false;
    return format(currentDate, 'dd MMM yyyy');
  } else if (mode === 'Past Week') {
    longDateIs.value = true;
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    return `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
  } else if (mode === 'Date Range' && value.value.start && value.value.end) {
    longDateIs.value = true;
    const startDate = parseISO(value.value.start.toString());
    const endDate = parseISO(value.value.end.toString());
    return `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
  }
  return '';
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} mins`;
  } else {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
  }
};

const getFilteredData = (mode) => {
  const today = new Date();
  let data = [];

  if (mode === 'Today') {
    const todayKey = format(today, 'ddMMMyy').toLowerCase();
    data = Object.entries(dvArr.value[todayKey] || {}).map(([subject, value]) => ({
      subject,
      total: value,
    }));
  } else if (mode === 'Past Week') {
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);
    const daysInWeek = eachDayOfInterval({ start: startDate, end: endDate });

    const weekData = {};
    daysInWeek.forEach(day => {
      const dayKey = format(day, 'ddMMMyy').toLowerCase();
      if (dvArr.value[dayKey]) {
        Object.entries(dvArr.value[dayKey]).forEach(([subject, value]) => {
          if (!weekData[subject]) weekData[subject] = 0;
          weekData[subject] += value;
        });
      }
    });

    data = Object.entries(weekData).map(([subject, total]) => ({ 
      subject, 
      total,
    }));
  } else if (mode === 'Date Range' && value.value.start && value.value.end) {
    const startDate = parseISO(value.value.start.toString());
    const endDate = parseISO(value.value.end.toString());
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    const rangeData = {};
    daysInRange.forEach(day => {
      const dayKey = format(day, 'ddMMMyy').toLowerCase();
      if (dvArr.value[dayKey]) {
        Object.entries(dvArr.value[dayKey]).forEach(([subject, value]) => {
          if (!rangeData[subject]) rangeData[subject] = 0;
          rangeData[subject] += value;
        });
      }
    });

    data = Object.entries(rangeData).map(([subject, total]) => ({ 
      subject, 
      total,
    }));
  }

  // Assign consistent colors to subjects
  data.forEach((item) => {
    if (!subjectColorMap.value[item.subject]) {
      subjectColorMap.value[item.subject] = monthColors[Object.keys(subjectColorMap.value).length % monthColors.length];
    }
    item.color = subjectColorMap.value[item.subject];
  });

  return data;
};

const filteredData = computed(() => getFilteredData(selectedMode.value));
const filteredDataTop3 = computed(() => getFilteredData(selectedModeTop3.value));

const valueFormatter = (seconds) => {
  return formatDuration(seconds);
};

function handleDateRangeSelect(isTop3 = false) {
  if (isTop3) {
    selectedModeTop3.value = 'Date Range';
    showRangeCalendarTop3.value = true;
  } else {
    selectedMode.value = 'Date Range';
    showRangeCalendar.value = true;
  }
}

function handleRangeSelect(isTop3 = false) {
  if (isTop3) {
    showRangeCalendarTop3.value = false;
  } else {
    showRangeCalendar.value = false;
  }
}

const breakdownData = computed(() => {
  if (filteredData.value.length === 0) return [];

  const total = filteredData.value.reduce((sum, item) => sum + item.total, 0);
  let remainingPercentage = 100;
  
  const data = filteredData.value.map((item) => {
    const percentage = (item.total / total) * 100;
    const roundedPercentage = Math.floor(percentage);
    remainingPercentage -= roundedPercentage;
    
    return {
      subject: item.subject,
      percentage: roundedPercentage,
      color: item.color,
      rawPercentage: percentage,
      formattedTotal: formatDuration(item.total)
    };
  });

  // Distribute the remaining percentage
  data.sort((a, b) => b.rawPercentage - a.rawPercentage);
  for (let i = 0; i < remainingPercentage; i++) {
    data[i % data.length].percentage += 1;
  }

  return data;
});

const topCategories = computed(() => {
  const sortedData = filteredDataTop3.value.sort((a, b) => b.total - a.total);
  const totalTime = sortedData.reduce((sum, item) => sum + item.total, 0);
  
  return sortedData.slice(0, 3).map((item) => ({
    category: item.subject,
    time: formatDuration(item.total),
    color: item.color,
    percentage: ((item.total / totalTime) * 100).toFixed(1)
  }));
});

const showBreakdown = ref(false);

// Function to toggle the breakdown visibility
const toggleBreakdown = () => {
  showBreakdown.value = !showBreakdown.value;
};
</script>

<template>
  <div class="">
    <Card class="donut-container">
      <CardHeader class="hidden">
      </CardHeader>
      <CardContent class="card-content">
        <h2 :class="`date-text ${longDateIs ? 'long-date-format' : 'short-date-format'}`">{{ dateHeader }}</h2>

        <div class="filter-button">
          <DropdownMenu>
            <DropdownMenuTrigger class="border border-solid px-2 py-1 rounded">Filter</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="selectedMode = 'Today'">Today</DropdownMenuItem>
              <DropdownMenuItem @click="selectedMode = 'Past Week'">Past Week</DropdownMenuItem>
              <DropdownMenuItem @click="handleDateRangeSelect()">Date Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="chart-list-container">
          <div class="donut-chart">
            <div class="donut-itself">
          <DonutChart
            v-if="filteredData.length > 0"
            :data="filteredData"
            index="subject"
            category="total"
            :value-formatter="valueFormatter"
            :colors="filteredData.map(item => item.color)"
            type="pie"
            class="w-[100%] h-[100%]"
          >
          <ChartSingleTooltip
              selector=".vis-donut-arc"
              index="subject"
              :value-formatter="valueFormatter"
            />
          </DonutChart>
          <p v-else class="mt-40 text-center text-gray-500">No data available for the selected period.</p>
          </div>     
        </div>

          <div v-if="breakdownData.length > 0" class="list-container">
            <ScrollArea class="scroll-area">
                <button @click="toggleBreakdown" class="mb-2 text-sm font-medium text-blue-600 hover:underline md:hidden">
                  {{ showBreakdown ? 'Hide' : 'Show' }} Breakdown
                </button>
                <div :class="{ 'hidden md:block': !showBreakdown }">
                  <div v-for="item in breakdownData" :key="item.subject" class="mb-6 flex items-center">
                    <div :style="{ backgroundColor: item.color }" class="min-w-4 min-h-4 mr-5 rounded-full"></div>
                      <div class="item-name-container">
                        <span class="item-name">{{ item.subject }}</span>
                        <span class="text-l text-gray-600">&nbsp - &nbsp{{ item.formattedTotal }} ({{ item.percentage }}%)</span>
                      </div>
                    </div>
                  </div>
            </ScrollArea>
            </div>
        </div>

        <div v-if="showRangeCalendar" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg w-full max-w-md mx-4">
            <RangeCalendar v-model="value" class="rounded-md border" @select="handleRangeSelect()" />
            <button @click="showRangeCalendar = false" class="mt-4 px-4 py-2 bg-gray-200 rounded w-full">Close</button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
<style scoped>
.donut-container {
  height: 100%;
  width: 100%;
  margin: auto;
  padding: 40px 15px 20px 15px;
}

.date-text {
  display: flex;
  justify-content: center;
  text-align: center;
  height: 70px;
  font-weight: 500;
}

.long-date-format {
  font-size: 30px;
}

.short-date-format {
  font-size: 30px;
}

.chart-list-container {
  margin: 0px 0px 0px 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.donut-itself {
  width: 90%;
}
.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 100%;
  flex:4;
  grid-area: dc;
}

.scroll-area {
  margin-top: 20px;
  height: 95%;
  width: 100%;
  padding: 0px;
}

.list-container {
  flex: 4;
  display: flex;
  height: 300px;
  align-items: center;
  width: 100%;
}

.item-name {
  font-size: 25px;
}

.card-content {
  padding: 0;
}

.filter-button {
  margin: 10px 15px 0px 0px;
  display: flex;
  justify-content: end;
}

@media (max-width: 768px) {
  .vis-single-container {
    height: 300px !important;
  }
  .chart-list-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 600px;
}
.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex: 2;
}
.donut-itself {
  height: 100%;
}
.list-container {
  flex: 9;
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  /* padding: 0px 0px 20px 0px; */
}
.scroll-area {
  height: 260px;
  width: 80%;
}
}
@media (min-width: 768px) {
.chart-list-container {
  margin: 0px 0px 0px 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 400px;
}
.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex: 5;
}
.donut-itself {
  height: 80%;
}
.list-container {
  flex: 4;
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  margin: 0px 0px 0px 20px;
}
.date-text {
  text-align: center;
  align-items: center;
  height: 70px;
  font-weight: 500;
}
/* .long-date-format {
  font-size: 26px;
}

.short-date-format {
  font-size: 30px;
} */
}

@media (min-width: 1000px) {
  .donut-container {
  height: 100%;
  width: 100%;
  margin: auto;
  padding: 40px 30px 20px 30px;
}
  .chart-list-container {
  margin: 0px 0px 0px 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 400px;
}
.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex: 4;
}
.donut-itself {
  height: 95%;
}
.list-container {
  flex: 3;
  display: flex;
  height: 25px;
  width: 100%;
  align-items: center;
  margin: 0px 0px 0px 40px;
}
.date-text {
  text-align: center;
  align-items: center;
  height: 70px;
  font-weight: 500;
}

/* .long-date-format {
  font-size: 30px;
}

.short-date-format {
  font-size: 30px;
} */
.scroll-area {
  max-width: 95%;
  max-height: 80%;
}
.item-name {
  font-size: 20px;
}
}

/* @media (min-width: 1150px) {

}  */


@media (min-width: 1350px) {
  .chart-list-container {
  margin: 0px 0px 0px 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 380px;
}
.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex: 4;
  padding: 20px 0px;
}
.donut-itself {
  height: 100%;
}
.list-container {
  flex: 3;
  display: flex;
  height: 90%;
  width: 100%;
  align-items: center;
  margin: 0px 0px 0px 20px;
}
.item-name {
  font-size: 20px;
}
.date-text {
  display: flex;
  justify-content: center;
  text-align: center;
  height: 70px;
  font-weight: 500;
}

/* .long-date-format {
  font-size: 30px;
}

.short-date-format {
  font-size: 30px;
} */
}
.scroll-area {
  max-width: 95%;
  max-height: 80%;
}

@media (min-width: 1440px) {
  /* .long-date-format {
  font-size: 26px;
}

.short-date-format {
  font-size: 30px;
} */
.scroll-area {
  max-width: 85%;
}
}

</style>