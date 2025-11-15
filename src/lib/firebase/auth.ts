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
import { getFunctions, httpsCallable } from 'firebase/functions';

const { firestore, auth, firebaseApp } = initializeFirebase();
const functions = getFunctions(firebaseApp);

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) => {
    const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfileRef = doc(firestore, 'userProfiles', user.uid);
    await setDoc(userProfileRef, {
        id: user.uid,
        email: user.email,
        displayName: displayName,
        role: role,
        createdAt: serverTimestamp(),
    });

    if (role === 'admin') {
        try {
            const setUserRoleCallable = httpsCallable(functions, 'setUserRole');
            await setUserRoleCallable({ userId: user.uid, role: 'admin' });
        } catch(e) {
            console.error("Error setting admin role, maybe function is not deployed?", e);
            // Optionally handle the error, e.g., by deleting the created user if setting the role is critical
        }
    }
    
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
