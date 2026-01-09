import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';

export default function NotificationsScreen() {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loadingSeed, setLoadingSeed] = useState(false);

  // Refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        fetchNotifications(currentUser.id, { reset: true });
        fetchStats(currentUser.id);
      }
    }, [currentUser?.id])
  );

  // Fetch when user changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications(currentUser.id, { reset: true });
      fetchStats(currentUser.id);
    } else {
      setNotifications([]);
      setStats(null);
    }
  }, [currentUser?.id]);

  // Debounced search
  useEffect(() => {
    if (!currentUser?.id) return;
    const handle = setTimeout(() => {
      fetchNotifications(currentUser.id, { reset: true });
    }, 400);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchNotifications = useCallback(async (uid, { reset = false } = {}) => {
    if (!uid) return;
    const nextPage = reset ? 1 : page + 1;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await api.getNotifications(uid, { page: nextPage, limit: 20, search });
      const items = result.notifications || [];
      setNotifications((prev) => (reset ? items : [...prev, ...items]));
      setPage(nextPage);
      setHasMore(result.pagination?.hasMore ?? items.length > 0);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, search]);

  const fetchStats = async (uid) => {
    try {
      const result = await api.getStats(uid);
      setStats(result);
    } catch (e) {
      console.error('Stats error', e);
    }
  };

  const onRefresh = async () => {
    if (!currentUser?.id) return;
    setRefreshing(true);
    await fetchNotifications(currentUser.id, { reset: true });
    await fetchStats(currentUser.id);
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markAsRead(id);
      if (currentUser?.id) {
        fetchNotifications(currentUser.id, { reset: true });
        fetchStats(currentUser.id);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSeed = async () => {
    if (!currentUser?.id) return;
    setLoadingSeed(true);
    try {
      await api.seedNotifications(currentUser.id, 80);
      await fetchNotifications(currentUser.id, { reset: true });
      await fetchStats(currentUser.id);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoadingSeed(false);
    }
  };

  const typeColors = { transactional: '#2196F3', marketing: '#9C27B0', alert: '#F44336', system: '#607D8B' };

  const renderNotification = ({ item }) => {
    const isUnread = item.channels?.inApp?.status === 'unread';
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10,
          borderLeftWidth: isUnread ? 4 : 0, borderLeftColor: '#2196F3',
        }}
        onPress={() => { setSelectedNotification(item); if (isUnread) handleMarkAsRead(item._id); }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ backgroundColor: typeColors[item.type] || '#999', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 8 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{item.type?.toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 11, color: '#888' }}>{item.priority}</Text>
          {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3', marginLeft: 'auto' }} />}
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ fontSize: 13, color: '#666' }} numberOfLines={2}>{item.body}</Text>
        <Text style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>{new Date(item.createdAt).toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  // No user selected
  if (!currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>No User Selected</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>Go to the Users tab to create or select a user first.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header: User + Stats */}
      <View style={{ backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{currentUser.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{currentUser.name}</Text>
            <Text style={{ fontSize: 11, color: '#888' }}>{currentUser.email}</Text>
          </View>
        </View>

        {stats && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: '#fafafa', borderRadius: 8 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>{stats.total}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>Total</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F44336' }}>{stats.unread}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>Unread</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4CAF50' }}>{stats.read}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>Read</Text>
            </View>
          </View>
        )}
      </View>

      {/* Search + Actions */}
      <View style={{ backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, fontSize: 14, backgroundColor: '#fafafa', marginBottom: 10 }}
          placeholder="Search by title or body..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#2196F3', padding: 10, borderRadius: 8, alignItems: 'center', marginRight: 8 }}
            onPress={onRefresh}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: loadingSeed ? '#ccc' : '#FF9800', padding: 10, borderRadius: 8, alignItems: 'center' }}
            onPress={handleSeed}
            disabled={loadingSeed}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loadingSeed ? 'Seeding...' : 'Generate Mock'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => item._id ? `${item._id}-${index}` : `notif-${index}`}
          contentContainerStyle={{ padding: 12 }}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (!loadingMore && hasMore) fetchNotifications(currentUser.id); }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>No Notifications</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Send one from the Create tab</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && notifications.length > 0 ? (
              <TouchableOpacity
                style={{ padding: 12, backgroundColor: '#2196F3', borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                onPress={() => fetchNotifications(currentUser.id)}
                disabled={loadingMore}
              >
                {loadingMore ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Load More</Text>}
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedNotification} transparent animationType="fade" onRequestClose={() => setSelectedNotification(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }} activeOpacity={1} onPress={() => setSelectedNotification(null)}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ backgroundColor: typeColors[selectedNotification?.type] || '#999', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{selectedNotification?.type?.toUpperCase()}</Text>
              </View>
              <Text style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>{selectedNotification?.priority} priority</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>{selectedNotification?.title}</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 }}>{selectedNotification?.body}</Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginBottom: 16 }}>{selectedNotification ? new Date(selectedNotification.createdAt).toLocaleString() : ''}</Text>
            
            {selectedNotification?.channels && (
              <View style={{ backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>CHANNEL STATUS</Text>
                {['push', 'email', 'inApp'].map((ch) => (
                  <View key={ch} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: '#888' }}>{ch}</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontWeight: '600' }}>{selectedNotification.channels?.[ch]?.status || 'n/a'}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity style={{ backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => setSelectedNotification(null)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
