import { defineStore } from 'pinia';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from "@/main"; // Firestore instance import
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth

function getUserId() {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        reject('No authenticated user found.');
      }
    });
  });
}

export const useUserStore = defineStore('userStore', {
  state: () => ({
    email: 'defaultempty', // static
    username: '', // static

    // Boolean to track whether data is being fetched or not
    isLoading: true,   // To show a loading screen until data is fetched
    isDataFetched: false,  // Checks if data was fetched to avoid refetching

    // (A) static until edited - for local ref and push only when sess ends (or upon edit?)
    // (read & write)
    mind_msg_array: [], //rename in db
    pomo_msg_array: [],
    reminder_message: '',
    priority_array: [],
    tag_array: [], // used for task, indirectly data vis - static until edited
    friends: [],

    profile_header_url: '',
    profile_picture_url: '',

    task_routine_array: [],
    tasks: [],

    tag_time_obj: {},
    mindful_time_obj: {},

    selected_task_id: '',

    chosen_mindful_music: 'Track 1',
    mindful_song_volume: [30],

    timerObj: {
      pomo_timer: 30,
      mindful_timer: 5,
      short_break_timer: 30,
      long_break_timer: 30,
      break_intervals: 5,

      auto_start_break: false,
      auto_start_pomo: false,

      enable_messages: false,
      enable_reminders: false,

      chosen_ringtone: 'Ringtone 1',
      ringtone_volume: [30],

      current_pomo_count: 0, // default is zero, used to compare with break_intervals
      current_time_left: 1000, // reset to pomo_timer at start of every sess, else local static
      current_timer_type: 'pomodoro', // default is 'pomodoro' on every sess

      has_ran_state: false, // default is false on every sess
      is_running_state: false, // default is false on every sess

      is_blackout_open: false, // LOOK OUT FOR THIS CHANGE

      // current_tab: 'pomodoro', 
    }
  }),

  actions: {
    // Fetch user data from Firestore
    async fetchUserData() {
      try {
        const userId = await getUserId();  // Dynamically get the userId
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Personal details, not used
          this.email = data.email;
          this.username = data.username;

          // Messages + Reminders
          this.mind_msg_array = data.mind_msg_array;
          this.pomo_msg_array = data.pomo_msg_array;
          this.reminder_message = data.reminder_message;

          // Profile related
          this.profile_header_url = data.profile_header_url;
          this.profile_picture_url = data.profile_picture_url;

          // Tasks related
          this.priority_array = data.priority_array;
          this.tag_array = data.tag_array;
          this.task_routine_array = data.task_routine_array;
          this.tasks = data.tasks;
          this.tag_time_obj = data.tag_time_obj;
          this.friends = data.friends;

          this.selected_task_id = data.selected_task;

          // Timer Settings + Intervals

          this.timerObj.pomo_timer = data.timerObj.pomo_timer;
          this.timerObj.mindful_timer = data.timerObj.mindful_timer;
          this.timerObj.short_break_timer = data.timerObj.short_break_timer;
          this.timerObj.long_break_timer = data.timerObj.long_break_timer;
          this.timerObj.break_intervals = data.timerObj.break_intervals;

          this.timerObj.current_time_left = (data.timerObj.pomo_timer * 60);

          // Auto start break / pomo
          this.timerObj.auto_start_break = data.timerObj.auto_start_break;
          this.timerObj.auto_start_pomo = data.timerObj.auto_start_pomo;

          // Choosing ringtones + enabling messages + reminders
          this.timerObj.chosen_ringtone = data.timerObj.chosen_ringtone;
          this.timerObj.ringtone_volume = data.timerObj.ringtone_volume;
          this.timerObj.enable_messages = data.timerObj.enable_messages;
          this.timerObj.enable_reminders = data.timerObj.enable_reminders;

          // Mindful 
          this.mindful_time_obj = data.mindful_time_obj;

          this.isDataFetched = true;  // Mark data as fetched


        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async init() {
      if (!this.isDataFetched) {  // Only fetch if it hasn't been fetched before
        this.isLoading = true;
        try {
          await this.fetchUserData();  // Fetch data using dynamic userId
        } catch (error) {
          console.error("Failed to initialize: ", error);
        }
      }
    },

    async fetchTaskRelatedOnly(userId) {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Tasks related
          this.tag_array = data.tag_array;
          this.task_routine_array = data.task_routine_array;
          this.tasks = data.tasks;

          console.log('User document data:', userDoc.data());
          console.log('fetch task related data from DB through state');
        }
      } catch (error) {
        console.log('Error fetching task related data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // Push current local storage state to the Firestore
    async updateAllStateToFirebase() {
      try {
        const userId = await getUserId();  // Dynamically get the userId - this has to be 
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          email: this.email,
          username: this.username,
          mind_msg_array: this.mind_msg_array,
          pomo_msg_array: this.pomo_msg_array,
          reminder_message: this.reminder_message,
          selected_task: this.selected_task_id,
          tag_array: this.tag_array,
          task_routine_array: this.task_routine_array,
          tasks: this.tasks,
          tag_time_obj: this.tag_time_obj,
          friends: this.friends,
          mindful_time_obj: this.mindful_time_obj,
          timerObj: {
            pomo_timer: this.timerObj.pomo_timer,
            mindful_timer: this.timerObj.mindful_timer,
            short_break_timer: this.timerObj.short_break_timer,
            long_break_timer: this.timerObj.long_break_timer,
            break_intervals: this.timerObj.break_intervals,

            auto_start_break: this.timerObj.auto_start_break,
            auto_start_pomo: this.timerObj.auto_start_pomo,

            chosen_ringtone: this.timerObj.chosen_ringtone,
            ringtone_volume: this.timerObj.ringtone_volume,
            enable_messages: this.timerObj.enable_messages,
            enable_reminders: this.timerObj.enable_reminders
          }
        });
        console.log('-- Pushed all latest local storage state to firestore')

        this.isDataFetched = false;
      } catch (error) {
        console.log('-- Failed to push local storage state to firestore', error)
      }
    },

    // (A) task related local & DB CRUD ------
    addTask(task) {
      // (1) add new task to this state's task array
      this.tasks.push(task);
      // (2) update this state as well
      this.updateTaskData();
    },

    removeTask(task) {
      // (1) update this state's task array - delete that selected task
      this.tasks = this.tasks.filter(t => t.task_id !== task);
      console.log('After delete:', this.tasks);

      // (2) update this state as well
      this.updateTaskData();
    },

    updateTask(task) {
      // (1) update this state's task item detail
      console.log('this is bo task obj that you wanna complete', task)
      const index = this.tasks.findIndex(t => t.task_id === task.task_id);
      if (index !== -1) this.tasks[index] = { ...this.tasks[index], ...task }
      else {
        console.log('bo checked task cannot be found - see if bo taskid is correct')
      }

      // (2) update this state as well
      this.updateTaskData();
    },

    completeTask(updatedTaskArray) {
      // (1) update this state's task item detail
      this.tasks = updatedTaskArray;

      // (2) update this state as well
      this.updateTaskData();
    },

    // (B) tag related local & DB CRUD --------
    addTag(trimmedTag) {

      // (1) update this state's task item detail
      this.tag_array.push(trimmedTag);

      // (2) update this state as well
      this.updateTagData();
    },

    deleteTag(tag) {

      // (1) update this state's tag array detail
      this.tag_array = this.tag_array.filter(t => t !== tag.value);

      // (2) update this state as well
      this.updateTagData();
    },

    // Push updated TimerObj state to the Firestore
    async updateTimerObj() {
      const userId = await getUserId();  // Dynamically get the userId
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        timerObj: {
          pomo_timer: this.timerObj.pomo_timer,
          mindful_timer: this.timerObj.mindful_timer,
          short_break_timer: this.timerObj.short_break_timer,
          long_break_timer: this.timerObj.long_break_timer,
          break_intervals: this.timerObj.break_intervals,

          auto_start_break: this.timerObj.auto_start_break,
          auto_start_pomo: this.timerObj.auto_start_pomo,

          chosen_ringtone: this.timerObj.chosen_ringtone,
          ringtone_volume: this.timerObj.ringtone_volume,
          enable_messages: this.timerObj.enable_messages,
          enable_reminders: this.timerObj.enable_reminders
        }
      });
    },

    // Push updated task array state to the Firestore
    async updateTaskData() {
      const userId = await getUserId();  // Dynamically get the userId
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        tasks: this.tasks,
        tag_time_obj: this.tag_time_obj
      });
    },

    // Push updated tag array state to the Firestore
    async updateTagData() {
      const userId = await getUserId();  // Dynamically get the userId
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { tag_array: this.tag_array });
    },

    // Update mindful_time_obj in Firestore
    async updateMindfulTimeObj(updatedMindfulTimeObj) {
      try {
        const userId = await getUserId();
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { mindful_time_obj: updatedMindfulTimeObj });
        this.mindful_time_obj = updatedMindfulTimeObj; // Update local state
        console.log('Updated mindful_time_obj in Firestore:', this.mindful_time_obj);
      } catch (error) {
        console.error('Error updating mindful_time_obj:', error);
      }
    },

    addFriend(friendUid) {
      if (!this.friends.includes(friendUid)) {
        this.friends.push(friendUid);
      }
    },

    removeFriend(friendUid) {
      this.friends = this.friends.filter(uid => uid !== friendUid);
    }

  },
  persist: {
    enabled: true,  // Enable persistence so state is saved across refreshes
    strategies: [
      {
        key: 'userStore',
        storage: localStorage,  // you can also choose sessionStorage
        // paths: ['timerObj.current_time_left', 'tasks', 'selected_task_id']
        afterRestore: (state) => {
          // After restoring, set each property in localStorage
          for (const [key, value] of Object.entries(state)) {
            localStorage.setItem(`${stateKey}.${key}`, JSON.stringify(value));
          }
        },
        beforeRestore: (state) => {
          // Before restoring, grab each property and set it to state
          const keys = Object.keys(localStorage).filter(key => key.startsWith(`${stateKey}.`));
          keys.forEach(key => {
            const prop = key.split('.')[1]; // Extract the property name
            state[prop] = JSON.parse(localStorage.getItem(key)); // Set it on the state
          });
        }
      }
    ]
  }
});