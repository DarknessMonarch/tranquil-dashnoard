// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyC2F03tb1R2lhKJzTXudu3DtZRANMLEOhM",
  authDomain: "backroom-8fd24.firebaseapp.com",
  projectId: "backroom-8fd24",
  storageBucket: "backroom-8fd24.firebasestorage.app",
  messagingSenderId: "690245939062",
  appId: "1:690245939062:web:e3dbda429b8ae80ad55457"
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'BackroomScript';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'backroomscript-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Open the app
  event.waitUntil(
    clients.openWindow('/')
  );
});
