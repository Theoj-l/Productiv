
git <script setup>
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserStore } from '@/stores/UserObjStore';

const props = defineProps({
  open: Boolean
});

const emit = defineEmits(['update:open']);

const userStore = useUserStore();
const newReminderMessage = ref('');
const reminderMessage = ref(userStore.reminder_message || 'work hard!');

// Initialize data and set up watchers
onMounted(async () => {
  if (!userStore.isDataFetched) {
    await userStore.fetchUserData('f9ohuT4WktOUh1TB490CrgYuDCa2');
  }
  reminderMessage.value = userStore.reminder_message;
  newReminderMessage.value = reminderMessage.value;
  console.log('Mounted reminder:', reminderMessage.value);
});

// Update the reminder message in Firestore
const updateReminder = async () => {
  try {
    if (newReminderMessage.value.trim()) {
      userStore.reminder_message = newReminderMessage.value;
      await userStore.updateAllStateToFirebase('f9ohuT4WktOUh1TB490CrgYuDCa2');
      reminderMessage.value = newReminderMessage.value;
      newReminderMessage.value = '';
      emit('update:open', false);
    }
  } catch (error) {
    console.error('Error updating reminder message:', error);
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-[90vw] max-w-lg mx-auto">
      <DialogHeader>
        <DialogTitle class="text-lg font-[500]">Edit reminder</DialogTitle>
        <DialogDescription>
          Make changes to your reminder message here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Input 
            v-model="newReminderMessage" 
            id="reminder" 
            class="col-span-4"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" @click="updateReminder">
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
