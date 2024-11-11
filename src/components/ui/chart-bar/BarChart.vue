<script setup>
import {
  ChartCrosshair,
  ChartLegend,
  defaultColors,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Axis, GroupedBar, StackedBar } from '@unovis/ts';
import {
  VisAxis,
  VisGroupedBar,
  VisStackedBar,
  VisXYContainer,
} from '@unovis/vue';
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
    default: () => ({ top: 20, bottom: 40, left: 60, right: 20 }),
  },
  filterOpacity: { type: Number, required: false, default: 0.2 },
  xFormatter: { type: Function, required: false },
  yFormatter: { type: Function, required: false },
  valueFormatter: { type: Function, required: false },
  showXAxis: { type: Boolean, required: false, default: true },
  showYAxis: { type: Boolean, required: false, default: true },
  showTooltip: { type: Boolean, required: false, default: true },
  showLegend: { type: Boolean, required: false, default: true },
  showGridLine: { type: Boolean, required: false, default: true },
  customTooltip: { type: null, required: false },
  type: { type: String, required: false, default: 'grouped' },
  roundedCorners: { type: Number, required: false, default: 0 },
  yDomain: { type: Array, required: false },
  viewMode: { type: String, required: false, default: 'weekly' },
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

const VisBarComponent = computed(() =>
  props.type === 'grouped' ? VisGroupedBar : VisStackedBar,
);
const selectorsBar = computed(() =>
  props.type === 'grouped'
    ? GroupedBar.selectors.bar
    : StackedBar.selectors.bar,
);

const xAxisLabel = computed(() => {
  return props.viewMode === 'weekly' ? 'Days of the Week' : 'Weeks of the Month';
});

const xAxisTickValues = computed(() => {
  return props.data.map((_, i) => i);
});
</script>

<template>
  <div
    :class="cn('w-full flex flex-col items-center', $attrs.class ?? '')"
  >
    <ChartLegend
      v-if="showLegend"
      v-model:items="legendItems"
      @legend-item-click="handleLegendItemClick"
      class="mb-4 w-full"
    />

    <div class="w-full h-[400px] flex justify-center">
      <VisXYContainer
        :data="data"
        :style="{ height: '100%', width: '100%' }"
        :margin="margin"
        :y-domain="yDomain"
      >
        <ChartCrosshair
          v-if="showTooltip"
          :colors="colors"
          :items="legendItems"
          :custom-tooltip="customTooltip"
          :index="index"
          :value-formatter="valueFormatter"
        />

        <VisBarComponent
          :x="(d, i) => i"
          :y="categories.map((category) => (d) => Number(d[category]))"
          :color="colors"
          :rounded-corners="roundedCorners"
          :bar-padding="0.05"
          :attributes="{
            [selectorsBar]: {
              opacity: (d, i) => {
                const pos = i % categories.length;
                return legendItems[pos]?.inactive ? filterOpacity : 1;
              },
            },
          }"
        />

        <VisAxis
          v-if="showXAxis"
          type="x"
          :tick-format="xFormatter"
          :grid-line="false"
          :tick-line="true"
          :ticks="xAxisTickValues"
          tick-text-color="hsl(var(--vis-text-color))"
          :attributes="{
            [Axis.selectors.axis]: {
              class: 'text-muted',
            },
          }"
          :label="xAxisLabel"
          :label-margin="20"
        />
        
        <VisAxis
          v-if="showYAxis"
          type="y"
          :tick-line="true"
          :tick-format="yFormatter"
          :domain-line="false"
          :grid-line="showGridLine"
          :attributes="{
            [Axis.selectors.grid]: {
              class: 'text-muted',
            },
            [Axis.selectors.axis]: {
              class: 'text-muted',
            },
          }"
          tick-text-color="hsl(var(--vis-text-color))"
        />

        <slot />
      </VisXYContainer>
    </div>
  </div>
</template>

<style scoped>
.w-full {
  max-width: 100%;
}
</style>