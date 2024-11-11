<template>
  <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  </head>
  <div id="app" class="flex h-[100dvh] max-h-[100dvh] max-w-full flex-1 flex-col transition-all duration-300 ease-in-out">
    <!-- Parent Container for Logo, Navigation, and Avatar -->
    <div class="header-container" v-if="displayNavigationRoutes.includes(route.path)">
      <router-link to="/pomodoro">
      <div class="logo-section">
        <span class="app-name">Productiv</span>
      </div>
      </router-link>

      <!-- Navigation Menu (Centered) -->
      <div class="navigation-container">
        <nav>
          <ul class="nav-list">
            <li>
              <router-link to="/mindfull" :class="{'active-link': route.path === '/mindfull'}">
                Mindfull
                <span class="circle"></span>
              </router-link>
            </li>
            <li>
              <router-link to="/pomodoro" :class="{'active-link': route.path === '/pomodoro'}">
                Pomodoro
                <span class="circle"></span>
              </router-link>
            </li>
            <li class="leaderboard-item">
              <router-link to="/leaderboard" :class="{'active-link': route.path === '/leaderboard'}">
                Leader Board
                <span class="circle"></span>
              </router-link>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Avatar Section (Right-Aligned using Shadcn Avatar and Username) -->
      <div class="avatar-section">
        <!-- For desktop: Avatar and Username -->
        <router-link to="/profile" class="desktop-only">
          <span class="username">{{ userStore.username }}</span>
        </router-link>
        <div class="desktop-only">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar class="cursor-pointer">
                <AvatarImage :src="userStore.profile_picture_url" alt="User Profile" />
                <AvatarFallback>{{ userStore.username.charAt(0).toUpperCase() }}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <router-link to="/profile">
                  <UserCircleIcon class="dropdown-icons"/> 
                  Profile
                </router-link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <router-link to="/logout">
                  <ArrowLeftStartOnRectangleIcon class="dropdown-icons"/>
                  Logout
                </router-link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- For mobile: Dropdown button using ShadCN Dropdown Menu -->
        <div class="mobile-only">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button class="dropdown-toggle">
                <Bars3BottomRightIcon class="dropdown-icon" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <router-link to="/profile">
                  <UserCircleIcon class="dropdown-icons"/> 
                  Profile
                </router-link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <router-link to="/leaderboard">
                  <TrophyIcon class="dropdown-icons"/>
                  Leaderboard
                </router-link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <router-link to="/logout">
                  <ArrowLeftStartOnRectangleIcon class="dropdown-icons"/>
                  Logout
                </router-link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    
  <div class="nav-bar-pusher" v-if="displayNavigationRoutes.includes(route.path)"></div>
  <!-- This is where the component for the current route is rendered -->
  <div :class="{ 'main-content': route.path !== '/landingpage' }">
    <router-view />
  </div>

    <Toaster />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircleIcon, TrophyIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/vue/24/outline';
import { Bars3BottomRightIcon } from '@heroicons/vue/20/solid';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'; // Import ShadCN Dropdown Menu Components
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useUserStore } from '@/stores/UserObjStore'; // Import the Pinia store

const route = useRoute();
const displayNavigationRoutes = ['/mindfull', '/pomodoro', '/leaderboard', '/profile'];

// !!! Call the init function when the component is mounted
const userStore = useUserStore();

function clearLocalStorage() {
  // localStorage.removeItem('userStore'); 
  // 'userStore' is the key used in Pinia persistence
}

onMounted(() => {
  // when close window/tab event is heard, push data to firebase through userObjectStore method and then clear local storage
  // window.addEventListener('beforeunload', async (event) => {

  // })
});

// clean up event listener when root app component is unmounted
onBeforeUnmount( () => {
  // window.removeEventListener('beforeunload', async (event) => {
  //   event.preventDefault(); // compatibility with certain browsers
  //   console.log('(4/4) beforeunload listener removed')
  // })
});
</script>

<style scoped>
/* Flex container for the entire header (logo + navigation + avatar) */
.nav-bar-pusher {
  height: 70px;
  flex-shrink: 0;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto; /* Allow scrolling if content exceeds the view */
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  height: 70px;
  width: 100%;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  z-index: 2;
}

/* Logo section aligned to the left */
.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.app-name {
  font-size: 1.5rem;
  font-weight: bold;
  color: black;
}

/* Central Navigation (centered and absolutely positioned) */
.navigation-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-list {
  display: flex;
  list-style: none;
}

.nav-list li {
  margin: 0 20px;
}

.nav-list a {
  position: relative;
  font-size: 1.2rem;
  color: grey;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-list a:hover {
  color: #1f2937;
}

.nav-list a .circle {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 5px;
  height: 5px;
  background-color: black;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.nav-list a.active-link .circle {
  transform: translateX(-50%) scale(1);
}

.nav-list a.active-link {
  color: black;
  font-weight: 500;
}

/* Avatar section aligned to the right */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* Add media queries for dynamic truncation */
@media (min-width: 1100px) and (max-width: 1199px) {
  .username {
    max-width: 300px;
  }
}

@media (min-width: 930px) and (max-width: 1099px) {
  .username {
    max-width: 200px;
  }
}

@media (min-width: 768px) and (max-width: 929px) {
  .username {
    max-width: 130px;
  }
}

/* Hide avatar and username on mobile screens */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.dropdown-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.dropdown-icons {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}

.dropdown-navbar {
  z-index: 95;
}

/* Media Query for Mobile */
@media (max-width: 768px) {
  .desktop-only {
    display: none; /* Hide avatar and username on mobile */
  }

  .mobile-only {
    display: flex; /* Show dropdown icon on mobile */
  }

  .navigation-container {
    left: 50%;
    transform: translateX(-50%);
  }

  .leaderboard-item, .app-name, .username {
    display: none;
  }
}
</style>