<script setup>
// Timer Settings Hover Card Component
// Parent: timerSettingsCard.vue
// Children: NA

// IMPORTS ---------------------------
// PRIMARY COMPONENTS ---------------------------
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

// Component 1: HoverCardOne
// const remindersHoverCard = {
//   template: `
//     <HoverCard>
//       <HoverCardTrigger as-child>
//         <Button variant="outline" class="text-slate-500 text-sm">
//           ?
//         </Button>
//       </HoverCardTrigger>
//       <HoverCardContent class="w-60">
//         <div class="flex justify-between space-x-4">
//           <div class="space-y-1">
//             <h4 class="text-sm font-semibold">
//               Enable us to help you focus
//             </h4>
//             <p class="text-sm">
//               If you leave our page during a Pomodoro cycle, we will remind you to focus.
//             </p>
//           </div>
//         </div>
//       </HoverCardContent>
//     </HoverCard>
//   `
// }

// // Component 2: HoverCardTwo
// const messagesHoverCard = {
//   template: `
//     <HoverCard>
//       <HoverCardTrigger as-child>
//         <Button variant="outline" class="text-slate-500 text-sm">
//           !
//         </Button>
//       </HoverCardTrigger>
//       <HoverCardContent class="w-60">
//         <div class="flex justify-between space-x-4">
//           <div class="space-y-1">
//             <h4 class="text-sm font-semibold">
//               Enable messages to keep you motivated
//             </h4>
//             <p class="text-sm">
//               The selected messages will show on your Pomodoro at intervals of 10 minutes.
//             </p>
//           </div>
//         </div>
//       </HoverCardContent>
//     </HoverCard>
//   `
// }

// export { remindersHoverCard, messagesHoverCard }
</script>

<template>
    <HoverCard>
        <HoverCardTrigger as-child>
        <Button variant="outline" class="text-slate-500 text-xs font-sans">
            <slot name="button-text">?</slot> <!-- Button text passed from parent -->
        </Button>
        </HoverCardTrigger>
        <HoverCardContent class="w-60">
        <div class="flex justify-between space-x-4">
            <div class="space-y-1">
            <h4 class="text-md font-semibold">
                <slot name="title">Enable us to help you focus</slot> <!-- Title passed from parent -->
            </h4>
            <p class="text-sm">
                <slot name="content">If you leave our page during a Pomodoro cycle, we will remind you to focus.</slot> <!-- Content passed from parent -->
            </p>
            </div>
        </div>
        </HoverCardContent>
    </HoverCard>

    <!-- for viewing component -->
    <!-- </div> -->
</template>

<style scoped>
    Button {
        box-shadow: none;
        margin: 0px 0px 0px 8px;
        padding: 0;
        height: 20px;
        width: 20px;
        border: solid;
        border-radius: 50%;
    }

    .hover-info-icon:Button {
    background-color: rgb(211, 211, 211);
    }
</style>