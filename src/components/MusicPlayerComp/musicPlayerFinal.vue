<!-- FINAL Music Player, updated @ 4.04am -->
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/main"; // Assuming Firebase storage setup is in main.js
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-vue-next';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

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
const repeatMode = ref(0); // 0: no repeat, 1: repeat indefinitely
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

const toggleRepeat = () => {
  // Cycle through the three states
  repeatMode.value = 1;
};

const handleSongEnd = () => {
   if (repeatMode.value === 1) {
    // Repeat once then return to normal
    audioPlayer.value.currentTime = 0;
    audioPlayer.value.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    repeatMode.value = 0; // Reset to normal mode after repeating once
  } else {
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

const shuffleButtonClass = computed(() => ({
  'bg-black text-white': true,
  'bg-gray-700': isShuffled.value
}));

const repeatButtonClass = computed(() => ({
  'bg-black text-white': true,
  'bg-gray-700': repeatMode.value === 1
}));
</script>

<template>
  <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  </head>
  <Card class="music-player">
    <CardHeader class="hidden">
      <CardTitle class="hidden"></CardTitle>
    </CardHeader>
    <CardContent class="card-content">
      <div class="button-group">
        <DropdownMenu v-model:open="isOpen">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="menu-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon-more">
                <circle cx="12" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
              </svg>
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

        <div class="controls flex items-center justify-center gap-4">
        <Button 
          @click="toggleShuffle" 
          variant="ghost" 
          size="icon"
          class="media-button"
          :class="{ 'active': isShuffled }"
        >
          <!-- <Shuffle class="h-5 w-5" /> -->
          <i class="fa-sharp fa-solid fa-shuffle" style="font-size: 35px;"></i>          
          <span class="sr-only">{{ isShuffled ? 'Shuffle on' : 'Shuffle off' }}</span>
        </Button>
        <Button @click="prevSong" variant="ghost" size="icon" class="media-button">
          <!-- <SkipBack class="h-5 w-5" /> -->
          <i class="fa fa-backward" style="font-size: 35px;"></i>
        </Button>
        <Button @click="playPause" variant="ghost" size="icon" class="media-button play-pause-button">
          <!-- <Play v-if="!isPlaying" class="h-5 w-5" /> -->
          <!-- <Pause v-else class="h-5 w-5" /> -->
          <i v-if="!isPlaying" class="fa fa-play" style="font-size: 35px;"></i>
          <i v-else class="fa fa-pause" style="font-size: 35px;"></i>
        </Button>
        <Button @click="nextSong" variant="ghost" size="icon" class="media-button">
          <!-- <SkipForward class="h-5 w-5" /> -->
          <i class="fa fa-forward" style="font-size: 35px;"></i>
        </Button>
        <Button 
          @click="toggleRepeat" 
          variant="ghost" 
          size="icon" 
          class="media-button repeat-button"
          :class="{ 'active': repeatMode > 0 }"
        >
          <div class="repeat-container">
            <!-- <Repeat class="h-5 w-5" /> -->
            <span v-if="repeatMode === 1" class="repeat-once">1</span>
          </div>
        </Button>
      </div>

        <audio ref="audioPlayer" :src="currentSongUrl" @timeupdate="updateProgress" @ended="handleSongEnd"></audio>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  margin: 0;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}

.music-player {
  width: 100%;
  height: 100%;
  background-color: white;
}

.header-content {
  display: flex;
  position: relative;
  justify-content: space-between;
}

.album-details {
  display: flex;
  flex-direction: row;
  align-items: start;
  gap: 0.75rem;
}

.album-cover {
  width: 5rem;
  height: 5rem;
  border-radius: 0.5rem;
  object-fit: cover;
}

.song-info {
  margin: 4px 0px 0px 4px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.song-title {
  font-size: 20px;
  font-weight: 600;
}

.artist-name {
  margin-top: 0px;
  padding-top: 0px;
  color: #4b5563;
  font-size: 16px;
}

.menu-button {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 0px;
  height: 30px;
  width: 30px;
  z-index: 10;
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
  margin: 1.5rem 0;
  cursor: pointer;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: min(50px, 3dvh);
}

.control-button .icon-control,
.play-pause-button .icon-control,
.menu-button .icon-more {
  width: fit-content;
  height: fit-content;
}

@media (min-width: 425px) {
  .card-content {
    width: 100%;
    height: 100%;
    padding: 1.4rem 1.4rem 1.2rem 1.4rem;
    margin: 0;
  }

  .album-details {
    display: flex;
    flex-direction: column;
    align-items: start;
    height: 100%;
    width: 100%;
    padding: 0;
  }

  .album-cover {
    height: 6rem;
    width: 6rem;
  }
}

@media (min-width: 800px) {
  .album-details {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 0;
  }

  .song-info {
    margin: 4px 0px 0px 4px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .song-title {
    font-size: 20px;
    font-weight: 600;
  }

  .album-cover {
    height: 95px;
    width: 95px;
  }

  .progress-slider {
    margin: 34px 6px 32px 0px;
  }
}

@media (min-width: 1000px) {
  .album-details {
    display: flex;
    flex-direction: row;
    align-items: start;
    height: 100%;
    width: 100%;
    padding: 0;
  }
  .song-title {
    font-size: min(2dvw, 22px);
    font-weight: 600;
    max-width: 100%;
    margin-bottom: 0px;
  }

  .album-cover {
    height: 100px;
    width: 100px;
  }
}

.media-button {
  /* background: black; */
  transition: all 0.2s ease-in-out;
  padding: 0px;
}

.media-button.active {
  /* background: #6A5ACD; */
}

.play-pause-button {
  border-color: white;
}

.repeat-button {
  position: relative;
}

.repeat-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.repeat-once {
  position: absolute;
  top: -8px;
  right: -8px;
  /* background: #8A7FFF; */
  color: white;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding-bottom: 1px; /* Slight adjustment for vertical centering */
}
</style>