<script setup>
import {
  ChartCrosshair,
  ChartLegend,
  defaultColors,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { CurveType } from '@unovis/ts';
import { Axis, Line } from '@unovis/ts';
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue';
import { useMounted } from '@vueuse/core';
import { computed, ref } from 'vue';

const props = defineProps({
  data: { type: Array, required: true },
  categories: { type: Array, required: true },
  index: { type: null, required: true },
  colors: { type: Array, required: false },
  margin: {
    type: Object,
    required: false,
    default: () => ({ top: 20, bottom: 20, left: 20, right: 20 }),
  },
  filterOpacity: { type: Number, required: false, default: 0.2 },
  xFormatter: { type: Function, required: false },
  yFormatter: { type: Function, required: false },
  showXAxis: { type: Boolean, required: false, default: false },
  showYAxis: { type: Boolean, required: false, default: false },
  showTooltip: { type: Boolean, required: false, default: true },
  showLegend: { type: Boolean, required: false, default: true },
  showGridLine: { type: Boolean, required: false, default: false },
  customTooltip: { type: null, required: false },
  curveType: { type: String, required: false, default: CurveType.MonotoneX },
  viewMode: { type: String, required: false, default: 'weekly' },
  valueFormatter: { type: Function, required: false },
});

const emits = defineEmits(['legendItemClick']);

const index = computed(() => props.index);
const colors = computed(() =>
  props.colors?.length ? props.colors : defaultColors(props.categories.length),
);

const legendItems = ref(
  props.categories.map((category, i) => ({
    name: category,
    color: colors.value[i],
    inactive: false,
  })),
);

const isMounted = useMounted();

function handleLegendItemClick(d, i) {
  emits('legendItemClick', d, i);
}

const xAxisLabels = computed(() => {
  if (props.viewMode === 'weekly') {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  } else {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  }
});

const getMaxYValue = computed(() => {
  return Math.max(...props.data.flatMap(d => props.categories.map(c => d[c])));
});

const yAxisLabels = computed(() => {
  const maxValue = getMaxYValue.value;
  const step = Math.ceil(maxValue / 5);
  return Array.from({ length: 6 }, (_, i) => i * step);
});

const xAxisFormatter = (v, i) => xAxisLabels.value[i];
const yAxisFormatter = (v) => `${v} hrs`;
</script>

<template>
  <div
    :class="cn('w-full h-[400px] flex flex-col items-center', $attrs.class ?? '')"
  >
    <ChartLegend
      v-if="showLegend"
      v-model:items="legendItems"
      @legend-item-click="handleLegendItemClick"
    />

    <VisXYContainer
      :margin="margin"
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto', width: '100%' }"
    >
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :index="index"
        :custom-tooltip="customTooltip"
        :value-formatter="yFormatter"
      />

      <template v-for="(category, i) in categories" :key="category">
        <VisLine
          :x="(d, i) => i"
          :y="(d) => d[category]"
          :curve-type="curveType"
          :color="colors[i]"
          :attributes="{
            [Line.selectors.line]: {
              opacity: legendItems.find((item) => item.name === category)
                ?.inactive
                ? filterOpacity
                : 1,
            },
          }"
        />
      </template>

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xAxisFormatter"
        :grid-line="false"
        :tick-line="false"
        :show-domain-line="false"
        tick-text-color="transparent"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yAxisFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            class: 'text-muted',
          },
        }"
        tick-text-color="transparent"
        :ticks="yAxisLabels"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>

<style scoped>
.w-full {
  max-width: 100%;
}
</style>