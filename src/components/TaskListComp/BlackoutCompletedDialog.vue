<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const emit = defineEmits(['toggle-completed']);
const showAlertDialog = ref(false);

// Emit event to complete the task
const toggleComplete = (event) => {
  const isChecked = event.target.checked;
  console.log(`Checkbox changed to: ${isChecked}`);
  
  // Use props.task to access the task
  emit('toggle-completed', { task: props.task, isChecked });
};

//change to completeTask
const deleteTask = async () => {
  const taskToDelete = tasks.value.find(task => task.task_id === selectedTaskId.value);

  // Remove task from the local state
  tasks.value = tasks.value.filter(task => task.task_id !== selectedTaskId.value);

  // (5) ANOTHER FB call - No need to call, can just update state
  // Remove task from Firestore
  await updateDoc(userRef, { tasks: arrayRemove(taskToDelete) });
  showAlertDialog.value = false;
};

</script>

<template>
    <div class="task-complete-popup">
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
                <Button variant="default" @click="deleteTask">Delete</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
    </div>
</template>

<style scoped>
.task-card {
    margin-bottom: 1rem;
    /* mb-4 */
    border: 1px solid #e2e8f0;
    /* border */
    border-radius: 0.375rem;
    /* rounded-md */
    padding: 1rem;
    /* p-4 */
    background-color: #ffffff;
    /* bg-white */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    /* shadow */
    width: 365px;
    height: auto;
    /* Fixed width for task cards */
    margin-right: auto;
    margin-left: auto;
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* items-center */
    /* padding-top: 1rem; */
    /* padding-bottom: 1.5rem; */
    border-bottom: solid;
}

.task-checkbox {
    display: flex;
    align-items: center;
    /* items-center */
}

.checkbox-label {
    display: flex;
    align-items: center;
    height: 2.5rem;
    /* h-10 */
    padding: 0 0.5rem;
    /* px-2 */
    border-radius: 0.375rem;
    /* rounded */
    cursor: pointer;
    transition: background-color 0.2s;
}

.task-name {
    margin-left: 0.5rem;
    /* mx-4 */
    width: 160px;
    word-wrap: break-word;
    white-space: pre-wrap;
    word-break: break-word;
    text-align: left;
}

.action-buttons {
    display: flex;
    align-items: center;
    /* items-center */
    gap: 0.5rem;
    /* space-x-2 */
}

.pomodoros-count {
    font-size: 0.875rem;
    /* text-sm */
}

.task-notes {
    margin-top: 1rem;
    /* mt-4 */
    overflow: hidden;
    transition: max-height 0.3s;
    /* transition-all duration-300 */
    width: 100%;
    font-size: 0.875rem;
    /* text-sm */

}

.task-notes.expanded {
    max-height: 24rem;
    /* max-h-96 */
}

.notes-content {
    color: black;
    /* text-black */
    word-break: break-word;
    /* break-words */
    width: 100%;
}

.toggle {
    color: #4299e1;
    /* text-blue-500 */
    cursor: pointer;
}

.task-tag{
    display: flex;
    justify-content: center;
}

.tag {
  display: inline-block;
  background-color: #e0e7ff; /* Light blue background */
  color: #1e3a8a; /* Dark text color */
  border-radius: 4px;
  padding: 4px 8px; /* Padding for the tags */
  margin: 4px 0; /* Margin for spacing between tags */
  font-size: 0.875rem; /* Font size for the tags */

}

.button-icon {
    position: relative;
    width: 20px;
    height: 35px;
}

.icon {
    position: absolute;
    left: 10px;
    top: 7px;
    width: 20px;
    height: 20px;
}

.trash:hover {
    color: red;
}

.pencil:hover {
    color: darkblue
}

/*Checkbox design below */

input[type="checkbox"]:checked+label span:first-of-type {
    background-color: #10b981;
    border-color: #000;
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
</style>