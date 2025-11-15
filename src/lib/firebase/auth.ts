'use client';

import {
  getAuth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { UserProfile } from './firestore';

const { firestore, auth } = initializeFirebase();

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
): Promise<UserProfile> => {
    try {
        const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create the user profile in Firestore
        const userProfileRef = doc(firestore, 'userProfiles', user.uid);
        const userProfileData: Omit<UserProfile, 'id' | 'createdAt'> = {
            email: user.email!,
            displayName: displayName,
            role: role,
        };
        await setDoc(userProfileRef, {
            ...userProfileData,
            createdAt: serverTimestamp(),
        });
        
        return {
            id: user.uid,
            ...userProfileData,
            createdAt: new Date() as any, // Optimistic update for UI
        };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            // User exists in Auth, let's find their UID and create the Firestore profile if it doesn't exist
            console.warn("User already exists in Auth. Ensuring profile exists in Firestore.");

            // This part is tricky without Admin SDK. We can't directly look up user by email on client.
            // So, we'll assume the sign-in error implies existence and proceed to try and create the profile doc.
            // A more robust solution would require a Cloud Function, but this is a pragmatic approach.
            
            // To create the doc, we need the UID. Since we can't get it, we'll inform the user.
            // The best we can do here is re-throw and let the UI handle it.
             throw error;

        }
        console.error("Error creating user:", error);
        // Re-throw other errors
        throw error;
    }
}


export const signOut = () => {
    return firebaseSignOut(auth);
}

export const onAuthStateChangedHelper = (callback: NextOrObserver<User>) => {
    return onAuthStateChanged(auth, callback);
}
