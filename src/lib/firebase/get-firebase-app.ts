import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';

// We need to make sure that we initialize the app only once.
// We are in a Next.js environment, so we need to be careful about
// how we initialize the app.
// On the server, we might initialize it multiple times, so we need to
// check if it's already initialized.
// On the client, it's safer, but we still should be careful.
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export function getFirebaseApp() {
  return app;
}
