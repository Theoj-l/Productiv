<template>
  <div class="task-card">
    <div class="task-header">

      <span class="task-name font-normal">{{ task.task_name }}</span>

      <div class="action-buttons">
        <span class="pomodoros-count">
          {{ task.estimated_pomodoros }} Pomo
        </span>
        <button @click.stop="handleEdit" class="button-icon">
          <PencilIcon class="icon pencil" />
        </button>
        <button @click.stop="handleDelete" class="button-icon">
          <TrashIcon class="icon trash" />
        </button>
      </div>
    </div>

     <!-- Task Notes -->
     <div class="task-notes" :class="{ expanded: task.isExpanded || hasBullets }">
      <span class="notes-content">
        <template v-if="shouldCollapse">
          <span v-if="task.isExpanded">{{ task.task_notes }}</span>
          <span v-else>{{ task.task_notes.slice(0, 55) + '...' }}</span>
          <span class="toggle" @click.stop="toggleCollapsible">
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

        <!-- Priority Box -->
        <p :class="['priority-box', priorityClass]">{{ task.task_priority }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/solid';
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  task: Object,
  task_index: Number, // Used to generate unique IDs for inputs
});

const emit = defineEmits(['edit-task', 'delete-task']);

const handleEdit = () => {
  emit('edit-task', props.task_index);
};

const handleDelete = () => {
  emit('delete-task', props.task_index);
};

const toggleCollapsible = () => {
  props.task.isExpanded = !props.task.isExpanded;
};

// Check if the notes contain bullet points
const hasBullets = computed(() => {
  return /(^|\n)(-|\*)\s/.test(props.task.task_notes);
});

// Decide if the notes should be collapsed
const shouldCollapse = computed(() => {
  return !hasBullets.value && props.task.task_notes.length > 55;
});

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

</script>

<style scoped>
.task-card {
  margin: 0.6rem auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #ffffff;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid slategray;
  gap: 1rem;
}

.task-name {
  font-size: 1.1rem;
  word-wrap: break-word; /* Ensure text wraps properly */
  white-space: pre-wrap; /* Prevent breaking at arbitrary points */
  overflow: hidden; /* Hide overflow */
  flex-grow: 1; /* Allow it to grow and take available space */
  max-width: 50%;
}


.action-buttons {
  display: flex;
  /* align-items: center; */
  gap: 0.7rem;
  padding: 0 0.3rem;
}

.pomodoros-count {
  font-size: medium;
}

.task-notes {
  width: 100%;
  font-size: 0.875rem;
  transition: max-height 0.3s;
  overflow: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.task-notes.expanded {
  max-height: 100%;
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
    width: 20px;
    height: 20px;
  }

.trash:hover {
  color: red;
}

.pencil:hover {
  color: blue;
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
.bottom-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
</style>