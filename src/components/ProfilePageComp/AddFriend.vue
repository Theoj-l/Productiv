<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-[90vw] max-w-[425px] mx-auto">
      <DialogHeader>
        <DialogTitle>Follow User</DialogTitle>
        <DialogDescription>
          Follow user by their username to connect with them.
        </DialogDescription>
      </DialogHeader>

      <!-- Friend List Display -->
      <ScrollArea v-if="displayFriendList.length" class="h-[200px] rounded-md border p-2">
        <div class="divide-y divide-gray-200">
          <div v-for="friend in displayFriendList" :key="friend.uid" class="flex items-center justify-between py-1">
            <span class="pl-2">{{ friend.username }}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              @click="removeFriend(friend.uid)"
              class="hover:text-red-500 transition-colors"
            >
              <TrashIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ScrollArea>
      <div v-else class="text-sm text-muted-foreground py-4">
        You have no people followed yet.
      </div>

      <!-- Add Friend Section -->
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Username</Label>
          <Input
            v-model="friendUsername"
            placeholder="Enter person's username"
            class="col-span-3"
          />
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="text-sm text-red-500 mb-4">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-sm text-green-500 mb-4">
        {{ successMessage }}
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog">Cancel</Button>
        <Button :disabled="isAdding" @click="submitFriend">Follow</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { db } from '@/main';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrashIcon } from '@heroicons/vue/24/solid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserStore } from '@/stores/UserObjStore';

const props = defineProps({
  open: Boolean
});

const emit = defineEmits(['update:open']);

const friendUsername = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isAdding = ref(false);
const friendList = ref([]);
const displayFriendList = ref([]);
const userStore = useUserStore();

// Add this after the props definition
watch(() => props.open, (newValue) => {
  if (newValue) {
    fetchFriendList();
  }
});

// Fetch the authenticated user's friend list
onMounted(async () => {
  await fetchFriendList();
});

// Fetch friend list from Firestore
const fetchFriendList = async () => {
  try {
    const uid = getCurrentUserId();
    // Get current user document
    const currentUserDoc = await getDoc(doc(db, 'users', uid));
    const userData = currentUserDoc.data();
    
    // Initialize friends if it doesn't exist
    if (!userData.friends) {
      await updateDoc(doc(db, 'users', uid), {
        friends: []
      });
      displayFriendList.value = [];
      return;
    }

    const friendUids = userData.friends || [];
    friendList.value = friendUids;

    if (friendUids.length > 0) {
      const friendPromises = friendUids.map(async (uid) => {
        try {
          const friendDoc = await getDoc(doc(db, 'users', uid));
          if (friendDoc.exists()) {
            return {
              uid,
              username: friendDoc.data().username
            };
          }
        } catch (err) {
          console.error(`Error fetching friend ${uid}:`, err);
        }
        return { uid, username: 'Unknown User' };
      });

      displayFriendList.value = await Promise.all(friendPromises);
    } else {
      displayFriendList.value = [];
    }
  } catch (error) {
    console.error("Error fetching friend list:", error);
    errorMessage.value = "An error occurred while fetching your friends list.";
  }
};

const closeDialog = () => {
  emit('update:open', false);
};

// Function to add a friend
const submitFriend = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isAdding.value = true;

  const trimmedUsername = friendUsername.value.trim();
  if (!trimmedUsername) {
    errorMessage.value = 'Please enter a username.';
    isAdding.value = false;
    return;
  }

  try {
    const uid = getCurrentUserId();
    // Find user by username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', trimmedUsername));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      errorMessage.value = "User not found. Please check the username.";
      isAdding.value = false;
      return;
    }

    const friendUid = querySnapshot.docs[0].id;

    if (friendUid === uid) {
      errorMessage.value = "You cannot add yourself as a friend.";
      isAdding.value = false;
      return;
    }

    // Get current user document to check if friends array exists
    const currentUserRef = doc(db, 'users', uid);
    const currentUserDoc = await getDoc(currentUserRef);
    const userData = currentUserDoc.data();

    // Initialize friends array if it doesn't exist
    if (!userData.friends) {
      await updateDoc(currentUserRef, {
        friends: []
      });
    }

    // Add friend's UID to current user's friends array
    await updateDoc(currentUserRef, {
      friends: arrayUnion(friendUid)
    });

    // Update Pinia store
    if (!userStore.friends) {
      userStore.friends = [];
    }
    userStore.addFriend(friendUid);

    successMessage.value = `Friend ${trimmedUsername} added successfully!`;
    friendUsername.value = '';
    await fetchFriendList();

    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error("Error adding friend:", error);
    errorMessage.value = "An error occurred while adding the friend.";
  } finally {
    isAdding.value = false;
  }
};

// Function to remove a friend
const removeFriend = async (friendUid) => {
  try {
    const uid = getCurrentUserId();
    const currentUserDoc = doc(db, 'users', uid);

    await updateDoc(currentUserDoc, {
      friends: arrayRemove(friendUid)
    });

    // Remove from Pinia store
    userStore.removeFriend(friendUid);

    await fetchFriendList();
    successMessage.value = 'Friend removed successfully!';
    
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error("Error removing friend:", error);
    errorMessage.value = "An error occurred while removing the friend.";
  }
};

// Replace userStore.uid usage with getCurrentUserId function
const getCurrentUserId = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.uid;
};
</script>
  