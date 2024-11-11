<!-- changed timer card min-height + font sizes for POMO TIMER NUMBER ALIGNMENT @ 11.48AM -->
<script setup>
import { ref, computed, watch } from 'vue';

import { Button } from '@/components/ui/button';    
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs'

import timerSettingsCard from '@/components/PomoPageComp/timerSettingsCard.vue';
import blackoutPopup from '@/components/PomoPageComp/blackoutPopup.vue';
import taskListCard from '@/components/TaskListComp/Tasklist.vue';
import musicPlayer from '@/components/MusicPlayerComp/musicPlayerFinal.vue';

// timer settings pop up card with button
import { useUserStore } from '@/stores/UserObjStore.js';
const userStore = useUserStore(); // may not need
const timerObj = useUserStore().timerObj;

const currTimerType = computed(() => useUserStore().timerObj.current_timer_type);

const currTab = computed(() => useUserStore().timerObj.current_tab);
const currTimeLeft = computed(() => useUserStore().timerObj.current_time_left);
const isRunning = computed(() => useUserStore().timerObj.is_running_state);
const hasRan = computed(() => useUserStore().timerObj.has_ran_state);

const currentTab = ref(currTimerType.value);

const pomoDisplay = ref(computed(() => {
    if (timerObj.current_timer_type === 'pomodoro') {
        return timerObj.has_ran_state ? secToMinTimeConverter(timerObj.current_time_left) : minToMinTimeConverter(timerObj.pomo_timer);

    }
    // in case of fail
    console.log('failed to change to original curr time left')
    return minToMinTimeConverter(timerObj.pomo_timer);
}));

const shortBreakDisplay = ref(computed(() => {
    if (timerObj.current_timer_type === 'shortbreak') {
        return timerObj.has_ran_state ? secToMinTimeConverter(timerObj.current_time_left) : minToMinTimeConverter(timerObj.short_break_timer);
    }
    // in case of fail
    return minToMinTimeConverter(timerObj.short_break_timer);
}));

const longBreakDisplay = ref(computed(() => {
    if (timerObj.current_timer_type === 'longbreak') {
        console.log('NOW @', timerObj.current_timer_type, '&', timerObj.has_ran_state, '&', timerObj.current_time_left)
        return timerObj.has_ran_state ? secToMinTimeConverter(timerObj.current_time_left) : minToMinTimeConverter(timerObj.long_break_timer);
    }
    // in case of fail
    return minToMinTimeConverter(timerObj.long_break_timer);
}));

// ensures that 
watch([
() => timerObj.current_time_left, 
() => timerObj.current_timer_type,
() => timerObj.pomo_timer, 
() => timerObj.short_break_timer, 
() => timerObj.long_break_timer], ([
    newTime, newType, newPomo, newShortBreak, newLongBreak]) => {

    // console.log('current_timer_type is now: ', timerObj.current_timer_type);

        if (!timerObj.has_ran_state) {
            if (newType === 'pomodoro') {
                // pomoDisplay.value = minToMinTimeConverter(newPomo);
                timerObj.current_time_left = timerObj.pomo_timer * 60;
                // console.log('current_time_left:', timerObj.current_time_left);
                currentTab.value = 'pomodoro';            
                console.log('currentTab should be pomo, is:', currentTab.value);    

            } else if (newType === 'shortbreak') {
                // shortBreakDisplay.value = minToMinTimeConverter(newShortBreak);
                timerObj.current_time_left = timerObj.short_break_timer * 60;
                // console.log('current_time_left:', timerObj.current_time_left);
                currentTab.value = 'shortbreak';        
                console.log('currentTab should be shortbreak, is:', currentTab.value);    

            } else if (newType === 'longbreak') {
                // longBreakDisplay.value = minToMinTimeConverter(newLongBreak);
                timerObj.current_time_left = timerObj.long_break_timer * 60;
                // console.log('current_time_left:', timerObj.current_time_left);
                currentTab.value = 'longbreak';         
                console.log('currentTab should be longbreak, is:', currentTab.value);    

            }
        }

});

// when changing tabs, current_left_time is set to the tab's set time
// display is changed too
function changeTimerType(type) {
    timerObj.current_timer_type = type;
    console.log('----- Timer type is now', timerObj.current_timer_type);

    if (timerObj.current_timer_type === 'pomodoro') {
        timerObj.current_time_left = timerObj.pomo_timer * 60;
        // pomoDisplay.value = minToMinTimeConverter(timerObj.pomo_timer);
        timerObj.has_ran_state = false;

    } else if (timerObj.current_timer_type === 'shortbreak') {
        timerObj.current_time_left = timerObj.short_break_timer * 60;
        // shortBreakDisplay.value = minToMinTimeConverter(timerObj.short_break_timer);
        timerObj.has_ran_state = false;

    } else if (timerObj.current_timer_type === 'longbreak') {
        timerObj.current_time_left = timerObj.long_break_timer * 60;
        // longBreakDisplay.value = minToMinTimeConverter(timerObj.long_break_timer);
        timerObj.has_ran_state = false;

    } else {
        console.log('Something is wrong, ', type, 'tab selected but this is the current pomo type', timerObj.current_timer_type)
        useUserStore().timerObj.current_time_left = 1500;
    }
}

//============== Converter functions

function secToMinTimeConverter(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function minToMinTimeConverter(timeInMinutes) {
    const minutes = timeInMinutes;
    const seconds = 0;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

</script>

<template>
    <div v-if="userStore.isLoading">
        <h1>loading...</h1>
    </div>

    <div v-else class="pomo-page-grid">
        <div class="task-list-card-container">
            <taskListCard/>
        </div>

        <!-- <div class="timer-card-player-container"> -->
            <Card class="timer-card relative">
                <Tabs v-model:modelValue="currentTab" class="h-full p-0 justify-center items-center">
                    <div class="h-full flex flex-col">
                        <CardHeader class="card-header-container w-full">
                            <TabsList class="grid w-full grid-cols-3">
                                <TabsTrigger class="tab-font" value="pomodoro" @click="changeTimerType('pomodoro')">
                                    Pomodoro
                                </TabsTrigger>
                                <TabsTrigger class="tab-font" value="shortbreak" @click="changeTimerType('shortbreak')">
                                    Short Break
                                </TabsTrigger>
                                <TabsTrigger class="tab-font" value="longbreak" @click="changeTimerType('longbreak')">
                                        Long Break
                                </TabsTrigger>
                            </TabsList>
                            <div class="absolute top-[64px] right-[14px] grid justify-items-end">
                                <timerSettingsCard/>
                            </div>
                        </CardHeader>

                        <div class="parent-timer-container">
                            <TabsContent value="pomodoro">
                                        <div class="timer-container">
                                            <div class="timer-number h-fit flex justify-center">
                                            {{pomoDisplay}}
                                            </div>    
                                            <div class="timer-buttons h-fit flex justify-center">
                                                <blackoutPopup/>
                                            </div>
                                        </div>
                            </TabsContent>

                            <TabsContent value="shortbreak">
                                <div class="timer-container">
                                            <div class="timer-number h-fit flex justify-center">
                                            {{shortBreakDisplay}}
                                            </div>    
                                            <div class="timer-buttons h-fit flex justify-center">
                                                <blackoutPopup/>
                                            </div>
                                        </div>
                            </TabsContent>

                            <TabsContent value="longbreak">
                                <div class="timer-container">
                                            <div class="timer-number h-fit flex justify-center">
                                            {{longBreakDisplay}}
                                            </div>    
                                            <div class="timer-buttons h-fit flex justify-center">
                                                <blackoutPopup/>
                                            </div>
                                        </div>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </Card>

                <div class="music-player">
                    <musicPlayer/>
                </div>
        </div>

    <!-- for testing -->
</template>

<style scoped>
        .pomo-page-grid{
            display: grid;   
            max-width: 100vw;
            max-height: 100vh;
            margin: auto;
            height: 100%;
            padding: 10px 10px;
            box-sizing: border-box;
        }
        .task-list-card-container {
            margin: 0;
            padding: 0px;
            height: 100%;
            grid-area: tl;
        }
        .timer-card{
            width: 100%;
            max-height: 100%;
            grid-area: tc;
        }
        .card-header-container {
            display: flex;
            flex-direction: column;
            padding: 8px 8px 0px 8px;
        }
        .parent-timer-container {
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: center;
            max-height: fit-content;
            margin: auto;
        }    

        .timer-container {
            height: fit-content;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
            justify-items: center;
            align-items: center;
        }

        .timer-number {
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            grid-area: 'tn';
        }
        .timer-buttons {
            grid-area: 'tb';
            display: flex;
            justify-content: center;
            align-items: center;
        }
        /* .play-button {
            width: 0;
            height: 0;
            margin: 0;
            padding: 0;

            border-left: 27px solid black; 
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            border-radius: 0;

            cursor: pointer;
            box-shadow: none;
        } */
        
        .reset-button {
            /* to ensure its close to the play button, no p or m for button */
            margin: 0;
            padding: 8px;

            font-weight: bold;
            font-size: x-large;

            color: black;
            box-shadow: none;
        }

        .music-player {
            height: 100%;
            width: 100%;
            grid-area: mp;
        }

        @media (min-width: 350px) {
            .pomo-page-grid{        
            grid-template: 
            "tc"
            "tl"
            "mp";
            grid-template-rows: max(350px, 40dvh);
            overflow-y: auto;
            padding: 10px;
            gap: 20px;
            margin: 0px;
            }
            .timer-number {
                font-size: 100px;
                height: min(20dvw, 140px);
            }
        }

        @media (min-width: 400px) {
            .timer-number {
                font-size: max(20dvw, 110px);
                height: min(20dvw, 140px);
            }
        }

        @media (min-width: 500px) {
            .pomo-page-grid{        
            padding: 20px;
            }
        }

        @media (min-width: 750px) {
            .pomo-page-grid{        
            grid-template: 
            "tc mp"
            "tl tl";
            }
            .timer-number {
                font-size: min(110px, 14dvh);
                height: 110px;
            }
        }

        @media (max-width: 800px) {
            .tab-font {
            font-size: medium;
        }
        }

        @media (min-width: 1000px) {
            .pomo-page-grid{        
            grid-template: 
            "tl tc"
            "tl mp";
            grid-template-columns: 4fr 3fr;
            grid-template-rows: 4fr 3fr;
            gap: 20px;
            padding: 20px;
            box-sizing: border-box;
            }
            .timer-number {
                font-size: 15dvh;
            }
        }

        @media (min-width: 1200px) {
            .pomo-page-grid{        
            grid-template: 
            "tl tc"
            "tl mp";
            grid-template-columns: 4fr 3fr;
            grid-template-rows: 4fr 2fr;
            gap: 20px;
            padding: 20px 40px;
            box-sizing: border-box;
            }
            .timer-number {
                font-size: 17dvh;
            }
            .timer-container {
                gap: min(3dvh);
            }
        }

        @media (min-width: 1300px) {
            .pomo-page-grid{        
            grid-template: 
            "tl tc"
            "tl mp";
            grid-template-columns: 6fr 4fr;
            grid-template-rows: 4fr 2fr;
            gap: 20px;
            padding: 20px 50px;
            box-sizing: border-box;
            }
            .timer-number {
                font-size: 17dvh;
            }
        }


</style>