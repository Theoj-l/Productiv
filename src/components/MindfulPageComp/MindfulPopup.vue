<!-- FINAL Mindful popup, updated @ 4.04am -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/UserObjStore';
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore functions
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ringtoneComponent from '@/components/PomoPageComp/ringtonePlayerMindful.vue';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const userStore = useUserStore();
const localTimeLeft = ref(userStore.timerObj.mindful_timer * 60);
const randomMessage = ref('');
let timer = null;
const startTime = ref(localTimeLeft.value); // Correctly initialize startTime as a reference to localTimeLeft.value

const userId = ref(null);
const storage = getStorage();

const songs = ref([]); // To store the list of songs from firebase
const isPlaying = ref(false); // Track if a song is playing
const audio = ref(null); // To store the HTML Audio element
const errorMessage = ref(""); // To store error messages

const currSong = computed(() => userStore.chosen_mindful_music);
const chosenSong = ref(currSong.value); // To store the chosen song from state
const currVolume = computed(() => userStore.mindful_song_volume[0]);
const songVolume = ref(currVolume.value / 100);

const chosenSongUrl = ref("");

const ringtonePlayerRef = ref(null);

// Animation 
const isAnimating = ref(false);
const currentText = ref('Inhale');
let animationFrame;

// Helper function to get today's date in the format "DDMMMYY"
const getDate = () => {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(2);
  return `${day}${month}${year}`;
};
// Display formatted time
const formattedTime = computed(() => {
  const minutes = Math.floor(localTimeLeft.value / 60);
  const seconds = localTimeLeft.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});
// Get a random mindful message
const getRandomMessage = () => {
  if (userStore.mind_msg_array.length > 0) {
    const randomIndex = Math.floor(Math.random() * userStore.mind_msg_array.length);
    randomMessage.value = userStore.mind_msg_array[randomIndex];
  }
};
// Start the timer countdown
const startMindfulTimer = () => {
  timer = setInterval(() => {
    if (localTimeLeft.value > 0) {
      localTimeLeft.value--;
    } else {
      stopTimer();
      timerDone();
    }
  }, 1000);

  isAnimating.value = true;
  startAnimationCycle();
};
function timerDone() {
    ringtonePlayerRef.value.playChosenRingtone(); 
    console.log('it should be playigggg', ringtonePlayerRef.value);        
}
// Stop the timer and update mindful_time_obj in the database
const stopTimer = () => {
  clearInterval(timer);

  const timeSpentNow = startTime.value - localTimeLeft.value; // Calculate total time spent
  const todayDate = getDate();

  // Update mindful_time_obj for today
  if (todayDate in userStore.mindful_time_obj) {
    userStore.mindful_time_obj[todayDate] += timeSpentNow;
  } else {
    userStore.mindful_time_obj[todayDate] = timeSpentNow;
  }

  // Update in Firestore
  (async () => {
    try {
      await userStore.updateMindfulTimeObj(userStore.mindful_time_obj);
      console.log('Updated mindful_time_obj:', userStore.mindful_time_obj);
    } catch (error) {
      console.error('Error updating mindful time:', error);
    }
  })();

  emit('close'); // Emit close event to parent to hide the popup
};
// Manage breathing animation cycle
const updateBreathText = (timestamp) => {
  if (!startTime.value) startTime.value = timestamp;
  const progress = (timestamp - startTime.value) % 14000; // 7s animation cycle

  currentText.value = progress < 7500 ? 'Inhale' : 'Exhale';

  if (isAnimating.value) {
    animationFrame = requestAnimationFrame(updateBreathText);
  }
};
const startAnimationCycle = () => {
  startTime.value = 0;
  animationFrame = requestAnimationFrame(updateBreathText);
};

const fetchSongs = async () => {
  try {
    const songsFolder = storageRef(storage, "pomodoro_music/");
    const songList = await listAll(songsFolder);

    const songsPromises = songList.items.map(async (songFile) => {
      const downloadUrl = await getDownloadURL(songFile);
      return { name: songFile.name, url: downloadUrl };
    });

    songs.value = await Promise.all(songsPromises);
    setChosenSongUrl();
  } catch (error) {
    errorMessage.value = "Error fetching songs from storage.";
    console.error(error);
  }
};

// Set the URL for the chosen song
const setChosenSongUrl = () => {
  const songFileName = `${chosenSong.value}.mp3`;
  const song = songs.value.find((s) => s.name === songFileName);
  if (song) {
    chosenSongUrl.value = song.url;
    console.log("Chosen Song URL:", chosenSongUrl.value);
  } else {
    errorMessage.value = `Song "${chosenSongUrl.value}.mp3" not found in Firebase Storage.`;
  }
};

const playSong = (url) => {
  if (audio.value) {
    audio.value.pause();
  }

  audio.value = new Audio(url);
  audio.value.volume = songVolume.value;
  console.log('Current audio volume:', audio.value.volume);

  audio.value.loop = true; // Option 1: Set loop to true for automatic looping

  audio.value.play();
  isPlaying.value = true;

  audio.value.onended = () => {
    isPlaying.value = false;
  };
};

// Play the chosen song
const playChosenSong = () => {
  if (!chosenSongUrl.value) {
    errorMessage.value = "Chosen song not available.";
    return;
  }
  playSong(chosenSongUrl.value);
};

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
  await fetchSongs();
  getRandomMessage();
  startMindfulTimer();
  playChosenSong()
  startTime.value = localTimeLeft.value; // Ensure startTime is initialized
});

// Clean up timer on component unmount
onBeforeUnmount(() => {
  if(localTimeLeft.value > 0) {
    stopTimer();
    audio.value.pause();
  }
});
</script>

<template>
  <Dialog :open="show" @onOpenChange="emit('close')" style="position: relative;">
    <DialogContent class="p-0 m-0 min-w-[100dvw] min-h-[100dvh] bg-black border-none rounded-none">
      <DialogTitle class="hidden"></DialogTitle>
      <div class="blackout-content">
        <!-- Display mindful message -->
        <div class="mindful-msg-container">
          <h2 class="mindful-msg">{{ randomMessage }}</h2>
        </div>
        <!-- Timer and animation placeholder -->
        <div class="timer-container">
          <div class="timer text-white">{{ formattedTime }}</div>
        </div>
        
        <!-- Breathing Animation -->
        <div class="animation-container">
            <div :class="['anim-circle', { 'paused': !isAnimating, 'reset': !isAnimating }]">
              <!-- <div class="text-container">{{ currentText }}</div> -->
            </div>
          </div>

        <div class="button-container">
            <Button variant="ghost" class="exit-button" @click="emit('close')">Exit</Button>
        </div>

        <ringtoneComponent ref="ringtonePlayerRef"/>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.blackout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100dvh;
  padding: 2dvh 0;
}

.mindful-msg-container {
  text-align: center;
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 1vh;
  max-width: 85dvw;
}
.mindful-msg{
    font-size: 15px;
    color: white;
}

.text-container {
  font-size: 14px;
  font-weight: semi-bold;

}

.timer-container {
  text-align: center;
  padding: auto;
  margin-bottom: auto;
}

.timer {
  font-size: max(30px,4dvw);
  font-weight: semi-bold;
  
  color: white;
}

.exit-button {
  color: white;
  font-size: 1.3rem;
}
.button-container {
  margin-top: auto;
  padding-top: auto;
  text-align: center;
}

.animation-container {
  position: relative;
  height: min(250px, 60vh);
  width: min(250px, 80vw);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10vh 0;
}

.anim-circle {
  width: min(60px, 18vw);
  height: min(60px, 18vw);
  border-radius: 50%;
  background: rgba(188, 237, 243, 0.889);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  animation: breathe 14s ease-in-out infinite;
}

.anim-circle.reset {
  animation: none;
  transform: scale(1);
  box-shadow: 0 0 0 min(15px, 4vw) rgba(188, 237, 243, 0.3),
              0 0 0 min(30px, 8vw) rgba(188, 237, 243, 0.3),
              0 0 0 min(45px, 12vw) rgba(188, 237, 243, 0.3),
              0 0 0 min(60px, 16vw) rgba(188, 237, 243, 0.3),
              0 0 0 min(75px, 20vw) rgba(188, 237, 243, 0.3);
}

.text-container {
  font-size: min(12px, 3vw);
  font-weight: 500;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 min(10px, 3vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(20px, 6vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(30px, 9vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(40px, 12vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(50px, 15vw) rgba(188, 237, 243, 0.3);
  }
  50% {
    transform: scale(1.5);
    box-shadow: 0 0 0 min(15px, 4.5vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(30px, 9vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(45px, 13.5vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(60px, 18vw) rgba(188, 237, 243, 0.3),
                0 0 0 min(75px, 22.5vw) rgba(188, 237, 243, 0.3);
  }
}


</style>
