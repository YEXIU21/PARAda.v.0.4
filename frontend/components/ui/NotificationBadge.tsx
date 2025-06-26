import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getUnreadCount, getUserNotifications, markAsRead, markAllAsRead } from '../../services/api/notification.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationBadgeProps {
  theme: {
    text: string;
    textSecondary: string;
    card: string;
    background: string;
    border: string;
    primary: string;
    error: string;
    success: string;
    warning: string;
  };
  size?: number;
  hideCount?: boolean;
  embedded?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  theme, 
  size = 22, 
  hideCount = false,
  embedded = false
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const dropdownRef = useRef<View>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch unread count on mount and start polling
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    pollingInterval.current = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isDropdownOpen || isModalOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen, isModalOpen]);

  // Update favicon badge on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      updateFaviconBadge(unreadCount);
    }
  }, [unreadCount]);

  // Update document title on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalTitle = 'PARAda Admin Dashboard';
      document.title = unreadCount > 0 ? `(${unreadCount}) ${originalTitle}` : originalTitle;
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
      
      // Also store in AsyncStorage for persistence
      await AsyncStorage.setItem('notification_unread_count', count.toString());
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      // Try to get from AsyncStorage as fallback
      try {
        const storedCount = await AsyncStorage.getItem('notification_unread_count');
        if (storedCount) {
          setUnreadCount(parseInt(storedCount));
        }
      } catch (storageError) {
        console.error('Error getting count from storage:', storageError);
      }
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await getUserNotifications({ limit: 20 });
      if (result.notifications) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Decrement unread count
      if (unreadCount > 0) {
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Update favicon badge on web
  const updateFaviconBadge = (count: number) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    
    const favicon = document.querySelector('link[rel="icon"]');
    
    if (!favicon) {
      console.warn('Favicon not found for badge update');
      return;
    }
    
    // For a real implementation, you would generate a canvas with the number
    // and set it as the favicon. For simplicity, we'll just set a data attribute.
    favicon.setAttribute('data-badge', count.toString());
    
    // You can implement canvas-based favicon badge generation here
    // (This would require more complex code to draw on canvas)
  };

  const renderNotificationIcon = () => {
    return (
      <FontAwesome5
        name="bell"
        size={size}
        color={unreadCount > 0 ? theme.primary : theme.text}
      />
    );
  };

  const renderNotificationBadge = () => {
    if (unreadCount === 0 || hideCount) return null;
    
    return (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    );
  };

  const renderNotificationItem = (notification: Notification) => {
    const typeColors = {
      info: theme.primary,
      success: theme.success,
      warning: theme.warning,
      error: theme.error
    };
    
    const formattedTime = notification.createdAt 
      ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
      : 'recently';
    
    return (
      <TouchableOpacity
        key={notification._id}
        style={[
          styles.notificationItem,
          { borderLeftColor: typeColors[notification.type] },
          !notification.read && { backgroundColor: `${theme.primary}10` }
        ]}
        onPress={() => handleMarkAsRead(notification._id)}
      >
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
            {formattedTime}
          </Text>
        </View>
        <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
          {notification.message}
        </Text>
        {!notification.read && (
          <View style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  // For web, render dropdown
  const renderDropdown = () => {
    if (!isDropdownOpen) return null;
    
    return (
      <View
        style={[
          styles.dropdownContainer,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }
        ]}
      >
        <View style={styles.dropdownHeader}>
          <Text style={[styles.dropdownTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={[styles.markAllReadText, { color: theme.primary }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.dropdownContent}>
          {loading ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Loading...
            </Text>
          ) : notifications.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No notifications
            </Text>
          ) : (
            notifications.map(renderNotificationItem)
          )}
        </ScrollView>
        
        <TouchableOpacity 
          style={[styles.viewAllButton, { borderTopColor: theme.border }]}
          onPress={() => {
            setIsDropdownOpen(false);
            setIsModalOpen(true);
          }}
        >
          <Text style={[styles.viewAllText, { color: theme.primary }]}>
            View all notifications
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // For mobile, render modal
  const renderModal = () => {
    return (
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Notifications
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAction, { borderColor: theme.border }]}
                onPress={handleMarkAllAsRead}
              >
                <Text style={[styles.modalActionText, { color: theme.primary }]}>
                  Mark all as read
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalNotifications}>
              {loading ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Loading...
                </Text>
              ) : notifications.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No notifications
                </Text>
              ) : (
                notifications.map(renderNotificationItem)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {embedded && Platform.OS === 'web' ? (
        // If embedded is true and we're on web, render the full notification list
        <View style={{ flex: 1, width: '100%' }}>
          {notifications.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No notifications
            </Text>
          ) : (
            notifications.map(renderNotificationItem)
          )}
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={[styles.markAllReadButton, { marginTop: 10 }]}
              onPress={handleMarkAllAsRead}
            >
              <Text style={[styles.markAllReadText, { color: theme.primary }]}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Otherwise render the normal notification badge
        <>
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => {
              if (Platform.OS === 'web') {
                setIsDropdownOpen(!isDropdownOpen);
              } else {
                setIsModalOpen(true);
              }
            }}
          >
            {renderNotificationIcon()}
            {renderNotificationBadge()}
          </TouchableOpacity>
          
          {Platform.OS === 'web' && renderDropdown()}
          {renderModal()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    padding: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 320,
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  markAllReadButton: {
    padding: 4,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dropdownContent: {
    maxHeight: 300,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderLeftWidth: 4,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  viewAllText: {
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalAction: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalNotifications: {
    maxHeight: 500,
  },
});

export default NotificationBadge; 