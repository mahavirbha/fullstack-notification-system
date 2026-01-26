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
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function CreateNotificationScreen() {
  const { currentUser } = useUser();
  const [type, setType] = useState('alert');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width >= 900;

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
        if (Platform.OS === 'web') {
          alert('Notification sent successfully!');
        } else {
          Alert.alert('Sent!', 'Notification created successfully');
        }
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
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#f5f5f5' }}
        contentContainerStyle={{ padding: isWeb ? 24 : 16 }}
      >
        <View style={isWeb ? styles.webContainer : styles.column}>
          
          {/* LEFT COLUMN: Input Form */}
          <View style={[styles.column, isWeb && { flex: 2 }]}>
            {/* Recipient Card */}
            <View style={styles.card}>
              <Text style={styles.label}>SENDING TO</Text>
              {currentUser ? (
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{currentUser.name}</Text>
                    <Text style={styles.userEmail}>{currentUser.email}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.warningBox}>
                  <MaterialIcons name="warning" size={20} color="#E65100" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: '#E65100', fontWeight: '600' }}>No user selected</Text>
                    <Text style={{ color: '#FF9800', fontSize: 12 }}>Go to Users tab first</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Notification Details Card */}
            <View style={styles.card}>
              <Text style={styles.label}>CONFIGURATION</Text>
              
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.rowWrap}>
                {types.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      { backgroundColor: type === t ? typeColors[t] : '#f0f0f0' }
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={{ color: type === t ? '#fff' : '#666', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Priority</Text>
              <View style={styles.rowWrap}>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.chip,
                      { backgroundColor: priority === p ? '#333' : '#f0f0f0' }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={{ color: priority === p ? '#fff' : '#666', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>CONTENT</Text>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Notification title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>Body</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Notification message"
                value={body}
                onChangeText={setBody}
                multiline
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!currentUser || loading) && styles.sendButtonDisabled
              ]}
              onPress={handleCreate}
              disabled={!currentUser || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>Send Notification</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* RIGHT COLUMN: Preview & Templates (Web Only) or Stacked (Mobile) */}
          <View style={[styles.column, isWeb && { flex: 1 }]}>
            
            {/* Live Preview - Only prominent on large screens or if content exists */}
            {(isWeb || title || body) && (
              <View style={styles.previewCard}>
                <Text style={styles.label}>PREVIEW</Text>
                <View style={[styles.notificationPreview, { borderLeftColor: typeColors[type] }]}>
                  <View style={styles.previewHeader}>
                     <View style={[styles.miniBadge, { backgroundColor: typeColors[type] }]}>
                       <Text style={styles.miniBadgeText}>{type}</Text>
                     </View>
                     <Text style={styles.previewTime}>Now</Text>
                  </View>
                  <Text style={styles.previewTitle}>{title || "Notification Title"}</Text>
                  <Text style={styles.previewBody}>{body || "Your notification message will appear here."}</Text>
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.label}>QUICK TEMPLATES</Text>
              {quickTemplates.map((tpl, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.templateItem}
                  onPress={() => { setType(tpl.type); setPriority(tpl.priority); setTitle(tpl.title); setBody(tpl.body); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={[styles.dot, { backgroundColor: typeColors[tpl.type] }]} />
                    <Text style={styles.templateTitle}>{tpl.title}</Text>
                  </View>
                  <Text style={styles.templateBody} numberOfLines={2}>{tpl.body}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  column: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewCard: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  label: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
    marginBottom: 16,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notificationPreview: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  previewTime: {
    fontSize: 10,
    color: '#aaa',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 14,
    color: '#555',
  },
  templateItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  templateBody: {
    fontSize: 12,
    color: '#666',
  },
});
