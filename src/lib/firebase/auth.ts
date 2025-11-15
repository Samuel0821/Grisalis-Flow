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
        // Attempt to create the user as before.
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
        // If the error is 'email-already-in-use', we don't treat it as a failure.
        // Instead, we'll try to sign the user in to get their UID and then create their profile.
        if (error.code === 'auth/email-already-in-use') {
            console.warn(`User with email ${email} already exists in Auth. Attempting to create Firestore profile.`);
            try {
                // We can't get the UID directly, so we have to sign them in.
                // This is a temporary sign-in and won't affect the admin's session.
                const tempAuth = getAuth(initializeFirebase().firebaseApp);
                const signInCredential = await firebaseSignInWithEmailAndPassword(tempAuth, email, password);
                const existingUser = signInCredential.user;

                const userProfileRef = doc(firestore, 'userProfiles', existingUser.uid);
                
                // We check if the profile *really* doesn't exist before creating it.
                const docSnap = await getDoc(userProfileRef);
                if (!docSnap.exists()) {
                     await setDoc(userProfileRef, {
                        id: existingUser.uid,
                        email: existingUser.email,
                        displayName: displayName,
                        role: role,
                        createdAt: serverTimestamp(),
                    });
                    console.log(`Successfully created Firestore profile for existing user ${email}.`);
                } else {
                    console.warn(`Firestore profile for ${email} already existed. No action taken.`);
                }
               
                // We sign out the temporary user immediately.
                await firebaseSignOut(tempAuth);
                
                // Return a user credential-like object so the UI can proceed.
                return signInCredential;

            } catch (signInError: any) {
                 // If we fail to sign in (e.g., wrong password for existing user), we re-throw the error.
                 console.error("Failed to sign in existing user to create profile:", signInError);
                 throw new Error(`El usuario con el email ${email} ya existe, pero la contraseña proporcionada es incorrecta.`);
            }
        } else {
            // For any other error, we re-throw it as before.
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
