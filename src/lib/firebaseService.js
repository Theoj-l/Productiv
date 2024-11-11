import { db, auth } from '@/main'; // Import Firestore and Auth from your initialized Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore functions

// Function to fetch the pomoMsgArray from Firestore
export const fetchPomoArray = async () => {
  const user = auth.currentUser; // Get the current authenticated user
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Reference to the user's document
    const userDocRef = doc(db, 'users', user.uid); 
    const userDocSnap = await getDoc(userDocRef); // Fetch document data

    if (userDocSnap.exists()) {
      return userDocSnap.data().pomoMsgArray || []; // Return pomoMsgArray or an empty array
    } else {
      console.error('No such document');
      return [];
    }
  } catch (error) {
    console.error('Error fetching pomo array:', error);
    throw error;
  }
};

// Function to update the pomoMsgArray in Firestore
export const updatePomoArray = async (newPomoArray) => {
  const user = auth.currentUser; // Get the current authenticated user
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Reference to the user's document
    const userDocRef = doc(db, 'users', user.uid); 
    await updateDoc(userDocRef, {
      pomoMsgArray: newPomoArray, // Update the pomoMsgArray
    });
    console.log('pomoArray updated successfully');
  } catch (error) {
    console.error('Error updating pomo array:', error);
    throw error;
  }
};

export const fetchReminderMessage = async () => {
  const user = auth.currentUser; // Get the current authenticated user
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Reference to the user's document
    const userDocRef = doc(db, 'users', user.uid); 
    const userDocSnap = await getDoc(userDocRef); // Fetch document data

    if (userDocSnap.exists()) {
      return userDocSnap.data().reminder_message || "Do not forget you are doing something important!"; 
    } else {
      console.error('No such document');
      return [];
    }
  } catch (error) {
    console.error('Error fetching reminder message:', error);
    throw error;
  }
};

export const updateReminderString = async (newReminderString) => {
  const user = auth.currentUser; // Get the current authenticated user
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Reference to the user's document
    const userDocRef = doc(db, 'users', user.uid); 
    await updateDoc(userDocRef, {
      reminder_message: newReminderString, // Update the pomoMsgArray
    });
    console.log('Reminder updated successfully');
  } catch (error) {
    console.error('Error updating reminder string:', error);
    throw error;
  }
};