import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../../components/layouts/SupportLayout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import ENV from '../../../constants/environment';
import { getAuthHeader } from '../../../services/api/auth.api.js';

// API URL
const API_URL = ENV.apiUrl;

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function MessageUserScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch user details and message history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authHeader = await getAuthHeader();
        
        // Fetch user details
        const userResponse = await axios.get(`${API_URL}/api/users/${id}`, { 
          headers: authHeader 
        });
        
        if (userResponse.data && userResponse.data.success) {
          setUser(userResponse.data.user);
        } else {
          setError('Failed to fetch user details');
        }
        
        // Fetch message history
        const messagesResponse = await axios.get(`${API_URL}/api/messages/history/${id}`, { 
          headers: authHeader 
        });
        
        if (messagesResponse.data && messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages || []);
        } else {
          console.warn('Failed to fetch message history');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  // Scroll to bottom of message list when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      setSendingMessage(true);
      const authHeader = await getAuthHeader();
      
      const response = await axios.post(
        `${API_URL}/api/messages/send`,
        {
          recipientId: user.id,
          content: newMessage.trim()
        },
        { headers: authHeader }
      );
      
      if (response.data && response.data.success) {
        // Add the new message to the list
        setMessages([...messages, response.data.message]);
        setNewMessage('');
      } else {
        console.error('Failed to send message:', response.data);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Render a message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isFromCurrentUser = item.senderId === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.sentMessage : styles.receivedMessage
      ]}>
        <View style={[
          styles.messageBubble,
          { 
            backgroundColor: isFromCurrentUser ? colors.primary : colors.card,
            borderColor: isFromCurrentUser ? colors.primary : colors.border,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isFromCurrentUser ? '#fff' : colors.text }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isFromCurrentUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SupportLayout title="Message User">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading conversation...
          </Text>
        </View>
      </SupportLayout>
    );
  }

  if (error || !user) {
    return (
      <SupportLayout title="Message User">
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'User not found'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout title={`Chat with ${user.username}`}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="comments" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Start the conversation with {user.username}
              </Text>
            </View>
          }
        />
        
        {/* Message Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: newMessage.trim() ? colors.primary : colors.border }
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome5 name="paper-plane" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SupportLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
}); 