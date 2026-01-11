import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { registerForPushNotifications, setupNotificationListeners, unregisterDevice } from '../services/pushNotifications';

const UserContext = createContext(null);

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [notificationEvent, setNotificationEvent] = useState(null); // For triggering refresh

  // WebSocket setup
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    newSocket.on('notification:created', (data) => {
      console.log('📬 New notification received:', data);
      setNotificationEvent({ type: 'created', data, timestamp: Date.now() });
    });

    newSocket.on('notification:updated', (data) => {
      console.log('🔄 Notification updated:', data);
      setNotificationEvent({ type: 'updated', data, timestamp: Date.now() });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Subscribe to user-specific events when user changes
  useEffect(() => {
    if (socket && currentUser?.id) {
      socket.emit('subscribe', currentUser.id);
      console.log(`📡 Subscribed to user:${currentUser.id}`);

      return () => {
        socket.emit('unsubscribe', currentUser.id);
        console.log(`📡 Unsubscribed from user:${currentUser.id}`);
      };
    }
  }, [socket, currentUser?.id]);

  // Register for push notifications when user changes
  useEffect(() => {
    if (currentUser?.id) {
      registerForPushNotifications(currentUser.id).catch(error => {
        console.error('Failed to register for push notifications:', error);
      });
    }
  }, [currentUser?.id]);

  // Set up push notification listeners
  useEffect(() => {
    const listeners = setupNotificationListeners(
      // When notification is received
      (notification) => {
        console.log('📬 In-app notification received:', notification);
        // Trigger refresh
        setNotificationEvent({ 
          type: 'push-received', 
          data: notification, 
          timestamp: Date.now() 
        });
      },
      // When notification is tapped
      (response) => {
        console.log('👆 Notification tapped:', response);
        const notificationData = response.notification.request.content.data;
        if (notificationData?.notificationId) {
          // Could navigate to notification detail here
          setNotificationEvent({ 
            type: 'push-tapped', 
            data: notificationData, 
            timestamp: Date.now() 
          });
        }
      }
    );

    return () => {
      listeners.remove();
    };
  }, []);

  // Load saved user and fetch user list on mount
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('selectedUserId');
      const name = await AsyncStorage.getItem('selectedUserName');
      const email = await AsyncStorage.getItem('selectedUserEmail');
      
      // Fetch users first
      const result = await refreshUsers();
      
      // Validate cached user still exists
      if (id && result) {
        const userExists = result.users?.some(u => (u._id || u.id) === id);
        if (userExists) {
          setCurrentUser({ id, name: name || 'User', email: email || '' });
        } else {
          // Clear invalid cached user
          await AsyncStorage.removeItem('selectedUserId');
          await AsyncStorage.removeItem('selectedUserName');
          await AsyncStorage.removeItem('selectedUserEmail');
          console.log('🧹 Cleared invalid cached user');
        }
      }
    })();
  }, []);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listUsers({ page: 1, limit: 50 });
      setUsers(result.users || []);
      return result; // Return for validation
    } catch (e) {
      console.error('Failed to load users', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectUser = useCallback(async (user) => {
    // user: { id or _id, name, email }
    const id = user._id || user.id;
    const u = { id, name: user.name, email: user.email };
    setCurrentUser(u);
    await AsyncStorage.setItem('selectedUserId', id);
    await AsyncStorage.setItem('selectedUserName', user.name);
    await AsyncStorage.setItem('selectedUserEmail', user.email || '');
  }, []);

  const clearUser = useCallback(async () => {
    // Unregister device from push notifications
    if (currentUser?.id) {
      await unregisterDevice(currentUser.id).catch(err => 
        console.error('Failed to unregister device:', err)
      );
    }
    
    setCurrentUser(null);
    await AsyncStorage.removeItem('selectedUserId');
    await AsyncStorage.removeItem('selectedUserName');
    await AsyncStorage.removeItem('selectedUserEmail');
  }, [currentUser?.id]);

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      users, 
      loading, 
      selectUser, 
      clearUser, 
      refreshUsers,
      notificationEvent, // Expose for screens to react to
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
