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
} from 'react-native';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';
import UserPicker from '../components/UserPicker';

export default function UsersScreen() {
  const { selectUser, refreshUsers } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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
      <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={{ padding: 16 }}>
          {/* Create User Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Create New User</Text>
            
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#ddd', padding: 12,
                borderRadius: 8, marginBottom: 12, fontSize: 15, backgroundColor: '#fafafa'
              }}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#ddd', padding: 12,
                borderRadius: 8, marginBottom: 16, fontSize: 15, backgroundColor: '#fafafa'
              }}
              placeholder="Display name"
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                padding: 14, borderRadius: 8, alignItems: 'center'
              }}
              onPress={handleCreateUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Create & Select User</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* User Picker */}
          <UserPicker />

          {/* Instructions */}
          <View style={{ marginTop: 16, padding: 16, backgroundColor: '#E3F2FD', borderRadius: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#1565C0' }}>How it works</Text>
            <Text style={{ fontSize: 13, color: '#1976D2', marginBottom: 4 }}>1. Create or select a user above</Text>
            <Text style={{ fontSize: 13, color: '#1976D2', marginBottom: 4 }}>2. Go to Send tab to create notifications</Text>
            <Text style={{ fontSize: 13, color: '#1976D2' }}>3. View them in the Notifications tab</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
