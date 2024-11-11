<template>
  <VisTooltip
    :horizontal-shift="20"
    :vertical-shift="20"
    :triggers="{
      [selector]: template,
    }"
  />
</template>

<script setup>
import { VisTooltip } from '@unovis/vue';
import { createApp } from 'vue';
import { ChartTooltip } from '.';

const props = defineProps({
  selector: { type: String, required: true },
  index: { type: String, required: true },
  valueFormatter: { type: Function, required: false, default: (tick) => `${tick}` },
  customTooltip: { type: null, required: false }
});

// Use WeakMap to store references to each data point for Tooltip
const wm = new WeakMap();

function template(d, i, elements) {
  const data = d.data || d; // Get the correct data object

  if (wm.has(data)) {
    return wm.get(data);
  } else {
    const componentDiv = document.createElement('div');
    const TooltipComponent = props.customTooltip ?? ChartTooltip;

    // Get subject and total
    const subject = data[props.index];
    const total = data.total;

    // Create tooltip data
    const tooltipData = [{
      name: subject,
      value: props.valueFormatter(total),
      color: elements[i].getAttribute('fill')
    }];

    // Set the tooltip title and data
    createApp(TooltipComponent, { 
      title: subject,
      data: tooltipData
    }).mount(componentDiv);
    
    wm.set(data, componentDiv.innerHTML);
    return componentDiv.innerHTML;
  }
}
</script>