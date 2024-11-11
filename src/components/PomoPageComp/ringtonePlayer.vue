<!-- FINAL ringtone player, updated @1.57pm -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore functions
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth
import { useUserStore } from '@/stores/UserObjStore.js';

// Store initialization
const userStore = useUserStore();
const timerObj = userStore.timerObj;

// Firebase Firestore initialization
const db = getFirestore();
const userId = ref(null);
const storage = getStorage();

const ringtones = ref([]); // To store the list of ringtones from firebase
const isPlaying = ref(false); // Track if a ringtone is playing
const audio = ref(null); // To store the HTML Audio element
const errorMessage = ref(""); // To store error messages

const currRingtone = computed(() => userStore.timerObj.chosen_ringtone);
console.log('Current Ringtone', currRingtone.value);
const currVolume = computed(() => userStore.timerObj.ringtone_volume[0]);
console.log('Current Ringtone Volume', currVolume.value);
const chosenRingtone = ref(currRingtone.value); // To store the chosen ringtone from state
const ringtoneVolume = ref(currVolume.value / 100);

const chosenRingtoneUrl = ref(""); // To store the URL of the chosen ringtone to play

// Fetch the list of ringtones from Firebase Storage
const fetchRingtones = async () => {
  try {
    const ringtoneFolderRef = storageRef(storage, "ringtones/");
    const ringtoneList = await listAll(ringtoneFolderRef);

    const ringtonePromises = ringtoneList.items.map(async (item) => {
      const downloadUrl = await getDownloadURL(item);
      return { name: item.name, url: downloadUrl };
    });

    ringtones.value = await Promise.all(ringtonePromises);
    setChosenRingtoneUrl();
  } catch (error) {
    errorMessage.value = "Error fetching ringtones from storage.";
    console.error(error);
  }
};

// Set the URL for the chosen ringtone
const setChosenRingtoneUrl = () => {
  const ringtoneFileName = `${chosenRingtone.value}.mp3`;
  const ringtone = ringtones.value.find((r) => r.name === ringtoneFileName);
  if (ringtone) {
    chosenRingtoneUrl.value = ringtone.url;
    console.log("Chosen Ringtone URL:", chosenRingtoneUrl.value);
  } else {
    errorMessage.value = `Ringtone "${chosenRingtone.value}.mp3" not found in Firebase Storage.`;
  }
};

// Play the selected ringtone
const playRingtone = (url) => {
  if (audio.value) {
    audio.value.pause();
  }

  audio.value = new Audio(url);
  audio.value.volume = ringtoneVolume.value;
  console.log('Current audio volume:', audio.value.volume);

  audio.value.play();
  isPlaying.value = true;

  audio.value.onended = () => {
    isPlaying.value = false;
  };
};

// Play the chosen ringtone
const playChosenRingtone = () => {
  if (!chosenRingtoneUrl.value) {
    errorMessage.value = "Chosen ringtone not available.";
    return;
  }
  playRingtone(chosenRingtoneUrl.value);
};

defineExpose({
  playChosenRingtone
});

// Fetch timerObj and ringtones when the component is mounted
onMounted(async () => {
  userId.value = await new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        reject('No authenticated user found.');
      }
    });
  });

  await fetchRingtones();
});
</script>

<template>
  <div v-if="false">
    <button @click="playChosenRingtone" class="bg-purple-500 text-white px-4 py-2 rounded mt-4">
      Play Chosen Ringtone
    </button>
  </div>
</template>