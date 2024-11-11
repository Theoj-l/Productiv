<script setup>
import { buttonVariants } from '@/components/ui/button';
import { BulletLegend } from '@unovis/ts';
import { VisBulletLegend } from '@unovis/vue';
import { nextTick, onMounted, ref } from 'vue';

const props = defineProps({
  items: { type: Array, required: true, default: () => [] },
});

const emits = defineEmits(['legendItemClick', 'update:items']);

const elRef = ref();

onMounted(() => {
  const selector = `.${BulletLegend.selectors.item}`;
  nextTick(() => {
    const elements = elRef.value?.querySelectorAll(selector);
    const classes = buttonVariants({ variant: 'ghost', size: 'xs' }).split(' ');
    elements?.forEach((el) =>
      el.classList.add(...classes, '!inline-flex', '!mr-2', 'mb-2'),
    );
  });
});

function onLegendItemClick(d, i) {
  emits('legendItemClick', d, i);
  const isBulletActive = !props.items[i].inactive;
  const isFilterApplied = props.items.some((i) => i.inactive);
  if (isFilterApplied && isBulletActive) {
    // reset filter
    emits(
      'update:items',
      props.items.map((item) => ({ ...item, inactive: false })),
    );
  } else {
    // apply selection, set other item as inactive
    emits(
      'update:items',
      props.items.map((item) =>
        item.name === d.name
          ? { ...d, inactive: false }
          : { ...item, inactive: true },
      ),
    );
  }
}
</script>

<template>
  <div ref="elRef" class="w-full flex justify-center py-2">
    <VisBulletLegend 
      :items="items" 
      :on-legend-item-click="onLegendItemClick"
      class="inline-flex flex-wrap justify-center"
    />
  </div>
</template>

<style scoped>
.w-full {
  max-width: 100%;
}

@media (min-width: 640px) {
  .w-full {
    max-width: 90%;
  }
}

@media (min-width: 768px) {
  .w-full {
    max-width: 80%;
  }
}

@media (min-width: 1024px) {
  .w-full {
    max-width: 70%;
  }
}
</style>