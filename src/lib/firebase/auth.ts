
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
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
          // This error is now handled in the UI to inform the admin.
          // We re-throw it so the calling function knows the creation failed for this reason.
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
