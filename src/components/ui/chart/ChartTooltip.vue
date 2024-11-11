<template>
  <Card class="text-sm max-w-full">
    <CardHeader v-if="title" class="p-3 border-b">
      <CardTitle>
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="p-3 min-w-[180px] max-w-full flex flex-col gap-1">
      <div v-for="item in data" :key="item.name" class="flex justify-between">
        <div class="flex items-center">
          <span class="w-2.5 h-2.5 mr-2 flex-shrink-0">
            <svg width="100%" height="100%" viewBox="0 0 30 30">
              <path
                d="M 15 15 m -14, 0 a 14,14 0 1,1 28,0 a 14,14 0 1,1 -28,0"
                :stroke="item.color || '#000'"
                :fill="item.color || '#000'"
                stroke-width="1"
              />
            </svg>
          </span>
          <span class="truncate">{{ item.name }}</span>
        </div>
        <span class="font-semibold ml-4 text-black">{{ item.value }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, required: true },
});
</script>

<style scoped>
.max-w-full {
  max-width: 100%;
}
</style>