importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBFxGmN3aW38F6KA0rF7dbV3kSc0TRokig",
  authDomain: "hayon-app.firebaseapp.com",
  projectId: "hayon-app",
  storageBucket: "hayon-app.firebasestorage.app",
  messagingSenderId: "1094405093952",
  appId: "1:1094405093952:web:b105162e509a0875cffda5",
  measurementId: "G-XNDZBYH6PQ",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
