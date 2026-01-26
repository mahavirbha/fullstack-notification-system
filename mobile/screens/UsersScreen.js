import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet
} from 'react-native';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';
import UserPicker from '../components/UserPicker';

export default function UsersScreen() {
  const { selectUser, refreshUsers } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const handleCreateUser = async () => {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and name');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createUser(email.trim(), name.trim());
      if (result.success) {
        Alert.alert('Success', `User "${result.user.name}" created!`);
        setEmail('');
        setName('');
        await selectUser(result.user);
        await refreshUsers();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#f5f5f5' }}
        contentContainerStyle={{ padding: isWeb ? 24 : 16 }}
      >
        <View style={isWeb ? styles.webContainer : styles.mobileContainer}>
          
          {/* Create User Section */}
          <View style={[styles.card, isWeb && styles.webCard]}>
            <Text style={styles.cardTitle}>Create New User</Text>
            <Text style={styles.cardSubtitle}>Start here by creating a test user to receive notifications.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Display name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreateUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create & Select User</Text>
              )}
            </TouchableOpacity>

            {!isWeb && (
               <View style={styles.instructionBox}>
                 <Text style={styles.instructionTitle}>Quick Start</Text>
                 <Text style={styles.instructionText}>1. Create user above</Text>
                 <Text style={styles.instructionText}>2. Go to Send tab</Text>
               </View>
            )}
          </View>

          {/* User Picker & Instructions Section */}
          <View style={[styles.rightColumn, isWeb && styles.webRightColumn]}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Switch User</Text>
              <Text style={styles.cardSubtitle}>Select an existing user to simulate their session.</Text>
              <UserPicker />
            </View>

            {isWeb && (
              <View style={[styles.instructionBox, { marginTop: 24 }]}>
                <Text style={styles.instructionTitle}>How it works</Text>
                <Text style={styles.instructionText}>1. Create or select a user on this screen.</Text>
                <Text style={styles.instructionText}>2. Navigate to the "Send Notification" tab.</Text>
                <Text style={styles.instructionText}>3. View received messages in the "Notifications" tab.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  webContainer: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  webCard: {
    flex: 1,
  },
  webRightColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2196F3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  instructionBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1565C0',
  },
  instructionText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 22,
  },
});
