<script setup>
import { ref, computed } from 'vue';
import { DonutChart } from '@/components/ui/chart-donut';
import { monthColors } from '@/components/ui/chart-donut/DonutChart.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

// Create a map to store consistent colors for each subject
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
    <Card class="card-container">
      <CardHeader class="hidden">
      </CardHeader>
      <CardContent class="card-content px-0 items-center">
        <h3 class="t3-cat-text">
            Top 3 Categories
        </h3>
        <h3 :class="`date-text ${longDateIs ? 'long-date-format' : 'short-date-format'}`">
            {{ dateHeaderTop3 }}
        </h3>
        <div class="filter-button">
          <DropdownMenu>
            <DropdownMenuTrigger class="border border-solid px-2 py-1 rounded">{{ selectedModeTop3 }}</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="selectedModeTop3 = 'Today'">Today</DropdownMenuItem>
              <DropdownMenuItem @click="selectedModeTop3 = 'Past Week'">Past Week</DropdownMenuItem>
              <DropdownMenuItem @click="handleDateRangeSelect(true)">Date Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="outer-list-container">
          <div class="list-container" >
            <ul v-if="topCategories.length > 0">
              <li v-for="(item, index) in topCategories" :key="index" class="item-container">
                <div :style="{ backgroundColor: item.color }" class="w-4 h-4 mr-5 rounded-full"></div>
                <div>
                  <span class="item-name">{{ index + 1 }}. {{ item.category }}</span>
                  <br>
                  <span class="text-l text-gray-600">{{ item.time }} ({{ item.percentage }}%)</span>
                </div>
              </li>
            </ul>
            <p v-else class="my-20 text-center text-gray-500">No data available for the selected period.</p>
          </div>
          
        </div>

        <div v-if="showRangeCalendarTop3" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg">
            <RangeCalendar v-model="value" class="rounded-md border" @select="handleRangeSelect(true)" />
            <button @click="showRangeCalendarTop3 = false" class="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </div>
        </div>
      </CardContent>
    </Card>
</template>
<style scoped>
.item-name {
  font-size: 22px;
}

.outer-list-container {
  min-height: 220px;
  margin-top: 10px;
}

.list-container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  margin: 10px 8px 0px 24px;
}

.item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 0px 0px 0px;
}

.card-container {
  padding: 33px 33px 33px 33px;
  width: 100%;
}

.t3-cat-text {
  font-size: 28px;
  font-weight: 500;
  text-align: center;
}

.date-text {
  font-size: 26px;
  font-weight: 200;
  text-align: center;
  width: 100%;
  height: 40px;
  margin: 15px auto;
}

.long-date-format {
  font-size: 22px;
}

.short-date-format {
  font-size: 28px;
}

.filter-button {
  margin: 15px 0px 0px 12px;
  display: flex;
  justify-content: end;
}

.card-content {
  width: 100%;
  padding: 0px
}

@media (max-width: 630px) {
  .t3-cat-text {
  font-size: 28px;
  font-weight: 500;
}

}

@media (max-width: 768px) {
  .vis-single-container {
    height: 300px !important;
  }
  .item-container {
  flex-direction: row;
  margin: 25px 0px 0px 5px;
}
}

@media (min-width: 768px) {
  .card-container {
  padding: 33px 25px 0px 25px;
  min-width: 100%;
}
  .card-content {
  min-width: 100%;
}
.item-container {
  flex-direction: row;
  margin: 20px 0px 0px 5px;
}
.date-text {
  font-weight: 400;
  align-items: center;
  width: 100%;
  height: 40px;
  margin: 20px 0px 20px 0px;
  font-size: 26px;
}
.long-date-format {
  font-size: 22px;
}

.short-date-format {
  font-size: 26px;
}
}

@media (min-width: 850px) {
  .long-date-format {
  font-size: 25px;
}

.short-date-format {
  font-size: 26px;
}
}

@media (min-width: 1000px) {
  .card-content {
  min-width: fit-content;
  min-height: 100%;
  }
  .card-container {
  padding: 40px 33px 33px 33px;
  min-width: fit-content;
  max-height: fit-content;
  }
  .list-container {
  min-height: 265px;
  margin: 0px 0px 0px 12px;
  }
.outer-list-container {
  min-height: 270px;
  margin-top: 10px;
}
  .t3-cat-text {
  font-size: 28px;
  font-weight: 500;
  text-align: center;
  }
  .date-text {
  display: flex;
  font-size: 26px;
  font-weight: 400;
  text-align: center;
  align-items: center;
  justify-content: center;
  width: 250px;
  height: 60px;
  margin: 20px auto 20px auto;
}
.long-date-format {
  font-size: 22px;
}
.short-date-format {
  font-size: 26px;
}
.item-name {
  font-size: 25px;
}
.item-container {
  flex-direction: row;
  margin: 35px 0px 0px 5px;
}
}

@media (min-width: 1150px) {
  .t3-cat-text {
  font-size: 28px;
  font-weight: 500;
  text-align: center;
}

.date-text {
  font-size: 26px;
  font-weight: 200;
  text-align: center;
  width: 300px;
  height: 40px;
  margin: 15px auto;
}
.long-date-format {
  font-size: 22px;
}

.short-date-format {
  font-size: 26px;
}

.card-container {
  padding: 40px 35px 33px 35px;
  min-width: fit-content;
  }

.item-container {
  flex-direction: row;
  margin: 35px 0px 0px 5px;
}
}

@media (min-width: 1150px) {
.card-container {
  padding: 40px 35px 33px 35px;
  min-width: fit-content;
  }
.item-container {
  flex-direction: row;
  margin: 40px 0px 0px 5px;
}
}


</style>