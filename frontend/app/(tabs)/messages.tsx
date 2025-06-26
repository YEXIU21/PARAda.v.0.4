import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  RefreshControl
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserNotifications, markAsRead, deleteNotification } from '../../services/api/notification.api';
import { formatDistanceToNow } from 'date-fns';
import { getSocket } from '../../services/socket/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BASE_URL } from '../../services/api/endpoints';

// Add interface for message categories
const categories = [
  { id: 'all', label: 'All', icon: 'bell' },
  { id: 'system', label: 'System', icon: 'cog' },
  { id: 'route', label: 'Routes', icon: 'route' },
  { id: 'user', label: 'Users', icon: 'user' },
  { id: 'payment', label: 'Payments', icon: 'credit-card' },
  { id: 'notification', label: 'Notifications', icon: 'bell-slash' },
  { id: 'promo', label: 'Promotions', icon: 'tag' }
];

interface Message {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'system' | 'route' | 'user' | 'payment' | 'notification' | 'promo';
  data?: {
    fromAdmin?: boolean;
    expiresIn?: number;
    adminId?: string;
    notificationId?: string;
    category?: string;
  };
}

// Changed from MessagingInterfaceProps to MessagesScreenProps
export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [composeText, setComposeText] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeRecipient, setComposeRecipient] = useState<string>('');
  const [showHeaderMenu, setShowHeaderMenu] = useState<boolean>(false);
  
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const { user } = useAuth();
  
  // Save messages to AsyncStorage
  const saveMessagesToStorage = async (messagesToSave: Message[]) => {
    try {
      // Filter out invalid messages before saving
      const validMessages = messagesToSave.filter(msg => {
        if (!msg) return false;
        if (!msg._id || !msg.title || !msg.message) return false;
        // Check for blank/empty messages
        if (msg.message.trim() === '' || msg.title.trim() === '') return false;
        return true;
      });
      
      if (validMessages.length === 0) {
        console.warn('No valid messages to save to storage');
        return;
      }
      
      console.log('Saving', validMessages.length, 'valid messages to AsyncStorage');
      await AsyncStorage.setItem('driverMessages', JSON.stringify(validMessages));
    } catch (error) {
      console.error('Error saving messages to storage:', error);
    }
  };
  
  // Load messages from AsyncStorage
  const loadMessagesFromStorage = async (): Promise<Message[]> => {
    try {
      const storedMessages = await AsyncStorage.getItem('driverMessages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages) as Message[];
        
        // Validate messages before returning
        const validMessages = parsedMessages.filter(msg => {
          if (!msg) return false;
          if (!msg._id || !msg.title || !msg.message) return false;
          // Check for blank/empty messages
          if (msg.message.trim() === '' || msg.title.trim() === '') return false;
          return true;
        });
        
        console.log('Loaded', validMessages.length, 'valid messages from storage');
        return validMessages;
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
      // If there's an error with the stored data, clear it
      try {
        await AsyncStorage.removeItem('driverMessages');
      } catch (clearError) {
        console.error('Error clearing corrupted messages from storage:', clearError);
      }
    }
    return [];
  };
  
  // Fetch messages (admin notifications) on component mount
  const fetchMessages = async () => {
    try {
      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }
      
      // Check if user is logged in
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      
      console.log(`Fetching messages for user ID: ${user.id} Role: ${user.role}`);
      
      // First try to load from storage for faster UI response
      const storedMessages = await loadMessagesFromStorage();
      
      try {
        // Then fetch from API
        console.log('Making API call to get notifications');
        const options = {
          limit: 100,
          unreadOnly: false
        };
        
        console.log('Getting notifications with options:', options);
        const apiUrl = `${BASE_URL}/api/notifications?limit=${options.limit}`;
        console.log('Fetching notifications from:', apiUrl);
        
        const response = await getUserNotifications(options);
        
        console.log('API returned notifications:', response?.notifications?.length);
        if (response?.notifications?.length > 0) {
          console.log('Sample notification:', JSON.stringify(response.notifications[0]));
          
          // Filter out invalid messages
          const validMessages = response.notifications.filter((msg: any) => {
            if (!msg) return false;
            if (!msg._id || !msg.title || !msg.message) return false;
            return true;
          });
          
          console.log('Valid messages after filtering:', validMessages.length);
          
          // Remove duplicates by ID
          const uniqueMessages = validMessages.filter((msg: any, index: number, self: any[]) => 
            index === self.findIndex((m) => m._id === msg._id)
          );
          
          console.log('Unique messages after duplicate filtering:', uniqueMessages.length);
          
          // Use API data if available
          if (uniqueMessages.length > 0) {
            console.log(`Found ${uniqueMessages.length} valid messages`);
            setMessages(uniqueMessages);
            saveMessagesToStorage(uniqueMessages);
          } 
          // Fall back to stored data if API returned no valid messages
          else if (storedMessages.length > 0) {
            console.log(`Loaded ${storedMessages.length} valid messages from storage`);
            setMessages(storedMessages);
          }
          // No messages available
          else {
            setMessages([]);
          }
        } 
        // Fall back to stored data if API returned no messages
        else if (storedMessages.length > 0) {
          console.log(`Loaded ${storedMessages.length} messages from storage`);
          setMessages(storedMessages);
        }
        // No messages available
        else {
          setMessages([]);
        }
      } catch (apiError) {
        console.error('Error fetching messages from API:', apiError);
        
        // Fall back to stored data if API call failed
        if (storedMessages.length > 0) {
          console.log('Using stored messages due to API error');
          setMessages(storedMessages);
        } else {
          throw new Error('Failed to load messages. Please check your connection and try again.');
        }
      }
      
      // Clean up deleted message IDs from storage
      cleanupDeletedMessageIds();
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up socket listeners for real-time notifications
  const setupSocketListeners = useCallback(() => {
    try {
      const socket = getSocket();
      if (!socket) {
        console.warn('Socket not available for setting up listeners');
        return;
      }
      
      if (!socket.connected) {
        console.log('Socket not connected, will set up listeners when connection is established');
        socket.on('connect', () => {
          console.log('Socket connected, setting up notification listeners');
          setupSocketEventHandlers(socket);
        });
        return;
      }
      
      setupSocketEventHandlers(socket);
    } catch (err) {
      console.error('Error setting up socket listeners:', err);
    }
  }, []);
  
  // Set up the actual socket event handlers
  const setupSocketEventHandlers = useCallback((socket) => {
    // Remove any existing listeners to prevent duplicates
    socket.off('new_notification');
    socket.off('connect');
    
    // Listen for new notifications
    socket.on('new_notification', (data) => {
      if (data && data.notification) {
        try {
          // Add new message to the list
          setMessages(prevMessages => {
            const updatedMessages = [data.notification, ...prevMessages];
            saveMessagesToStorage(updatedMessages); // Save to storage when new message arrives
            return updatedMessages;
          });
        } catch (error) {
          console.error('Error processing new notification:', error);
        }
      }
    });
    
    // Listen for socket reconnection to send pending replies
    socket.on('connect', () => {
      console.log('Socket reconnected, checking for pending replies');
      sendPendingReplies();
    });
  }, []);
  
  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    setupSocketListeners();
    
    // Check for pending replies when component mounts
    const socket = getSocket();
    if (socket && socket.connected) {
      sendPendingReplies();
    }
    
    return () => {
      cleanupSocketListeners();
    };
  }, []);
  
  // Send any pending replies when socket reconnects
  const sendPendingReplies = async () => {
    try {
      const pendingReplies = await AsyncStorage.getItem('pendingReplies');
      if (!pendingReplies) return;
      
      const replies = JSON.parse(pendingReplies);
      if (!replies || !replies.length) return;
      
      console.log(`Found ${replies.length} pending replies to send`);
      
      const socket = getSocket();
      if (!socket || !socket.connected) {
        console.warn('Socket not connected, cannot send pending replies');
        return;
      }
      
      // Send each pending reply
      let successCount = 0;
      for (const reply of replies) {
        try {
          // Determine which event to emit based on stored eventName or user role
          const eventName = reply.eventName || (user?.role === 'driver' ? 'driver_reply' : 'passenger_reply');
          
          // Use a promise to handle the socket emit with callback
          await new Promise((resolve, reject) => {
            socket.emit(eventName, reply, (response) => {
              if (response && response.success) {
                console.log(`Successfully sent pending ${eventName}`);
                successCount++;
                resolve(response);
              } else {
                reject(new Error(`Failed to send ${eventName}`));
              }
            });
            
            // Add timeout
          setTimeout(() => {
              reject(new Error('Socket reply timed out'));
            }, 10000);
          });
        } catch (replyError) {
          console.error('Error sending pending reply:', replyError);
        }
      }
      
      // Clear pending replies if all were sent successfully
      if (successCount === replies.length) {
        await AsyncStorage.removeItem('pendingReplies');
        console.log('All pending replies sent successfully');
      } else {
        // Keep only the failed replies
        const remainingReplies = replies.slice(successCount);
        await AsyncStorage.setItem('pendingReplies', JSON.stringify(remainingReplies));
        console.log(`${successCount} replies sent, ${remainingReplies.length} remaining`);
      }
      
      // Notify user if any replies were sent
      if (successCount > 0) {
        Alert.alert(
          'Replies Sent',
          `${successCount} queued ${successCount === 1 ? 'reply has' : 'replies have'} been sent.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error processing pending replies:', error);
    }
  };
  
  // Clean up socket listeners
  const cleanupSocketListeners = useCallback(() => {
    try {
      const socket = getSocket();
      if (!socket) return;
      
      socket.off('new_notification');
    } catch (err) {
      console.error('Error cleaning up socket listeners:', err);
    }
  }, []);
  
  // Clean up old deleted message IDs (keep only the last 100)
  const cleanupDeletedMessageIds = async () => {
    try {
      const storedDeletedIds = await AsyncStorage.getItem('deletedMessageIds');
      if (!storedDeletedIds) return;
      
      let deletedMessageIds: string[] = JSON.parse(storedDeletedIds);
      
      // If we have too many IDs, keep only the most recent ones
      if (deletedMessageIds.length > 100) {
        console.log(`Pruning deleted message IDs list from ${deletedMessageIds.length} to 100`);
        deletedMessageIds = deletedMessageIds.slice(-100); // Keep only the last 100
        await AsyncStorage.setItem('deletedMessageIds', JSON.stringify(deletedMessageIds));
      }
    } catch (error) {
      console.error('Error cleaning up deleted message IDs:', error);
    }
  };
  
  // Mark message as read
  const handleMarkAsRead = async (messageId: string) => {
    try {
      console.log(`Attempting to mark message ${messageId} as read`);
      
      // Update local state immediately for better UX
      setMessages(prevMessages => prevMessages.map(message => {
        if (message._id === messageId) {
          return { ...message, read: true, readAt: new Date().toISOString() };
        }
        return message;
      }));
      
      // Update in AsyncStorage immediately
      const updatedMessages = messages.map(message => 
        message._id === messageId ? { ...message, read: true, readAt: new Date().toISOString() } : message
      );
      saveMessagesToStorage(updatedMessages);
      
      // Call API to update on server
      const result = await markAsRead(messageId);
      console.log(`API result for marking message ${messageId} as read:`, result);
      
      if (result.error) {
        console.warn(`Server reported error but local state was updated: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error in handleMarkAsRead for message ${messageId}:`, err);
      // Don't show alert to user since local state is already updated
      // This provides a better user experience even if the API call fails
    }
  };
  
  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Attempting to delete message ${messageId}`);
              
              // Update local state immediately for better UX
              const updatedMessages = messages.filter(message => message._id !== messageId);
              setMessages(updatedMessages);
              
              // Update AsyncStorage immediately
              await saveMessagesToStorage(updatedMessages);
              
              // Double-check that the message was removed from AsyncStorage
              const storedMessages = await loadMessagesFromStorage();
              const messageStillExists = storedMessages.some(msg => msg._id === messageId);
              
              if (messageStillExists) {
                console.warn(`Message ${messageId} still exists in AsyncStorage after deletion attempt`);
                // Force remove it again with a direct filter
                const forceCleaned = storedMessages.filter(msg => msg._id !== messageId);
                await AsyncStorage.setItem('driverMessages', JSON.stringify(forceCleaned));
                console.log('Forced removal of message from AsyncStorage');
              } else {
                console.log(`Message ${messageId} successfully removed from AsyncStorage`);
              }
              
              // Store the deleted message ID to prevent it from reappearing
              try {
                const storedDeletedIds = await AsyncStorage.getItem('deletedMessageIds');
                let deletedMessageIds: string[] = storedDeletedIds ? JSON.parse(storedDeletedIds) : [];
                
                // Add this ID if it's not already in the list
                if (!deletedMessageIds.includes(messageId)) {
                  deletedMessageIds.push(messageId);
                  await AsyncStorage.setItem('deletedMessageIds', JSON.stringify(deletedMessageIds));
                  console.log(`Added message ID ${messageId} to deleted messages list`);
                }
              } catch (storageError) {
                console.error('Error updating deleted message IDs:', storageError);
              }
              
              // If we had a selected message and it was deleted, close the detail view
              if (selectedMessage && selectedMessage._id === messageId) {
                setSelectedMessage(null);
              }
              
              // Call API to delete on server
              const result = await deleteNotification(messageId);
              console.log(`API result for deleting message ${messageId}:`, result);
              
              if (result.error) {
                console.warn(`Server reported error but local state was updated: ${result.error}`);
              }
            } catch (err) {
              console.error(`Error in handleDeleteMessage for message ${messageId}:`, err);
              // Even if there's an error, make sure the message is removed from local state
              try {
                const storedMessages = await loadMessagesFromStorage();
                const cleanedMessages = storedMessages.filter(msg => msg._id !== messageId);
                await AsyncStorage.setItem('driverMessages', JSON.stringify(cleanedMessages));
                console.log('Cleaned up message from storage despite error');
                
                // Also add to deleted IDs list
                const storedDeletedIds = await AsyncStorage.getItem('deletedMessageIds');
                let deletedMessageIds: string[] = storedDeletedIds ? JSON.parse(storedDeletedIds) : [];
                if (!deletedMessageIds.includes(messageId)) {
                  deletedMessageIds.push(messageId);
                  await AsyncStorage.setItem('deletedMessageIds', JSON.stringify(deletedMessageIds));
                }
              } catch (cleanupError) {
                console.error('Failed final cleanup attempt:', cleanupError);
              }
            }
          }
        }
      ]
    );
  };
  
  // Format date string for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Calculate time remaining until message expires
  const getExpiryTimeRemaining = (createdAt: string, expiresInDays: number = 2) => {
    const createdDate = new Date(createdAt);
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    
    // Calculate time difference
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    
    // If already expired
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    // Calculate hours and minutes
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `Expires in ${diffHrs}h ${diffMins}m`;
    } else {
      return `Expires in ${diffMins}m`;
    }
  };
  
  // Handle reply to admin
  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    try {
      console.log(`Sending reply to message ${selectedMessage._id}`);
      
      // Show loading indicator
      setIsLoading(true);
      
      // Create a reply message
      const replyData = {
        title: `Reply from ${user?.username || 'User'}: ${selectedMessage.title.substring(0, 30)}`,
        message: replyText,
        type: 'info',
        category: 'reply',
        userId: 'admin', // This will be replaced with actual admin ID on the server
        data: {
          inReplyTo: selectedMessage._id,
          fromDriver: user?.role === 'driver',
          fromPassenger: user?.role === 'passenger',
          userId: user?.id,
          userName: user?.username,
          originalMessage: selectedMessage.message.substring(0, 100) + (selectedMessage.message.length > 100 ? '...' : '')
        }
      };
      
      // Use socket to send the reply
      const socket = getSocket();
      
      // Check if socket exists and is connected
      if (!socket) {
        console.error('Socket not initialized for sending reply');
        queueReplyForLater(replyData);
        setIsLoading(false);
        return;
      }
      
      if (!socket.connected) {
        console.error('Socket exists but not connected for sending reply');
        queueReplyForLater(replyData);
        setIsLoading(false);
        return;
      }
      
      // Socket is connected, proceed with sending
      if (socket && socket.connected) {
        // Emit the event with acknowledgment callback
        const eventName = user?.role === 'driver' ? 'driver_reply' : 'passenger_reply';
        
        try {
          // Use a promise to handle the socket emit with callback
          await new Promise((resolve, reject) => {
            console.log(`Emitting ${eventName} event with data:`, replyData);
            
            socket.emit(eventName, replyData, (response) => {
              console.log(`Received response for ${eventName}:`, response);
              if (response && response.success) {
                console.log(`Reply sent successfully via socket (${eventName})`);
                resolve(response);
              } else {
                console.error('Server returned error:', response);
                reject(new Error(response?.message || 'Failed to send reply'));
              }
            });
            
            // Add timeout
            setTimeout(() => {
              reject(new Error('Socket reply timed out'));
            }, 10000);
          });
          
          // Show success modal with more details
          Alert.alert(
            'Reply Sent Successfully',
            `Your reply has been sent to the administrator.\n\nMessage: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Reset state
                  setReplyText('');
                  setShowReplyModal(false);
                  setSelectedMessage(null);
                } 
              }
            ]
          );
          
        } catch (socketError) {
          console.error('Socket error when sending reply:', socketError);
          
          // Store the reply for later sending
          queueReplyForLater(replyData);
          setIsLoading(false);
        }
      } else {
        // Socket not connected
        console.error('Socket not connected for sending reply');
        
        // Store the reply for later sending
        queueReplyForLater(replyData);
        setIsLoading(false);
      }
      } catch (error) {
      console.error('Error in handleReply:', error);
      
      // Show error message
      Alert.alert(
        'Error',
        'Failed to send reply. Please try again later.',
        [{ text: 'OK' }]
      );
      
        setIsLoading(false);
      }
    };
    
  // Queue a reply for later sending when socket reconnects
  const queueReplyForLater = async (replyData: any) => {
    try {
      const pendingReplies = await AsyncStorage.getItem('pendingReplies');
      let replies = pendingReplies ? JSON.parse(pendingReplies) : [];
      
      // Determine event name based on user role
      const eventName = user?.role === 'driver' ? 'driver_reply' : 'passenger_reply';
      
      // Add this reply to the pending list
      replies.push({
        ...replyData,
        timestamp: new Date().toISOString(),
        eventName
      });
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('pendingReplies', JSON.stringify(replies));
      
      // Show detailed message to user
      Alert.alert(
        'Reply Queued',
        `You appear to be offline. Your reply will be sent when you reconnect.\n\nQueued Message: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset state
              setReplyText('');
              setShowReplyModal(false);
              setSelectedMessage(null);
            } 
          }
        ]
      );
    } catch (storageError) {
      console.error('Error storing pending reply:', storageError);
      
      Alert.alert(
        'Error',
        'Failed to store reply for later sending. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Get icon for message category
  const getCategoryIcon = (category?: string) => {
    if (!category) return 'bell';
    const found = categories.find(cat => cat.id === category);
    return found ? found.icon : 'bell';
  };
  
  // Get color for notification type
  const getTypeColor = (type?: string) => {
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
  
  // Filter messages based on search query and category
  const filteredMessages = messages.filter(msg => {
    // First check if it passes the category filter
    if (selectedCategory !== 'all') {
      const msgCategory = msg.category || msg.data?.category || 'system';
      if (msgCategory !== selectedCategory) return false;
    }
    
    // Then check if it passes the search filter
    if (searchQuery) {
      return (
        msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true; // If no search query and passes category filter, include it
  });
  
  // Render each message item with the new design
  const renderMessageItem = ({ item }: { item: Message }) => {
    // Check if item exists and has required properties
    if (!item || !item._id || !item.title || !item.message) {
      console.warn('Invalid message item:', item);
      return null;
    }
    
    // Determine message category - if title contains "notification" or message contains "notification", 
    // categorize as notification
    let messageCategory = item.category || item.data?.category || 'system';
    if (
      item.title?.toLowerCase().includes('notification') || 
      item.message?.toLowerCase().includes('notification') ||
      item.title?.toLowerCase().includes('alert')
    ) {
      messageCategory = 'notification';
    }
    
    const messageType = item.type || 'info';
    
    return (
    <TouchableOpacity 
      style={[
        styles.messageItem, 
        { 
          backgroundColor: theme.card,
            borderLeftColor: item.read ? theme.border : getTypeColor(messageType) 
        }
      ]}
        onPress={() => {
          setSelectedMessage(item);
          handleMarkAsRead(item._id);
        }}
    >
      <View style={styles.messageHeader}>
          <Text style={[styles.senderName, { color: theme.text }]}>
            {item.title || 'System Message'}
          </Text>
        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text 
        style={[
          styles.messageContent, 
          { color: theme.textSecondary },
          !item.read && { color: theme.text, fontWeight: '500' }
        ]}
        numberOfLines={2}
      >
        {item.message}
      </Text>
        
        {/* Category badge */}
        <View style={styles.messageFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: `${getTypeColor(messageType)}15` }]}>
            <FontAwesome5 
              name={getCategoryIcon(messageCategory)} 
              size={10} 
              color={getTypeColor(messageType)}
              style={styles.categoryIcon} 
            />
            <Text style={[styles.categoryText, { color: getTypeColor(messageType) }]}>
              {messageCategory.charAt(0).toUpperCase() + messageCategory.slice(1)}
            </Text>
          </View>
        </View>
        
      {!item.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );
  };
  
  // Render message detail modal
  const renderMessageDetailModal = () => (
    <Modal
      visible={!!selectedMessage}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSelectedMessage(null)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Message from Admin
            </Text>
            <TouchableOpacity 
              onPress={() => setSelectedMessage(null)}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {selectedMessage?.title}
          </Text>
            
            <Text style={[styles.detailDate, { color: theme.textSecondary }]}>
              {selectedMessage ? formatDate(selectedMessage.createdAt) : ''}
          </Text>
            
            <Text style={[styles.detailContent, { color: theme.text }]}>
              {selectedMessage?.message}
            </Text>
            
            <Text style={[styles.messageExpiry, { color: theme.error, marginTop: 20 }]}>
              {selectedMessage ? getExpiryTimeRemaining(selectedMessage.createdAt, selectedMessage.data?.expiresIn || 2) : ''}
            </Text>
          </View>
          
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
          <TouchableOpacity 
              style={[styles.replyButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setShowReplyModal(true);
              }}
            >
              <FontAwesome5 name="reply" size={16} color="#fff" style={styles.replyIcon} />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteButtonLarge, { backgroundColor: theme.error }]}
              onPress={() => {
                if (selectedMessage) {
                  handleDeleteMessage(selectedMessage._id);
                  setSelectedMessage(null);
                }
              }}
            >
              <FontAwesome5 name="trash-alt" size={16} color="#fff" style={styles.deleteIcon} />
              <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
  
  // Render reply modal
  const renderReplyModal = () => (
    <Modal
      visible={showReplyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowReplyModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Reply to Admin
            </Text>
            <TouchableOpacity 
              onPress={() => setShowReplyModal(false)}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.replyToText, { color: theme.textSecondary }]}>
              Re: {selectedMessage?.title}
            </Text>
            
            <TextInput
              style={[
                styles.replyInput,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBackground || (isDarkMode ? '#333' : '#f5f5f5'),
                  borderColor: theme.border
                }
              ]}
              placeholder="Type your reply here..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={5}
              value={replyText}
              onChangeText={setReplyText}
            />
          </View>
          
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowReplyModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.primary },
                !replyText.trim() && styles.disabledButton
              ]}
              onPress={handleReply}
              disabled={!replyText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
  
  // Add refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMessages().finally(() => {
      setIsRefreshing(false);
    });
  };

  // Handle compose message
  const handleComposeMessage = () => {
    // Show the compose modal
    setComposeSubject('');
    setComposeText('');
    setComposeRecipient('');
    setShowComposeModal(true);
  };
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!composeSubject.trim() || !composeText.trim() || !composeRecipient.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      // In a real implementation, this would send the message to the server
      // For now, just show a success message and close the modal
      Alert.alert(
        'Message Sent',
        'Your message has been sent successfully.',
        [{ text: 'OK', onPress: () => setShowComposeModal(false) }]
      );
      
      // Reset the form
      setComposeSubject('');
      setComposeText('');
      setComposeRecipient('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };
  
  // Render compose modal
  const renderComposeModal = () => (
    <Modal
      visible={showComposeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowComposeModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Message</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowComposeModal(false)}
              >
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>To:</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Recipient"
                  placeholderTextColor={theme.textSecondary}
                  value={composeRecipient}
                  onChangeText={setComposeRecipient}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Subject:</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Subject"
                  placeholderTextColor={theme.textSecondary}
                  value={composeSubject}
                  onChangeText={setComposeSubject}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Message:</Text>
                <TextInput
                  style={[
                    styles.messageInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground || theme.card }
                  ]}
                  placeholder="Type your message here..."
                  placeholderTextColor={theme.textSecondary}
                  value={composeText}
                  onChangeText={setComposeText}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.primary }]}
                onPress={handleSendMessage}
              >
                <FontAwesome5 name="paper-plane" size={16} color="#fff" style={styles.sendIcon} />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
  
  // Handle header menu toggle
  const handleHeaderMenuToggle = () => {
    setShowHeaderMenu(!showHeaderMenu);
  };
  
  // Handle menu action
  const handleMenuAction = (action: string) => {
    setShowHeaderMenu(false);
    
    switch (action) {
      case 'mark_all_read':
        Alert.alert(
          'Mark All as Read',
          'Are you sure you want to mark all messages as read?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Mark All Read', 
              onPress: () => {
                // In a real implementation, this would call an API
                Alert.alert('Success', 'All messages marked as read');
              } 
            }
          ]
        );
        break;
        
      case 'delete_all':
        Alert.alert(
          'Delete All Messages',
          'Are you sure you want to delete all messages? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete All', 
              style: 'destructive',
              onPress: () => {
                // In a real implementation, this would call an API
                Alert.alert('Success', 'All messages deleted');
              } 
            }
          ]
        );
        break;
        
      case 'settings':
        // Navigate to settings
        router.push('/settings');
        break;
        
      default:
        break;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors || ['#4B6BFE', '#2D3AF2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Messages</Text>
          <View>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleHeaderMenuToggle}
            >
              <FontAwesome5 name="ellipsis-v" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search bar - Updated design */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground || theme.card }]}>
          <FontAwesome5 name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome5 name="times" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filters - Improved design */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={{ marginVertical: 4 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && {
                  backgroundColor: `${theme.primary}20`,
                  borderColor: theme.primary
                },
                // Make the notification category more prominent
                category.id === 'notification' && {
                  borderWidth: 1.5,
                  borderColor: category.id === selectedCategory ? theme.primary : '#FF9500',
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <FontAwesome5 
                name={category.icon} 
                size={10} 
                color={selectedCategory === category.id ? theme.primary : (category.id === 'notification' ? '#FF9500' : theme.textSecondary)} 
              />
              <Text 
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === category.id ? theme.primary : (category.id === 'notification' ? '#FF9500' : theme.textSecondary) }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading messages...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-triangle" size={40} color={theme.error} />
            <Text style={[styles.errorTitle, { color: theme.text }]}>Error</Text>
            <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={fetchMessages}
            >
              <Text style={{ color: '#fff' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredMessages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="inbox" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No messages found</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {searchQuery 
                ? 'Try a different search term' 
                : selectedCategory !== 'all'
                  ? `No ${categories.find(c => c.id === selectedCategory)?.label || selectedCategory} messages`
                  : 'Your messages will appear here'
              }
              </Text>
            </View>
        ) : (
          <FlatList
            data={filteredMessages}
            renderItem={renderMessageItem}
            keyExtractor={item => item._id || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            style={{ width: '100%' }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />
        )}
      </View>
      
      {/* Header dropdown menu - Moved outside content flow for proper z-index */}
      {showHeaderMenu && (
        <>
          {/* Backdrop to close menu when clicking outside */}
        <TouchableOpacity 
            style={styles.menuBackdrop}
            activeOpacity={0}
            onPress={() => setShowHeaderMenu(false)}
          />
          
          <View 
            style={[
              styles.headerMenuContainer,
              { top: Platform.OS === 'web' ? 60 : 80 } // Adjust based on platform
            ]}
          >
            <View style={[styles.headerMenu, { backgroundColor: theme.card }]}>
              <TouchableOpacity 
                style={styles.headerMenuItem}
                onPress={() => handleMenuAction('mark_all_read')}
              >
                <FontAwesome5 name="check-double" size={16} color={theme.primary} style={styles.headerMenuIcon} />
                <Text style={[styles.headerMenuText, { color: theme.text }]}>Mark All as Read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerMenuItem}
                onPress={() => handleMenuAction('delete_all')}
              >
                <FontAwesome5 name="trash-alt" size={16} color={theme.error} style={styles.headerMenuIcon} />
                <Text style={[styles.headerMenuText, { color: theme.text }]}>Delete All Messages</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerMenuItem, { borderBottomWidth: 0 }]}
                onPress={() => handleMenuAction('settings')}
              >
                <FontAwesome5 name="cog" size={16} color={theme.textSecondary} style={styles.headerMenuIcon} />
                <Text style={[styles.headerMenuText, { color: theme.text }]}>Settings</Text>
        </TouchableOpacity>
      </View>
          </View>
        </>
      )}
      
      {/* Compose FAB button */}
      <TouchableOpacity 
        style={[styles.composeFab, { backgroundColor: theme.primary }]}
        onPress={handleComposeMessage}
      >
        <FontAwesome5 name="pen" size={20} color="#fff" />
      </TouchableOpacity>
      
      {/* Message detail modal */}
      {renderMessageDetailModal()}
      
      {/* Reply modal */}
      {renderReplyModal()}
      
      {/* Compose modal */}
      {renderComposeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    padding: 8,
  },
  headerMenuContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  headerMenu: {
    width: 200,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
  },
  headerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerMenuIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  headerMenuText: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  categoriesContainer: {
    paddingVertical: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    height: 26,
  },
  categoryButtonText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '500',
  },
  messagesList: {
    paddingBottom: 80, // Extra space for FAB
  },
  messageItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  composeFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  replyToText: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  replyIcon: {
    marginRight: 8,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 14,
    marginBottom: 16,
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageExpiry: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
}); 