<template>
    <div class="flex justify-center items-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-2xl font-bold text-center mb-6">Forgot Password</h2>
  
        <!-- Display success or error messages -->
        <div v-if="message" :class="{'text-green-500': success, 'text-red-500': !success}" class="text-center mb-4">
          {{ message }}
        </div>
  
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              v-model="email"
              type="email"
              id="email"
              class="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your email"
              required
            />
          </div>
  
          <button
            type="submit"
            class="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold"
          >
            Reset Password
          </button>
        </form>
  
        <router-link to="/login" class="block mt-4 text-sm text-center text-indigo-600 hover:underline">
          Back to Login
        </router-link>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  // Import Firebase Authentication
  import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
  
  // Define reactive variables
  const email = ref('');
  const message = ref('');
  const success = ref(false);
  
  // Firebase Auth instance
  const auth = getAuth();
  
  // Function to handle form submission and send reset email
  const submitForm = async () => {
    try {
      // Ensure email is provided
      if (email.value.trim()) {
        await sendPasswordResetEmail(auth, email.value);
        success.value = true;
        message.value = `Password reset link sent to: ${email.value}`;
      } else {
        success.value = false;
        message.value = 'Please enter a valid email address.';
      }
    } catch (error) {
      success.value = false;
      if (error.code === 'auth/user-not-found') {
        message.value = 'No user found with this email.';
      } else {
        message.value = 'An error occurred. Please try again.';
      }
    }
  };
  </script>
  
  <style scoped>
  /* Add any additional styling here */
  </style>
  