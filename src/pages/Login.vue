<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/main"; // Import your initialized Firebase auth
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';
import { useUserStore } from '@/stores/UserObjStore'; // Import the Pinia store

// Reactive variables to store form data
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const rememberMe = ref(false);  // For Remember Me functionality
const passwordInputRef = ref(null); // Reference for password input
const showPassword = ref(false); // Reactive variable for toggling password visibility
const router = useRouter();
const userStore = useUserStore();

// Custom error messages for Firebase error codes
const firebaseErrorMessages = {
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "The email address is invalid.",
  "auth/missing-password": "Please enter your password.",
  "auth/invalid-credential": "Invalid credentials. Please check your details.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  // Add more error codes and messages as needed
};

// Function to handle login
const handleLogin = async () => {
  try {
    // Set persistence based on the "Remember Me" option
    const persistence = rememberMe.value ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    // Attempt to sign in using Firebase Authentication
    await signInWithEmailAndPassword(auth, email.value, password.value);

    // Initialize the user store state
    userStore.init();

    // Redirect to a dashboard or home page on successful login
    router.push("/pomodoro");
  } catch (error) {
    // Use Firebase error code to display a friendly message
    const errorCode = error.code;
    errorMessage.value = firebaseErrorMessages[errorCode] || "Login failed. Please try again.";
  }
};

// Function to toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Function to move focus to the password input field when "Enter" is pressed on the email input
const focusPasswordInput = async () => {
  await nextTick(); // Ensure DOM has been updated
  if (passwordInputRef.value?.$el) {
    passwordInputRef.value.$el.focus(); // Focus the password input (accessing native input)
  }
};
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <Card class="w-full max-w-md p-6 custom-rounded bg-white mx-2 shadow-lg">
      <!-- Header Section -->
      <div class="text-center mb-6">
        <h1 class="text-4xl font-[400]">Productive</h1>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-500 text-center mb-4">{{ errorMessage }}</div>

      <!-- Email and Password Input Fields -->
      <div class="space-y-4">
        <!-- When Enter is pressed in the email field, focus moves to the password input -->
        <Input v-model="email" type="email" placeholder="Email" class="w-full" @keyup.enter="focusPasswordInput" />
        
        <div class="relative">
          <!-- Reference to the password input field -->
          <Input 
            v-model="password" 
            ref="passwordInputRef" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="Password" 
            class="w-full" 
            @keyup.enter="handleLogin" 
          />
          <span class="absolute inset-y-0 right-3 flex items-center">
            <!-- Heroicons for Eye / Eye-Off based on showPassword state -->
            <EyeSlashIcon v-if="!showPassword" @click="togglePasswordVisibility" class="h-5 w-5 text-gray-500 cursor-pointer" />
            <EyeIcon v-if="showPassword" @click="togglePasswordVisibility" class="h-5 w-5 text-gray-500 cursor-pointer" />
          </span>
        </div>
      </div>

      <!-- Remember Me and Forgot Password -->
      <div class="flex justify-between items-center my-4">
        <router-link to="/forgot" class="text-sm text-red-500 ml-auto">
          Forgot Password
        </router-link>
      </div>

      <!-- Login Button -->
      <Button @click="handleLogin" class="w-full bg-black text-white py-2">Log In</Button>

      <!-- Sign Up Link -->
      <div class="text-center mt-4 text-sm">
        <span>Do not have an account? </span>
        <router-link to="/signup" class="text-green-500 underline">Sign Up</router-link>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.custom-rounded {
  border-radius: 10px;
}
</style>