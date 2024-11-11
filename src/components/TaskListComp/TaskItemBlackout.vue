<!-- edited notes for bulleted points, updated @ 5pm -->
<script setup>
import { defineProps, defineEmits, ref, watch, computed } from 'vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

const props = defineProps({
    botask: Object,
});

const boIsChecked = ref(false);
const isHidden = ref(true);
const emit = defineEmits(['openBoCheckedDialog']);

// Emit event to complete the task
function boHandleCheck() {
    //   boIsChecked.value = event.target.checked;
    console.log(`Blackout item checked to open dialog for confirmation`);

    emit('openBoCheckedDialog');
};

// Toggle collapsible notes
const toggleCollapsible = () => {
    props.botask.isExpanded = !props.botask.isExpanded;
};

// Check if the notes contain bullet points
const hasBullets = computed(() => {
  return /(^|\n)(-|\*)\s/.test(props.botask.task_notes);
});

// Check if the notes span multiple lines (for bullets)
const hasMultipleLines = computed(() => {
  return props.botask.task_notes.split('\n').length > 1;
});

// Decide if the notes should be collapsed (bullets with multiple lines or non-bullet text over 55 characters)
const shouldCollapse = computed(() => {
  return (hasBullets.value && hasMultipleLines.value) || (!hasBullets.value && props.botask.task_notes.length > 55);
});

// Generate a preview text for collapsed notes
const previewText = computed(() => {
  if (hasBullets.value) {
    // Show only the first line for bullet notes
    const lines = props.botask.task_notes.split('\n');
    return lines[0] + '...';
  } else {
    // Show the first 55 characters for non-bullet notes
    return props.botask.task_notes.slice(0, 55) + '...';
  }
});

// Function to toggle hidden visibility
const toggleHidden = () => {
    isHidden.value = !isHidden.value;
};

const formatDate = (d) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const date = d; // Create a new Date object
    let day = date.getDate().toString().padStart(2, '0'); // Ensure day is two digits
    let month = months[date.getMonth()];
    let year = date.getFullYear().toString().slice(2); // Get last two digits of the year
    let hour = String(date.getHours()).padStart(2, '0');
    let minute = String(date.getMinutes()).padStart(2, '0');
    if(minute.toString().length == 1){
        minute = "0" + minute;
    }
    let todayString = day + " " + month + " " + year + ", " + hour + ":" + minute;
    
    console.log(hour, minute);
    console.log(`${hour}:${minute}`); // e.g: 15:38

    console.log(todayString);
    return todayString;
};

// Reactive computed properties for formatted dates so that it is reactive
const formattedDateComplete = computed(() => {
  return formatDate(new Date(props.botask.updated_at));
});

const formattedDateIncomplete = computed(() => {
  return formatDate(new Date(props.botask.created_at));
});


const priorityClass = computed(() => {
    switch (props.botask.task_priority) {
        case 'high':
            return 'high-priority';
        case 'medium':
            return 'medium-priority';
        case 'low':
            return 'low-priority';
        default:
            return '';
    }
});
</script>

<template>
    <div class="outer-bo-task-container">
    <div :class="['task-card', isHidden ? 'bg-black text-white' : 'bg-white text-black card-expanded']">
        <div class="task-header">
            <div class="task-checkbox">
                <!-- Binding the checked state manually instead of using v-model due to bug-->
                <input class="hidden" type="checkbox" :id="'check-round-bo' + botask.task_id" :checked="boIsChecked"
                    @change="boHandleCheck" />
                <label class="checkbox-label" :for="'check-round-bo' + botask.task_id">
                    <span :class="`checkbox-inner, ${isHidden ? 'hidden-circle' : 'shown-circle'}`"></span>
                </label>
            </div>

            <span class="task-name"
                :class="{ 'line-through': completed, 'text-black': !isHidden, 'text-white': isHidden }">{{
                    botask.task_name }}</span>

            <div class="is-hidden">
                <span>
                    <!-- Heroicons for Eye / Eye-Off based on isHidden state -->
                    <EyeSlashIcon v-if="isHidden" @click="toggleHidden" class="h-5 w-5 text-gray-500 cursor-pointer" />
                    <EyeIcon v-if="!isHidden" @click="toggleHidden" class="h-5 w-5 text-gray-500 cursor-pointer" />
                </span>
            </div>
        </div>

        <div v-if="!isHidden">
<!-- Task Notes -->
<ScrollArea class="scroll-area">
                <div v-if="!isHidden" class="task-notes" :class="{ expanded: botask.isExpanded || (hasBullets && hasMultipleLines) }">
                <span class="notes-content">
                    <template v-if="shouldCollapse">
                    <!-- Show full content if expanded; otherwise, show only the first line or first 55 characters for non-bullet notes -->
                    <span v-if="botask.isExpanded">{{ botask.task_notes }}</span>
                    <span v-else>{{ previewText }}</span>
                    <!-- Toggle only if collapse is required -->
                    <span class="toggle" v-if="shouldCollapse" @click.stop="toggleCollapsible">
                        {{ botask.isExpanded ? ' ▲ ' : ' ▼ ' }}
                    </span>
                    </template>
                    <template v-else>
                    {{ botask.task_notes }}
                    </template>
                </span>
                </div>
            </ScrollArea>

            <!-- Bottom half -->
            <div class="bottom-container" v-if="!isHidden">
                <div class="task-tag">
                    <p v-if="botask.task_tag" class="tag">{{ botask.task_tag }}</p>

                    <!-- Priority Box -->
                    <p :class="['priority-box', priorityClass]">{{ botask.task_priority }}</p>
                </div>
                <div class="hover-container">
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Button variant="outline" class="hover-info-icon text-slate-500 text-xs font-sans">
                                <slot>i</slot> <!-- Button text passed from parent -->
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent class="w-50">
                            <div>
                                <Label class="text-sm font-medium">Imported Routine</Label>
                                <p class="hover-content">{{ botask.routine_used }}</p>
                                <Label class="text-sm font-medium">Date Created</Label>
                                <p class="hover-content">{{ formattedDateIncomplete }}</p>
                                <Label class="text-sm font-medium">Date Modified</Label>
                                <p class="hover-content">{{ formattedDateComplete }}</p>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </div>
        </div>
    </div>
    </div>
</template>

<style scoped>
.outer-bo-task-container {
    display: flex;
    height: 225px;
    /* border: white solid 1px; */
    align-items: center;
}

.task-card {
    /* margin: 1rem; */
    /* border: 1px solid #e2e8f0; */
    border-radius: 0.375rem;
    padding: 1rem;
    transition: background-color 0.5s, color 0.5s;
    width: 60%;
    position: relative;
    margin-left: auto;
    margin-right: auto;
}

.card-expanded {
    height: 220px;
}

.task-header {
    display: flex;
    align-items: center;
    /* justify-content: space-between;*/
    padding: 0 0 10px 0;
    border-bottom: solid 1px black;
    gap: 0.5rem;
}

.task-checkbox {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    height: 2.5rem;
    padding: 0 0 0 0.25rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.task-name {
    font-size: 1.1rem;
    word-wrap: break-word;
    white-space: pre-wrap;
    overflow: hidden;
    flex-grow: 1;
    width: 100%;
}

.is-hidden {
    margin-left: auto;
    white-space: nowrap;
    cursor: pointer;
    /* background-color: white; */
}

.action-buttons {
    display: flex;
    /* align-items: center; */
    gap: 0.7rem;
    padding: 0 0.3rem;
}

.pomodoros-count {
    font-size: large;
}

.task-progress {
    margin-left: auto;
    white-space: nowrap;
}

.task-notes {
    font-size: 1rem;
    transition: max-height 0.3s;
    padding: 0px 10px;
    /* overflow: hidden; */
    word-wrap: break-word;
    white-space: pre-wrap;
    margin-top: 10px;
}

.task-notes.expanded {
    max-height: 45px;
}

.scroll-area {
    /* border: 1px solid black; */
    margin-top: 10px;
    height: 80px;
    width: 100%;
    padding: 0px;
}

.notes-content {
    display: block;
    color: black;
    /* width: 100%; */
}

.toggle {
    color: slategray;
    cursor: pointer;
}

.task-tag {
    display: flex;
    justify-content: start;
}

.tag {
    display: inline-block;
    /* background-color: rgb(204, 208, 212); */
    background-color: rgb(0, 0, 0);
    /* color: black; */
    color: white;
    /* Dark text color */
    border-radius: 4px;
    padding: 4px 8px;
    /* Padding for the tags */
    margin: 4px 0;
    /* Margin for spacing between tags */
    font-size: 0.875rem;
    /* Font size for the tags */
}

.icon {
    /* right: 10px;
    top: 7px; */
    width: 23px;
    height: 23px;
}

.date {
    font-size: 0.875rem;
    /* color: gray; */
}

/*Checkbox design below */

/* input[type="checkbox"]:checked+label span:first-of-type {
    background-color: black;
    border-color: #000;
    color: #fff;
    background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='14px' height='10px' viewBox='0 0 14 10' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3C!-- Generator: Sketch 59.1 (86144) - https://sketch.com --%3E%3Ctitle%3Echeck%3C/title%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='ios_modification' transform='translate(-27.000000, -191.000000)' fill='%23FFFFFF' fill-rule='nonzero'%3E%3Cg id='Group-Copy' transform='translate(0.000000, 164.000000)'%3E%3Cg id='ic-check-18px' transform='translate(25.000000, 23.000000)'%3E%3Cpolygon id='check' points='6.61 11.89 3.5 8.78 2.44 9.84 6.61 14 15.56 5.05 14.5 4'%3E%3C/polygon%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    background-size: 14px 10px;
} */

/* input[type="checkbox"]:checked+label span:nth-of-type(2) {
    text-decoration: line-through;
    color: rgba(0, 0, 0, 0.6);
} */

.checkbox-inner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: transparent no-repeat center;
}

.shown-circle {    
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: transparent no-repeat center;
}

.hidden-circle {    
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid white;
    background: transparent no-repeat center;
}

.high-priority {
    background-color: rgba(233, 14, 14, 0.831);
    color: white;
}

.medium-priority {
    background-color: rgb(220, 220, 220);
}

.low-priority {
    background-color: rgb(60, 183, 60);
    color: white;
}

.priority-box {
    display: inline-block;

    /* Dark text color */
    border-radius: 4px;
    padding: 4px 8px;
    /* Padding for the tags */
    margin: 4px;
    /* Margin for spacing between tags */
    font-size: 0.875rem;
    /* Font size for the tags */
}

/* Hover Info Icon */
.hover-info-icon {
    display:flex;
    cursor: pointer;
    transition: color 0.3s ease;
    /* The circle around it */
    box-shadow: none;
    margin: 10px 8px 0px 8px;
    /* padding-bottom: 10px; */
    height: 20px;
    width: 20px;
    border: solid;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
}

.hover-info-icon:hover {
    background-color: rgb(211, 211, 211);
}

/* Hover Card Content not used check with others */
.hover-card-content {
    padding: 1rem;
    background-color: #f7fafc;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.hover-content {
    margin-bottom: 10px;
    font-size: smaller;
    color: rgb(92, 92, 92)
}

.hover-container {
    display: flex;
    justify-content: end;
}

.bottom-container {
    /* Keep this container at the bottom */
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 10px 10px 15px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    /* Maintain alignment */
}

@media (max-width: 450px) {
    .task-name,
    .task-notes, 
    .task-notes.expanded {
    font-size: 0.8rem;
    }
}

@media (max-width: 600px) {
    .task-card {
    border-radius: 0.375rem;
    padding: 1rem;
    transition: background-color 0.5s, color 0.5s;
    width: 70%;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    }
}
</style>