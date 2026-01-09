import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from './context/UserContext';
import UsersScreen from './screens/UsersScreen';
import CreateNotificationScreen from './screens/CreateNotificationScreen';
import NotificationsScreen from './screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
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
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
              title: 'Create User',
            }}
          />
          <Tab.Screen
            name="Create"
            component={CreateNotificationScreen}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>➕</Text>,
              title: 'Send Notification',
            }}
          />
          <Tab.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔔</Text>,
              title: 'View Notifications',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
