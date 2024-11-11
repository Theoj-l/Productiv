<template>
  <!-- Settings Button to Trigger Dialog -->
  <Dialog>
    <!-- Dialog for Editing Profile, Header, and Username -->
    <DialogContent class="w-[90vw] max-w-lg bg-white p-6 rounded-lg shadow-md">
      <DialogHeader>
        <DialogTitle class="text-lg font-[500]">Update Profile Information</DialogTitle>
        <DialogDescription>
          Update your profile picture, header, and username.
        </DialogDescription>
      </DialogHeader>

      <!-- Scrollable Section for All Inputs -->
      <ScrollArea class="h-80 rounded-md outside scroll-area-padding"> <!-- Added padding for scrollbar -->
        <!-- Username Section -->
        <div class="my-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-normal">Username</h3>
            <div class="text-right">
              <p v-if="usernameError" class="text-red-500 text-sm">
                {{ usernameError }}
              </p>
              <p v-else-if="newUsername.length >= 25" class="text-red-500 text-sm">
                Username cannot exceed 25 characters
              </p>
            </div>
          </div>
          <input
            v-model="newUsername"
            type="text"
            :placeholder="username"
            class="border rounded px-4 py-2 w-full"
            maxlength="25"
          />
          <div class="flex items-center gap-2 mt-4">
            <Button 
              @click="updateUsername"
              :disabled="newUsername.length > 25 || !newUsername.trim()"
            >
              Update Username
            </Button>
            <span class="text-sm text-gray-500">{{ newUsername.length }}/25</span>
          </div>
        </div>

        <!-- Separator -->
        <hr class="separator">

        <!-- Profile Picture Upload Section -->
        <div class="my-4">
          <!-- Profile picture container will stack on small screens -->
          <div class="sm:flex sm:items-center">
            <div class="profile-picture-container mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0">
              <img :src="userStore.profile_picture_url" alt="Profile Picture" class="profile-picture" />
            </div>
            <div class="flex-1">
              <h3 class="text-md font-normal mb-2">Change Profile Picture</h3>
              <div class="flex items-center space-x-2">
                <Button @click="triggerProfilePicUpload">Choose Profile Picture</Button>
                
                <!-- Trash Icon with AlertDialog -->
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      class="hover:text-red-500 transition-colors"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <!-- Alert Dialog Content -->
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete your profile picture? This action cannot be undone and will return the default profile picture.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div class="flex space-x-4">
                      <AlertDialogAction @click="uploadDefaultProfilePic">Continue</AlertDialogAction>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
                
              </div>
              <input
                type="file"
                ref="profilePicInput"
                @change="handleProfilePicUpload"
                accept="image/*"
                class="hidden"
              />
              <p class="text-sm text-gray-500 overflow-hidden mt-2">JPG, PNG (Max size: 5MB)</p>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <hr class="separator">
        
        <!-- Header Image Upload Section -->
        <div class="my-4">
          <div class="header-image-container mb-2">
            <img :src="userStore.profile_header_url" alt="Header Image" class="header-image" />
          </div>
          <div>
            <h3 class="text-md font-normal mb-2">Change Header Image</h3>
            <div class="flex items-center space-x-2"> <!-- Flex container for button and icon -->
              <Button @click="triggerHeaderImageUpload">Choose Header Image</Button>

              <!-- Trash Icon with AlertDialog for Header Image -->
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    class="hover:text-red-500 transition-colors"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>

                <!-- Alert Dialog Content for Header -->
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your header image? This action cannot be undone and will return to the default header image.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter></AlertDialogFooter>
                  <div class="flex space-x-4">
                    <AlertDialogAction @click="uploadDefaultHeaderImage">Continue</AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

            </div>
            <input
              type="file"
              ref="headerImageInput"
              @change="handleHeaderImageUpload"
              accept="image/*"
              class="hidden"
            />
            <p class="text-sm text-gray-500 mt-2">JPG, PNG (Max size: 5MB)</p>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/UserObjStore'; // Import your Pinia store
import { getAuth } from 'firebase/auth'; // Firebase Auth
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Firebase Storage
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea from shadcn
import { TrashIcon } from '@heroicons/vue/24/solid';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Access Pinia store
const userStore = useUserStore();
const auth = getAuth();
const storage = getStorage();
const db = getFirestore();

// Refs for file inputs
const profilePicInput = ref(null);
const headerImageInput = ref(null);

// State for new username
const username = ref(userStore.username); // Current username from store
const newUsername = ref(userStore.username); // Initialize with current username
const usernameError = ref('');

// Default image URLs (can be assets or URLs from your project)
const defaultProfilePic = '/src/assets/defaultPp.jpg';
const defaultHeaderImage = '/src/assets/defaultHp.png';

// Trigger file input for profile picture
const triggerProfilePicUpload = () => {
profilePicInput.value.click();
};

// Trigger file input for header image
const triggerHeaderImageUpload = () => {
headerImageInput.value.click();
};

// Handle profile picture upload
const handleProfilePicUpload = async (event) => {
const file = event.target.files[0];
if (file) {
  const user = auth.currentUser;
  const fileRef = storageRef(storage, `profile-pictures/${user.uid}/profile.jpg`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  uploadTask.on(
    'state_changed',
    null,
    (error) => {
      console.error('Error uploading profile picture:', error);
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      userStore.profile_picture_url = downloadURL;
      await userStore.updateAllStateToFirebase(user.uid);
      console.log('Profile picture updated and changes pushed to Firestore');
    }
  );
}
};

// Handle header image upload
const handleHeaderImageUpload = async (event) => {
const file = event.target.files[0];
if (file) {
  const user = auth.currentUser;
  const fileRef = storageRef(storage, `profile-headers/${user.uid}/header.png`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  uploadTask.on(
    'state_changed',
    null,
    (error) => {
      console.error('Error uploading header image:', error);
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      userStore.profile_header_url = downloadURL;
      await userStore.updateAllStateToFirebase(user.uid);
      console.log('Header image updated and changes pushed to Firestore');
    }
  );
}
};

// Update username
const updateUsername = async () => {
usernameError.value = ''; // Reset error

if (!newUsername.value.trim()) {
  usernameError.value = 'Username cannot be empty';
  return;
}

if (newUsername.value.length > 25) {
  usernameError.value = 'Username too long';
  return;
}

// Skip check if username hasn't changed
if (newUsername.value === username.value) {
  usernameError.value = 'No changes made';
  return;
}

try {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', newUsername.value));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    usernameError.value = 'Username already taken';
    return;
  }

  userStore.username = newUsername.value;
  await userStore.updateAllStateToFirebase();
  username.value = newUsername.value;
} catch (error) {
  usernameError.value = 'Failed to update username';
  console.error('Error updating username:', error);
}
};

// Upload default profile picture from public folder
const uploadDefaultProfilePic = async () => {
const user = auth.currentUser;
const defaultPicRef = storageRef(storage, `profile-pictures/${user.uid}/profile.jpg`);

// Fetch the default picture from the public folder
const response = await fetch('/defaultPp.jpg'); 
const blob = await response.blob();

const uploadTask = uploadBytesResumable(defaultPicRef, blob);

uploadTask.on(
  'state_changed',
  null,
  (error) => {
    console.error('Error uploading default profile picture:', error);
  },
  async () => {
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    userStore.profile_picture_url = downloadURL; // Set the default picture URL in the store
    await userStore.updateAllStateToFirebase(user.uid);
    console.log('Default profile picture uploaded successfully');
  }
);
};

// Upload default header image from public folder
const uploadDefaultHeaderImage = async () => {
const user = auth.currentUser;
const defaultHeaderRef = storageRef(storage, `profile-headers/${user.uid}/header.png`);

// Fetch the default header image from the public folder
const response = await fetch('/defaultHp.png'); 
const blob = await response.blob();

const uploadTask = uploadBytesResumable(defaultHeaderRef, blob);

uploadTask.on(
  'state_changed',
  null,
  (error) => {
    console.error('Error uploading default header image:', error);
  },
  async () => {
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    userStore.profile_header_url = downloadURL; // Set the default header URL in the store
    await userStore.updateAllStateToFirebase(user.uid);
    console.log('Default header image uploaded successfully');
  }
);
};
</script>

<style scoped>
/* Separator Styling */
.separator {
border: none;
border-top: 1px solid #ccc;
margin: 1rem 0;
}

/* ScrollArea Styling with Padding for Scrollbar */
.scroll-area-padding {
padding-right: 10px; /* Padding to prevent scrollbar from covering content */
}

.profile-picture-container {
width: 96px;
height: 96px;
border-radius: 50%;
overflow: hidden;
background-color: #ccc;
}

.profile-picture {
object-fit: cover;
object-position: center;
width: 100%;
height: 100%;
}

.header-image-container {
width: 100%;
height: 128px;
background-color: #ccc;
overflow: hidden;
border-radius: 8px;
}

.header-image {
object-fit: cover;
object-position: center;
width: 100%;
height: 100%;
}

input[type="text"] {
border: 1px solid #ddd;
padding: 8px;
width: 100%;
border-radius: 4px;
}

input[type="text"]:focus {
border-color: #3490dc;
outline: none;
}

.my-4 {
margin-top: 1rem;
margin-bottom: 1rem;
}
</style>