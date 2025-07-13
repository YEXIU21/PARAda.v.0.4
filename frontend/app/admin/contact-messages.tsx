import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  timestamp: string;
  status: 'read' | 'unread';
}

export default function ContactMessages() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const goToLandingPage = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    // Load messages from localStorage
    if (Platform.OS === 'web') {
      try {
        const storedMessages = localStorage.getItem('parada_contact_messages');
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (error) {
        console.error('Error loading contact messages:', error);
      }
    }
    setLoading(false);
  }, []);

  const markAsRead = (index: number) => {
    if (Platform.OS === 'web') {
      const updatedMessages = [...messages];
      updatedMessages[index].status = 'read';
      setMessages(updatedMessages);
      
      try {
        localStorage.setItem('parada_contact_messages', JSON.stringify(updatedMessages));
      } catch (error) {
        console.error('Error updating contact messages:', error);
      }
    }
  };

  const deleteMessage = (index: number) => {
    if (Platform.OS === 'web') {
      const updatedMessages = [...messages];
      updatedMessages.splice(index, 1);
      setMessages(updatedMessages);
      
      try {
        localStorage.setItem('parada_contact_messages', JSON.stringify(updatedMessages));
      } catch (error) {
        console.error('Error deleting contact message:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goToLandingPage} style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin - Contact Messages</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <ThemedText type="title" style={styles.pageTitle}>Contact Form Submissions</ThemedText>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333' }}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="inbox" size={40} color={isDarkMode ? '#555555' : '#CCCCCC'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              No contact messages found
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(_, index) => `message-${index}`}
            renderItem={({ item, index }) => (
              <View 
                style={[
                  styles.messageCard, 
                  { 
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                    borderLeftColor: item.status === 'unread' ? colors.primary : 'transparent',
                    borderLeftWidth: item.status === 'unread' ? 4 : 0,
                  }
                ]}
              >
                <View style={styles.messageHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.messageName}>
                    {item.name}
                  </ThemedText>
                  <Text style={[styles.messageDate, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                
                <Text style={[styles.messageEmail, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  {item.email}
                </Text>
                
                <Text style={[styles.messageContent, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                  {item.message}
                </Text>
                
                <View style={styles.messageActions}>
                  {item.status === 'unread' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => markAsRead(index)}
                    >
                      <Text style={styles.actionButtonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isDarkMode ? '#333333' : '#DDDDDD' }]}
                    onPress={() => deleteMessage(index)}
                  >
                    <Text style={[styles.actionButtonText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.messagesList}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerTitle: { 
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  contentContainer: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  pageTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
  messagesList: {
    paddingBottom: 40,
  },
  messageCard: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  messageName: {
    fontSize: 18,
  },
  messageDate: {
    fontSize: 14,
  },
  messageEmail: {
    fontSize: 14,
    marginBottom: 15,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
}); 