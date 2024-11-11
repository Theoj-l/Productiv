<!-- tag adding error fixed, dropdown date sort fixed, updated red button, updated @ 4.55pm -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { doc } from 'firebase/firestore';
import { db } from "@/main"; // Firestore instance import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectItem, SelectTrigger, SelectLabel, SelectContent, SelectGroup, SelectValue, } from "@/components/ui/select";
import { NumberField, NumberFieldInput, NumberFieldDecrement, NumberFieldContent, NumberFieldIncrement } from '@/components/ui/number-field';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FunnelIcon } from '@heroicons/vue/24/solid';
import { ArrowSmallUpIcon, ArrowSmallDownIcon, ChevronDownIcon } from '@heroicons/vue/24/solid';

import TaskItem from '@/components/TaskListComp/TaskItem.vue';
import TaskItemCompleted from '@/components/TaskListComp/TaskItemCompleted.vue';
import RoutinePopup from '@/components/TaskListComp/RoutinePopup.vue'; // Import the new RoutinePopup component
import { useUserStore } from '@/stores/UserObjStore'; // Import store

// User ID
const userId = "WPumFo4jf1fWnD63nAc54FeLDCi1"; // Make this dynamic in your actual implementation
const userStore = useUserStore();  // Initialize the store

// State variables
const isDialogOpen = ref(false);
const newTaskName = ref('');
const newTaskNotes = ref('');
const newTaskPomo = ref(1);
const newTaskPriority = ref('medium');
const selectedTaskId = ref(null);
const currentTaskId = ref(null);
const isEditing = ref(false);
const tagInput = ref('');
const filteredTags = ref([]);
const allTags = ref([]);
const selectedTag = ref(null);

// State to track selected sort options
const selectedDateSort = ref('dateAsc');     // 'dateAsc' or 'dateDesc'
const selectedPrioritySort = ref(null); // 'priorityHigh' or 'priorityLow'

// States to track Routine popups
const isRoutinePopupOpen = ref(false);
const isCreateRoutineModalOpen = ref(false);

const showAlertDialog = ref(false);
const tagSelectorRef = ref(null);
const showClearAll = ref(false);

const dropdownVisible = ref(false);  // Track visibility of the tag dropdown
const tagAlertDialogOpen = ref(false);  // Track alert dialog visibility
const tagToDelete = ref('');  // Store the tag to delete

// Track Sort dropdown visibility
const dropdownOpen = ref(false);
const dropdownSortRef = ref(null);

// Track filter dropdown visibilty
const dropdownFilterRef = ref(null);
const filterDropdownOpen = ref(false); // Track filter dropdown visibility
const selectedFilterTag = ref('all'); // Store selected tag filter
const selectedDateRange = ref('alltime'); // Selected date filter
const filteredTasks = ref([]); // Store tasks after applying filters

// Firestore reference to the user document
const userRef = doc(db, "users", userId);

// Fetch tasks on component mount NOT NEEDED ANYMORE
onMounted(async () => {

  // userStore.fetchUserData();
  //Listen for click outside of dropdown
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});



// Close dropdown if clicked outside

const handleClickOutside = (event) => {

  // Close sort dropdown
  if (dropdownOpen.value && dropdownSortRef.value && !dropdownSortRef.value.contains(event.target)) {
    dropdownOpen.value = false;
  }

  // Close filter dropdown
  if (filterDropdownOpen.value && dropdownFilterRef.value && !dropdownFilterRef.value.contains(event.target)) {
    filterDropdownOpen.value = false;
  }

  // Tag selector in Add/Edit Dialog
  if (dropdownVisible.value && tagSelectorRef.value && !tagSelectorRef.value.contains(event.target)) {
    dropdownVisible.value = false;
  }
};


// Clear task form fields
const clearTaskForm = () => {
  newTaskName.value = '';
  newTaskNotes.value = '';
  newTaskPomo.value = 1;
  newTaskPriority.value = 'medium';
  selectedTag.value = null;
  currentTaskId.value = null;
  isEditing.value = false;
};

// Toggle task selection
const toggleTaskSelection = (taskId) => {
  console.log("Toggle called with Task ID:", taskId); // Debugging

  selectedTaskId.value = selectedTaskId.value === taskId ? '' : taskId;
  console.log("Selected Task ID after toggle:", selectedTaskId.value); // Debugging

  userStore.selected_task_id = selectedTaskId.value || "";
  console.log("User Store Task ID:", userStore.selected_task_id); // Debugging
};

// Format date
const getDate = () => {
  const date = new Date(); // Create a new Date object
  date.setHours(date.getHours() + 8); // Adjust to Singapore time UTC+8
  const isoString = date.toISOString(); // Get the ISO string
  return isoString.replace('Z', ''); // Remove 'Z' to indicate local time
};

// Helper: Generate task ID based on naming convention
const generateTaskId = (taskName) => {

  let formattedDate = getDate();

  return `${taskName.replace(/\s+/g, '_')}_${formattedDate}`;
};

// Helper function to get the original task (used for preserving 'created_at')
const getExistingTask = (taskId) => {
  return userStore.tasks.find(task => task.task_id === taskId) || {};
};

const openAddTaskDialog = () => {
  clearTaskForm(); // Clear the form fields
  isEditing.value = false; // Reset editing state
  isDialogOpen.value = true; // Open the dialog
};

// -------------------------tags----------------------------------------------------------------

//Get all tags first
allTags.value = userStore.tag_array;

// Method to clear selected tag
const clearSelectedTag = () => {
  selectedTag.value = null;
};

// Method to filter existing tags as the user types
const filterTags = () => {
  //To display all tags when input =""

  filteredTags.value = userStore.tag_array.filter(tag =>
    tag.toLowerCase().includes(tagInput.value.toLowerCase())
  );
};

// Method to select or add a tag
const selectTag = (tag) => {
  selectedTag.value = tag;
  tagInput.value = ''; // Clear input field
  filteredTags.value = []; // Clear dropdown
  dropdownVisible.value = false; // Hide dropdown
};

// Method to add or select a tag on enter key press
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
  isDialogOpen.value = false;
  tagAlertDialogOpen.value = true;
};

const removeTag = async () => {
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
  isDialogOpen.value = true;
};

const cancelTagDelete = () => {
  tagAlertDialogOpen.value = false;
  dropdownVisible.value = false;
  tagInput.value = "";
  filteredTags.value = []; // Clear dropdown
  isDialogOpen.value = true;
}
// ------------------------Filter------------------------------------------------
// Toggle filter dropdown visibility
const toggleFilterDropdown = () => {
  filterDropdownOpen.value = !filterDropdownOpen.value;
};

// Apply simultaneous tag and date filtering
const applyFilters = () => {
  const now = new Date();
  const tasks = userStore.tasks;

  // Set date range boundaries
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of month

  // Apply tag and date range filters together
  filteredTasks.value = tasks.filter(task => {
    const taskDate = new Date(task.created_at);

    // Tag filter logic
    const matchesTag =
      selectedFilterTag.value === 'all' || task.task_tag === selectedFilterTag.value;


    // Date range filter logic
    let matchesDate = true;
    if (selectedDateRange.value === 'thisWeek') {
      matchesDate = taskDate >= startOfWeek && taskDate <= now;
    } else if (selectedDateRange.value === 'thisMonth') {
      matchesDate = taskDate >= startOfMonth && taskDate <= endOfMonth;
    }

    // Return tasks that match both filters
    return matchesTag && matchesDate;
  });
};

// Watch for changes in tasks, tag, or date range filters
watch(
  () => ({
    tasks: userStore.tasks,
    filterTag: selectedFilterTag,
    dateRange: selectedDateRange,
  }),
  (newValues, oldValues) => {

    // Apply filters when any value changes
    applyFilters();
  },
  { immediate: true, deep: true }
);



// ---- CRUD Operations ------------------------------------------------
// Add or update task logic with user store integration
const addOrUpdateTask = async () => {

  if (!newTaskName.value) {
    alert("Task name cannot be empty");
    return;
  }

  if (!selectedTag.value) {
    alert('Please select a tag before adding the task.');
    return;
  }

  if (!newTaskPomo.value) {
    alert('Please have a minimum of 1 pomodoro for the task.');
    return;
  }

  const taskId = currentTaskId.value || generateTaskId(newTaskName.value);

  const taskData = {
    task_id: taskId,
    task_name: newTaskName.value,
    task_notes: newTaskNotes.value,
    estimated_pomodoros: newTaskPomo.value,
    task_tag: selectedTag.value,
    task_priority: newTaskPriority.value,
    // pomodoros_taken: 0, //This may not be needed anymore
    time_spent_seconds: isEditing.value ? getExistingTask(taskId).time_spent_seconds : 0,
    completed: false,
    created_at: isEditing.value ? getExistingTask(taskId).created_at : getDate(),
    updated_at: getDate(),
    routine_used: isEditing.value ? getExistingTask(taskId).routine_used : "-",
  };

  if (isEditing.value) {
    if (!taskId) {
      console.error('No task_id provided for the update.');
      return;
    }
    userStore.updateTask(taskData);
  } else {
    userStore.addTask(taskData);
  }

  clearTaskForm();
  isDialogOpen.value = false;
};

// Toggle task completion 
const toggleTaskCompletion = ({ task, isChecked }) => {
  try {
    // Update the tasks array by mapping over existing tasks
    const updatedTasks = userStore.tasks.map(t =>
      t.task_id === task.task_id
        ? { ...t, completed: isChecked, updated_at: getDate() } // Update the specific task
        : t
    );

    // Directly update the tasks in the user store 
    // userStore.tasks = updatedTasks; 

    userStore.completeTask(updatedTasks)

    // Optionally, you can also log the updated tasks for debugging
    console.log("Updated tasks:", updatedTasks);

  } catch (error) {
    console.error("Error updating task status:", error);
  }
};


// Delete a task
const deleteTask = () => {
  userStore.tasks = userStore.tasks.filter(t => t.task_id !== currentTaskId.value);

  userStore.removeTask(currentTaskId.value);
  showAlertDialog.value = false;
};

// Edit a task (populate form)
const editTask = (task) => {
  console.log('Editing Task:', task);  // Debug log

  currentTaskId.value = task.task_id;

  newTaskName.value = task.task_name;
  newTaskNotes.value = task.task_notes;
  newTaskPomo.value = task.estimated_pomodoros;
  selectedTag.value = task.task_tag;
  newTaskPriority.value = task.task_priority;
  dropdownVisible.value = false;
  isEditing.value = true;
  isDialogOpen.value = true;
};

// Confirm deletion
const confirmDelete = (taskId) => {
  currentTaskId.value = taskId;
  showAlertDialog.value = true;
};

const openClearAllTask = () => {
  showClearAll.value = true;
}

//Clear all task
// Function to clear all incomplete tasks
const confirmClearAll = () => {
  // Filter out only incompleted tasks and update the store
  let toDeleteAll = userStore.tasks.filter((task) => !task.completed);
  for (let task of toDeleteAll) {
    userStore.removeTask(task.task_id);
  }

  // Close the dialog after deletion
  showClearAll.value = false;

  console.log(toDeleteAll);
};

// Sort functions----------------------------------------------------------------------------------------

// ---- Sorting Logic ----
const priorityMap = { low: 1, medium: 2, high: 3 };

const toggleDateSort = () => {
  if (selectedDateSort.value === 'dateAsc') {
    selectedDateSort.value = 'dateDesc';
  } else {
    selectedDateSort.value = 'dateAsc';
  }
};

const togglePrioritySort = () => {
  if (selectedPrioritySort.value === 'priorityLow') {
    selectedPrioritySort.value = 'priorityHigh';
  } else if (selectedPrioritySort.value === 'priorityHigh') {
    selectedPrioritySort.value = null;
  } else {
    selectedPrioritySort.value = 'priorityLow';
  }
};

const sortedTasks = computed(() => {
  let tasks = filteredTasks.value.filter(task => !task.completed);
  return applySort(tasks);
});

const sortedCompletedTasks = computed(() => {
  let tasks = filteredTasks.value.filter(task => task.completed);
  return applySort(tasks);
});

// Helper function to sort tasks based on selected options
const applySort = (tasks) => {
  // Sort by date (created_at for incomplete, updated_at for completed)
  if (selectedDateSort.value) {
    tasks.sort((a, b) => {
      const isACompleted = a.completed === true;
      const isBCompleted = b.completed === true;

      const dateA = isACompleted ? new Date(a.updated_at) : new Date(a.created_at);
      const dateB = isBCompleted ? new Date(b.updated_at) : new Date(b.created_at);

      return selectedDateSort.value === 'dateAsc'
        ? dateA - dateB
        : dateB - dateA;
    });
  }

  // Priority sorting using the priority map
  if (selectedPrioritySort.value === 'priorityHigh') {
    tasks.sort((a, b) =>
      priorityMap[b.task_priority] - priorityMap[a.task_priority]
    );
  } else if (selectedPrioritySort.value === 'priorityLow') {
    tasks.sort((a, b) =>
      priorityMap[a.task_priority] - priorityMap[b.task_priority]
    );
  }

  return tasks;
};


// Toggle dropdown visibility
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

//-----------settings--------------------------------------------------------------------------------
// Method to open the routine popup


// Handle routine application
async function handleRoutineApplied({ routine_name, routine_tasks }) {
  console.log(routine_name + ": " + routine_tasks);
  for (const routineTask of routine_tasks) {
    const taskData = {
      task_id: generateTaskId(routineTask.task_name),
      task_name: routineTask.task_name,
      task_notes: routineTask.task_notes,
      estimated_pomodoros: routineTask.estimated_pomodoros,
      task_tag: routineTask.task_tag,
      task_priority: routineTask.task_priority,
      pomodoros_taken: 0,
      time_spent_seconds: 0,
      completed: false,
      created_at: getDate(),
      updated_at: getDate(),
      routine_used: routine_name,
    };
    userStore.addTask(taskData);
  }
}

// Function to handle opening the Create Routine Modal
const openCreateRoutineModal = () => {
  console.log('Handling Create Routine Modal opening');
  isCreateRoutineModalOpen.value = true; // Set to true to open the modal
};

</script>

<template>
    <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    </head>
  <Card class="task-list-card-container">
    <Tabs default-value="incomplete" class="h-full flex flex-col justify-center">
      <CardHeader class="card-header-container w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger class="tab-font" value="incomplete">Incomplete Tasks</TabsTrigger>
          <TabsTrigger class="tab-font" value="completed">Completed Tasks</TabsTrigger>
        </TabsList>
      </CardHeader>

      <TabsContent value="incomplete">
        <div class="header">
          <div class="button-group">

            <!-- Filter and Sort Dropdown Menu -->
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" class="filter-button">
                  <!-- <FunnelIcon class="h-5 w-5" /> -->
                  <i class="fa fa-filter" style="font-size: 19px;"></i>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" class="space-y-4 w-fit">
              <div class="grid gap-2 py-4 px-4"> 

                <Separator class="mb-3" label="Filter" />

                <!-- Filter by Tag -->
                <Label class="" for="select_tag">Filter by Tags</Label>
                <Select id="select_tag" v-model="selectedFilterTag">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Filter by Tags"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tags</SelectLabel>
                      <SelectItem value="all">All Tags</SelectItem>
                      <SelectItem v-for="tag in allTags" :key="tag" :value="tag">
                        {{ tag }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <!-- Filter by Date Range -->
                <Label class="mt-2" for="select_date">Filter by Date</Label>
                <Select id="select_date" v-model="selectedDateRange">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Filter by Time"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Date Range</SelectLabel>
                      <SelectItem value="alltime">All Time</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Separator class="my-3" label="Sort"/>

                <div class="sort-group">
                  <Label class="mb-1" for="sort_date">Sort by Date</Label>
                  <button @click="toggleDateSort" id="sort_date" class="flex items-center gap-1">
                    <div v-if="selectedDateSort === 'dateAsc'" class="flex flex-row items-center m-1">
                      <ArrowSmallUpIcon class="h-5"/>
                      <span class="sort-content">Earliest to Latest</span>
                    </div>

                    <div v-if="selectedDateSort === 'dateDesc'" class="flex flex-row items-center m-1">
                      <ArrowSmallDownIcon class="h-5"/>
                      <span class="sort-content">Latest to Earliest</span>
                    </div>
                  </button>
                </div>
                
                <div class="sort-group">
                  <Label class="my-1" for="sort_priority">Sort by Priority</Label>
                  <button @click="togglePrioritySort" id="sort_priority" class="flex items-center gap-1">
                    <div v-if="selectedPrioritySort === 'priorityLow'" class="flex flex-row items-center m-1">
                      <ArrowSmallUpIcon class="h-5"/>
                      <span class="sort-content">Low to High</span>
                    </div>

                    <div v-if="selectedPrioritySort === 'priorityHigh'" class="flex flex-row items-center m-1">
                      <ArrowSmallDownIcon class="h-5"/>
                      <span class="sort-content">High to Low</span>
                    </div>

                    <div v-if="!selectedPrioritySort" class="flex flex-row items-center m-1">
                      <span class="sort-content">- None -</span>
                    </div>
                  </button>
                </div>
              </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- Add Task Button -->
            <Button variant="ghost" class="add-button" @click="openAddTaskDialog">+</Button>
           
            <div class="task-settings">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" class="task-settings-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
                      class="icon-more">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                    </svg>
                    <span class="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem @click="isRoutinePopupOpen = true">Routine Tasks</DropdownMenuItem>
                  <DropdownMenuItem @click="openClearAllTask">Clear all tasks</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <!-- Task Cards -->
        <CardContent class="card-content-container">
          <div class="task-list">
            <ScrollArea class="scroll-area">
              <div v-if="sortedTasks.length === 0" class="no-tasks">
                No tasks available. Click "+ Add Task" to add a task.
              </div>
              <div class="task-container">
              <TaskItem class="task-item" v-for="task in sortedTasks" :key="task.task_id" :task="task"
                :is-selected="task.task_id === selectedTaskId" @toggle-select="toggleTaskSelection(task.task_id)"
                @toggle-completed="toggleTaskCompletion" @edit="editTask" @delete="confirmDelete"
                :routine_used="task.routine_used" />
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </TabsContent>

<!---------------------------------------------- Completed Tab --------------------------------------------------->
      <TabsContent value="completed">
        <div class="header">
          <div class="button-group">
            <!-- Filter and Sort Dropdown Menu -->
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" class="filter-button">
                  <!-- <FunnelIcon class="h-5 w-5" /> -->
                  <i class="fa fa-filter" style="font-size: 19px;"></i>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" class="space-y-4 w-fit">
              <div class="grid gap-2 py-4 px-4"> 

                <Separator class="mb-3" label="Filter" />

                <!-- Filter by Tag -->
                <Label class="" for="select_tag">Filter by Tags</Label>
                <Select id="select_tag" v-model="selectedFilterTag">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Filter by Tags"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tags</SelectLabel>
                      <SelectItem value="all">All Tags</SelectItem>
                      <SelectItem v-for="tag in allTags" :key="tag" :value="tag">
                        {{ tag }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <!-- Filter by Date Range -->
                <Label class="mt-2" for="select_date">Filter by Date</Label>
                <Select id="select_date" v-model="selectedDateRange">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Filter by Time"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Date Range</SelectLabel>
                      <SelectItem value="alltime">All Time</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Separator class="my-3" label="Sort"/>

                <div class="sort-group">
                  <Label class="mb-1" for="sort_date">Sort by Date</Label>
                  <button @click="toggleDateSort" id="sort_date" class="flex items-center gap-1">
                    <div v-if="selectedDateSort === 'dateAsc'" class="flex flex-row items-center m-1">
                      <ArrowSmallUpIcon class="h-5"/>
                      <span class="sort-content">Earliest to Latest</span>
                    </div>

                    <div v-if="selectedDateSort === 'dateDesc'" class="flex flex-row items-center m-1">
                      <ArrowSmallDownIcon class="h-5"/>
                      <span class="sort-content">Latest to Earliest</span>
                    </div>
                  </button>
                </div>
                
                <div class="sort-group">
                  <Label class="my-1" for="sort_priority">Sort by Priority</Label>
                  <button @click="togglePrioritySort" id="sort_priority" class="flex items-center gap-1">
                    <div v-if="selectedPrioritySort === 'priorityLow'" class="flex flex-row items-center m-1">
                      <ArrowSmallUpIcon class="h-5"/>
                      <span class="sort-content">Low to High</span>
                    </div>

                    <div v-if="selectedPrioritySort === 'priorityHigh'" class="flex flex-row items-center m-1">
                      <ArrowSmallDownIcon class="h-5"/>
                      <span class="sort-content">High to Low</span>
                    </div>

                    <div v-if="!selectedPrioritySort" class="flex flex-row items-center m-1">
                      <span class="sort-content">- None -</span>
                    </div>
                  </button>
                </div>
              </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" class="add-button" @click="openAddTaskDialog">+</Button>
            <!-- <Button variant="ghost" @click="isSettingOpen = true">⋮</Button> -->
            <div class="task-settings">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" class="task-settings-button" @click="handleClick">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
                      class="icon-more">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                    </svg>
                    <span class="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem @click="isRoutinePopupOpen = true">Routine Tasks</DropdownMenuItem>
                  <DropdownMenuItem @click="openClearAllTask">Clear all tasks</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <!--Task Cards -->
        <CardContent class="card-content-container">
          <div class="task-list">
            <ScrollArea class="scroll-area p-0">
              <div v-if="sortedCompletedTasks.length === 0" class="no-tasks">
                No completed tasks.
              </div>
              <div class="task-container">
                <TaskItemCompleted class="task-item" v-for="task in sortedCompletedTasks" :key="task.task_id" :task="task" :routine_used="task.routine_used"
                  @delete="confirmDelete" @toggle-completed="toggleTaskCompletion" completed />
              </div>
            </ScrollArea>
          </div>
        </CardContent>

      </TabsContent>
    </Tabs>
  </Card>

  <!-- Dialog for Adding/Editing Tasks -->
  <Dialog v-if="isDialogOpen" v-model:open="isDialogOpen">
    <DialogContent class="w-[90vw] max-w-[420px] grid-rows-[auto_minmax(0,1fr)_auto] p-2 gap-1 max-h-[90dvh]">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-2xl font-[500]">{{ isEditing ? 'Edit Task' : 'New Task' }}</DialogTitle>
      </DialogHeader>

  <div class="grid gap-2 py-4 overflow-y-auto px-6">     

      <!-- Task name input -->
      <div class="my-2 flex flex-col gap-2">
        <Label class="labels">Task name</Label>
        <Input v-model="newTaskName" placeholder="Task Name (max 50 chars)" maxlength="50" />
      </div>

      <!-- Task notes input -->
      <div class="my-2 flex flex-col gap-2">
        <Label class="labels">Task Notes</Label>
        <Textarea v-model="newTaskNotes" placeholder="Task Notes (max 200 chars)" maxlength="200" rows="3" />
      </div>

      <!-- Tag input -->
      <div class="tag-selector my-2 flex flex-col gap-2" ref="tagSelectorRef">
          <Label class="labels">Tags</Label>

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
            <button @click.stop="confirmTagDelete(tag)" class="delete-tag-button">×</button>
          </li>

          <!-- All tags when input is empty -->
          <li v-if="filteredTags.length === 0 && tagInput === ''" v-for="tag in allTags" :key="tag"
            @click="selectTag(tag)"
            class="tag-option flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100">
            <span class="tag">{{ tag }}</span>
            <button @click.stop="confirmTagDelete(tag)" class="delete-tag-button">×</button>
          </li>
        </ul>
      </div>

      <!-- Estimated Pomodoros Input  -->
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

      <!-- Priority Level Input -->
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
        <Button variant="secondary" @click="clearTaskForm(); isDialogOpen = false">Cancel</Button>
        <Button variant="default" @click="addOrUpdateTask">{{ isEditing ? 'Update' : 'Add Task' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Alert Dialog for Confirming Task Deletion -->
  <AlertDialog :open="showAlertDialog" @onOpenChange="(open) => showAlertDialog = open">
    <AlertDialogContent class="bg-white p-4 rounded-lg shadow-lg w-96">
      <AlertDialogHeader>
        <h2 class="text-lg font-semibold">Confirm Deletion</h2>
      </AlertDialogHeader>
      <div class="mt-2">
        <p>Are you sure you want to delete this task?</p>
      </div>
      <AlertDialogFooter>
        <Button variant="ghost" @click="showAlertDialog = false">Cancel</Button>
        <Button variant="default" @click="deleteTask" style="background-color: red">Delete</Button>
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

  <!-- Alert Dialog for Confirming Clear All Task -->
  <AlertDialog :open="showClearAll">
    <AlertDialogContent class="bg-white p-4 rounded-lg shadow-lg w-96">
      <AlertDialogHeader>
        <h2 class="text-lg font-semibold">Confirm Deletion</h2>
      </AlertDialogHeader>
      <div class="mt-2">
        <p>Are you sure you want to delete all incomplete tasks?</p>
      </div>
      <AlertDialogFooter>
        <Button variant="ghost" @click="showClearAll = false">Cancel</Button>
        <Button variant="default" @click="confirmClearAll" style="background-color: red">Clear</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>


  <!-- Routine Popup Dialog -->
  <RoutinePopup :isOpen="isRoutinePopupOpen" @update:isOpen="isRoutinePopupOpen = $event"
    @routine-applied="handleRoutineApplied" @open-create-routine-modal="openCreateRoutineModal" />

</template>

<style scoped>
.labels {
  /* width: 50%; */
  padding: 3px;
  font-size: 18px;
  font-weight: 400;
}

.task-list-card-container { 
  min-height: 100%; 
} 
 
.card-content-container { 
  height: 100%; 
  padding: 0px 9px 9px 9px;
}

.card-header-container {
  display: flex;
  flex-direction: column;
  padding: 8px 8px 0px 8px;
}

.tabs {
  display: flex;
}

.header {
  margin: 0p 20px;
  padding: 0px;
}

.button-group {
  display: flex;
  gap: 0.5rem;

  margin: 0px 15px;
  justify-content: end;
}

.button-group>Button,
.task-settings>Button,
.filter-dropdown>Button {
  height: 30px;
}

.filter-dropdown {
  justify-content: end;
}

.filter-button {
  padding: 0px;
  width: 30px;
  height: 30px;
}

.add-button {
  font-size: 27px;
  font-weight: lighter;
  width: 30px;
  height: 30px;
}

.task-settings-button {
  padding: 0px;
  /* margin-right: 7px; */

  height: 30px;
  width: 30px;

  z-index: 10;
  /* Ensure button is above other elements */
}

.task-list {
  height: calc(100dvh - 220px);
  width: 100%;
  overflow: hidden;

  /* background: white; */
  background: rgba(241,245,249,255);
  /* background: rgb(251, 251, 251); */
  border-radius: 6px;
  padding: 5px 0px 0px 0px;
}

.task-container{
  margin: 0 0.7rem;
}

.task-item {
  margin: 5px auto 10px auto;
}

.scroll-area {
  height: 100%;
}

.no-tasks {
  color: #a0aec0;
  text-align: center;
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

.delete-tag-button:hover {
  color: #ef4444;
}


@media (max-width: 800px) {
  .tab-font {
    font-size: medium;
  }
}

@media (max-width: 800px) {
  .task-list {
    height: calc(40dvh);
    overflow: hidden;
  }
}
</style>