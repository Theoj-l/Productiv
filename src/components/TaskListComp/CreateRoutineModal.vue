<!-- tag adding error fixed, red delete button, updated @ 4.55pm -->

<template>
  <Dialog :open="isOpen" @update:open="closeDialog">

    <DialogContent class="w-[90vw] grid-rows-[auto_minmax(0,1fr)_auto] p-2 gap-1 max-h-[90dvh]" v-if="routine">

      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-2xl font-[500]">{{ isEditing ? 'Edit Routine' : 'Create Routine' }}</DialogTitle>
      </DialogHeader>

    <div class="grid gap-0 py-4 overflow-y-auto px-6"> 
      <Input v-model="routine.routine_name" class="mb-3 w-full border p-2 rounded" placeholder="Routine Name" />

      <div class="mr-0" align="end">
        <Button variant="ghost" class="add-button" @click="openTaskDialog">+ Add Task</Button>
      </div>

      <!-- Display the added routine tasks -->
      <div class="h-60">
        <ScrollArea class="scroll-area">
          <div class="mx-[0.7rem]">
          <RoutineTaskItem
            v-for="(task, index) in routineTasks"
            :key="index"
            :task="task"
            :task_index="index"
            @edit-task="editTask"
            @delete-task="confirmDelete"
          />
        </div>
        </ScrollArea>
      </div>
    </div>

    <DialogFooter class="p-4 pt-3">
        <Button variant="secondary" @click="closeDialog">Cancel</Button>
        <Button @click="saveRoutine"> 
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Adding/Editing Task -->
  <Dialog v-if="isAddTaskOpen" v-model:open="isAddTaskOpen">
    <DialogContent class="w-[90vw] max-w-[420px] grid-rows-[auto_minmax(0,1fr)_auto] p-2 gap-1 max-h-[90dvh]">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-lg font-semibold">
          {{ isEditing ? 'Edit Task in Routine' : 'Add Task to Routine' }}
        </DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4 overflow-y-auto px-6"> 

      <div class="my-2 flex flex-col gap-2">
          <Label class="labels">Task name</Label>
        <Input v-model="newTaskName" placeholder="Task Name (max 50 chars)" maxlength="50" />
      </div>

      <div class="my-2 flex flex-col gap-2">
        <Label class="labels">Task Notes</Label>
        <Textarea v-model="newTaskNotes" placeholder="Task Notes (max 200 chars)" maxlength="200" rows="3" />
      </div>

      <!-- Tag input -->
      <div class="tag-selector my-2 flex flex-col gap-2" ref="tagSelectorRef">
          <Label class="labels">Select Tag</Label>

          <!-- Display selected tag with a remove option -->
          <div class="selected-tag" v-if="selectedTag">
            <span class="tag">{{ selectedTag }}</span>
            <button class="ml-1" @click="clearSelectedTag">×</button>
          </div>

          <!-- Input field for adding/searching tags -->
          <Input v-if="!selectedTag" type="text" placeholder="Search or Press 'Enter' Key to Add New Tag"
            class="tagInput w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            v-model="tagInput" @input="filterTags" @keyup.enter="addOrSelectTag" @focus="dropdownVisible = true" />

          <!-- Dropdown for tags -->
          <ul v-if="dropdownVisible"
            class="tag-dropdown absolute z-10 bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto w-full shadow-lg">
            <!-- Filtered tags -->
            <li v-for="tag in filteredTags" :key="tag" @click="selectTag(tag)"
              class="tag-option flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100">
              <span class="tag">{{ tag }}</span>
              <button @click.stop="confirmTagDelete(tag)"
                class="delete-tag-button">×</button>
            </li>

            <!-- All tags when input is empty -->
            <li v-if="filteredTags.length === 0 && tagInput === ''" v-for="tag in allTags" :key="tag"
              @click="selectTag(tag)"
              class="tag-option flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100">
              <span class="tag">{{ tag }}</span>
              <button @click.stop="confirmTagDelete(tag)"
                class="delete-tag-button">×</button>
            </li>
          </ul>
        </div>

       <div class="my-2 flex flex-col gap-2">
        <Label class="labels">Estimated Pomodoros</Label>
        <NumberField v-model="newTaskPomo" :min="1" placeholder="Estimated Pomodoros">
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        </div>

        <div class="my-2 flex flex-row gap-2">
          <Label class="labels flex items-center w-[90%]">Priority</Label>
          <select v-model="newTaskPriority" class="border border-gray-300 rounded p-2">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>

      </div>

      <DialogFooter class="p-4 pt-3">
        <Button variant="secondary" @click="clearTaskForm; isAddTaskOpen = false">
          Cancel
        </Button>
        <Button variant="default" @click="addOrUpdateRoutineTask">
          {{ isEditing ? 'Update Task' : 'Add Task' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>


  <!-- Alert Dialog for delete from routine -->
  <AlertDialog :open="showAlertDialog" @onOpenChange="(open) => showAlertDialog = open">
    <AlertDialogContent class="bg-white p-4 rounded-lg shadow-lg w-96">
      <AlertDialogHeader>
        <h2 class="text-lg font-semibold">Confirm Deletion</h2>
      </AlertDialogHeader>
      <div class="mt-2">
        <p>Are you sure you want to delete this task?</p>
      </div>
      <AlertDialogFooter>
        <Button variant="ghost" @click="cancelDelete">Cancel</Button>
        <Button variant="default" @click="deleteTask">Delete</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

<!-- Alert Dialog for Confirming Task Deletion -->
<AlertDialog :open="tagAlertDialogOpen">
      <AlertDialogContent class="bg-white p-4 rounded-lg shadow-lg w-96">
        <AlertDialogHeader>
          <h2 class="text-lg font-semibold">Confirm Tag Deletion</h2>
        </AlertDialogHeader>
        <div class="mt-2">
          <p>Are you sure you want to delete the tag "{{ tagToDelete }}"?</p>
        </div>
        <AlertDialogFooter>
          <Button variant="ghost" @click="cancelTagDelete">Cancel</Button>
          <Button variant="default" @click="removeTag" style="background-color: red">Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { NumberField,NumberFieldInput, NumberFieldDecrement, NumberFieldContent, NumberFieldIncrement } from '@/components/ui/number-field';
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import RoutineTaskItem from '@/components/TaskListComp/RoutineTaskItem.vue';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/main'; // Firestore instance
import { useUserStore } from '@/stores/UserObjStore'; // Import store
import { getAuth, onAuthStateChanged } from "firebase/auth";

function getUserId() {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        reject('No authenticated user found.');
      }
    });
  });
}

const userStore = useUserStore();

const props = defineProps({
  isOpen: Boolean,
  routine: {
    type: Object,
    default: () => ({
      routine_id: '', // New addition: Track routine_id
      routine_name: '',
      routine_tasks: [],
    }),
  },
});

const emit = defineEmits(['update:isOpen', 'save-routine']);


const routineName = ref('');
const routineTasks = ref([]);
const isAddTaskOpen = ref(false);
const isEditing = ref(false);
const showAlertDialog = ref(false);
const taskToDeleteIndex = ref(null); // Track task index for deletion
const currentTaskIndex = ref(null); // Track task index for editing

// Task form fields
const newTaskName = ref('');
const newTaskPomo = ref(null);
const newTaskNotes = ref('');
const newTaskPriority = ref('medium');
const selectedTag = ref(null);

// Tag filtering
const tagArray = ref([]);
const tagInput = ref('');
const filteredTags = ref([]);
const tagAlertDialogOpen = ref(false);  // Track alert dialog visibility
const tagToDelete = ref('');  // Store the tag to delete
const allTags = ref([]);
const dropdownVisible = ref(false);
const tagSelectorRef = ref(null);


// const userId = "WPumFo4jf1fWnD63nAc54FeLDCi1"

// Firestore reference (replace with dynamic user ID)
// const userRef = doc(db, 'users', userId);

// Fetch user tags when the component mounts
onMounted(async () => {

  //Listen for click outside of dropdown
  document.addEventListener('click', handleClickOutside);

  const userId = await getUserId(); // Retrieve the user ID dynamically
    const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    tagArray.value = userDoc.data().tag_array || []; // Ensure your Firestore field name matches
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Populate the modal with the routine data when the component receives new props
// Watch for changes in props to populate form fields
watch(
  () => props.routine,
  (newRoutine) => {
    if (newRoutine) {
      routineName.value = newRoutine.routine_name || '';
      routineTasks.value = newRoutine.routine_tasks || [];
      isEditing.value = !!newRoutine.routine_id; // Use routine_id to detect edit mode
    }
  },
  { immediate: true }
);

const handleClickOutside = (event) => {
  // Tag selector in Add/Edit Dialog
  if (dropdownVisible.value && tagSelectorRef.value && !tagSelectorRef.value.contains(event.target)) {
    dropdownVisible.value = false;
  }
};


//--------Add/Edit/Delete Task-------------------------------------------

// Clear form
const clearTaskForm = () => {
  newTaskName.value = '';
  newTaskPomo.value = 1;
  newTaskNotes.value = '';
  newTaskPriority.value = 'medium';
  selectedTag.value = null;
  tagInput.value = '';
};

// Add or update a routine task
const addOrUpdateRoutineTask = () => {
  // Validate task fields
  if (!newTaskName.value) {
    alert("Task name cannot be empty");
    return false;
  }
  if (!selectedTag.value) {
    alert('Please select a tag before adding the task.');
    return;
  }
  if (!newTaskPomo.value) {
    alert('Please have a minimum of 1 pomodoro for the task.');
    return;
  }
  
  const taskData = {
    task_name: newTaskName.value,
    estimated_pomodoros: newTaskPomo.value,
    task_notes: newTaskNotes.value,
    task_priority: newTaskPriority.value,
    task_tag: selectedTag.value,
  };

  if (currentTaskIndex.value !== null) {
    // Update the existing task in place
    routineTasks.value[currentTaskIndex.value] = taskData;
    currentTaskIndex.value = null;  // Reset after updating
  } else {
    // Add a new task if not in edit mode
    routineTasks.value.push(taskData);
  }

  // Clear the form and reset states after adding/updating
  clearTaskForm();
  isAddTaskOpen.value = false;  // Close the dialog
  openDialog();  // Reopen the main modal if needed
};


// For task edit dialog
const editTask = (index) => {
  const task = routineTasks.value[index];

  // Populate the form with the task data for editing
  newTaskName.value = task.task_name;
  newTaskPomo.value = task.estimated_pomodoros;
  newTaskNotes.value = task.task_notes;
  newTaskPriority.value = task.task_priority;
  selectedTag.value = task.task_tag;

  // Set the editing state and store the index of the task
  isEditing.value = true;
  currentTaskIndex.value = index; // Store the index of the task to update
  isAddTaskOpen.value = true;     // Open the dialog in edit mode
};


// -----------------tags----------------------------------------------------------------
//Get all tags first
allTags.value = userStore.tag_array;

// Method to clear selected tag
const clearSelectedTag = () => {
  selectedTag.value = null;
};

// Method to filter existing tags as the user types
const filterTags = () => {
  filteredTags.value = tagArray.value.filter(tag =>
    tag.toLowerCase().includes(tagInput.value.toLowerCase())
  );
};

// Method to select
const selectTag = (tag) => {
  selectedTag.value = tag;
  tagInput.value = ''; // Clear input field
  filteredTags.value = []; // Clear dropdown
  dropdownVisible.value = false;
};

const addOrSelectTag = async () => {
  const trimmedTag = tagInput.value.trim();

  if (trimmedTag) {
    try {
      if (!userStore.tag_array.includes(trimmedTag) && userStore.tag_array.length < 10) {
        // Update local storage state's + firebase's tag_array
        userStore.addTag(trimmedTag)
        // Get all updated tags
        allTags.value = userStore.tag_array;
      } else if (userStore.tag_array.includes(trimmedTag)) {
        clearSelectedTag();
        alert('You already have an existing tag with the same name');
        return;
      } else if (userStore.tag_array.length >= 10) {
        clearSelectedTag();
        alert('You can only have 10 tags, delete to make space for more');
        return;
      }
      selectTag(trimmedTag); // Set the selected tag
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  }
};

// Method to confirm tag deletion (opens the Alert Dialog)
const confirmTagDelete = (tag) => {
  tagToDelete.value = tag;
  isAddTaskOpen.value = false;
  closeDialog();
  tagAlertDialogOpen.value = true;
};

const removeTag = async() => {
  try {
    // Remove tag from the user store and Firestore
    userStore.deleteTag(tagToDelete);

    tagAlertDialogOpen.value = false;  // Close the alert dialog
    tagToDelete.value = '';  // Clear the tag to delete
    console.log(`Tag "${tagToDelete.value}" deleted successfully`);
  } catch (error) {
    console.error('Error deleting tag:', error);
  }

  tagInput.value = "";
  dropdownVisible.value = false;
  allTags.value = userStore.tag_array;
  filteredTags.value = [];
  tagAlertDialogOpen.value = false;
  isAddTaskOpen.value = true;
};

const cancelTagDelete = () =>{
  tagAlertDialogOpen.value = false;
  dropdownVisible.value = false;
  tagInput.value = "";
  filteredTags.value = []; // Clear dropdown
  isAddTaskOpen.value = true;
}

// -------------------------------------------------------------------------

// Open Add task 
const openTaskDialog = () => {
  isEditing.value = false;  // Ensure it's in add mode
  clearTaskForm();
  isAddTaskOpen.value = true;
};

const deleteTask = () => {
  if (taskToDeleteIndex.value !== null) {
    routineTasks.value.splice(taskToDeleteIndex.value, 1); // Remove task by index
    taskToDeleteIndex.value = null; // Reset after deletion
    showAlertDialog.value = false; // Close the dialog
    openDialog();
  }
};

// Open delete confirmation dialog
const confirmDelete = (index) => {
  taskToDeleteIndex.value = index; // Store the index for deletion
  closeDialog();
  showAlertDialog.value = true;
};

// Cancel Delete
const cancelDelete = () => {
  openDialog();
  showAlertDialog.value = false;
}


// -----------------------------------------------------------------------------------

const closeDialog = () => {
  console.log('Closing CreateRoutineModal');  // Debugging log
  emit('update:isOpen', false);
};

const openDialog = () => {
  emit('update:isOpen', true);
}


const saveRoutine = () => {
  emit('save-routine', {
    routine_id: props.routine.routine_id || null, // Pass routine_id during save
    routine_name: props.routine.routine_name, // routineName.value does not work for some reason
    routine_tasks: routineTasks.value,
  });
  closeDialog();
};



</script>

<style scoped>
.labels {
  /* width: 50%; */
  padding: 3px;
  font-size: 18px;
  font-weight: 400;
}

.title {
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 8px;
}

.scroll-area {
  height: 100%;
  /* h-full */
}

.tag-selector {
  position: relative;
}

.tagInput {
  padding-left: 12px;
}

.tag-dropdown {
  position: absolute; /* Updated from relative */
  top: 100%; /* Position directly below the input */
  left: 0;
  width: 100%; /* Match width of input */
  z-index: 1000; /* Ensure it appears above other elements */
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Optional shadow for better visibility */
}


.tag-option {
  padding: 8px;
  cursor: pointer;
}

.tag-option:hover {
  background-color: #f0f0f0;
  /* Highlight option on hover */
}

.tag {
  display: inline-block;
  /* background-color: rgb(204, 208, 212); */
  background-color: black;
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

.delete-tag-button {
  color: #b91c1c;
}

.delete-tag-button:hover {
  color: #ef4444;
}
</style>
