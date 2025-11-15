
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const { firestore, auth, firebaseApp } = initializeFirebase();
const functions = getFunctions(firebaseApp);

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) => {
    try {
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
            const setUserRole = httpsCallable(functions, 'setUserRole');
            await setUserRole({ uid: user.uid, role: 'admin' });
        }

        return userCredential;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
             try {
                // The user exists in Auth, but maybe not in Firestore.
                // We can't get their UID directly, so we'll sign in to get it.
                const existingUserCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = existingUserCredential.user;
                
                const userProfileRef = doc(firestore, 'userProfiles', user.uid);
                const userProfileSnap = await getDoc(userProfileRef);

                if (!userProfileSnap.exists()) {
                    // Profile doesn't exist, so create it.
                    await setDoc(userProfileRef, {
                        id: user.uid,
                        email: user.email,
                        displayName: displayName,
                        role: role,
                        createdAt: serverTimestamp(),
                    });
                }
                // If the profile already exists, we do nothing.
                
                // Sign out the temporary session
                await firebaseSignOut(auth);
                
                // Return a custom object since we can't return the original userCredential
                // and the UI expects a successful "creation"
                return { user: user } as any;

            } catch (signInError) {
                // This could happen if the password is wrong for the existing email
                console.error("Error signing in existing user to create profile:", signInError);
                throw new Error("El usuario ya existe, pero no se pudo verificar con la contraseña proporcionada.");
            }
        }
        console.error("Error creating user:", error);
        throw error;
    }
}


export const signOut = () => {
    return firebaseSignOut(auth);
}

export const onAuthStateChangedHelper = (callback: NextOrObserver<User>) => {
    return onAuthStateChanged(auth, callback);
}
