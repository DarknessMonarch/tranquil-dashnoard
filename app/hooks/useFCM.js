import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/app/lib/firebase';
import { toast } from 'sonner';

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

export const useFCM = (isAuthenticated, getAuthHeader) => {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState('default');

  // Request permission and register token
  const requestPermission = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping FCM registration');
      return;
    }

    try {
      const result = await requestNotificationPermission();

      if (result.success) {
        setToken(result.token);
        setPermission('granted');

        // Register token with backend
        await registerTokenWithBackend(result.token);

        toast.success('Notifications enabled!');
      } else {
        setPermission('denied');
        console.error('FCM permission denied:', result.error);
      }
    } catch (error) {
      console.error('Error requesting FCM permission:', error);
      setPermission('denied');
    }
  };

  // Register token with backend
  const registerTokenWithBackend = async (fcmToken) => {
    try {
      const response = await fetch(`${SERVER_API}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ token: fcmToken }),
      });

      const data = await response.json();

      if (data.status !== 'success') {
        console.error('Failed to register FCM token:', data.message);
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted') return;

    onMessageListener()
      .then((payload) => {
        console.log('Received foreground message:', payload);

        const title = payload.notification?.title || 'Tranquil';
        const body = payload.notification?.body || '';

        toast.info(body, { description: title });
      })
      .catch((err) => console.error('Failed to receive foreground message:', err));
  }, [isAuthenticated, permission]);

  return {
    token,
    permission,
    requestPermission,
  };
};
