<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage imports
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Import Heroicons for password visibility toggle
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/20/solid';

// Initialize Firebase Authentication, Firestore, and Storage
const auth = getAuth();
const db = getFirestore();
const storage = getStorage(); // Initialize Firebase Storage

// Reactive variables to store form data
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const router = useRouter();

// Paths to the default profile picture and header images in the src/assets folder
const defaultProfilePicPath = "/defaultPp.jpg"; // Relative path to the default profile picture
const defaultHeaderPicPath = "/defaultHp.png"; // Relative path to the default header

// Refs for each input field
const usernameInputRef = ref(null);
const emailInputRef = ref(null);
const passwordInputRef = ref(null);
const confirmPasswordInputRef = ref(null);

// Single variable to control the visibility of both password fields
const showPasswords = ref(false);

// Custom error messages for Firebase error codes
const firebaseErrorMessages = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "The email address is invalid.",
  "auth/operation-not-allowed": "Operation not allowed. Please contact support.",
  "auth/weak-password": "The password is too weak. Minimum of 6 letters.",
  "auth/username-already-exists": "The username is already taken. Please choose a different one."
};

// Function to handle signup
const handleSignup = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  try {
    // Check if the username already exists in Firestore
    const usernameExists = await checkUsernameExists(username.value);
    if (usernameExists) {
      errorMessage.value = firebaseErrorMessages["auth/username-already-exists"];
      return;
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;

    // Upload default profile picture and header to Firebase Storage
    const profilePicUrl = await uploadFileToStorage(defaultProfilePicPath, `profile-pictures/${user.uid}/profile.jpg`);
    const headerPicUrl = await uploadFileToStorage(defaultHeaderPicPath, `profile-headers/${user.uid}/header.png`);

    // Create a new user document in Firestore using the UID from Firebase Authentication
    await setDoc(doc(db, "users", user.uid), {
      email: email.value,
      username: username.value,
      isDataFetched: false,
      isLoading: true,
      mind_msg_array: [
        "Take a deep breath and focus on the sensation of air filling your lungs, allowing each exhale to gently release tension from your body.",
        "Notice the subtle sounds around you, the texture of the ground beneath your feet, and the way your body feels in this moment, fully embracing the present.",
        "Gently observe your thoughts without judgment, letting them come and go like passing clouds, while bringing your attention back to the present whenever your mind wanders.",
        "Ground yourself by focusing on the rhythm of your breath, using it as an anchor to stay centered and calm, even amidst the busyness of life."
      ],
      pomo_msg_array: [
        "You’re in control right now—trust in your focus and let the world fade away as you dive deep into your task.",
        "Keep going, this focused silence is your strength, and you’re making incredible progress with every minute.",
        "The distractions can wait. For now, it’s just you and your goals—one step closer with each moment of focus.",
        "Embrace this calm. You’re creating space for clarity and growth, and your hard work is paying off in ways you’ll soon see."
      ],
      reminder_message: "Don't forget! You're working on something important.",
      priority_array: ["High", "Medium", "Low"],
      tag_array: [],
      profile_header_url: headerPicUrl, // Store profile picture URL in Firestore
      profile_picture_url: profilePicUrl, // Store header picture URL in Firestore
      task_routine_array: [],
      tasks: [],
      friends: [],
      tag_time_obj: {},
      selected_task_id: '',
      timerObj: {
        pomo_timer: 30,
        short_break_timer: 30,
        long_break_timer: 30,
        break_intervals: 5,
        auto_start_break: false,
        auto_start_pomo: false,
        chosen_ringtone: { label: 'Ringtone 1', value: 'Ringtone 1'},
        ringtone_volume: [30],
        enable_messages: false,
        enable_reminders: false,
      }
    });

    // Redirect to a dashboard or home page after successful signup
    router.push("/pomodoro");
  } catch (error) {
    errorMessage.value = firebaseErrorMessages[error.code] || "Signup failed. Please try again.";
  }
};

// Helper function to fetch and upload local assets (default images) to Firebase Storage
const uploadFileToStorage = async (filePath: string, storagePath: string) => {
  try {
    // Fetch the image as a Blob
    const response = await fetch(filePath);
    const fileBlob = await response.blob();

    // Create a storage reference and upload the file
    const fileRef = storageRef(storage, storagePath);
    const snapshot = await uploadBytesResumable(fileRef, fileBlob);

    // Get the download URL after the file is uploaded
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    return null;
  }
};

// Function to check if the username already exists in Firestore
const checkUsernameExists = async (username: string) => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty; // Returns true if username already exists
};
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <Card class="w-full max-w-md p-6 custom-rounded shadow-lg bg-white mx-2">
      <!-- Header Section -->
      <div class="text-center mb-6">
        <h1 class="text-4xl font-[400]">Sign Up</h1>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-500 text-center mb-4">{{ errorMessage }}</div>

      <!-- Username, Email, Password, and Confirm Password Input Fields -->
      <div class="space-y-4">
        <Input 
          ref="usernameInputRef" 
          v-model="username" 
          type="text" 
          placeholder="Username" 
          class="w-full" 
          @keyup.enter="emailInputRef.$el.focus()" />

        <Input 
          ref="emailInputRef" 
          v-model="email" 
          type="email" 
          placeholder="Enter Email" 
          class="w-full" 
          @keyup.enter="passwordInputRef.$el.focus()" />

        <div class="relative">
          <Input 
            ref="passwordInputRef" 
            v-model="password" 
            :type="showPasswords ? 'text' : 'password'" 
            placeholder="Password" 
            class="w-full" 
            @keyup.enter="confirmPasswordInputRef.$el.focus()" />
          <span class="absolute inset-y-0 right-3 flex items-center">
            <!-- Heroicons for Eye / Eye-Off based on showPasswords state -->
            <EyeSlashIcon v-if="!showPasswords" @click="showPasswords = !showPasswords" class="h-5 w-5 text-gray-500 cursor-pointer" />
            <EyeIcon v-if="showPasswords" @click="showPasswords = !showPasswords" class="h-5 w-5 text-gray-500 cursor-pointer" />
          </span>
        </div>

        <div class="relative">
          <Input 
            ref="confirmPasswordInputRef" 
            v-model="confirmPassword" 
            :type="showPasswords ? 'text' : 'password'" 
            placeholder="Confirm Password" 
            class="w-full" 
            @keyup.enter="handleSignup()" />
          <span class="absolute inset-y-0 right-3 flex items-center">
            <!-- Heroicons for Eye / Eye-Off based on showPasswords state -->
            <EyeSlashIcon v-if="!showPasswords" @click="showPasswords = !showPasswords" class="h-5 w-5 text-gray-500 cursor-pointer" />
            <EyeIcon v-if="showPasswords" @click="showPasswords = !showPasswords" class="h-5 w-5 text-gray-500 cursor-pointer" />
          </span>
        </div>
      </div>

      <!-- Create Account Button -->
      <Button @click="handleSignup" class="w-full bg-black text-white py-2 mt-6">Create Account</Button>

      <!-- Sign In Link -->
      <div class="text-center mt-4 text-sm">
        <span>Have an account? </span>
        <router-link to="/login" class="text-green-500 underline">Login</router-link>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.custom-rounded {
  border-radius: 10px;
}
</style>
