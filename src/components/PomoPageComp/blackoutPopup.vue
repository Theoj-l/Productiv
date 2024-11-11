<!-- FINAL Blackout Popup, updated @ 1.57pm -->
<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';

// PRIMARY COMPONENTS ---------------------------
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';

// body for entire blackout pomo
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog'

// CHILDREN COMPONENTS ---------------------------
import ringtoneComponent from '@/components/PomoPageComp/ringtonePlayer.vue';
import pomoMessage from '@/components/PomoPageComp/PomoMsg.vue';
import TaskItemBlackout from '@/components/TaskListComp/TaskItemBlackout.vue';
import MusicPomoCard from '@/components/PomoPageComp/musicDrawerCard.vue';

// STATES ---------------------------
import { useUserStore } from '@/stores/UserObjStore.js';

// Var ---------------------------
const userStore = useUserStore()
const timerObj = useUserStore().timerObj;

const currTimerType = computed(() => useUserStore().timerObj.current_timer_type);
const currTimeLeft = computed(() => useUserStore().timerObj.current_time_left);
const isRunning = computed(() => useUserStore().timerObj.is_running_state);
const hasRan = computed(() => useUserStore().timerObj.has_ran_state);
const isBlackOutOpen = computed(() => useUserStore().timerObj.is_blackout_open);

const currPomoCount = computed(() => useUserStore().timerObj.current_pomo_count);
const breakIntervals = computed(() => useUserStore().timerObj.break_intervals);
const autoStartBreak = computed(() => useUserStore().timerObj.auto_start_break);
const autoStartPomo = computed(() => useUserStore().timerObj.auto_start_pomo);

const currReminder = computed(() => useUserStore().reminder_message);

const taskArr = computed(() => useUserStore().tasks);
const idSelectedTask = computed(() => useUserStore().selected_task_id);
const tagTimeObj = computed(() => useUserStore().tag_time_obj);

const showReminders = computed(() => useUserStore().timerObj.enable_reminders);
const showMessages = computed(() => useUserStore().timerObj.enable_messages);

const boSelectedTask = ref(null);
const ringtonePlayerRef = ref(null);

// () For countdown timer + realtime updating state
const localTimeRef = ref(currTimeLeft.value);
// Update Local current_time_left with State current_time_left
watch(() => timerObj.current_time_left, (newTime) => {
    localTimeRef.value = newTime;  
    // console.log('counting down, current_time_left is now:', newTime);
});
// Update State current_time_left with Local current_time_left
watch(localTimeRef, (newTime) => {
    timerObj.current_time_left = newTime; 
    // console.log('counting down, current_time_left is now:', newTime);
});

// () For tracking total_time_ran for the task, when timer stops
const startTime = ref();

// () For getting today's date for tag_time_obj
const getDate = () => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    const date = new Date(); // Create a new Date object
    let day = date.getDate().toString().padStart(2, '0'); // Ensure day is two digits
    let month = months[date.getMonth()];
    let year = date.getFullYear().toString().slice(2); // Get last two digits of the year
    let todayString = day + month + year;

    console.log(todayString);
    return todayString
};

// () For progress bar - static
const progressBarWidth = ref('100%');
const totalTime = currTimeLeft.value;

// () For controlling resume/exit buttons + reset (in timercard)
const localIsRunningRef = ref(isRunning.value); 
watch(localIsRunningRef, (newRunState) => {
    // Watch `time` to update `timerObj.current_time_left` in real time
    timerObj.is_running_state = newRunState;  // Update store's current_time_left
    console.log('Running state is now:', timerObj.is_running_state);
});

// () For actual countdown timer function
let timer = null;

// () For Completing task dialog, opening/closing this whole blackout pomo programmatically - timer done, completed task, auto start
const showBlackoutDialog = ref(isBlackOutOpen.value);
watch(showBlackoutDialog, (newDialogState) => {
    timerObj.is_blackout_open = newDialogState;
    console.log('Blackout popup state changed to', newDialogState, 'local state should be changed to', timerObj.is_blackout_open);
})

// () For Confirming completing task dialog
const showAlertDialog = ref(false);

// Countdown timer 
const blackoutShownTime = computed(() => {
    const minutes = Math.floor(timerObj.current_time_left / 60);
    const seconds = timerObj.current_time_left % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// (1) Reminder Notification Functions --------------------------
    // (1a) Check if the browser supports Notifications
    const checkNotificationPermission = () => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
        }
        });
    }
    };
    // (1b) Function to show the notification
    const showReminderNotification = () => {
    if (Notification.permission === 'granted') {
        new Notification("Reminder", {
        body: currReminder.value,
        icon: './assets/placeholder.jpg', 
        });
    }
    };
    // (1c) Listen to tab visibility changes
    // show notifications only if showReminders === true, timer is still running, and tab is detected to be hidden
    const handleVisibilityChange = () => {

        if (document.hidden && timerObj.is_running_state && showReminders.value) {
            showReminderNotification();
        }
    };
    // (1d) Attach event listeners when the component is mounted
    onMounted(() => {
    checkNotificationPermission();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    });
    // (1e) Clean up the event listener when the component is unmounted
    onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    });

// (2) Blackout Timer Functions --------------------------
    // (2a) Function startTimer
    // - starts timer
    // - set running to true so it shows pause and exit buttons
    // - set has_run_state to true so when blackout exits, current_time_left is displayed on card and not default
    function startTimer() {
        // > called by play button (in card) & resumes button (in blackout)
        console.log(">>>> New Running Cycle Now <<<< ");
        console.log("This cycle starts with current_time_left: ", timerObj.current_time_left);
        console.log("This cycle starts with local time of: ", localTimeRef.value);
        console.log("This cycle is currently type: ", timerObj.current_timer_type);
        console.log('Show reminders is currently: ', showReminders.value)
        console.log('Show messages is currently: ', showMessages.value)

        // (2a1) updates isRunning to true to hide resume/exit buttons
        localIsRunningRef.value = true; // becomes false in stopTimer
        console.log('(R1) is_running_state should be true, is now: ', localIsRunningRef.value);

        // (2aa) starts/resumes timer from curr_time_left
        setTimeout(() => {
            timerObj.has_ran_state = true;
            console.log('(R3) has_ran_state should be true, is now: ', timerObj.has_ran_state);
        }, 1000); 
        
        // (2a3) records start time to - off curr_time_left during pause got total_task_time
        startTime.value = currTimeLeft.value;
        console.log('(R2) Locally saved Current start time, for deducting later:', startTime.value)

        // (2a4) upon end, calls stopTimer and timerDone function
        timer = setInterval(() => {
            if (localTimeRef.value > 0) {
                localTimeRef.value--;
                progressBarWidth.value = `${(localTimeRef.value / totalTime.value) * 100}%`;

            } else {
                timerDone();
            }
        }, 1000);
    }

    // (2b) Function stopTimer
    // - stops timer
    // - updates task selected's total_spent_seconds if is pomo
    function stopTimer() {
        // > called by startTimer function at end + Pause button

        // (2b1) pauses timer - updated in timerStore state above via watch function
        clearInterval(timer);

        // (2b2) updates isRunning to false so that buttons resume/exit buttons show
        localIsRunningRef.value = false; // becomes false in stopTimer

        // (2b3) finds total time ran from startTime and adds to selected task's total_time_run
        let timeTakenNow = startTime.value - localTimeRef.value;

        // (2b4) if selectedTask is null, then show total time but not addition
        // else add the time to the selected task + tag_time_obj
        if (useUserStore().timerObj.current_timer_type === 'pomodoro') {

            let todayDate = getDate();
            console.log('today\'s date is', todayDate)

            if (boSelectedTask.value) { // if task is selected - go to the tag
                console.log('(R4.1) Task\'s OLD total time taken BEFORE this cycle:', boSelectedTask.value.time_spent_seconds);
                boSelectedTask.value.time_spent_seconds += timeTakenNow;
                const updatedTaskArr = taskArr.value.map(item =>
                item.task_id === idSelectedTask.value ? { ...item, time_spent_seconds: boSelectedTask.value.time_spent_seconds } : item
                );
                console.log('(R5.1) Seconds taken and added to task:', timeTakenNow);
                console.log('(R6.1) Task\'s NEW total time taken AFTER this cycle:', boSelectedTask.value.time_spent_seconds);

                let tag_to_update = boSelectedTask.value.task_tag;
                    console.log('Current tagTimeObj', tagTimeObj.value)

                if (todayDate in useUserStore().tag_time_obj) {
                    if (tag_to_update in useUserStore().tag_time_obj[todayDate]) {
                            // console.log('(R4.2) Tag', tag_to_update, 'OLD total time taken BEFORE this cycle:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                        useUserStore().tag_time_obj[todayDate][tag_to_update] += timeTakenNow;
                            // console.log('(R5.2) Tag\'s', tag_to_update, 'NEW total time taken BEFORE this cycle:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                    } else {
                        useUserStore().tag_time_obj[todayDate][tag_to_update] = timeTakenNow;
                    }
                } else {
                    useUserStore().tag_time_obj[todayDate] = { [tag_to_update]: timeTakenNow };
                    // console.log('(R4.2) Tag', tag_to_update, 'was just added in tag_time_obj:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                }
            } else { // if there are no selected tasks - make time recorded go to misc

                let tag_to_update = 'misc';

                if (todayDate in useUserStore().tag_time_obj) {
                    if (tag_to_update in useUserStore().tag_time_obj[todayDate]) {
                            // console.log('(R4.2) Tag', tag_to_update, 'OLD total time taken BEFORE this cycle:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                        useUserStore().tag_time_obj[todayDate][tag_to_update] += timeTakenNow;
                            // console.log('(R5.2) Tag\'s', tag_to_update, 'NEW total time taken BEFORE this cycle:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                    } else {
                        useUserStore().tag_time_obj[todayDate][tag_to_update] = timeTakenNow;
                    }
                } else {
                    useUserStore().tag_time_obj[todayDate] = { [tag_to_update]: timeTakenNow };
                    // console.log('(R4.2) Tag', tag_to_update, 'was just added in tag_time_obj:', useUserStore().tag_time_obj.todayDate.tag_to_update);
                }
                
            }
            (async () => {
                    try {
                        await userStore.updateTaskData(); 
                    } catch (error) {
                        console.error('Error updating timer:', error);
                    }
                })();
        } else {
            console.log('(R5) Seconds taken, no task so not added:', timeTakenNow);
        }
        console.log('<<<< End of Running Cycle >>>>');
    }

    // (2c) Function exitBlackOut
    // - closes blackout dialog
    function exitBlackOut() {
        // (1) Brings user straight back to main pomo
        // (2) current time must be preserved and sent back to be shown on main pomo's
        // shownPomodoroTime (or shownShortBreakTime / shownShortLongTime if in break mode)
        boSelectedTask.value = null;
        console.log('selectedTask is set to null before exiting this cycle', boSelectedTask)

        console.log('(R6) current_time_left is now:', localTimeRef.value);
        timerObj.is_running_state = false;
        useUserStore().timerObj.is_blackout_open = false;
        console.log('<<<< Exited blackout >>>>');
    }

    // (2X) Function autoStartNextTimer
    // - if auto_start_break and NEW current_timer_type === 'longbreak' or 'shortbreak' -> auto open blackout popup timer for break
    // - if auto_start_pomo and NEW current_timer_type === 'pomodoro' -> auto open blackout popup timer for pomo
    function autoStartNextTimer() {
        // if autostartbreak is enabled
        // change this dialog to open when this autoStartNextTimer function is called
        setTimeout(() => {
            if (autoStartBreak.value && 
            (currTimerType.value === 'shortbreak' || currTimerType.value === 'longbreak')) {
                // showBlackoutDialog.value = true;
                // startTimer();
                console.log(`~~~ Auto started break; is now '${currTimerType.value}'' ~~~`);
            } else if (autoStartPomo.value && currTimerType.value === 'pomodoro') {
                // showBlackoutDialog.value = true;
                // startTimer();
                console.log(`~~~ Auto started pomodoro; is now '${currTimerType.value}' ~~~`);
            } else {
                console.log('auto pomo and auto break are disabled, no auto start')
            }
        }, 2000)
    }

    // (2d) Function completePomoRun
    // - changes current_timer_type based on current_pomo_count -> either pomo or shortbreak / longbreak
    // - calls (2b) stopTimer
    // - calls (2c) exitBlackOut
    // called by timerDone or confirmTaskCompletion to move to shortbreak/longbreak -> calls stopTimer()
    function completePomoRun() {
        // (1) handles the change in pomo_type -> used to change tabs upon exit
        // (2) calls stoptimer through exitblackout

        console.log('(R7) Current pomo count: ', currPomoCount.value)
        console.log('(R8) Current break intervals: ', breakIntervals.value)
        console.log('(R9) Current Type: ', currTimerType.value)

        // if current_type === pomo, change to shortbreak if current pomo count < 5, else long break
        if (useUserStore().timerObj.current_timer_type === 'pomodoro') {
            useUserStore().timerObj.current_pomo_count += 1;
            console.log('(R10) New pomo count: ', currPomoCount.value)

            if ( currPomoCount.value < breakIntervals.value ) {
                // set current_type to shortbreak
                timerObj.has_ran_state = false;
                stopTimer();
                exitBlackOut();
                useUserStore().timerObj.current_timer_type = 'shortbreak';
                console.log('(R11) New Type: ', useUserStore().timerObj.current_timer_type)
                // autoStartNextTimer()
            } else {
                // set current_type to longbreak + reset count
                timerObj.has_ran_state = false;
                stopTimer();
                exitBlackOut();
                useUserStore().timerObj.current_timer_type = 'longbreak';
                console.log('(R11) New Type: ', useUserStore().timerObj.current_timer_type)

                useUserStore().timerObj.current_pomo_count = 0;
                console.log('(R12) Reset pomo count: ', currPomoCount.value)
                // autoStartNextTimer()
            }
        } else {
            timerObj.has_ran_state = false;
            stopTimer();
            exitBlackOut();
            useUserStore().timerObj.current_timer_type = 'pomodoro';
            console.log('(R10+) New pomo count: ', currPomoCount.value)
            console.log('(R11+) New Type after end break: ', useUserStore().timerObj.current_timer_type)
            // autoStartNextTimer()
        }
    }


    // (2e) Function timerDone
    // - notifies user timer has ended
    // - sound ringtone for 1 second
    // - calls (2d) completePomoRun
    function timerDone() {
        // (1) Shows Notification / alert
        // (2) Plays ringtone chosen

        // (2e1) shows notification of timer done
        new Notification("Pomodoro Completed", {
            body: "You did great, have a break!",
            // icon: './assets/placeholder.jpg', 
            });

        localIsRunningRef.value = false;

        // (2e2) play ringtone once and stop
        ringtonePlayerRef.value.playChosenRingtone(); 
        console.log('it should be playigggg', ringtonePlayerRef.value);        

        // (2e3) calls completePomoRun to exit
        completePomoRun()
    }

    // (2f) Function confirmTaskCompletion
    // - marks selected task as completed + update local state & push to db
    function confirmTaskCompletion() {

    console.log('This is bo selected task BEFORE', boSelectedTask.value);
    boSelectedTask.value.completed = true;
    console.log('This is bo selected task AFTER', boSelectedTask.value);

    useUserStore().updateTask(boSelectedTask);
    useUserStore().selected_task_id = '';

    completePomoRun()
    };

    // (base1) starts timer when this popup is opened + loads selected task if timer type is pomodoro & there is a selected task
    function blackoutOpened() {

        if (idSelectedTask.value !== '' && currTimerType.value === 'pomodoro') {
            boSelectedTask.value = taskArr.value.find(item => item.task_id === idSelectedTask.value);
            console.log('... Task was selected for this cycle ...')
            console.log('Task Obj selected for this pomo: ', boSelectedTask.value);
        } else {
            console.log('... No tasks selected ...')
        }

        startTimer();

    }

    // (base2) allows user to reset timer in timercard
    function resetTimer() {

        // manage bar ui
        progressBarWidth.value = '100%';

        // set has_ran to never 
        timerObj.has_ran_state = false;
        console.log('* Reset called, has_ran_state should be false, is now: ', timerObj.has_ran_state);
            
        if (timerObj.current_timer_type === 'pomodoro') {
                timerObj.current_pomo_count += 1;
                console.log('(R10) Prematurely ended Pomo, New pomo count: ', currPomoCount.value)

                if ( currPomoCount.value < breakIntervals.value ) {
                    // set current_type to shortbreak
                    timerObj.current_time_left = timerObj.short_break_timer * 60;
                    timerObj.has_ran_state = false;
                    timerObj.current_timer_type = 'shortbreak';

                    console.log('(R11) Prematurely ended Pomo, Now Timer Type: ', useUserStore().timerObj.current_timer_type)
                    autoStartNextTimer()
                } else {
                    // set current_type to longbreak + reset count
                    timerObj.current_time_left = timerObj.long_break_timer * 60;
                    timerObj.has_ran_state = false;
                    timerObj.current_timer_type = 'longbreak';
                    useUserStore().timerObj.current_pomo_count = 0;

                    console.log('(R11) Prematurely ended Pomo, Now Timer Type: ', useUserStore().timerObj.current_timer_type)
                    console.log('(R12) Prematurely ended Pomo, Reset pomo count: ', currPomoCount.value)
                    autoStartNextTimer()
                }
        } else {
            timerObj.current_time_left = timerObj.pomo_timer * 60;
            timerObj.has_ran_state = false;
            timerObj.current_timer_type = 'pomodoro';

            console.log('(R10+) Ended Break, New pomo count: ', currPomoCount.value)
            console.log('(R11+)Ended Break, Now Timer Type after end break: ', useUserStore().timerObj.current_timer_type)
            autoStartNextTimer()
        }

    }

    // (3a) Function openCompleteDialog
    // - opens confirmation dialog after checking selected task
    function openCompleteDialog() {
        showAlertDialog.value = true;
    }


</script>

<template>
    <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    </head>
        <!-- play button (in card timer) -->
        <Dialog v-model:open="showBlackoutDialog" @onOpenChange="(open) => showBlackoutDialog = open" @escapeKeyDown="(event) => { event.preventDefault(); 
                    console.log('Escape key pressed, but dialog will not close.'); 
        }"
            style="position: relative;">
            <DialogTrigger as-child>
                <Button variant="ghost" class="new-play-button" @click="blackoutOpened">
                    <i class="fa fa-play" style="font-size: 45px;"></i>
                </Button>
                <!-- <button class="play-button" @click="blackoutOpened"></button> -->
            </DialogTrigger>
            <DialogContent class="p-0 m-0 min-w-[100%] min-h-[100%]border-none rounded-none bg-black ">
                <DialogTitle class="hidden">
                </DialogTitle>
            <DialogDescription class="hidden"></DialogDescription>
            <div class="blackout-container">
            <div class="blackout-content relative">

                <!-- Call Pomo Message -->
                <div class="bo-pomo-msg-container">
                    <pomoMessage class="pomo-message" v-if="currTimerType === 'pomodoro' && showMessages"/>
                </div>

                <!-- Timer Countdown -->
                 <div class="outer-timer-container">
                    <div class="timer-container">
                        <div class="timer">{{ blackoutShownTime }}</div>
                        <div class="progress-bar">
                            <div class="progress" :style="{ width: progressBarWidth }"></div>
                        </div>

                        <Button class="blackout" variant="ghost" v-if="isRunning" @click="stopTimer">Pause</Button>

                        <div class="paused-button-container" v-if="!isRunning">
                            <Button class="blackout" variant="ghost" @click="startTimer">Resume</Button>
                            <DialogClose as-child>
                                <Button class="blackout" variant="ghost" @click="exitBlackOut">Exit</Button>
                            </DialogClose>
                        </div>
                    </div>
                </div>

                <!-- Call selected task -->
                <div class="task-item" v-if="boSelectedTask !== null">
                    <TaskItemBlackout 
                    :key="boSelectedTask.task_id" 
                    :botask="boSelectedTask"
                    @open-bo-checked-dialog="openCompleteDialog"/>
                </div>

                <!-- Call ringtoneTest button (hidden) -->
                <ringtoneComponent ref="ringtonePlayerRef"/>

                <!-- Call Music Player Drawer -->
                <!-- <div class="music-drawer">
                    <MusicPomoCard/>
                </div> -->
            </div>       
        </div> 

        <!-- Call alert dialog for task completion -->
        <div class="absolute">
            <AlertDialog :open="showAlertDialog" @onOpenChange="(open) => showAlertDialog = open">
            <AlertDialogContent class="confirm-task-dialog bg-white p-4 rounded-lg shadow-lg w-96 sm:w-4/5">

                <DialogTitle class="hidden"></DialogTitle>
                <DialogDescription class="hidden"></DialogDescription>

                <AlertDialogHeader>
                <h2 class="text-lg font-semibold">Confirm Completion</h2>
                </AlertDialogHeader>
                <div class="mt-2">
                <p>Mark task as completed? This will end this current Pomodoro</p>
                </div>
                <AlertDialogFooter>
                <Button variant="ghost" @click="showAlertDialog = false">Cancel</Button>

                <Button variant="default" @click="confirmTaskCompletion">Confirm</Button>

                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
         </div>

            </DialogContent>
        </Dialog>

        <!-- reset button (in card timer) -->
        <Button variant="ghost" class="reset-button"
        v-if="hasRan" @click="resetTimer">End</Button>
</template>

<style scoped>
        .component-wrapper-for-testing{
            display: flex;               
            justify-content: center;     
            align-items: center;

            min-height: 100vh;
            min-width: 100vw; 

            margin: 0; 
            padding: 100px;
            /* box-sizing: border-box;  */
        }

        .blackout-container {
            height: 100vh;
            width: 100vw; 
            display: flex;               
            justify-content: center;     
            align-items: center;
            padding: 20px 0px;
        }

        .music-drawer {
            position: absolute;
            margin: 0px;
            bottom: 0;
            right: 0;
        }

        .blackout-content {
            display: grid;
            grid-template: 
            "msg"
            "tc"
            "ti";
            grid-template-rows: 0.8fr 1fr 1fr; /* Adjust based on the number of columns */
            width: 100%; /* Adjust to set max width of content */
            height: 100%; /* Set max height */
            box-sizing: border-box;
            margin: auto;
            /* padding: 1vw; */
        }

        .bo-pomo-msg-container {
            /* border: 1px white solid; */
            display: flex;
            align-items: center;
            justify-content: center;
            height: 11dvh;
            width: max(65dvw, 350px);
            margin: auto;
            grid-area: msg;
        }
        .outer-timer-container {
            height: 100%;
            display: flex;
            align-items: center;
        }
        .timer-container {
            /* border: 1px white solid; */
            display: flexbox;
            margin: 0px;
            padding: 0px;
            height: fit-content;
            width: 100%;
            text-align: center;
            grid-area: tc;
        }

        .task-item {
            /* border: 1px white solid; */
            margin: 0px auto;
            height: 25dvh;
            width: 100%;
            padding: 0px;
            grid-area: ti;
        }
        .timer {
            color: white;
            font-size: max(11dvw, 110px);
            padding: 0px;
        }
        .progress-bar {
            width: max(50dvw, 280px);
            background-color: black;
            border-radius: 20px;
            overflow: hidden;
            margin: 0px auto;
            height: 5px;
            /* box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); */
        }
        .progress-bar .progress {
            background-color: white;
            height: 20px;
            transition: width 0.5s ease-in-out;
            /* border-radius: 20px; */
        }
        .paused-button-container {
            display: flex;
            width: 100%;
            
            margin: auto;
            justify-content: center;
        }
        Button.blackout {
            padding: 10px 20px;
            margin: 20px;

            font-size: 24px;
            color: white;
            cursor: pointer;

            border: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
            /* box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); */
        }
        Button.play-button {
            width: 0;
            height: 0;
            margin: 0;
            padding: 0;

            border-left: 35px solid black; 
            border-top: 20px solid transparent;
            border-bottom: 20px solid transparent;
            border-radius: 0;

            cursor: pointer;
            /* shadcn buttons have shadows, m and p by default so have to remove */
            box-shadow: none;
        }
        Button.new-play-button {
            width: 66px;
            height: 66px;
            color: black;
        }
        Button.reset-button {
            margin: 0px 0px 0px 1dvw;
            padding: 8px 16px;

            font-weight: 600;
            font-size: 45px;
            height: 66px;
            width: fit-content;

            color: black;
            box-shadow: none;
        }

        @media (max-width: 450px) {
            .music-drawer {
            position: absolute;
            margin: 0px 0px 0px 0px;
            top: 21%;
            right: 10px;
            } 
            /* .confirm-task-dialog {
                max-width: 30dvw;
            } */
        }

</style>