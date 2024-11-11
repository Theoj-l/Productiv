<!-- SEMI-FINAL Music drawercard, updated @ 1.57pm -->
<script setup>
// Timer Settings Hover Card Component
// Parent: timerSettingsCard.vue
// Children: NA

// IMPORTS ---------------------------
// PRIMARY COMPONENTS ---------------------------
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/main"; // Import Firebase storage setup
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-vue-next';

const songs = ref([]);
const currentSongIndex = ref(0);
const isPlaying = ref(false);
const progress = ref([0]);
const audioDuration = ref(0);
const artistName = ref("Artist Name");
const currentArtistImage = ref("");
const source = ref("ownMusic");
const volume = ref([1]);
const isOpen = ref(false);
const isShuffled = ref(false);
const repeatMode = ref(0); // 0: no repeat, 1: repeat once, 2: repeat forever
const error = ref(null);

const currentSongUrl = computed(() => {
  return source.value === "ownMusic" && songs.value.length > 0 ? songs.value[currentSongIndex.value].songUrl : "";
});

const currentSongName = computed(() => {
  return source.value === "ownMusic" && songs.value.length > 0 ? songs.value[currentSongIndex.value].name : "No Song";
});

const currentSongImage = computed(() => {
  return source.value === "ownMusic" && songs.value.length > 0 ? songs.value[currentSongIndex.value].pictureUrl : "";
});

const audioPlayer = ref(null);

const fetchSongs = async () => {
  const songsFolder = storageRef(storage, "mindful_music/mindful_songs/");
  const picturesFolder = storageRef(storage, "mindful_music/mindful_pictures/");
  const artistPicturesFolder = storageRef(storage, "mindful_music/artists/");

  try {
    const songList = await listAll(songsFolder);

    const fetchedSongs = await Promise.all(
      songList.items.map(async (songFile) => {
        const songUrl = await getDownloadURL(songFile);
        const pictureFilename = songFile.name.replace(".mp3", ".png");

        const pictureUrl = await getDownloadURL(
          storageRef(picturesFolder, pictureFilename)
        ).catch(() => null);

        const artistPictureFilename = songFile.name.replace(".mp3", "_artist.jpg");
        const artistImageUrl = await getDownloadURL(
          storageRef(artistPicturesFolder, artistPictureFilename)
        ).catch(() => null);

        return {
          name: songFile.name.replace(".mp3", ""),
          songUrl,
          pictureUrl,
          artistImageUrl
        };
      })
    );

    songs.value = fetchedSongs;
    currentSongIndex.value = 0;

    if (songs.value.length > 0) {
      currentArtistImage.value = songs.value[currentSongIndex.value].artistImageUrl || "";
      artistName.value = songs.value[currentSongIndex.value].name.split(" - ")[0] || "Unknown Artist";
    }
  } catch (err) {
    console.error("Error fetching songs or pictures:", err);
    error.value = "Failed to load songs. Please try again later.";
  }
};

const playPause = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

const updateProgress = () => {
  if (!audioPlayer.value) return;
  
  progress.value = [audioPlayer.value.currentTime];
  audioDuration.value = audioPlayer.value.duration;
};

const seek = (newProgress) => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = newProgress[0];
  }
};


const nextSong = () => {
  if (source.value === "ownMusic" && songs.value.length > 0) {
    if (isShuffled.value) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * songs.value.length);
      } while (newIndex === currentSongIndex.value && songs.value.length > 1);
      currentSongIndex.value = newIndex;
    } else {
      currentSongIndex.value = (currentSongIndex.value + 1) % songs.value.length;
    }
    console.log(`Next song: ${currentSongIndex.value}, Shuffled: ${isShuffled.value}`);
    updateCurrentSong();
  }
};

const prevSong = () => {
  if (source.value === "ownMusic" && songs.value.length > 0) {
    if (isShuffled.value) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * songs.value.length);
      } while (newIndex === currentSongIndex.value && songs.value.length > 1);
      currentSongIndex.value = newIndex;
    } else {
      currentSongIndex.value = (currentSongIndex.value - 1 + songs.value.length) % songs.value.length;
    }
    console.log(`Previous song: ${currentSongIndex.value}, Shuffled: ${isShuffled.value}`);
    updateCurrentSong();
  }
};

const updateCurrentSong = () => {
  progress.value = [0];
  currentArtistImage.value = songs.value[currentSongIndex.value].artistImageUrl || "";
  artistName.value = songs.value[currentSongIndex.value].name.split(" - ")[0] || "Unknown Artist";
  
  // Ensure the audio source is updated before playing
  nextTick(() => {
    if (audioPlayer.value) {
      audioPlayer.value.load();
      if (isPlaying.value) {
        audioPlayer.value.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    }
  });
};


const updateVolume = (newVolume) => {
  volume.value = newVolume;
  if (audioPlayer.value) {
    audioPlayer.value.volume = newVolume[0];
  }
};

const toggleShuffle = () => {
  isShuffled.value = !isShuffled.value;
  console.log(`Shuffle toggled: ${isShuffled.value}`);
};


 // 0: no repeat, 1: repeat indefinitely, 2: repeat once

const toggleRepeat = () => {
  repeatMode.value = repeatMode.value === 0 ? 1 : 0;
};

const handleSongEnd = () => {
  if (repeatMode.value === 1) {
    // Repeat indefinitely
    audioPlayer.value.currentTime = 0;
    audioPlayer.value.play().catch(error => {
      console.error("Error playing audio:", error);
    });
  } else {
    // No repeat, play next song
    nextSong();
  }
};



onMounted(() => {
  fetchSongs();
});

watch(currentSongUrl, () => {
  if (audioPlayer.value) {
    audioPlayer.value.load();
    if (isPlaying.value) {
      audioPlayer.value.play();
    }
  }
});

watch(isShuffled, (newValue) => {
  console.log(`Shuffle state changed: ${newValue}`);
});

</script>

<template>


<Drawer class="w-100%">
    <DrawerTrigger as-child>
      <Button variant="ghost" class="music-drawer-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z" clipRule="evenodd" />
      </svg>
      </Button>
    </DrawerTrigger>
    <DrawerContent>
      <div class="mx-auto w-100%">
        <DrawerHeader>
          <DrawerTitle class="hidden"></DrawerTitle>
          <DrawerDescription class="hidden"></DrawerDescription>
        </DrawerHeader>
        <div class="justify-content-center">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-else class="music-player">
          <div class="header-content">
              <div class="album-details">
                <img
                  v-if="currentSongImage"
                  :src="currentSongImage"
                  alt="Album Cover"
                  class="album-cover"
                />
                <div class="song-info">
                  <h2 class="song-title">{{ currentSongName }}</h2>
                  <p class="artist-name">{{ artistName }}</p>
                </div>
              </div>
            <DropdownMenu v-model:open="isOpen">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="menu-button absolute top-3 right-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-more"><circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
                    <span class="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <div class="volume-control">
                    <span>Volume</span>
                    <Slider
                      v-model="volume"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      @update:model-value="updateVolume"
                      class="volume-slider"
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div class="progress-slider">
            <Slider
              v-model="progress"
              :min="0"
              :max="audioDuration"
              :step="0.01"
              @update:model-value="seek"
            />
          </div>

          <div class="controls">
            <Button 
              @click="toggleShuffle" 
              variant="ghost" 
              size="icon"
              :class="shuffleButtonClass"
            >
              <Shuffle class="icon-control" />
              <span class="sr-only">{{ isShuffled ? 'Shuffle on' : 'Shuffle off' }}</span>
            </Button>
            <Button @click="prevSong" variant="ghost" size="icon" class="control-button">
              <SkipBack class="icon-control" />
            </Button>
            <Button @click="playPause" variant="outline" size="icon" class="play-pause-button">
              <Play v-if="!isPlaying" class="icon-control" />
              <Pause v-else class="icon-control" />
            </Button>
            <Button @click="nextSong" variant="ghost" size="icon" class="control-button">
              <SkipForward class="icon-control" />
            </Button>
            <Button 
              @click="toggleRepeat" 
              variant="ghost" 
              size="icon" 
              :class="{
                'text-primary bg-primary/10': repeatMode === 1,
                'hover:bg-primary/10': repeatMode === 0
              }"
            >
              <Repeat class="icon-control" />
            </Button>
            </div>

          <audio ref="audioPlayer" :src="currentSongUrl" @timeupdate="updateProgress" @ended="handleSongEnd"></audio>
        </div>
  </div>
        <DrawerFooter>
          <DrawerClose as-child>
            <Button variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<style scoped>

.music-drawer-button {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  box-shadow: none;
  margin: 0px;
  height: 40px;
  width: 40px;
  padding: 6px;
  border: solid 2px;
  border-radius: 50%;
  color: white;

  z-index: 99;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}

.music-player {
width: 100%;
height: 100%;
align-items: center;
background-color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.album-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.album-cover {
  width: 5rem;
  height: 5rem;
  border-radius: 0.5rem;
  object-fit: cover;
}

.song-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.song-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.artist-name {
  color: #4b5563;
  font-size: 0.875rem;
}

.menu-button{
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0;
    margin: 0;
    height: 30px;
    width: 30px;
    z-index: 999; /* Ensure button is above other elements */
}

.volume-control {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 0.2rem 0rem 0.5rem 0rem;
    cursor: pointer;
}

.volume-slider {
  width: 70%;
}

.progress-slider {
  width: 100%;
  margin: 1.5rem 0;
  cursor: pointer;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.control-button .icon-control,
.play-pause-button .icon-control,
.menu-button .icon-more {
  width: 1.5rem;
  height: 1.5rem;
}

.repeat-indicator {
  position: absolute;
  font-size: 0.75rem;
  top: 0;
  right: 0;
  background-color: var(--primary);
  color: white;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shuffleButtonClass {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}
/* -------------------------------------------- */

/* @media (max-width: 425px) {
  .music-drawer-button {
    position: absolute;
    bottom: 20%;
    right: 2rem;
    height: 60px;
    width: 60px;
    padding: 10px;
  }
} */

</style>