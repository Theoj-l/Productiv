<!-- FINAL Task item completed, updated @ 4.04am -->
<script setup>
import { defineProps, defineEmits, computed, watch } from 'vue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/solid';


const props = defineProps({
    task: Object,
    completed: Boolean,
    isSelected: Boolean, // Add this prop to indicate selection state
    routine_used: String, //Add this prop to display routine
});

const emit = defineEmits(['toggle-completed', 'edit', 'delete', 'toggle-select']);

const toggleComplete = (event) => {
    const isChecked = event.target.checked;
    emit('toggle-completed', { task: props.task, isChecked });
};

const handleDelete = () => {
    emit('delete', props.task.task_id);
};

const toggleCollapsible = () => {
    props.task.isExpanded = !props.task.isExpanded;
};

// Check if the notes contain bullet points
const hasBullets = computed(() => {
  return /(^|\n)(-|\*)\s/.test(props.task.task_notes);
});

// Check if the notes span multiple lines (for bullets)
const hasMultipleLines = computed(() => {
  return props.task.task_notes.split('\n').length > 1;
});

// Decide if the notes should be collapsed (bullets with multiple lines or non-bullet text over 55 characters)
const shouldCollapse = computed(() => {
  return (hasBullets.value && hasMultipleLines.value) || (!hasBullets.value && props.task.task_notes.length > 55);
});

// Generate a preview text for collapsed notes
const previewText = computed(() => {
  if (hasBullets.value) {
    // Show only the first line for bullet notes
    const lines = props.task.task_notes.split('\n');
    return lines[0] + '...';
  } else {
    // Show the first 55 characters for non-bullet notes
    return props.task.task_notes.slice(0, 55) + '...';
  }
});

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
  return formatDate(new Date(props.task.updated_at));
});

const formattedDateIncomplete = computed(() => {
  return formatDate(new Date(props.task.created_at));
});


const handleSelect = () => {
    if (!props.task.completed) {
        emit('toggle-select', props.task.task_id);
    }
};

const priorityClass = computed(() => {
    switch (props.task.task_priority) {
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

const secondsToHoursAndMinutes = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
};

// current progress in hours and mins
const currentProgress = computed(() => {
    console.log(props.task);
    if (!props.task.time_spent_seconds) return '0h0min';
    const { hours, minutes } = secondsToHoursAndMinutes(props.task.time_spent_seconds);
    return `${hours}h${minutes}min`;
});

// Estimated pomo in hours and mins
const estimatedPomodoros = computed(() => {
    if (!props.task.estimated_pomodoros) return '0h0min';
    const estimatedTime = props.task.estimated_pomodoros * 30 * 60; // assuming each pomodoro is 30 minutes
    const { hours, minutes } = secondsToHoursAndMinutes(estimatedTime);
    return `${hours}h${minutes}min`;
});

// Watch for updates in time_spent_seconds if needed
watch(
    () => props.task.time_spent_seconds,
    (newValue) => {
        console.log("Updated time_spent_seconds:", newValue);
    }
);

</script>

<template>
    <div class="task-card" :class="[{ 'selected': isSelected, 'completed': task.completed }]" @click="handleSelect">
        <div class="task-header">
            <div class="task-checkbox">
                <input class="hidden" type="checkbox" :id="'check-round' + task.task_id" :checked="task.completed"
                    @change="toggleComplete" />
                <label class="checkbox-label" :for="'check-round' + task.task_id">
                    <span class="checkbox-inner"></span>
                </label>
                <span class="task-name font-normal" :class="{ 'line-through': completed }">
                    {{ task.task_name }}
                </span>
            </div>
            <div class="date-button-container">
                <div class="date">
                    {{ formattedDateComplete }}
                </div>

                <div class="action-buttons">
                    <button @click="handleDelete" class="button-icon">
                        <TrashIcon class="icon trash" />
                    </button>
                </div>

            </div>

        </div>
        <!-- Task Notes -->
        <div class="task-notes" :class="{ expanded: task.isExpanded || (hasBullets && hasMultipleLines) }">
            <span class="notes-content">
                <template v-if="shouldCollapse">
                <!-- Show full content if expanded; otherwise, show only the first line or first 55 characters for non-bullet notes -->
                <span v-if="task.isExpanded">{{ task.task_notes }}</span>
                <span v-else>{{ previewText }}</span>
                <!-- Toggle only if collapse is required -->
                <span class="toggle" v-if="shouldCollapse" @click.stop="toggleCollapsible">
                    {{ task.isExpanded ? ' ▲ ' : ' ▼ ' }}
                </span>
                </template>
                <template v-else>
                {{ task.task_notes }}
                </template>
            </span>
            </div>

        <!-- Bottom half -->
        <div class="bottom-container">
            <div class="task-tag">
                <p v-if="task.task_tag" class="tag">{{ task.task_tag }}</p>
                <p :class="['priority-box', priorityClass]">{{ task.task_priority }}</p>
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
                            <p class="hover-content">{{ routine_used }}</p>
                            <Label class="text-sm font-medium">Current Time Spent</Label>
                            <p class="hover-content">{{ currentProgress }} / {{ estimatedPomodoros }}</p>
                            <Label class="text-sm font-medium">Date Created</Label>
                            <p class="hover-content">{{ formattedDateIncomplete }}</p>
                            <Label class="text-sm font-medium">Date Completed</Label>
                            <p class="hover-content">{{ formattedDateComplete }}</p>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            </div>
        </div>
    </div>

</template>



<style scoped>
.task-card {
margin: 1rem;
  /* border: 1px solid #e2e8f0; */  
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #ffffff;
  width: 100%;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Push items to opposite ends */
  padding: 0 0 0.5rem 0;
  border-bottom: solid 1px slategray;
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
  padding: 0 0.5rem 0 0.25rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-name {
    font-size: 1.1rem;
    word-wrap: break-word; /* Ensure text wraps properly */
    white-space: pre-wrap; /* Prevent breaking at arbitrary points */
    overflow: hidden; /* Hide overflow */
    flex-grow: 1; /* Allow it to grow and take available space */
    width: 100%;
    color: black;
}


.pomodoros-count {
    font-size: large;
}

.task-notes {
    width: 100%;
    font-size: 0.95rem;
    transition: max-height 0.3s;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin-top: 10px;
}

.task-notes.expanded {
    max-height: 100%;
    max-width: 100%;
}

.notes-content {
    display: block;
    color: black;
    /* width: 100%; */
}

/* Styling for bullet points and paragraph elements */
.notes-content li {
    list-style: disc;
    margin-left: 1.5rem;
    padding-bottom: 0.3rem;
}

.notes-content p {
    margin: 0.5rem 0;
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
    background-color: rgb(204, 208, 212);
    color: black;
    border-radius: 4px;
    padding: 4px 8px;
    margin: 4px 0;
    font-size: 0.875rem;
}

.icon {
    width: 20px;
    height: 20px;
  }

.action-buttons {
  display: flex;
  gap: 0.7rem;
  padding: 0 0.3rem;
}

.trash:hover {
    color: red;
}

.date-button-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto; /* Push the date and buttons to the right end */
}

.date {
    text-align: end;
    font-size: 0.875rem;
    white-space: normal;
    align-self: end;
}

input[type="checkbox"]:checked+label span:first-of-type {
    background-color: black;
    border-color: black;
    color: #fff;
    background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='14px' height='10px' viewBox='0 0 14 10' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3C!-- Generator: Sketch 59.1 (86144) - https://sketch.com --%3E%3Ctitle%3Echeck%3C/title%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='ios_modification' transform='translate(-27.000000, -191.000000)' fill='%23FFFFFF' fill-rule='nonzero'%3E%3Cg id='Group-Copy' transform='translate(0.000000, 164.000000)'%3E%3Cg id='ic-check-18px' transform='translate(25.000000, 23.000000)'%3E%3Cpolygon id='check' points='6.61 11.89 3.5 8.78 2.44 9.84 6.61 14 15.56 5.05 14.5 4'%3E%3C/polygon%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    background-size: 14px 10px;
}

input[type="checkbox"]:checked+label span:nth-of-type(2) {
    text-decoration: line-through;
    color: rgba(0, 0, 0, 0.6);
}

.checkbox-inner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
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
    cursor: pointer;
    transition: color 0.3s ease;
    /* font-size: 1.2rem; */
    /* margin-left: 0.5rem; */

    /* The circle around it */
    box-shadow: none;
    margin: 0px 0px 0px 8px;
    padding: 0;
    height: 20px;
    width: 20px;
    border: solid;
    border-radius: 50%;
}

.hover-info-icon:hover {
    background-color: rgb(211, 211, 211);
}

/* Hover Card Content not used check with others */
.hover-card-content {
    padding: 0px;
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

.task-progress {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
}

.bottom-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
}

@media (max-width: 768px) {
    .task-name {
        max-width: min(40dvw, 400px);
    }
    .task-notes,
    .task-notes.expanded {
      max-width: 70dvw;
  }
  .task-name {
        max-width: min(40dvw, 400px);
    }
    .task-notes,
    .task-notes.expanded {
      max-width: 300px;
    }
}
/* 
@media (min-width: 1000px) {
    .task-notes,
    .task-notes.expanded {
      max-width: 50dvw;
  }
} */
</style>