import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { UserProvider } from './context/UserContext';
import UsersScreen from './screens/UsersScreen';
import CreateNotificationScreen from './screens/CreateNotificationScreen';
import NotificationsScreen from './screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

// Configure notification behavior for ALL app states (foreground, background, killed)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Show alert when app is in foreground
    shouldPlaySound: true,   // Play sound
    shouldSetBadge: true,    // Update badge count
  }),
});

export default function App() {
  useEffect(() => {
    // Set up notification listeners for background/killed state
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 User tapped notification:', response.notification.request.content);
      
      // Handle notification tap (e.g., navigate to specific screen)
      const data = response.notification.request.content.data;
      if (data?.notificationId) {
        console.log('Navigate to notification:', data.notificationId);
        // You can add navigation logic here if needed
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <UserProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: '#666',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Users"
            component={UsersScreen}
            options={{
              tabBarIcon: ({ color, size = 22 }) => (
                <MaterialIcons name="person-outline" size={size} color={color} />
              ),
              title: 'Create User',
            }}
          />
          <Tab.Screen
            name="Create"
            component={CreateNotificationScreen}
            options={{
              tabBarIcon: ({ color, size = 22 }) => (
                <MaterialIcons name="add-circle-outline" size={size} color={color} />
              ),
              title: 'Send Notification',
            }}
          />
          <Tab.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              tabBarIcon: ({ color, size = 22 }) => (
                <MaterialIcons name="notifications-none" size={size} color={color} />
              ),
              title: 'View Notifications',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
