import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { router, usePathname, useLocalSearchParams } from 'expo-router';

// Mock data for messages
const mockMessages = [
  {
    id: '1',
    sender: 'System',
    message: 'Welcome to PARAda! We hope you enjoy your experience.',
    timestamp: '2023-10-15T10:30:00Z',
    read: true,
  },
  {
    id: '2',
    sender: 'Support Team',
    message: 'Your recent inquiry has been received. We will respond shortly.',
    timestamp: '2023-10-16T14:45:00Z',
    read: false,
  },
  {
    id: '3',
    sender: 'Driver',
    message: 'I will arrive at the pickup location in 5 minutes.',
    timestamp: '2023-10-17T09:20:00Z',
    read: true,
  },
  {
    id: '4',
    sender: 'System',
    message: 'Your subscription plan will expire in 7 days. Renew now to avoid service interruption.',
    timestamp: '2023-10-18T16:10:00Z',
    read: false,
  },
];

export default function MessagesScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Get URL parameters to check for router key issues
  const params = useLocalSearchParams();
  const pathname = usePathname();

  // Check for router key issues and handle them
  useEffect(() => {
    const checkRouterKey = async () => {
      try {
        // If '__EXPO_ROUTER_key' param is 'undefined', there's an issue with the route
        if (params && params.__EXPO_ROUTER_key === 'undefined') {
          console.log('Invalid router key detected, redirecting to home');
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.replace('/');
          }, 2000);
          
          setHasError(true);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in messages screen:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    checkRouterKey();
  }, [params]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const renderMessageItem = ({ item }: { item: typeof messages[0] }) => (
    <TouchableOpacity 
      style={[
        styles.messageItem, 
        { 
          backgroundColor: theme.card,
          borderLeftColor: item.read ? theme.border : theme.primary 
        }
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={[styles.senderName, { color: theme.text }]}>{item.sender}</Text>
        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
          {formatDate(item.timestamp)}
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
      {!item.read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  // If there's a router key error, show error view
  if (hasError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={50} color={theme.warning} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Navigation Error</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            We're having trouble accessing this page.
          </Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            Redirecting you to the home screen...
          </Text>
          <TouchableOpacity 
            style={[styles.homeButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Normal view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages</Text>
      </LinearGradient>

      <View style={styles.content}>
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

        <FlatList
          data={filteredMessages}
          keyExtractor={item => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="inbox" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No messages found</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Your messages will appear here'}
              </Text>
            </View>
          }
        />

        <TouchableOpacity 
          style={[styles.composeFab, { backgroundColor: theme.primary }]}
        >
          <FontAwesome5 name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  messagesList: {
    paddingBottom: 80, // Space for FAB
  },
  messageItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 16,
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
    backgroundColor: '#4B6BFE',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
}); 