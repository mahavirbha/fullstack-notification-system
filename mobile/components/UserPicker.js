import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';

export default function UserPicker({ onSelect }) {
  const { currentUser, users, loading, selectUser, refreshUsers } = useUser();

  const handleSelect = async (user) => {
    await selectUser(user);
    if (onSelect) onSelect(user);
  };

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }}>
      {/* Current Selection */}
      {currentUser ? (
        <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, color: '#388E3C', fontWeight: '600' }}>SELECTED USER</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginTop: 4 }}>{currentUser.name}</Text>
          <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 2 }}>{currentUser.email}</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#E65100', fontWeight: '600' }}>No user selected</Text>
          <Text style={{ fontSize: 12, color: '#FF9800', marginTop: 4 }}>Select a user below to continue</Text>
        </View>
      )}

      {/* User List */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#666' }}>Available Users</Text>
        <TouchableOpacity onPress={refreshUsers} disabled={loading}>
          <Text style={{ fontSize: 12, color: '#2196F3' }}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator style={{ marginVertical: 20 }} />
      ) : users.length === 0 ? (
        <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 }}>
          No users yet. Create one above!
        </Text>
      ) : (
        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
          {users.map((u) => {
            const isSelected = currentUser?.id === u._id;
            return (
              <TouchableOpacity
                key={u._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: isSelected ? '#E3F2FD' : 'transparent',
                  marginBottom: 4,
                }}
                onPress={() => handleSelect(u)}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isSelected ? '#2196F3' : '#E0E0E0',
                  justifyContent: 'center', alignItems: 'center', marginRight: 10
                }}>
                  <Text style={{ color: isSelected ? '#fff' : '#666', fontWeight: 'bold' }}>
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>{u.name}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>{u.email}</Text>
                </View>
                {isSelected && (
                  <Text style={{ fontSize: 16, color: '#2196F3' }}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
