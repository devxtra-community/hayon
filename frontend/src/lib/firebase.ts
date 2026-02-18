import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBFxGmN3aW38F6KA0rF7dbV3kSc0TRokig",
  authDomain: "hayon-app.firebaseapp.com",
  projectId: "hayon-app",
  storageBucket: "hayon-app.firebasestorage.app",
  messagingSenderId: "1094405093952",
  appId: "1:1094405093952:web:b105162e509a0875cffda5",
  measurementId: "G-XNDZBYH6PQ",
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export { messaging };
