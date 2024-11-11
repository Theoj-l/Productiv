<script setup>
    import { ref, computed, watch } from 'vue';
    import { cn } from '@/lib/utils';

    import { Switch } from '@/components/ui/switch';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label'
    import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
    import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@/components/ui/number-field'
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Separator } from '@/components/ui/separator';
    import { Slider } from '@/components/ui/slider';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from '@/components/ui/select'

    import tsHoverCard from '@/components/PomoPageComp/tsHoverCard.vue';
    import { useUserStore } from '@/stores/UserObjStore.js';

const userStore = useUserStore()
const timerObj = useUserStore().timerObj;

const pomoTimer = computed(() => useUserStore().timerObj.pomo_timer);
const shortBreakTimer = computed(() => useUserStore().timerObj.short_break_timer);
const longBreakTimer = computed(() => useUserStore().timerObj.long_break_timer);
const breakIntervals = computed(() => useUserStore().timerObj.break_intervals);

const autoStartPomo = computed(() => useUserStore().timerObj.auto_start_pomo);
const autoStartBreak = computed(() => useUserStore().timerObj.auto_start_break);

const chosenRingtone = computed(() => useUserStore().timerObj.chosen_ringtone);
const ringtoneVolume = computed(() => useUserStore().timerObj.ringtone_volume);

const enableReminders = computed(() => useUserStore().timerObj.enable_reminders);
const enableMessages = computed(() => useUserStore().timerObj.enable_messages);
const chosenMessages = computed(() => useUserStore().timerObj.chosen_messages);

const setPomodoroTime = ref(pomoTimer.value);
watch(setPomodoroTime, (newVal) => {
        timerObj.pomo_timer = newVal;
        console.log('Pomodoro time is now: ', timerObj.pomo_timer);

        if (timerObj.current_timer_type === 'pomodoro') {
            timerObj.current_time_left = newVal * 60;
            timerObj.has_ran_state = false;
            console.log('In pomodoro mode now, current time set to: ', timerObj.current_time_left);
        }
});

const setShortBreakTime = ref(shortBreakTimer.value);
watch(setShortBreakTime, (newVal) => {
        timerObj.short_break_timer = newVal;
        console.log('Short Break time is now: ', timerObj.short_break_timer);

        if (timerObj.current_timer_type === 'shortbreak') {
            timerObj.current_time_left = newVal * 60;
            timerObj.has_ran_state = false;
            console.log('In shortbreak mode now, current time set to: ', timerObj.current_time_left);
        }
});

const setLongBreakTime = ref(longBreakTimer.value);
watch(setLongBreakTime, (newVal) => {
        timerObj.long_break_timer = newVal;
        console.log('Long Break time is now: ', timerObj.long_break_timer);

        if (timerObj.current_timer_type === 'longbreak') {
            timerObj.current_time_left = newVal * 60;
            timerObj.has_ran_state = false;
            console.log('In longbreak mode now, current time set to: ', timerObj.current_time_left);
        }
});

const setBreakIntervals = ref(breakIntervals.value);
watch(setBreakIntervals, (newVal) => {
        timerObj.break_intervals = newVal;
        console.log('Break Intervals time is set to: ', newVal);
        console.log('Break Intervals time is now: ', timerObj.break_intervals);
});

const setAutoStartPomo = ref(autoStartPomo.value);
watch(setAutoStartPomo, (newVal) => {
        userStore.timerObj.auto_start_pomo = newVal;
        console.log('Enable Auto Start Pomo is set to: ', newVal);
        console.log('Enable Auto Start Pomo is now: ', timerObj.auto_start_pomo);
});

const setAutoStartBreak = ref(autoStartBreak.value);
watch(setAutoStartBreak, (newVal) => {
        timerObj.auto_start_break = newVal;
        console.log('Enable Auto Start Break is set to: ', newVal);
        console.log('Enable Auto Start Break is now: ', timerObj.auto_start_break);
});

const setChosenRingtone = ref(chosenRingtone.value);
watch(setChosenRingtone, (newVal) => {
        timerObj.chosen_ringtone = newVal;
        console.log('Chosen Ringtone is set to: ', newVal);
        console.log('Chosen Ringtone is now: ', timerObj.chosen_ringtone);
});

const setRingtoneVolume = ref(ringtoneVolume.value);
watch(setRingtoneVolume, (newVal) => {
        timerObj.ringtone_volume = newVal;
        console.log('Ringtone Volume is set to: ', newVal);
        console.log('Ringtone Volume is now: ', timerObj.ringtone_volume);
});

const setEnableReminders = ref(enableReminders.value);
watch(setEnableReminders, (newVal) => {
        timerObj.enable_reminders = newVal;
        console.log('Enable Reminders is set to: ', newVal);
        console.log('Enable Reminders is now: ', timerObj.enable_reminders);
});

const setEnableMessages = ref(enableMessages.value);
watch(setEnableMessages, (newVal) => {
        timerObj.enable_messages = newVal;
        console.log('Enable Messages is set to: ', newVal);
        console.log('Enable Messages is now: ', timerObj.enable_messages);
});

const setChosenMessages = ref(chosenMessages.value);
watch(setChosenMessages, (newVal) => {
        timerObj.chosen_messages = newVal;
        console.log('Set Messages is now set to: ', newVal);
        console.log('Set Messages is now: ', timerObj.chosen_messages);
});

    function handleClick() {
        console.log("Timer Settings Opened");
    }

    // For (2a) ringtone dropdown selection - to hardcode
    const ringtones = [
    { value: 'Ringtone 1', label: 'Ringtone 1' },
    { value: 'Ringtone 2', label: 'Ringtone 2' },
    { value: 'Ringtone 3', label: 'Ringtone 3' },
    { value: 'Ringtone 4', label: 'Ringtone 4' },
    { value: 'none', label: 'No Ringtone' },
    ];

    // Track popover and selected ringtone
    const isRingtoneOpen = ref(false)
    // const selectedRingtone = ref(chosenRingtone.value)
    // Function to handle ringtone selection
    function onRingtoneSelect(ringtone) {
        setChosenRingtone.value = ringtone;
        isRingtoneOpen.value = false
        console.log(ringtone, 'is set')
    }

// [FB] Calls UserObjStore's action to update settings in FB
    function checkUpdates() {
        console.log('for checking saved settings', useUserStore().timerObj);
        (async () => {
                try {
                    await userStore.updateTimerObj('9WEscS3MXxelfRDj72brRwpG8Wf2'); 
                    // !!! not to hardcode the userId
                    console.log('Timer updated successfully');
                } catch (error) {
                    console.error('Error updating timer:', error);
                }
        })();
    }

</script>

<template>
    <!-- formatting for viewing component -->
    <!-- <div class="m-20 items-center justify-center w-full relative"> -->

            <Dialog>
                <DialogTrigger as-child>
                    <Button variant="ghost" class="timer-settings-button" @click="handleClick">
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
                    <DialogDescription class="hidden"></DialogDescription>
                    <DialogHeader class="p-6 pb-0">
                        <DialogTitle class="text-2xl font-[500]">Timer Settings</DialogTitle>
                    </DialogHeader>

                    <!-- start of timer settings dialog content -->
                        <div class="grid gap-4 py-4 overflow-y-auto px-6"> 

                        <!-- (1) Timer Segment -->
                        <div>
                            <Separator class="mb-2" label="Timer" />
                        </div>

                            <!-- (1a) Pomo settings -->
                            <div class="flex items-center">
                                <Label class="timer-settings-label" for="pomodoro_minutes">Pomodoro</Label>
                
                                <NumberField id="pomodoro_minutes" v-model="setPomodoroTime" :default-value="30" :min="1" :max="99">
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                            <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>

                            <!-- (1b) Short break settings -->
                            <div class="flex items-center">
                                <Label class="timer-settings-label" for="short_break_minutes">Short Break</Label>
                                <NumberField id="short_break_minutes" v-model="setShortBreakTime" :default-value="5" :min="1" :max="99">
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                            <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>

                            <!-- (1c) Long break settings -->
                            <div class="flex items-center">
                                <Label class="timer-settings-label" for="long_break_minutes">Long Break</Label>
                                <NumberField id="long_break_minutes" v-model="setLongBreakTime" :default-value="15" :min="1" :max="99">
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                            <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>

                            <!-- (1d) Break intervals settings -->
                            <!-- to add 'i' hover card for explaining -->
                            <div class="flex items-center">
                                <Label class="timer-settings-label" for="break_intervals">Break Intervals</Label>
                                <NumberField id="break_intervals" v-model="setBreakIntervals" :default-value="5" :min="1" :max="30">
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                            <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>

                        <!-- (2) Sound Segment -->
                            <div class="flex items-center  h-10">
                                <Label class="timer-settings-label">Ringtone</Label>
                                    <Select @update:modelValue="onRingtoneSelect">
                                    <SelectTrigger class="w-[130px] justify-center ml-auto">
                                        <SelectValue :placeholder="'Select Ringtone'"/>
                                    </SelectTrigger>
                                    <SelectContent align="start">
                                        <SelectGroup>
                                        <SelectItem value="Ringtone 1">
                                            Ringtone 1
                                        </SelectItem>
                                        <SelectItem value="Ringtone 2">
                                            Ringtone 2
                                        </SelectItem>
                                        <SelectItem value="Ringtone 3">
                                            Ringtone 3
                                        </SelectItem>
                                        <SelectItem value="Ringtone 4">
                                            Ringtone 4
                                        </SelectItem>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                    </Select>
                            </div>
                            <!-- (2b) Ringtone volume settings -->
                            <div class="flex items-center h-10">
                                <Label class="timer-settings-label min-w-[60%]" for="ringtone_slider">Ringtone Volume</Label>
                                <Slider id="ringtone_slider" class="max-w-[40%]"
                                    v-model="setRingtoneVolume"
                                    :default-value="[33]" 
                                    :max="100"
                                    :step="1"
                                    :class="cn('w-3/5', $attrs.class ?? '')"
                                />
                            </div>

                        <!-- (3) Motivation Segment -->
                        <div>
                            <Separator class="mb-2" label="Motivation" />
                        </div>
                            <!-- (3a) Focus Reminders Pomo settings -->
                            <div class="flex items-center h-10">
                                <div class="align-center">
                                    <Label class="timer-settings-label" for="focus_reminders">Focus Reminders</Label>
                                    <tsHoverCard>
                                        <template #button-text>?</template>
                                        <template #title>Stay focused</template>
                                        <template #content>We will notify you if you leave this page during a Pomodoro session. 
                                            <br><br>
                                            Ensure notifications are enabled.</template>
                                    </tsHoverCard>
                                </div>
                                <Switch class="ml-auto mr-1" id="focus_reminders"
                                :checked="setEnableReminders"
                                @update:checked="(v) => setEnableReminders = v"
                                ></Switch>
                            </div>

                            <!-- (3b) Select Motivational Message Pomo settings -->
                            <div class="flex items-center h-10">
                                <div class="align-center">
                                    <Label class="timer-settings-label" for="motivation_messages">Motivation Messages</Label>
                                    <tsHoverCard>
                                        <template #button-text>?</template>
                                        <template #title>Stay motivated</template>
                                        <template #content>Motivational messages will be displayed during your Pomodoro session. 
                                            <br><br>
                                        Create your own messages in your profile.
                                        </template>
                                    </tsHoverCard>
                                </div>
                                <Switch class="ml-auto mr-1" id="motivation_messages"
                                :checked="setEnableMessages"
                                @update:checked="(v) => setEnableMessages = v"
                                ></Switch>
                            </div>
                        </div> 
                    <!-- end of timer settings dialog content -->

                    <DialogFooter class="p-4 pt-3">
                        <DialogClose as-child>
                            <Button type="button" variant="secondary" @click="checkUpdates">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

        <!-- formatting for viewing component -->
        <!-- </div> -->

</template>

<style scoped>
        .timer-settings-button {
            padding: 0px;
            height: 30px;
            width: 30px;
            z-index: 10;
        }
        .timer-settings-label  {
            width: 50%;
            font-size: 18px;
            font-weight: 400;
        }
    </style>