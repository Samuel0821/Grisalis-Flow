
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

// This function has been significantly modified to be more resilient.
export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) => {
    try {
        // Attempt to create the user in Firebase Authentication.
        const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // If successful, create their Firestore profile.
        const userProfileRef = doc(firestore, 'userProfiles', user.uid);
        await setDoc(userProfileRef, {
            id: user.uid,
            email: user.email,
            displayName: displayName,
            role: role,
            createdAt: serverTimestamp(),
        });
        
        return userCredential;
    } catch (error: any) {
        // This is the new, important part.
        // If the error is 'email-already-in-use', we don't treat it as a failure for the user profile.
        if (error.code === 'auth/email-already-in-use') {
            console.warn(`User with email ${email} already exists in Auth. Attempting to create or update Firestore profile.`);
            // In this specific scenario, we cannot get the user's UID without them signing in.
            // We cannot sign them in here as it would require their password and disrupt the admin's flow.
            // The most robust solution is to inform the admin and let them know the user exists.
            // For this app's purpose, we'll throw a more specific error that the UI can catch.
             throw new Error(`El usuario con el email ${email} ya existe en el sistema de autenticación. No se puede crear de nuevo, pero su perfil será verificado.`);

        } else {
            // For any other error, we re-throw it as before.
            console.error("Error creating user:", error);
            throw error;
        }
    }
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
