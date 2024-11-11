<script setup>
import { ref, computed } from 'vue';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUserStore } from '@/stores/UserObjStore.js';

const userStore = useUserStore();

// Main arrays for tag and mindful data
const dvAr = computed(() => userStore.tag_time_obj);
const dvArr = ref(dvAr.value);

const dvArM = computed(() => userStore.mindful_time_obj);
const dvArrM = ref(dvArM.value);

const selectedProductivMindful = ref('productiv'); // Either 'mindful' or 'productiv'

// Toggle between productiv and mindful modes
const toggleProductivMindful = () => {
  selectedProductivMindful.value = selectedProductivMindful.value === 'mindful' ? 'productiv' : 'mindful';
};

// Determine which data to use based on the selected mode
const dataForMode = computed(() => selectedProductivMindful.value === 'productiv' ? dvArr.value : dvArrM.value);

const today = computed(() => new Date());
const formatDate = (date) => format(date, 'ddMMMyy').toLowerCase();

// Weekly calculations
const currentWeekStart = computed(() => startOfWeek(today.value, { weekStartsOn: 0 }));
const currentWeekEnd = computed(() => endOfWeek(today.value, { weekStartsOn: 0 }));
const previousWeekStart = computed(() => subDays(currentWeekStart.value, 7));
const previousWeekEnd = computed(() => subDays(currentWeekEnd.value, 7));

const calculateTotal = (data) => typeof data === 'number' ? data : Object.values(data).reduce((sum, value) => sum + value, 0);

const calculateWeekTotal = (start, end) => {
  const days = eachDayOfInterval({ start, end });
  return days.reduce((total, day) => {
    const dayData = dataForMode.value[formatDate(day)] || {};
    return total + calculateTotal(dayData);
  }, 0);
};

const currentWeekTotal = computed(() => calculateWeekTotal(currentWeekStart.value, currentWeekEnd.value));
const previousWeekTotal = computed(() => calculateWeekTotal(previousWeekStart.value, previousWeekEnd.value));

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const weeklyPercentageChange = computed(() => calculatePercentageChange(currentWeekTotal.value, previousWeekTotal.value));

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  
  return hours === 0 ? `${minutes} mins` : `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
};

const weekDateRange = computed(() => 
  `${format(currentWeekStart.value, 'dd MMM')} - ${format(currentWeekEnd.value, 'dd MMM yyyy')}`
);
</script>

<template>
  <div class="weekly-card-container">
    <Card class="w-full h-full px-6 py-0 flex items-center justify-center">
      <CardHeader class="hidden">
      </CardHeader>
      <CardContent class="card-content">
        <h3 class="date-text">{{ weekDateRange }}</h3>
        <h3 class="statement-text">
          <!-- Your Weekly  -->
          <button @click="toggleProductivMindful" class="inline-block p-0 m-0 bg-transparent border-none cursor-pointer">
            <span v-if="selectedProductivMindful === 'mindful'" class="statement-text">Your Weekly Mindful Time</span>
            <span v-if="selectedProductivMindful === 'productiv'" class="statement-text">Your Weekly Productiv Time</span>
          </button>
          is now:
        </h3>
        <h3 class="text-3xl font-medium text-center mt-2 mb-3">
          {{ formatDuration(currentWeekTotal) }}
        </h3>
        <p :class="`change-text ${weeklyPercentageChange > 0 ? 'text-green-600' : weeklyPercentageChange < 0 ? 'text-red-600' : 'text-black'}`">
            <span v-if="weeklyPercentageChange > 0">▲ {{ Math.abs(Math.round(weeklyPercentageChange)) }}% from last week</span>
            <span v-else-if="weeklyPercentageChange < 0">▼ {{ Math.abs(Math.round(weeklyPercentageChange)) }}% from last week</span>
            <span v-else>No change since last week</span>
        </p>
      </CardContent>
    </Card>
  </div>
</template>


<style scoped>
.weekly-card-container {
  min-height: 230px;
  min-width: 180px;
  max-height: 400px;
  height: 100%;
  width: 100%;
  margin: auto;
}

.date-text {
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 2px;
  text-align: center;
}

.statement-text {
  font-size: 18px;
  text-align: center;
  margin: 12px 0px 5px 0px;
}

.change-text {
  font-size: 16px;
  text-align: center;
  margin: 20px 0px 0px 0px;
}

.card-content {
    padding: 0px;
  }

@media (min-width: 768px) {
  .card-content {
    padding: 20px 0px;
  }
}

@media (min-width: 1000px) {
  .date-text {
  font-size: 25px;
  font-weight: 500;
  margin-bottom: 2px;
  text-align: center;
}
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}
</style>

