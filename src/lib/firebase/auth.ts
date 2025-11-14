

'use client';

import {
  getAuth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const { firestore, auth } = initializeFirebase();

export const createUserWithEmailAndPassword = async (email: string, password: string, displayName: string) => {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user profile document in Firestore
    const userProfileRef = doc(firestore, 'userProfiles', user.uid);
    await setDoc(userProfileRef, {
        email: user.email,
        displayName: displayName,
        role: 'member', // Default role
        createdAt: serverTimestamp(),
    });
    
    return userCredential;
}

export const signInWithEmailAndPassword = (email: string, password: string) => {
    return firebaseSignInWithEmailAndPassword(auth, email, password);
}

export const signOut = () => {
    return firebaseSignOut(auth);
}

export const onAuthStateChangedHelper = (callback: NextOrObserver<User>) => {
    return onAuthStateChanged(auth, callback);
}
