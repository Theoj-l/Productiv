<template>
  <div class="logout-page">
    <p>Logging you out, please wait...</p>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/UserObjStore'; // Your Pinia store
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getAuth, signOut } from 'firebase/auth'; // Firebase Auth

// Access router and user store
const router = useRouter();
const userStore = useUserStore();
const auth = getAuth(); // Initialize Firebase Authentication

// Clear local storage and perform logout
async function performLogout() {
  try {
    // Set isDataFetched to false
    userStore.isDataFetched = false;

    // Push user data to Firebase (you can replace this ID with the actual user ID or dynamic handling)
    await userStore.updateAllStateToFirebase();

    // Sign out from Firebase Authentication
    await signOut(auth);
    console.log('User signed out from Firebase.');

    // Clear Pinia state
    userStore.$reset();
    userStore.$dispose();  // Removes all reactivity
    
    // Redirect to the login page after logging out
    router.push('/'); // Redirect to the login page after logout
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

onMounted(() => {
  performLogout(); // Call logout when the component mounts
});
</script>

<style scoped>
.logout-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>