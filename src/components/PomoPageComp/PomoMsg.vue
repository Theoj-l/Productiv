<template>
  <div class="pomo-msg-container">
    <!-- Show loading message if data is being fetched -->
    <div v-if="isLoading">
      <p>Loading messages...</p>
    </div>

    <!-- Display the currently selected message -->
    <div v-else-if="pomoMsgArray && pomoMsgArray.length > 0">
      <p class="pomo-msg">{{ currentMessage }}</p>
    </div>

    <!-- Show this message if there are no messages available -->
    <div v-else>
      <p>No messages available.</p>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/UserObjStore';

export default {
  name: 'PomoMsg',
  data() {
    return {
      currentMessage: '',  // The message currently being displayed
      previousIndex: null, // Keep track of the last message index
      intervalId: null,    // Interval ID to clear when component is destroyed
    };
  },
  computed: {
    // Pull the pomo_msg_array and loading state from the Pinia store
    pomoMsgArray() {
      const userStore = useUserStore();
      return userStore.pomo_msg_array;
    },
    isLoading() {
      const userStore = useUserStore();
      return userStore.isLoading;
    },
  },
  methods: {
    // Method to get a random index, ensuring it's not the same as the last one
    getRandomIndex() {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * this.pomoMsgArray.length);
      } while (newIndex === this.previousIndex);
      return newIndex;
    },

    // Method to update the current message
    updateMessage() {
      const randomIndex = this.getRandomIndex();
      this.currentMessage = this.pomoMsgArray[randomIndex];
      this.previousIndex = randomIndex;
    },

    // Start the interval for message updates every 2 seconds
    startMessageLoop() {
      this.updateMessage(); // Show the first message immediately
      this.intervalId = setInterval(() => {
        this.updateMessage();
      }, 10000); // Change message every 2 seconds
    },
  },
  async mounted() {
    const userStore = useUserStore();

    if (!userStore.isDataFetched) {
      await userStore.fetchUserData(); // Fetch data if not already fetched
    }

    if (this.pomoMsgArray.length > 0) {
      this.startMessageLoop(); // Start displaying messages
    }
  },
  beforeUnmount() {
    // Clear the interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
};
</script>

<style scoped>
.pomo-msg {
  display: flex;
  /* border: white solid 1px; */
  color: white;
  font-size: max(1.3dvw, 17px);
  height: max(13dvh, 80px);
  text-align: center;
  align-items: center;
}
</style>