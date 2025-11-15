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

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) => {
    // This function can throw 'auth/email-already-in-use' which should be caught by the caller.
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfileRef = doc(firestore, 'userProfiles', user.uid);
    // This setDoc creates the user profile that makes the user visible in the app.
    // It is protected by Firestore rules.
    await setDoc(userProfileRef, {
        id: user.uid,
        email: user.email,
        displayName: displayName,
        role: role,
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
