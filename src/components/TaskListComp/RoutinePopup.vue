<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="w-[90vw] max-w-[420px] grid-rows-[auto_minmax(0,1fr)_auto] p-2 gap-1 max-h-[90dvh]">
      <DialogHeader class="p-6 pb-0 title">
        <div class="flex items-center">
        <DialogTitle class="text-2xl font-[500]">Your Routines</DialogTitle>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" class="hover-button text-slate-500 text-xs font-sans">
                    <slot name="button-text">?</slot> <!-- Button text passed from parent -->
                </Button>
                </HoverCardTrigger>
              <HoverCardContent class="w-60">
                <h4 class="text-md font-semibold mb-2">
                  Routine Imports
                </h4>
                <div>
                  <p>Routines are templates that you can save for repeated use, like a template</p>
                </div>
              </HoverCardContent>
            </HoverCard>
        </div>
      </DialogHeader>

    <div class="grid gap-0 py-2 overflow-y-auto px-4"> 

        <div class="mr-0" align="end">
          <Button variant="ghost" @click="openCreateRoutineModal">+ Create Routine</Button>
          <CreateRoutineModal :isOpen="isCreateRoutineModalOpen" :routine="selectedRoutine"
            @update:isOpen="isCreateRoutineModalOpen = $event" @save-routine="handleSaveRoutine" />
        </div>

        <ScrollArea class="scroll-area">
          <div class="routines-card">
          <ul v-if="routines.length > 0" class="routine-list">
            <li v-for="routine in routines" :key="routine.routine_id"
              class="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded">
              <span @click="applyRoutine(routine)" class="flex-1">{{ routine.routine_name }}</span>

              <div class="flex space-x-2">
                <button @click="openEditRoutineModal(routine)" class="button-icon">
                  <PencilIcon class="icon pencil" />
                </button>
                <button @click="confirmDelete(routine.routine_id)" class="button-icon">
                  <TrashIcon class="icon trash" />
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="text-gray-500">No Routines</p>
        </div>
        </ScrollArea>

    </div>

    <DialogFooter class="p-4 pt-3">
      <Button variant="secondary" @click="handleClose">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog :open="showAlertDialog" @onOpenChange="(open) => showAlertDialog = open">
    <AlertDialogContent class="bg-white p-4 rounded-lg shadow-lg w-96">
      <AlertDialogHeader>
        <h2 class="text-lg font-semibold">Confirm Deletion</h2>
      </AlertDialogHeader>
      <div class="mt-2">
        <p>Are you sure you want to delete this routine?</p>
      </div>
      <AlertDialogFooter>
        <Button variant="ghost" @click="showAlertDialog = false">Cancel</Button>
        <Button variant="default" @click="deleteRoutine" style="background-color: red">Delete</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/solid';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import CreateRoutineModal from '@/components/TaskListComp/CreateRoutineModal.vue';

import { doc, updateDoc, getDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '@/main'; // Firestore instance
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { useUserStore } from '@/stores/UserObjStore.js';
const userStore = useUserStore();

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

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['update:isOpen', 'routine-applied']);

const showAlertDialog = ref(false);
const routines = ref([]);
const isCreateRoutineModalOpen = ref(false);  // Control modal visibility
const selectedRoutine = ref(null); // Track the routine being edited
const routineToDelete = ref(null); // Track the routine to delete

// const userId = 'WPumFo4jf1fWnD63nAc54FeLDCi1'; // Dynamic in real scenario
// const userRef = doc(db, 'users', userId);

// Fetch routines from Firestore
const fetchRoutines = async () => {
  const userId = await getUserId(); // Retrieve the user ID dynamically
    const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.exists()) {
    routines.value = userSnapshot.data().task_routine_array || [];
  }
};

// Apply the selected routine
const applyRoutine = (routine) => {
  if (!routine.routine_tasks || routine.routine_tasks.length === 0) {
    alert("This routine has no tasks.");
    return;
  }

  console.log(routine.routine_tasks);
  handleClose();
  // Emit the tasks from the selected routine
  // Emit both routine name and routine tasks to TaskList.vue
  emit('routine-applied', {
    routine_name: routine.routine_name,
    routine_tasks: routine.routine_tasks
  });
};


// Open modal to create a new routine
const openCreateRoutineModal = () => {
  selectedRoutine.value = { routine_name: '', routine_tasks: [], routine_id: '' };
  isCreateRoutineModalOpen.value = true;
};

// Open modal to edit an existing routine
const openEditRoutineModal = (routine) => {
  selectedRoutine.value = { ...routine };
  isCreateRoutineModalOpen.value = true;
};

// Save routine (create or update)
const handleSaveRoutine = async (routine) => {
  try {
    const userId = await getUserId(); // Retrieve the user ID dynamically
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);
    let task_routine_array = userSnapshot.exists() ? userSnapshot.data().task_routine_array || [] : [];

    const existingIndex = task_routine_array.findIndex(r => r.routine_id === routine.routine_id);

    if (existingIndex !== -1) {
      task_routine_array[existingIndex] = routine;
    } else {
      routine.routine_id = getDate() // Create unique ID
      task_routine_array.push(routine);
    }

    await updateDoc(userRef, { task_routine_array });

    // Update the task_routine_array in the user store directly
    userStore.task_routine_array = task_routine_array;

    await fetchRoutines();
    isCreateRoutineModalOpen.value = false;
  } catch (error) {
    console.error('Error saving routine:', error);
  }
};

// Date for id
// Format date
const getDate = () => {
  const date = new Date(); // Create a new Date object
  date.setHours(date.getHours() + 8); // Adjust to Singapore time UTC+8
  const isoString = date.toISOString(); // Get the ISO string
  console.log(isoString);
  return isoString.replace('Z', ''); // Remove 'Z' to indicate local time
};

// Delete routine
const deleteRoutine = async () => {
  try {
    const userId = await getUserId(); // Retrieve the user ID dynamically
    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      const updatedArray = userSnapshot.data().task_routine_array.filter(r => r.routine_id !== routineToDelete.value);
      await updateDoc(userRef, { task_routine_array: updatedArray });
      
      // Update the task_routine_array in the user store directly
      userStore.task_routine_array = updatedArray;

      await fetchRoutines();
      showAlertDialog.value = false;
    }
  } catch (error) {
    console.error('Error deleting routine:', error);
  }
};

// Confirm deletion
const confirmDelete = (routineId) => {
  routineToDelete.value = routineId;
  showAlertDialog.value = true;
};

// Emit update:isOpen to tell the parent to close the dialog
const handleClose = () => {
  console.log('Closing Routine Popup');
  emit('update:isOpen', false);  // Notify parent to update the isOpen prop
};


onMounted(fetchRoutines);

// onBeforeUnmount(() => window.removeEventListener('keydown', handleClose));

</script>

<style scoped>
.title {
  font-weight: bold;
  font-size: 20px;
  display: flex;
  position: relative;
  padding-bottom: 2px;
}

.icon {
  width: 24px;
  height: 24px;
}

.button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
}

.hover-button {
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

.pencil:hover {
  color: blue;
}

.trash:hover {
  color: red;
}

.hover-info-icon {
  cursor: pointer;
  transition: color 0.3s ease;
  
  /* The circle around it */
  box-shadow: none;
  margin: 0px 0px 0px 8px;
  padding: 10px 5px 9px 5px;
  height: 20px;
  width: 20px;
  border: solid 2px;
  border-radius: 50%;
}

.icon {
    width: 20px;
    height: 20px;
  }

.hover-info-icon:hover {
  color: #3182ce;
  /* Blue on hover */
}

/* Hover Card Content not used check with others */
.hover-card-content {
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* .hover-content {
  margin-bottom: 10px;
} */

.hover-container {
  display: inline;
  position: absolute;
  left: 190px;
  bottom: 5px;
}
</style>
