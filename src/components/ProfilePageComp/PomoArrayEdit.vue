<!-- Updated the text, font-size, spacing, padding from top @ 2.31pm -->
<template>
  <Dialog>
    <DialogContent class="w-[90vw] max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <DialogHeader>
      </DialogHeader>
      <Tabs default-value="account" class="w-auto">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="account">
            Pomodoro Messages
          </TabsTrigger>
          <TabsTrigger value="password">
            Mindful Messages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" class="pt-0">
          <Card>
            <CardHeader>
              <CardTitle class="flex justify-between items-center">
                <div class="text-lg font-[500]">Pomodoro Messages</div>
                <Button variant="ghost" @click="addPomoMessage" v-if="pomoArray.length < maxLength" class="add-button">+</Button>
              </CardTitle>
              <CardDescription class="card-description">
                These messages will be shown during your Pomodoro Session.
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
              </CardDescription>
            </CardHeader>
            <div class="ml-6 flex items-center space-x-4">
              <!-- Flex container with space between elements -->
              <p>{{ pomoArray.length }} / {{ maxLength }} Messages</p> <!-- Counter -->
              <p v-if="pomoArray.length <= minLength" class="text-red-500 text-sm">Minimum of {{ minLength }} messages.</p>
            </div>

            <ScrollArea class="h-[220px]">
              <CardContent class="space-y-2">
                <ul>
                  <li v-for="(message, index) in pomoArray" :key="index" class="relative my-2">
                    <div class="relative">
                      <Input 
                        v-model="pomoArray[index]" 
                        type="text" 
                        class="p-4 pr-10 w-full" 
                        placeholder="This is empty"
                        maxlength="200"
                      />
                      <TrashIcon
                        @click="removePomoMessage(index)" 
                        class="absolute right-3 top-3 cursor-pointer w-4 h-4 hover:text-red-500 transition-opacity duration-200"
                        :class="{
                          'opacity-0 pointer-events-none': pomoArray.length <= minLength
                        }" 
                      />
                      <div class="text-xs text-gray-500 mt-1">
                        {{ pomoArray[index].length }}/200 characters
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </ScrollArea>
            <CardFooter class="flex justify-between space-x-2 mt-6"> 
              <Button class="ml-auto" @click="updatePomoMessages">Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="password" class="pt-0">
          <Card>
            <CardHeader>
              <CardTitle class="flex justify-between items-center">
                <div class="text-lg font-[500]">Mindful Messages</div>
                <Button variant="ghost" @click="addMindMessage" v-if="mindArray.length < maxLength" class="add-button">+</Button>
              </CardTitle>
              <CardDescription class="card-description">
                These messages will be shown during your Meditation Session.
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
              </CardDescription>
            </CardHeader>
            <div class="ml-6 flex items-center space-x-4">
              <!-- Flex container with space between elements -->
              <p>{{ mindArray.length }} / {{ maxLength }} Messages</p> <!-- Counter -->
              <p v-if="mindArray.length <= minLength" class="text-red-500 text-sm">Minimum of {{ minLength }} messages.</p>
            </div>

            <ScrollArea class="h-[220px] border-slate-100">
              <CardContent class="space-y-2">
                <ul>
                  <li v-for="(message, index) in mindArray" :key="index" class="relative my-2">
                    <div class="relative">
                      <Input 
                        v-model="mindArray[index]" 
                        type="text" 
                        class="p-4 pr-10 w-full" 
                        placeholder="This is empty"
                        maxlength="200"
                      />
                      <TrashIcon
                        @click="removeMindMessage(index)" 
                        class="absolute right-3 top-3 cursor-pointer w-4 h-4 hover:text-red-500 transition-opacity duration-200"
                        :class="{
                          'opacity-0 pointer-events-none': mindArray.length <= minLength
                        }" 
                      />
                      <div class="text-xs text-gray-500 mt-1">
                        {{ mindArray[index].length }}/200 characters
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </ScrollArea>
            <CardFooter class="flex justify-between space-x-2 mt-6"> 
              <Button class="ml-auto" @click="updateMindMessages">Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/UserObjStore';  // Import your Pinia store
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/solid'; // Importing the remove icon
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/toast/use-toast'; // Import the toast

// Access Pinia store
const userStore = useUserStore();
const pomoArray = ref([...userStore.pomo_msg_array]); // Take `pomo_msg_array` from the store
const mindArray = ref([...userStore.mind_msg_array]); // Take `mind_msg_array` from the store
const isEditing = ref(false); // To control when the editing is active
const errorMessage = ref(''); // To show error messages
const maxLength = 10; // Maximum length for the array
const minLength = 4; // Minimum length for the array
const maxCharLength = 200;
const { toast } = useToast(); // Use the Shadcn toast

// Fetch the pomoMsgArray when the dialog is opened
const fetchAndEditPomoMessages = () => {
  if (userStore.pomo_msg_array && userStore.pomo_msg_array.length > 0) {
    pomoArray.value = [...userStore.pomo_msg_array]; // Store the array
    isEditing.value = true; // Enable editing mode
  } else {
    errorMessage.value = 'No data found or the array is empty.';
  }
};

const fetchAndEditMindMessages = () => {
  if (userStore.mind_msg_array && userStore.mind_msg_array.length > 0) {
    mindArray.value = [...userStore.mind_msg_array]; // Store the array
    isEditing.value = true; // Enable editing mode
  } else {
    errorMessage.value = 'No data found or the array is empty.';
  }
};

// Function to handle updating the array in Firestore via Pinia store action
const updatePomoMessages = async () => {
  try {
    if (pomoArray.value.some(msg => msg.length > maxCharLength)) {
      toast({
        title: 'Error',
        description: 'Messages cannot exceed 200 characters',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }
    userStore.pomo_msg_array = [...pomoArray.value]; // Update store state
    await userStore.updateAllStateToFirebase(userStore.userId); // Push updates to Firestore via store

    isEditing.value = false; // Exit editing mode

    // Show success toast for Pomodoro messages
    toast({
      title: 'Success',
      description: 'Pomodoro messages updated successfully!',
      variant: 'default',
      duration: 2000,
    });
  } catch (error) {
    errorMessage.value = 'Error updating the array. Please try again.';
    console.error(error);

    // Show error toast for failure
    toast({
      title: 'Error',
      description: 'Error updating Pomodoro messages. Please try again.',
      variant: 'destructive',
      duration: 2000,
    });
  }
};

const updateMindMessages = async () => {
  try {
    if (mindArray.value.some(msg => msg.length > maxCharLength)) {
      toast({
        title: 'Error',
        description: 'Messages cannot exceed 200 characters',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }
    userStore.mind_msg_array = [...mindArray.value]; // Update store state
    await userStore.updateAllStateToFirebase(userStore.userId); // Push updates to Firestore via store

    isEditing.value = false; // Exit editing mode

    // Show success toast for Mindful messages
    toast({
      title: 'Success',
      description: 'Mindful messages updated successfully!',
      variant: 'default',
      duration: 2000,
    });
  } catch (error) {
    errorMessage.value = 'Error updating the array. Please try again.';
    console.error(error);

    // Show error toast for failure
    toast({
      title: 'Error',
      description: 'Error updating Mindful messages. Please try again.',
      variant: 'destructive',
      duration: 2000,
    });
  }
};

// Function to add a new string to the array
const addPomoMessage = () => {
  if (pomoArray.value.length < maxLength) {
    pomoArray.value.push(''); // Add an empty string or default value
  } else {
    // Show error toast when exceeding max messages
    toast({
      title: 'Error',
      description: `You can only have a maximum of ${maxLength} messages.`,
      variant: 'destructive',
    });
  }
};

const addMindMessage = () => {
  if (mindArray.value.length < maxLength) {
    mindArray.value.push(''); // Add an empty string or default value
  } else {
    // Show error toast when exceeding max messages
    toast({
      title: 'Error',
      description: `You can only have a maximum of ${maxLength} messages.`,
      variant: 'destructive',
    });
  }
};

// Function to remove a string from the array
const removePomoMessage = (index) => {
  if (pomoArray.value.length > minLength) {
    pomoArray.value.splice(index, 1); // Remove the string at the specified index
  } else {
    // Show error toast when below minimum messages
    toast({
      title: 'Error',
      description: `You must have at least ${minLength} messages.`,
      variant: 'destructive',
    });
  }
};

const removeMindMessage = (index) => {
  if (mindArray.value.length > minLength) {
    mindArray.value.splice(index, 1); // Remove the string at the specified index
  } else {
    // Show error toast when below minimum messages
    toast({
      title: 'Error',
      description: `You must have at least ${minLength} messages.`,
      variant: 'destructive',
    });
  }
};

// Watch for dialog opening and trigger fetch
watch(() => isEditing.value, (newVal) => {
  if (newVal) {
    fetchAndEditPomoMessages();
    fetchAndEditMindMessages();
  }
});
</script>

<style scoped>
.update-button {
  background-color: #3490dc;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px 0;
}

.update-button {
  background-color: #38c172;
}

.input-field {
  padding: 5px;
  margin: 10px 0;
}

.error-message {
  color: red;
}

.card-description {
  color: grey;
  font-size: 0.8rem;
}

.add-button {
  font-size: 22px;
  font-weight: lighter;
  width: 25px;
  height: 25px;
  padding: 0;
}

</style>