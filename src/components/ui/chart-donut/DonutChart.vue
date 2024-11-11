<script>
export const monthColors = [
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
</script>

<script setup>
import { ChartSingleTooltip, defaultColors } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Donut } from '@unovis/ts';
import { VisDonut, VisSingleContainer } from '@unovis/vue';
import { useMounted } from '@vueuse/core';
import { computed, ref } from 'vue';



const props = defineProps({
  data: { type: Array, required: true },
  index: { type: String, required: true },
  category: { type: String, required: true }, // This should be the key like 'day1', 'day2', etc.
  showTooltip: { type: Boolean, required: false, default: true },
  valueFormatter: { type: Function, required: false, default: (tick) => `${tick}` }
});

// Chart computed properties
const isMounted = useMounted();
const activeSegmentKey = ref();
const colors = computed(() => monthColors.slice(0, props.data.length));

const totalValue = computed(() => 
  props.data.reduce((prev, curr) => prev + curr[props.category], 0)
);

// Create tooltip content for each segment
const tooltipItems = computed(() => 
  props.data.map(item => ({
    name: item[props.index], // Subject name
    value: item[props.category], // Value for the selected category (e.g., day1, day2)
    color: colors.value[props.data.indexOf(item)] // Get corresponding color
  }))
);

</script>

<template>
  <div :class="cn('w-full h-48 flex flex-col items-end', $attrs.class ?? '')">
    <VisSingleContainer
      :style="{ height: isMounted ? '100%' : 'auto' }"
      :data="data"
    >
      <ChartSingleTooltip
        :selector="Donut.selectors.segment"
        :index="props.index"
        :items="tooltipItems" 
        :value-formatter="valueFormatter"
      />

      <VisDonut
        :value="(d) => d[props.category]" 
        :color="colors"
        :arc-width="20"
        :central-label="valueFormatter(totalValue)" 
      />

      <slot />
    </VisSingleContainer>
  </div>
</template>




