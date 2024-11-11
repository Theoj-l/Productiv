<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/stores/UserObjStore';
import EditProfile from '@/components/ProfilePageComp/EditProfile.vue'; 
import PomoArrayEdit from '@/components/ProfilePageComp/PomoArrayEdit.vue'; 
import ReminderEdit from '@/components/ProfilePageComp/Reminder.vue'; 
import AddFriend from '@/components/ProfilePageComp/AddFriend.vue';
import BarCard from '@/components/ProfilePageComp/BarCard.vue';
import DonutCard from '@/components/ProfilePageComp/DonutCard.vue';
import DailyCard from '@/components/ProfilePageComp/DailyCard.vue';
import WeeklyCard from '@/components/ProfilePageComp/WeeklyCard.vue';
import TopCatCard from '@/components/ProfilePageComp/TopCatCard.vue';
import LineCard from '@/components/ProfilePageComp/LineCard.vue';
import { PencilIcon, PlusIcon } from '@heroicons/vue/24/solid';
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton';

// Access Pinia store
const userStore = useUserStore();

// State variable for dropdown visibility
const isEditProfileDialogOpen = ref(false);
const isEditMessagesDialogOpen = ref(false);
const isEditReminderDialogOpen = ref(false);

// Add this to script setup
const openAddFriendDialog = ref(false);

// Add loading states
const isLoadingProfilePic = ref(true);
const isLoadingHeaderPic = ref(true);
const isLoadingUsername = ref(true);
const isLoadingCharts = ref(true);

// Add watchers
watch(() => userStore.profile_picture_url, (newVal) => {
  if (newVal) isLoadingProfilePic.value = false;
});

watch(() => userStore.profile_header_url, (newVal) => {
  if (newVal) isLoadingHeaderPic.value = false;
});

watch(() => userStore.username, (newVal) => {
  if (newVal) isLoadingUsername.value = false;
});

// Fetch data when the component is mounted (if needed)
if (!userStore.isDataFetched) {
  userStore.fetchUserData();  // Ensure user data is fetched from Firestore
}

// Update onMounted
onMounted(async () => {
  isLoadingProfilePic.value = true;
  isLoadingHeaderPic.value = true;
  isLoadingUsername.value = true;
  isLoadingCharts.value = true;

  try {
    if (!userStore.isDataFetched) {
      await userStore.fetchUserData();
    }
    
    // Set loading states to false immediately after data is fetched
    isLoadingProfilePic.value = false;
    isLoadingHeaderPic.value = false;
    isLoadingUsername.value = false;
    isLoadingCharts.value = false;
  } catch (error) {
    console.error('Error loading profile:', error);
    // Set loading states to false even on error
    isLoadingProfilePic.value = false;
    isLoadingHeaderPic.value = false;
    isLoadingUsername.value = false;
    isLoadingCharts.value = false;
  }
});
</script>

<template>
  <div class="profile-page">
    <header class="profile-header">
      <!-- Background Image Section with Skeleton -->
      <div class="header-image" :style="{ backgroundImage: !isLoadingHeaderPic ? `url(${userStore.profile_header_url})` : undefined }">
        <Skeleton v-if="isLoadingHeaderPic" class="w-full h-full" />
      </div>

      <!-- Profile Content with Skeletons -->
      <div class="profile-content">
        <!-- <div class="flex"> -->
          <!-- Profile Picture with Skeleton -->
          <div class="profile-picture">
            <img 
              :src="userStore.profile_picture_url" 
              alt="User Profile Picture" 
              @load="isLoadingProfilePic = false"
            />
          </div>

          <!-- Username with Skeleton -->
          <!-- <div class="profile-info"> -->
            <div class="words">
              {{ userStore.username }}
            </div>
          <!-- </div> -->
        <!-- </div> -->

        <div class="flex gap-4">
          <div class="icon-wrapper">
            <Button variant="ghost" class="edit-button" @click="openAddFriendDialog = true">
              <!-- <PlusIcon class="w-8 h-8"/>  -->
              <span class="add-icon text-[40px] font-[100]">+</span>
            </Button>
          </div>

          <div class="icon-wrapper">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" class="edit-button">
                  <PencilIcon class="edit-icon w-6 h-6"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem @click="isEditProfileDialogOpen = true" class="justify-end">
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem @click="isEditMessagesDialogOpen = true" class="justify-end">
                  Edit Messages
                </DropdownMenuItem>
                <DropdownMenuItem @click="isEditReminderDialogOpen = true" class="justify-end">
                  Edit Reminder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Charts with Skeletons -->
    <div class="chart-container">
      <template v-if="isLoadingCharts">
        <!-- Skeleton for each chart card -->
        <div class="daily-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
        <div class="weekly-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
        <div class="top-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
        <div class="donut-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
        <div class="bar-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
        <div class="line-card">
          <Skeleton class="w-full h-full min-h-[200px]" />
        </div>
      </template>
      <template v-else>
        <DailyCard class="daily-card"/>
        <WeeklyCard class="weekly-card"/>
        <TopCatCard class="top-card"/>
        <DonutCard class="donut-card"/>
        <BarCard class="bar-card"/>
        <LineCard class="line-card"/>
      </template>
    </div>

    <!-- Add these dialogs here -->
    <EditProfile v-model:open="isEditProfileDialogOpen" />
    <PomoArrayEdit v-model:open="isEditMessagesDialogOpen" />
    <ReminderEdit v-model:open="isEditReminderDialogOpen" />
    <AddFriend 
      v-model:open="openAddFriendDialog"
      @update:open="openAddFriendDialog = $event"
    />
  </div>
</template>

<style scoped>
.profile-page {
  overflow: hidden;
}
.chart-container {
  display: grid;   
  width: 100%;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  grid-template: 
  "dc tc doc doc"
  "wc tc doc doc";
  grid-template-rows: 1fr;
  grid-template-columns: 1.2fr 1fr 1.2fr 1.2fr;
  gap: 20px;
  box-sizing: border-box;
  margin-top: 70px;
}

.donut-card {
  height: 100%;
  width: 100%;
  grid-area: doc;
}

.line-card {
  height: 100%;
  width: 100%;
  grid-area: lc;
}

.bar-card {
  height: 100%;
  width: 100%;
  grid-area: bc;
}

.daily-card {
  height: 100%;
  width: 100%;
  grid-area: dc;
}

.weekly-card {
  height: 100%;
  width: 100%;
  grid-area: wc;
}

.top-card {
  height: 100%;
  width: 100%;
  grid-area: tc;
}

/* Full-Width Header Section */
.profile-header {
  position: relative;
  width: 100%;
  height: 200px;
  /* You can adjust the height as per your preference */
}

/* Background Image (Cover full width) */
.header-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-bottom: 2px solid #e9eef3;
  position: relative;
}

.profile-content {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Aligns the icon to the right */
  background-color: #fff; /* Adjust to fit your design */
  margin: 0px; /* Center the content */
  padding-right: 10px; /* Optional: add padding to separate icon from edge */
  top: -10px;
  max-height: 80px;
}

.profile-picture {
  width: 120px; /* Adjust as needed */
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: 30px;
  position: relative;
  top: -34px; /* Pushes the picture up */
  border: 2px solid #e9eef3; /* Optional: adds a border to make it stand out */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Adds shadow for depth */
  flex-shrink: 0; /* Prevents profile picture from shrinking */
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Edit Icon Button Positioned at Bottom Right of the Header */
.edit-icon-button {
  background-color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  opacity: 0.7; /* Set initial transparency */
  transition: opacity 0.3s ease; /* Smooth transition on hover */
}

.edit-button {
  height: 40px;
  width: 40px;
  padding: 0;
}

/* .edit-icon-button svg {
  width: 40px;
  height:40px;
  fill: black;
} */

/* Dropdown Menu Styling */
.dropdown-menu {
  position: fixed;
  top: 260px;
  right: 10px;
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 5px;
  padding: 15px;
  z-index: 100;
  width: 160px;
}

.icon-wrapper {
  position: relative;
}

/* Flexbox for Aligning Text and Icon in a Single Line */
.dropdown-item {
  display: flex;
  justify-content: right; /* Aligns text to the right */
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
}

.words {
  font-size: 2rem;
  font-weight: 500;
  color: black;
  padding-left: 10px;
  display: flex;
  justify-content: start;
  align-items: center;
  width: 100%;
  height: 100%;
  text-overflow: ellipsis;
}

@media (max-width: 500px) {
  .words {
    font-size: 0.5rem;
  }
  .profile-picture {
    width: 100px;
    height: 100px;
    margin-left: 10px;
  }
  .edit-button {
    height: 30px;
    width: 30px;
  }
  .edit-icon {
    width: 20px !important;
    height: 20px !important;
  }
  .add-icon {
    font-size: 30px !important;
  }
  .flex.gap-4 {
    gap: 0.5rem !important; /* 8px, reduced from 1rem (16px) */
  }
}

/* .profile-info p {
  font-size: 1rem;
  color: #666;
} */

.profile-info {
  flex: 1;
  display: flex;
  justify-content: center;
}

@media (max-width: 670px) {
  .chart-container {
  display: grid;   
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  grid-template: 
  "dc dc"
  "wc wc"
  "tc tc"
  "doc doc"
  "bc bc"
  "lc lc";
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  /* grid-template-columns: 1fr; */
  gap: 20px;
}
.words {
  font-size: min(6dvw, 30px);
}
.profile-picture {
  height: min(dvw, 80px);
}
}


@media (min-width: 670px) {
  .chart-container {
  display: grid;   
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  grid-template: 
  "dc tc"
  "wc tc"
  "doc doc"
  "bc bc"
  "lc lc";
  grid-template-rows: auto;
  grid-template-columns: 2fr 2fr;
  gap: 20px;
  box-sizing: border-box;
}
}

@media (min-width: 768px) {
  .chart-container {
  display: grid;   
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  grid-template: 
  "dc tc"
  "wc tc"
  "doc doc"
  "bc bc"
  "lc lc";
  grid-template-rows: auto;
  grid-template-columns: 2fr 2fr;
  gap: 20px;
  box-sizing: border-box;
}
}

@media (min-width: 1000px) {
  .chart-container {
  display: grid;   
  width: 100%;
  height: fit-content;
  padding: 20px;
  box-sizing: border-box;
  grid-template: 
  "dc tc doc"
  "wc tc doc"
  "bc bc bc"
  "lc lc lc";
  grid-template-rows: auto;
  grid-template-columns: 1.2fr 0.5fr 2fr;
  gap: 20px;
  box-sizing: border-box;
}
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>