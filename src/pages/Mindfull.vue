<script setup>
import { ref, watch, computed } from 'vue';
import { useUserStore } from '@/stores/UserObjStore';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import MindfulPopup from '@/components/MindfulPageComp/MindfulPopup.vue';
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldInput, NumberFieldIncrement } from '@/components/ui/number-field';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from '@/components/ui/select'

const userStore = useUserStore();
const showPopup = ref(false);
const setMindfulTime = ref(userStore.timerObj.mindful_timer);
const ringtoneVolume = computed(() => useUserStore().timerObj.ringtone_volume);
const musicVolume = computed(() => useUserStore().mindful_song_volume);
const chosenMusic = computed(() => useUserStore().chosen_mindful_music);

// Sync mindful time with userStore when adjusted
watch(setMindfulTime, (newVal) => {
    userStore.timerObj.mindful_timer = newVal;
});

const setRingtoneVol = ref(ringtoneVolume.value);
watch(setRingtoneVol, (newVal) => {
    useUserStore().timerObj.ringtone_volume = newVal;
        console.log('Ringtone Volume is set to: ', newVal);
        console.log('Ringtone Volume is now: ', useUserStore().timerObj.ringtone_volume);
});

const setMusicVol = ref(musicVolume.value);
watch(setMusicVol, (newVal) => {
    useUserStore().mindful_song_volume = newVal;
        console.log('Music Volume is set to: ', newVal);
        console.log('Music Volume is now: ', useUserStore().mindful_song_volume);
});

const openMindfulPopup = () => {
    showPopup.value = true;
};

  function onTrackSelect(track) {
      useUserStore().chosen_mindful_music = track;
      console.log(track, 'has been set');
  }
</script>

<template>
  <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  </head>
  <div class="mindful-page">
    <MindfulPopup v-if="showPopup" :show="showPopup" @close="showPopup = false" />

    <Card class="mindful-timer-card border-0 bg-none shadow-none">
      <CardHeader class="mindful-card-header relative">
        <CardTitle class="header-text">Mindfull</CardTitle>
        <CardDescription class="description-text">Set your desired time and begin.</CardDescription>
          
        
        <Dialog>
          <DialogTrigger as-child>
              <Button variant="ghost" class="mindful-setting-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="icon-more">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                  </svg>
                  <span class="sr-only">More options</span>
              </Button>
          </DialogTrigger>

        <DialogContent class="w-[90vw] max-w-[420px] grid-rows-[auto_minmax(0,1fr)_auto] p-2 gap-1 max-h-[90dvh]">
            <DialogTitle class="hidden"></DialogTitle>
            <DialogDescription class="hidden"></DialogDescription>

            <DialogHeader class="p-6 pb-0">
                <DialogTitle class="text-2xl font-[500]">Mindfull Settings</DialogTitle>
            </DialogHeader>

            <div class="grid gap-4 py-4 overflow-y-auto px-6"> 
<!--  -->

              <!-- (1) Ringtone Segment -->
              <div>
                  <Separator class="mb-2" label="Ringtone" />
              </div>

              <div class="flex items-center h-10">
                  <Label class="timer-settings-label" for="ringtone">Ringtone Volume</Label>
                  <Slider id="ringtone" class="w-[50%]"
                      v-model="setRingtoneVol"
                      :default-value="[33]" 
                      :max="100"
                      :step="1"
                  />
              </div>

              <!-- (2) Music Segment -->
              <div>
                  <Separator class="mb-2" label="Music" />
              </div>

              <div class="flex items-center h-10">
                  <Label class="timer-settings-label" for="volume">Music Volume</Label>
                  <Slider id="volume" class="w-[50%]"
                      v-model="setMusicVol" 
                      :default-value="[33]" 
                      :max="100"
                      :step="1"
                  />
              </div>

              <div class="flex items-center h-10">
                <Label class="timer-settings-label" for="ringtone_s">Track</Label>
                    <Select @update:modelValue="onTrackSelect">
                      <SelectTrigger class="w-[130px] justify-center ml-auto">
                        <SelectValue :placeholder="chosenMusic || 'Select Track'" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectGroup>
                          <SelectItem value="Track 1">
                            Track 1
                          </SelectItem>
                          <SelectItem value="Track 2">
                            Track 2
                          </SelectItem>
                          <SelectItem value="Track 3">
                            Track 3
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
            </div>

<!--  -->
            </div>

            <DialogFooter class="p-4 pt-3">
                <DialogClose as-child>
                    <Button type="button" variant="secondary">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>

          </DialogContent>
          </Dialog>
      </CardHeader>

      <CardContent>
        <div class="mindful-time-settings">
            <NumberField v-model="setMindfulTime" :min="1" :max="99" :default-value="5">
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput class="num-field-text" />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
      </CardContent>
      <CardFooter class="flex justify-center">
        <Button variant="ghost" class="mindful-play-button" @click="openMindfulPopup">
          <i class="fa fa-play" style="font-size: 45px;"></i>
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
.timer-settings-label  {
    width: 50%;
    text-wrap: wrap;
    font-size: 18px;
    font-weight: 400;
}

.mindful-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100dvh - 70px);
  overflow: hidden;
}

.mindful-timer-card {
  width: max(400px, 30dvw);
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
  max-height: calc(100dvh - 80px);
  display: flex;
  flex-direction: column;
}

.mindful-card-header {
  text-align: center;
}

.header-text {
  font-size: max(5dvw, 60px);
  font-weight: 400;
}

.description-text {
  font-size: 100%;
}

.num-field-text {
  font-size: large;
}

.mindful-time-settings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.mindful-setting-button {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 0px;
  height: 30px;
  width: 30px;
  z-index: 10;
}

.mindful-label {
  color: #333;
  font-size: 1rem;
  font-weight: bold;
}

.mindful-play-button {
  width: 66px;
  height: 66px;
}

/* .old-mindful-play-button {
  width: 0;
  height: 0;
  border-left: 35px solid #333;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
  cursor: pointer;

  margin-top: 20px;
  margin-left:auto;
  margin-right:auto;
} */
</style>