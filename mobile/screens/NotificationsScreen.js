import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  Platform,
  Modal,
  ScrollView // Added ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const typeColors = { transactional: '#2196F3', marketing: '#9C27B0', alert: '#F44336', system: '#607D8B' };
const statusColors = { pending: '#FFC107', sent: '#2196F3', delivered: '#4CAF50', failed: '#F44336', unread: '#2196F3', read: '#9E9E9E' };

export default function NotificationsScreen() {
  const { currentUser, notificationEvent } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  // React to WebSocket notification events
  useEffect(() => {
    if (notificationEvent && currentUser?.id) {
      fetchNotifications(currentUser.id, { reset: true });
      fetchStats(currentUser.id);
    }
  }, [notificationEvent]);

  // Refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        fetchNotifications(currentUser.id, { reset: true });
        fetchStats(currentUser.id);
        setSelectedNotification(null);
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

  const fetchNotifications = useCallback(async (uid, { reset = false } = {}) => {
    if (!uid) return;
    if (reset) setLoading(true);

    try {
      const result = await api.getNotifications(uid, { page: 1, limit: 50 }); // Fetch more for ease
      const items = result.notifications || [];
      setNotifications(items);
      if (isWeb && items.length > 0 && !selectedNotification) {
        // Auto-select first item on web if nothing selected
       // setSelectedNotification(items[0]); 
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [isWeb, selectedNotification]);

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
      // Update local state smoothly
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, channels: { ...n.channels, inApp: { status: 'read' } } } : n));
      fetchStats(currentUser.id);
    } catch (error) {
     console.error(error);
    }
  };

  const NotificationItem = ({ item, isSelected, onPress }) => {
    const isUnread = item.channels?.inApp?.status === 'unread';
    const pushStatus = item.channels?.push?.status || 'pending';
    const emailStatus = item.channels?.email?.status || 'pending';

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.itemSelected,
          isUnread && styles.itemUnread
        ]}
        onPress={onPress}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColors[item.type] || '#999' }]}>
            <Text style={styles.typeText}>{item.type?.toUpperCase().slice(0, 1)}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={[styles.itemTitle, isUnread && styles.textBold]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        
        <View style={styles.statusRow}>
          <Feather name="smartphone" size={12} color={statusColors[pushStatus]} />
          <View style={{ width: 8 }} />
          <Feather name="mail" size={12} color={statusColors[emailStatus]} />
        </View>
      </TouchableOpacity>
    );
  };

  const DetailView = ({ item }) => {
    if (!item) return (
      <View style={styles.emptyDetail}>
        <Feather name="inbox" size={64} color="#ddd" />
        <Text style={styles.emptyText}>Select a notification to view details</Text>
      </View>
    );

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <View style={[styles.detailTypeBadge, { backgroundColor: typeColors[item.type] || '#999' }]}>
             <Text style={styles.detailTypeText}>{item.type?.toUpperCase()}</Text>
          </View>
          <Text style={styles.detailDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>

        <Text style={styles.detailTitle}>{item.title}</Text>
        
        <View style={styles.detailBodyBox}>
          <Text style={styles.detailBody}>{item.body}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.statusGrid}>
             <View style={styles.statusCard}>
                <Feather name="bell" size={20} color="#555" />
                <Text style={styles.statusLabel}>In-App</Text>
                <Text style={[styles.statusValue, { color: statusColors[item.channels?.inApp?.status || 'unread'] }]}>
                  {item.channels?.inApp?.status || 'Unread'}
                </Text>
             </View>
             <View style={styles.statusCard}>
                <Feather name="smartphone" size={20} color="#555" />
                <Text style={styles.statusLabel}>Push</Text>
                <Text style={[styles.statusValue, { color: statusColors[item.channels?.push?.status || 'pending'] }]}>
                  {item.channels?.push?.status || 'Pending'}
                </Text>
             </View>
             <View style={styles.statusCard}>
                <Feather name="mail" size={20} color="#555" />
                <Text style={styles.statusLabel}>Email</Text>
                <Text style={[styles.statusValue, { color: statusColors[item.channels?.email?.status || 'pending'] }]}>
                  {item.channels?.email?.status || 'Pending'}
                </Text>
             </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Metadata</Text>
           <Text style={styles.metaText}>ID: {item._id}</Text>
           <Text style={styles.metaText}>Priority: {item.priority}</Text>
        </View>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#9e9e9e" style={{ marginBottom: 16 }} />
        <Text style={styles.centerTitle}>No User Selected</Text>
        <Text style={styles.centerText}>Go to the Users tab to create or select a user first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Master List */}
      <View style={[styles.listContainer, isWeb && styles.webListContainer]}>
        <View style={styles.header}>
             <Text style={styles.headerTitle}>Inbox</Text>
             {stats && (
               <View style={styles.statsContainer}>
                 <View style={styles.statItem}>
                   <Text style={styles.statLabel}>Total</Text>
                   <Text style={styles.statValue}>{stats.total || 0}</Text>
                 </View>
                 <View style={styles.divider} />
                 <View style={styles.statItem}>
                   <Text style={[styles.statLabel, styles.statLabelUnread]}>Unread</Text>
                   <Text style={[styles.statValue, styles.statValueUnread]}>{stats.unread || 0}</Text>
                 </View>
               </View>
             )}
        </View>
        
        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#2196F3" />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
               <NotificationItem 
                 item={item} 
                 isSelected={selectedNotification?._id === item._id}
                 onPress={() => {
                   setSelectedNotification(item);
                   if (item.channels?.inApp?.status === 'unread') {
                     handleMarkAsRead(item._id);
                   }
                 }}
               />
            )}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No notifications yet</Text>
              </View>
            }
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>

      {/* Detail View (Web Only) */}
      {isWeb && (
        <View style={styles.webDetailContainer}>
           <DetailView item={selectedNotification} />
        </View>
      )}

      {/* Mobile Modal for Details */}
      {!isWeb && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={!!selectedNotification}
          onRequestClose={() => setSelectedNotification(null)}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
             <View style={styles.modalHeader}>
               <TouchableOpacity onPress={() => setSelectedNotification(null)} style={styles.closeBtn}>
                 <Feather name="x" size={24} color="#333" />
               </TouchableOpacity>
               <Text style={styles.modalTitle}>Notification Details</Text>
               <View style={{ width: 24 }} />
             </View>
             <ScrollView contentContainerStyle={{ padding: 16 }}>
                <DetailView item={selectedNotification} />
             </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  webListContainer: {
    flex: 0.4,
    maxWidth: 400,
  },
  webDetailContainer: {
    flex: 0.6,
    backgroundColor: '#fafafa',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },
  statLabelUnread: {
    color: '#2196F3',
  },
  statValueUnread: {
    color: '#2196F3',
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#F0F8FF',
  },
  itemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    position: 'absolute',
    right: -6,
    top: -6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  textBold: {
    fontWeight: '700',
    color: '#000',
  },
  itemBody: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  centerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  detailContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    height: '100%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailTypeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailDate: {
    fontSize: 13,
    color: '#999',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailBodyBox: {
    backgroundColor: '#f9f9f9',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  detailBody: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});
