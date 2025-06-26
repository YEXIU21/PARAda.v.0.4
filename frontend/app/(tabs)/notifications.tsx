import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../services/api/notification.api';
import { useFocusEffect } from '@react-navigation/native';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  category: 'system' | 'route' | 'user' | 'payment' | 'promo';
}

// Categories for filtering
const categories = [
  { id: 'all', label: 'All', icon: 'bell' },
  { id: 'system', label: 'System', icon: 'cog' },
  { id: 'route', label: 'Routes', icon: 'route' },
  { id: 'user', label: 'Users', icon: 'user' },
  { id: 'payment', label: 'Payments', icon: 'credit-card' },
  { id: 'promo', label: 'Promotions', icon: 'tag' }
];

// Export the notification list component so it can be used elsewhere
export function NotificationList({ theme, standalone = false }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      
      const options: any = {
        limit: 50
      };
      
      const result = await getUserNotifications(options);
      
      if (result && result.notifications) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount || 0);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };
  
  // Handle marking notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };
  
  // Handle deleting notification
  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(id);
              
              // Update local state
              const updatedNotifications = notifications.filter(notification => notification._id !== id);
              setNotifications(updatedNotifications);
            } catch (err) {
              console.error('Error deleting notification:', err);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };
  
  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      
      Alert.alert('Success', 'All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };
  
  // Helper to format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#4B6BFE';
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      default:
        return '#4B6BFE';
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'info-circle';
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'error':
        return 'exclamation-circle';
      default:
        return 'bell';
    }
  };
  
  // Render the notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <View 
        style={[
          styles.notificationItem,
          { 
            borderLeftColor: getNotificationColor(item.type),
            backgroundColor: !item.read ? `${getNotificationColor(item.type)}10` : theme.card
          }
        ]}
      >
        <View style={styles.notificationIcon}>
          <FontAwesome5 
            name={getNotificationIcon(item.type)} 
            size={18} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
          <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
            {item.message}
          </Text>
        </View>
        <View style={styles.notificationActions}>
          {!item.read && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleMarkAsRead(item._id)}
            >
              <FontAwesome5 name="check" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteNotification(item._id)}
          >
            <FontAwesome5 name="trash-alt" size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Loading notifications...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchNotifications}
          >
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="bell-slash" size={40} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No notifications</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            You don't have any notifications right now
          </Text>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <View style={[standalone ? styles.container : { flex: 1 }, { backgroundColor: standalone ? theme.background : 'transparent' }]}>
      {standalone && (
        <LinearGradient
          colors={theme.gradientColors}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Notifications</Text>
          
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={[styles.markAllButton, { backgroundColor: theme.card }]}
              onPress={handleMarkAllAsRead}
            >
              <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      )}
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.notificationList,
          notifications.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
      
      {!standalone && notifications.length > 0 && (
        <TouchableOpacity 
          style={[styles.markAllButton, { backgroundColor: theme.primary + '22', alignSelf: 'center', marginTop: 10 }]}
          onPress={handleMarkAllAsRead}
        >
          <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NotificationList theme={theme} standalone={true} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4B6BFE',
    marginLeft: 6,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
  },
  notificationContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    marginRight: 4,
  },
  notificationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
  },
  notificationList: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    padding: 40,
  },
}); 