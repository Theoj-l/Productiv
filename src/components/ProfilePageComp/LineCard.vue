<script setup>
import { ref, computed } from 'vue'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns'
import { LineChart } from '@/components/ui/chart-line'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserStore } from '@/stores/UserObjStore.js';
import { useMediaQuery } from '@vueuse/core'

const dvAr = computed(() => useUserStore().tag_time_obj);
const dvArr = ref(dvAr.value);

const colors = [
    '#FF6384', // Bright Pink
    '#36A2EB', // Bright Blue
    '#FFCE56', // Golden Yellow
    '#4BC0C0', // Turquoise
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#32CD32', // Lime Green
    '#FF5C8D', // Coral Pink
    '#45B7D1', // Sky Blue
    '#98FB98', // Pale Green
    '#DDA0DD', // Plum
    '#F08080', // Light Coral
    '#87CEEB', // Light Sky Blue
    '#FFB347', // Light Orange
    '#00CED1', // Dark Turquoise
    '#BA55D3', // Medium Orchid
    '#40E0D0', // Turquoise
    '#FF6B6B', // Light Red
    '#4169E1', // Royal Blue
    '#FFA07A'  // Light Salmon
];

const currentDate = ref(new Date())
const viewMode = ref('weekly')

const isSmallScreen = useMediaQuery('(max-width: 639px)')
const isMediumScreen = useMediaQuery('(min-width: 640px) and (max-width: 767px)')
const isLaptopScreen = useMediaQuery('(min-width: 1024px)')

const subjects = computed(() => {
  return Array.from(new Set(Object.values(dvArr.value).flatMap(Object.keys)))
})

const dateRange = computed(() => {
  if (viewMode.value === 'weekly') {
    const start = startOfWeek(currentDate.value)
    const end = endOfWeek(currentDate.value)
    return { start, end }
  } else {
    const start = startOfMonth(currentDate.value)
    const end = endOfMonth(currentDate.value)
    return { start, end }
  }
})

const headerText = computed(() => {
  const { start, end } = dateRange.value
  if (viewMode.value === 'weekly') {
    return `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`
  } else {
    return format(start, 'MMMM yyyy')
  }
})

const handlePrev = () => {
  currentDate.value = addDays(currentDate.value, viewMode.value === 'weekly' ? -7 : -30)
}

const handleNext = () => {
  currentDate.value = addDays(currentDate.value, viewMode.value === 'weekly' ? 7 : 30)
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60); // Round up minutes

  if (hours === 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min${minutes !== 1 ? 's' : ''}` : ''}`;
  }
};

const formatData = computed(() => {
  const { start, end } = dateRange.value
  const allSubjects = subjects.value

  if (viewMode.value === 'weekly') {
    const days = eachDayOfInterval({ start, end })
    return days.map((day) => {
      const dayKey = format(day, 'ddMMMyy').toLowerCase()
      const dayData = dvArr.value[dayKey] || {}
      const formattedData = { date: format(day, 'EEE') }
      
      allSubjects.forEach((subject) => {
        formattedData[subject] = dayData[subject] || 0
      })
      
      return formattedData
    })
  } else {
    const weeks = eachWeekOfInterval({ start, end }).slice(0, 4)
    return weeks.map((weekStart, index) => {
      const weekEnd = index < 3 ? addDays(weekStart, 6) : end
      const weekData = { date: `Week ${index + 1}` }
      
      allSubjects.forEach((subject) => {
        weekData[subject] = 0
      })
      
      eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach(day => {
        const dayKey = format(day, 'ddMMMyy').toLowerCase()
        const dayData = dvArr.value[dayKey] || {}
        
        allSubjects.forEach((subject) => {
          weekData[subject] += (dayData[subject] || 0)
        })
      })
      
      return weekData
    })
  }
})

const formatTooltipValue = (value) => {
  return formatDuration(value);
};

const formatYAxis = (value) => {
  return formatDuration(value);
};

const legendItems = computed(() => 
  subjects.value.map((subject, index) => ({
    name: subject,
    color: colors[index % colors.length],
    inactive: false,
    formatter: formatDuration
  }))
);

const chartMargin = computed(() => {
  return { top: 20, right: 20, bottom: 20, left: 20 }
})

const showAxes = ref(false)


const xAxisLabel = computed(() => {
  return viewMode.value === 'weekly' ? 'Days of the Week' : 'Weeks'
})
</script>

<template>
  <Card class="relative responsive-card">
    <CardHeader>
        <div class="w-full flex items-center justify-between gap-2">
          <Button @click="handlePrev" class="nav-button shrink-0">Prev</Button>
          <h2 class="header-text">{{ headerText }}</h2>
          <Button @click="handleNext" class="nav-button shrink-0">Next</Button>
        </div>
    </CardHeader>
    <CardContent class="px-4 flex flex-col items-center h-max">
      <div class="flex justify-center space-x-2 sm:space-x-4 mb-4 w-full">
        <DropdownMenu class="dropdown">
          <DropdownMenuTrigger class="dropdown-trigger">
            {{ viewMode === 'weekly' ? 'Weekly' : 'Monthly' }}
          </DropdownMenuTrigger>
          <DropdownMenuContent class="dropdown-content">
            <DropdownMenuItem @click="viewMode = 'weekly'">Weekly</DropdownMenuItem>
            <DropdownMenuItem @click="viewMode = 'monthly'">Monthly</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div class="w-full flex justify-center items-center">
        <LineChart
          :data="formatData"
          :index="'date'"
          :categories="subjects"
          :colors="subjects.map((_, index) => colors[index % colors.length])"
          :y-formatter="formatYAxis"
          :value-formatter="formatTooltipValue"
          :view-mode="viewMode"
          :show-legend="true"
          :legend-items="legendItems"
          :show-x-axis="false"
          :show-y-axis="false"
          :margin="chartMargin"
          :x-axis-label="xAxisLabel"
          style="height: 100%;"
        />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.responsive-card {
  padding: clamp(0.5rem, 2vw, 1.5rem);
  width: 100%;
  height: fit-content;
  margin: 0 auto;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem;
  width: 100%;
}

.nav-button {
  font-size: clamp(0.75rem, 1vw + 0.5rem, 1rem);
  padding: clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1vw + 0.25rem, 1rem);
  min-width: 60px;
}

.header-text {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.75rem);
  font-weight: 500;
  text-align: center;
  padding: 0 0.25rem;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: normal;
  word-break: break-word;
  flex: 1;
}

.dropdown-trigger {
  border: 1px solid #e2e8f0;
  padding: clamp(0.25rem, 0.5vw + 0.25rem, 0.75rem) clamp(0.5rem, 1vw, 1rem);
  border-radius: 0.25rem;
  font-size: clamp(0.75rem, 1vw + 0.5rem, 1rem);
}

@media (min-width: 350px) {
  .header-container {
    gap: 1rem;
    padding: 0.75rem;
  }
}

@media (min-width: 640px) {
  .header-container {
    gap: 1.5rem;
    padding: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .header-container {
    gap: 2rem;
    padding: 1rem;
  }

  .dropdown-trigger {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
}

@media (min-width: 1280px) {
  .header-container {
    padding: 1.25rem;
  }

  .header-text {
    font-size: 1.75rem;
  }
}
</style>