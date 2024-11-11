import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/index.css'; // Import tailwind css to style
import { createRouter, createWebHistory } from 'vue-router';
import piniaPersist from 'pinia-plugin-persistedstate';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import LandingPage from './pages/LandingPage.vue';  // Landing page component
import Login from './pages/Login.vue';              // Login page component
import Pomodoro from './pages/Pomodoro.vue';        // Pomodoro page component
import Leaderboard from './pages/Leaderboard.vue';  // Leaderboard page component
import Mindfull from './pages/Mindfull.vue';        // Mindfull page component
import Signup from './pages/Signup.vue';            // Singup page component
import Profile from './pages/Profile.vue';          // Profile page component
import Logout from './pages/Logout.vue';            // Profile page component
import Forgot from './pages/Forgot.vue';            // Profile page component

// Firebase stuff
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // For Firebase Authentication
import { getFirestore } from 'firebase/firestore'; // For Firestore Database
import { getStorage } from 'firebase/storage'; // For Firebase Storage

// Define routes
const routes = [
  { path: '/', redirect: () => auth.currentUser ? '/pomodoro' : '/landingpage', meta: { guestOnly: true } },  // Root redirects based on auth
  { path: '/landingpage', component: LandingPage, meta: { guestOnly: true } }, // Login page route
  { path: '/login', component: Login, meta: { guestOnly: true } }, // Login page route
  { path: '/mindfull', component: Mindfull, meta: { requiresAuth: true } }, // Meditation page route
  { path: '/pomodoro', component: Pomodoro, meta: { requiresAuth: true } }, // Pomodoro page route
  { path: '/leaderboard', component: Leaderboard, meta: { requiresAuth: true } }, // Leaderboard page route
  { path: '/signup', component: Signup, meta: { guestOnly: true } }, // Signup page route
  { path: '/profile', component: Profile, meta: { requiresAuth: true } }, // Profile page route
  { path: '/logout', component: Logout }, // Logout page route
  { path: '/forgot', component: Forgot }, // Forgot page route
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Create pinia persistence plugin globally
const pinia = createPinia();
pinia.use(piniaPersist);
export default pinia;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app); // Firebase Authentication
const db = getFirestore(app); // Firestore
const storage = getStorage(app); // Firebase Storage

export { auth, db, storage };

// After initializing Firebase services, before the router guard:
let userLoaded = false;

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  userLoaded = true;
});

// Update the navigation guard
router.beforeEach(async (to, from, next) => {
  // Wait for initial auth state to load
  if (!userLoaded) {
    await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }

  const user = auth.currentUser;

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      next();
    } else {
      next('/login');
    }
  } else if (to.matched.some(record => record.meta.guestOnly)) {
    if (user) {
      next('/pomodoro');
    } else {
      next();
    }
  } else {
    next();
  }
});

const vueApp = createApp(App);
vueApp.use(pinia);  // Use the Pinia instance
vueApp.use(router);
vueApp.mount('#app');


