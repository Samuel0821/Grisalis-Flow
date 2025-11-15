
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
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const { firestore, auth } = initializeFirebase();

/**
 * Creates a new user in Firebase Authentication and their corresponding profile in Firestore.
 * This version is simplified to throw an error if the user already exists, which should be handled by the UI.
 * @param email The user's email.
 * @param password The user's password.
 * @param displayName The user's display name.
 * @param role The user's role, defaults to 'member'.
 * @returns The user credential from Firebase Auth.
 */
export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) => {
    // This will now throw 'auth/email-already-in-use' if the email exists,
    // which the calling UI component must handle.
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // If authentication creation is successful, create the Firestore profile.
    const userProfileRef = doc(firestore, 'userProfiles', user.uid);
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
