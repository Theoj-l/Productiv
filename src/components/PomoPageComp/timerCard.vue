<script setup>
// Timer Card Component (child component)
// Parent: PomodoroMain.vue
// Children: timerSettingsCard.vue > tsHoverCard.vue

// IMPORTS ---------------------------
    import { ref, computed } from 'vue';
    import { cn } from '@/lib/utils'

// PRIMARY COMPONENTS ---------------------------
    import { Label } from '@/components/ui/label'
    import { Button } from '@/components/ui/button';    
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
    import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs'

// CHILD COMPONENT: timerSettingsCard.vue ---------------------------
    // timer settings pop up card with button
    import timerSettingsCard from '@/components/PomoPageComp/timerSettingsCard.vue';

// Var ---------------------------
    // stored pomo, short, long break times
    const setPomodoroTime = ref('50:00');
    const setShortBreakTime = ref('05:00');
    const setLongBreakTime = ref('15:00');

    // showing all times for pomo, short, and long break
    // can consider having a main shared since all of them can only be used one at a time
    const currPomodoroTime = ref('45:00');
    const currShortBreakTime = ref('03:29');
    const currLongBreakTime = ref('05:17');

    const runState = ref(false);

    function startPomodoro() {
        // (1) should bring to blackout realtime countdown and start it
        // (2) runstate to be true so that when they exit back to this page, they have option to
        // reset their current timer
        runState.value = true;
    }

    function startShortBreak() {
        // (1) should bring to blackout realtime countdown and start it
        // (2) runstate to be true so that when they exit back to this page, they have option to
        // reset their current timer
        runState.value = true;
    }

    function startLongBreak() {
        // (1) should bring to blackout realtime countdown and start it
        // (2) runstate to be true so that when they exit back to this page, they have option to
        // reset their current timer
        runState.value = true;
    }

    function resetPomodoro() {
        // (1) resets the timer on this card to what was set for pomo
        runState.value = false;
        currPomodoroTime.value = setPomodoroTime;
    }

    function resetShortBreak() {
        // (1) resets the timer on this card to what was set for shortbreak
        runState.value = false;
        currShortBreakTime.value = setShortBreakTime;

    }

    function resetLongBreak() {
        // (1) resets the timer on this card to what was set for longbreak
        runState.value = false;
        currLongBreakTime.value = setLongBreakTime;
    }
</script>

<template>
    <!-- for testing -->
    <!-- <div class="component-wrapper-for-testing"> -->

        <div class="timer-card">
            
            <Tabs default-value="pomodoro" class="w-[400px]">
                <TabsList class="grid w-full grid-cols-3">
                    <TabsTrigger value="pomodoro">
                        Pomodoro
                    </TabsTrigger>
                    <TabsTrigger value="shortbreak">
                        Short Break
                    </TabsTrigger>
                    <TabsTrigger value="longbreak">
                        Long Break
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pomodoro">
                    <Card class="timer-card relative">
                        <!-- timerSettingsCard Child is here -->
                        <timerSettingsCard />
                        
                        <CardHeader class="card-header-container">
                            <CardTitle class="timer-number">{{currPomodoroTime}}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="timer-buttons-container">
                                    <button class="play-button" @click="startPomodoro"></button>
                                    <Button variant="ghost" class="reset-button"
                                    v-if="runState" @click="resetPomodoro">Reset</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shortbreak">
                    <Card class="timer-card relative">
                        <!-- timerSettingsCard Child is here -->
                        <timerSettingsCard />

                        <CardHeader class="card-header-container">
                            <CardTitle class="timer-number">{{currShortBreakTime}}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="timer-buttons-container">
                                    <button class="play-button" @click="startShortBreak"></button>
                                    <Button variant="ghost" class="reset-button"
                                    v-if="runState" @click="resetShortBreak">Reset</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="longbreak">
                    <Card class="timer-card relative">
                        <!-- timerSettingsCard Child is here -->
                        <timerSettingsCard />

                        <CardHeader class="card-header-container">
                            <CardTitle class="timer-number">{{currLongBreakTime}}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div class="timer-buttons-container">
                                    <button class="play-button" @click="startLongBreak"></button>
                                    <Button variant="ghost" class="reset-button"
                                    v-if="runState" @click="resetLongBreak">Reset</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>

    <!-- for testing -->
    <!-- </div> -->
</template>

<style scoped>
        .component-wrapper-for-testing{
            display: flex;               
            justify-content: center;      /* Centers the child elements horizontally */
            align-items: center;          /* Centers the child elements vertically */

            min-height: 100vh;
            min-width: 100vw; /* Ensure full width of the viewport */

            margin: 0; /* Remove default margin */
            padding: 0;
            box-sizing: border-box; /* Ensure padding and border do not affect the width */
        }

        .timer-card{
            /* fix this first */
            width: 400px;
            height: fit-content;

            /* do not flex it */
            /* display: flex; */
            text-align: center;
        }

        .card-header-container {
            /* relative for button */
            position: relative;
            margin-top: 40px;
            padding: 8px;
        }
        .timer-number {
            position: relative;
            font-size: 100px;
            font-weight: lighter;
        }

        
        .timer-buttons-container {
            margin: auto;
            width: fit-content;
            height: 80px;

            display: flex;
            align-items: center;
            gap: 20px;
        }
        .play-button {
            width: 0;
            height: 0;
            margin: 0;
            padding: 0;

            border-left: 27px solid black; 
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            border-radius: 0;

            cursor: pointer;
            /* shadcn buttons have shadows, m and p by default so have to remove */
            box-shadow: none;
        }
        .reset-button {
            /* to ensure its close to the play button, no p or m for button */
            margin: 0;
            padding: 8px;

            font-weight: bold;
            font-size: x-large;

            color: black;
            box-shadow: none;
        }

</style>
