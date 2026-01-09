import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load saved user and fetch user list on mount
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('selectedUserId');
      const name = await AsyncStorage.getItem('selectedUserName');
      const email = await AsyncStorage.getItem('selectedUserEmail');
      if (id) {
        setCurrentUser({ id, name: name || 'User', email: email || '' });
      }
      refreshUsers();
    })();
  }, []);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listUsers({ page: 1, limit: 50 });
      setUsers(result.users || []);
    } catch (e) {
      console.error('Failed to load users', e);
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
    setCurrentUser(null);
    await AsyncStorage.removeItem('selectedUserId');
    await AsyncStorage.removeItem('selectedUserName');
    await AsyncStorage.removeItem('selectedUserEmail');
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, users, loading, selectUser, clearUser, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
