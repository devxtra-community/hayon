importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID_PLACEHOLDER",
  measurementId: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_PLACEHOLDER",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
