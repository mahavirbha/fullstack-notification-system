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
import { useUser } from '../context/UserContext';
import { api } from '../services/api';

export default function CreateNotificationScreen() {
  const { currentUser } = useUser();
  const [type, setType] = useState('alert');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!currentUser) {
      Alert.alert('No User', 'Please select a user in the Users tab first');
      return;
    }
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please enter title and body');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createNotification({
        type,
        title: title.trim(),
        body: body.trim(),
        userId: currentUser.id,
        priority,
      });
      if (result.success) {
        Alert.alert('Sent!', 'Notification created successfully');
        setTitle('');
        setBody('');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const types = ['transactional', 'marketing', 'alert', 'system'];
  const priorities = ['low', 'medium', 'high'];
  const typeColors = { transactional: '#2196F3', marketing: '#9C27B0', alert: '#F44336', system: '#607D8B' };

  const quickTemplates = [
    { type: 'alert', priority: 'high', title: 'Security Alert', body: 'New login detected from Chrome on Windows.' },
    { type: 'transactional', priority: 'high', title: 'Payment Successful', body: 'Your payment of $99.99 has been processed.' },
    { type: 'marketing', priority: 'low', title: 'Special Offer', body: 'Get 20% off premium features this week!' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={{ padding: 16 }}>
          {/* Recipient Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: '#888', fontWeight: '600' }}>SENDING TO</Text>
            {currentUser ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50',
                  justifyContent: 'center', alignItems: 'center', marginRight: 12
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{currentUser.name}</Text>
                  <Text style={{ fontSize: 12, color: '#888' }}>{currentUser.email}</Text>
                </View>
              </View>
            ) : (
              <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginTop: 8 }}>
                <Text style={{ color: '#E65100', fontWeight: '600' }}>No user selected</Text>
                <Text style={{ color: '#FF9800', fontSize: 12, marginTop: 4 }}>Go to Users tab to select one</Text>
              </View>
            )}
          </View>

          {/* Type Selection */}
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10 }}>TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8,
                    backgroundColor: type === t ? typeColors[t] : '#f0f0f0',
                  }}
                  onPress={() => setType(t)}
                >
                  <Text style={{ color: type === t ? '#fff' : '#666', fontSize: 13, fontWeight: '600' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 10 }}>PRIORITY</Text>
            <View style={{ flexDirection: 'row' }}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                    backgroundColor: priority === p ? '#333' : '#f0f0f0',
                  }}
                  onPress={() => setPriority(p)}
                >
                  <Text style={{ color: priority === p ? '#fff' : '#666', fontSize: 13, fontWeight: '600' }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 }}>TITLE</Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8,
                fontSize: 15, backgroundColor: '#fafafa', marginBottom: 16
              }}
              placeholder="Notification title"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 }}>BODY</Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8,
                fontSize: 15, backgroundColor: '#fafafa', height: 100, textAlignVertical: 'top'
              }}
              placeholder="Notification body"
              value={body}
              onChangeText={setBody}
              multiline
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={{
              backgroundColor: (!currentUser || loading) ? '#ccc' : '#4CAF50',
              padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16
            }}
            onPress={handleCreate}
            disabled={!currentUser || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Send Notification</Text>
            )}
          </TouchableOpacity>

          {/* Quick Templates */}
          <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 12 }}>QUICK TEMPLATES</Text>
            {quickTemplates.map((tpl, i) => (
              <TouchableOpacity
                key={i}
                style={{ backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 8 }}
                onPress={() => { setType(tpl.type); setPriority(tpl.priority); setTitle(tpl.title); setBody(tpl.body); }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>{tpl.title}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{tpl.body}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
