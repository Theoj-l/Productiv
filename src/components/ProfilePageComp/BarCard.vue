<script setup>
import { ref, computed,watch } from 'vue'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from '@/components/ui/chart-bar'
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
const selectedSubject = ref('all')
const showLegend = computed(() => selectedSubject.value === 'all')

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
  const minutes = Math.round((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} mins`;
  } else {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes > 0 ? ` ${minutes} min${minutes > 1 ? 's' : ''}` : ''}`;
  }
};

const formatHours = (seconds) => {
  return seconds / 3600; // Return raw hours for data processing
}

const formatData = computed(() => {
  const { start, end } = dateRange.value
  const allSubjects = subjects.value

  if (viewMode.value === 'weekly') {
    const days = eachDayOfInterval({ start, end })
    return days.map((day) => {
      const dayKey = format(day, 'ddMMMyy').toLowerCase()
      const dayData = dvArr.value[dayKey] || {}
      const formattedData = { name: format(day, 'EEE') }
      
      allSubjects.forEach((subject) => {
        formattedData[subject] = formatHours(dayData[subject] || 0)
      })
      
      return formattedData
    })
  } else {
    const weeks = eachWeekOfInterval({ start, end }).slice(0, 4)
    return weeks.map((weekStart, index) => {
      const weekEnd = index < 3 ? addDays(weekStart, 6) : end
      const weekData = { name: `Week ${index + 1}` }
      
      allSubjects.forEach((subject) => {
        weekData[subject] = 0
      })
      
      eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach(day => {
        const dayKey = format(day, 'ddMMMyy').toLowerCase()
        const dayData = dvArr.value[dayKey] || {}
        
        allSubjects.forEach((subject) => {
          weekData[subject] += dayData[subject] || 0
        })
      })
      
      allSubjects.forEach((subject) => {
        weekData[subject] = formatHours(weekData[subject])
      })
      
      return weekData
    })
  }
})

const formatTooltipValue = (value, category) => {
  const seconds = Math.round(value * 3600); // Convert hours back to seconds and round
  console.log(value, category);
  return formatDuration(seconds); // Remove the category prefix
}

const chartType = computed(() => {
  return selectedSubject.value === 'all' ? 'stacked' : 'grouped'
})

const updateData = (category, seconds) => {
  const today = format(new Date(), 'ddMMMyy').toLowerCase()
  if (dvArr.value[today]) {
    if (dvArr.value[today][category]) {
      dvArr.value[today][category] += seconds
    } else {
      dvArr.value[today][category] = seconds
    }
  } else {
    dvArr.value[today] = { [category]: seconds }
  }
}

const chartMargin = computed(() => {
  return { top: 20, right: 20, bottom: 20, left: 20 }
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
    <CardContent class="px-4 flex flex-col items-center">
      <div class="flex justify-center space-x-2 sm:space-x-4 mb-4 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger class="dropdown-trigger">
            {{ selectedSubject === 'all' ? 'All Subjects' : selectedSubject }}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="selectedSubject = 'all'">All Subjects</DropdownMenuItem>
            <DropdownMenuItem v-for="subject in subjects" :key="subject" @click="selectedSubject = subject">
              {{ subject }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger class="dropdown-trigger">
            {{ viewMode === 'weekly' ? 'Weekly' : 'Monthly' }}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="viewMode = 'weekly'">Weekly</DropdownMenuItem>
            <DropdownMenuItem @click="viewMode = 'monthly'">Monthly</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div class="w-full flex justify-center items-center" >
        <BarChart
        :data="formatData"
          :index="'name'"
          :categories="selectedSubject === 'all' ? subjects : [selectedSubject]"
          :value-formatter="formatTooltipValue"
          :colors="selectedSubject === 'all' ? colors : [colors[subjects.indexOf(selectedSubject) % colors.length]]"
          :show-tooltip="true"
          :type="chartType"
          :show-x-axis="false"
          :show-y-axis="false"
          :show-legend="true"
          :selected-subject="selectedSubject"
          :margin="chartMargin"
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
    gap: 1.5rem;
    padding: 0.75rem;
  }
}

@media (min-width: 640px) {
  .header-container {
    gap: 1rem;
    padding: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .header-container {
    gap: 2rem;
    padding: 1rem;
  }

  .dropdown-trigger {
    font-size: 1rem;
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