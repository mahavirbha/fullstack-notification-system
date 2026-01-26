import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export default function WebContainer({ children }) {
  if (Platform.OS !== 'web') {
    // On native, simply pass through with flex: 1
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Allow full width for headers/nav bars
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5', 
  },
  content: {
    flex: 1,
    width: '100%', 
    // Remove maxWidth constraint on the app root so nav bars stretch
    maxWidth: '100%',
    // Remove individual card styling from the root
    shadowOpacity: 0,
    borderWidth: 0,
  },
});
