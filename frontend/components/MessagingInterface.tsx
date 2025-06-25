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
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markAsRead, deleteNotification } from '../services/api/notification.api';
import { formatDistanceToNow } from 'date-fns';
import { getSocket } from '../services/socket/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: {
    fromAdmin?: boolean;
    expiresIn?: number;
    adminId?: string;
    notificationId?: string;
  };
}

interface MessagingInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  
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
  useEffect(() => {
    if (isVisible) {
      fetchMessages();
      setupSocketListeners();
      
      // Check for pending replies when component mounts
      const socket = getSocket();
      if (socket && socket.connected) {
        sendPendingReplies();
      }
    }
    
    return () => {
      cleanupSocketListeners();
    };
  }, [isVisible]);
  
  // Set up socket listeners for real-time notifications
  const setupSocketListeners = useCallback(() => {
    try {
      const socket = getSocket();
      if (!socket || !socket.connected) return;
      
      // Listen for new notifications
      socket.on('new_notification', (data) => {
        if (data && data.notification && data.notification.data && data.notification.data.fromAdmin) {
          // Add new message to the list
          setMessages(prevMessages => {
            const updatedMessages = [data.notification, ...prevMessages];
            saveMessagesToStorage(updatedMessages); // Save to storage when new message arrives
            return updatedMessages;
          });
        }
      });
      
      // Listen for socket reconnection to send pending replies
      socket.on('connect', () => {
        console.log('Socket reconnected, checking for pending replies');
        sendPendingReplies();
      });
    } catch (err) {
      console.error('Error setting up socket listeners:', err);
    }
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
  
  // Fetch messages from the notifications API
  const fetchMessages = async () => {
    try {
      // Load the list of deleted message IDs
      const storedDeletedIds = await AsyncStorage.getItem('deletedMessageIds');
      const deletedMessageIds: string[] = storedDeletedIds ? JSON.parse(storedDeletedIds) : [];
      
      setIsLoading(true);
      setError(null);
      
      // Get user info from auth context
      if (!user || !user.id) {
        console.error('No user found in fetchMessages');
        setError('Authentication required');
        setIsLoading(false);
        return;
      }
      
      // Set options for API call
      const options = {
        limit: 100,
        unreadOnly: false
      };
      
      console.log('Fetching messages for user ID:', user.id, 'Role:', user.role);
      
      let apiMessages: Message[] = [];
      let fetchSuccess = false;
      
      try {
        console.log('Making API call to get notifications');
        const result = await getUserNotifications(options);
        console.log('API returned notifications:', result?.notifications?.length);
        
        if (result && result.notifications && Array.isArray(result.notifications)) {
          if (result.notifications.length > 0) {
            console.log('Sample notification:', JSON.stringify(result.notifications[0]));
          }
          
          // Filter for valid messages
          const validMessages = result.notifications.filter(notification => 
            notification && 
            notification._id &&
            notification.title && 
            notification.message && 
            notification.title.trim() !== '' && 
            notification.message.trim() !== '' &&
            // Filter out messages that were previously deleted locally
            !deletedMessageIds.includes(notification._id)
          );
          
          console.log('Valid messages after filtering:', validMessages.length);
          
          // Track notification IDs to filter out duplicates
          const processedNotificationIds = new Set<string>();
          
          // Filter out duplicate admin messages based on notificationId
          const uniqueMessages = validMessages.filter(message => {
            // If this is an admin message with a notificationId
            if (message.data && message.data.notificationId) {
              // If we've already processed this notificationId, skip it
              if (processedNotificationIds.has(message.data.notificationId)) {
                console.log(`Filtering out duplicate message with notificationId: ${message.data.notificationId}`);
                return false;
              }
              
              // Otherwise, mark this notificationId as processed and keep the message
              processedNotificationIds.add(message.data.notificationId);
              return true;
            }
            
            // For messages without notificationId, always keep them
            return true;
          });
          
          console.log('Unique messages after duplicate filtering:', uniqueMessages.length);
          
          // For driver users, include ALL valid messages
          apiMessages = uniqueMessages;
          
          if (apiMessages.length > 0) {
            console.log('Found', apiMessages.length, 'valid messages');
            fetchSuccess = true;
          } else {
            console.warn('No valid messages found in API response');
          }
        }
      } catch (apiError) {
        console.error('API error:', apiError);
      }
      
      // Load from AsyncStorage as backup
      const storedMessages = await loadMessagesFromStorage();
      console.log('Loaded', storedMessages.length, 'messages from storage');
      
      if (apiMessages.length > 0) {
        // API returned valid data - use it and update storage
        console.log('Using API data with', apiMessages.length, 'messages');
        setMessages(apiMessages);
        saveMessagesToStorage(apiMessages);
        setIsLoading(false);
      } else if (storedMessages.length > 0) {
        // No API data but we have stored data
        console.log('Using stored data with', storedMessages.length, 'messages');
        setMessages(storedMessages);
        setIsLoading(false);
        
        // If API fetch failed completely, show an error
        if (!fetchSuccess) {
          setError('Couldn\'t fetch latest messages. Showing cached data.');
        }
      } else {
        // No data anywhere
        console.log('No messages available');
        setMessages([]);
        setError(fetchSuccess ? null : 'No messages found');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error in message flow:', err);
      setError('Failed to load messages. Please try again.');
      
      // Try to load from storage as last resort
      try {
        const storedMessages = await loadMessagesFromStorage();
        if (storedMessages.length > 0) {
          setMessages(storedMessages);
        }
      } catch (storageError) {
        console.error('Failed to load from storage:', storageError);
      }
    } finally {
      setIsLoading(false);
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
  
  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[
        styles.messageItem,
        { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: item.read ? 0.7 : 1
        }
      ]}
      onPress={() => {
        setSelectedMessage(item);
        if (!item.read) {
          handleMarkAsRead(item._id);
        }
      }}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageHeaderLeft}>
          <FontAwesome5 
            name="envelope" 
            size={16} 
            color={item.read ? theme.textSecondary : theme.primary} 
            solid={!item.read}
          />
          <Text 
            style={[
              styles.messageTitle, 
              { 
                color: theme.text,
                fontWeight: item.read ? 'normal' : 'bold'
              }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        </View>
        <Text style={[styles.messageDate, { color: theme.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <Text 
        style={[styles.messageContent, { color: theme.text }]}
        numberOfLines={2}
      >
        {item.message}
      </Text>
      
      <View style={styles.messageFooter}>
        {item.data?.expiresIn && (
          <Text style={[styles.messageExpiry, { color: theme.textSecondary }]}>
            {getExpiryTimeRemaining(item.createdAt, item.data?.expiresIn || 2)}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMessage(item._id)}
        >
          <FontAwesome5 name="trash-alt" size={14} color={theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
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
  
  // Main render
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading messages...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={fetchMessages}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="inbox" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No messages</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              You don't have any messages from the admin yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {renderMessageDetailModal()}
        {renderReplyModal()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  messageList: {
    padding: 15,
  },
  messageItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  messageTitle: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    flexShrink: 0,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  messageExpiry: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
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
    borderRadius: 15,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 14,
    marginBottom: 15,
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  replyIcon: {
    marginRight: 8,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  replyToText: {
    fontSize: 14,
    marginBottom: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default MessagingInterface; 