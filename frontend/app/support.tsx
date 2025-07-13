import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import SupportNavBar from '../components/SupportNavBar';

// Define types for support tickets
interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastUpdated: string;
}

export default function SupportPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has support role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role !== 'support') {
            // Redirect to home if not a support user
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          } else {
            // For support users, check if they're accessing /support directly
            // If so, redirect them to the dashboard at /support/
            const pathname = window.location.pathname;
            if (pathname === '/support' && Platform.OS === 'web') {
              // Add trailing slash to go to the dashboard
              window.location.href = '/support/';
            }
          }
        } else {
          // No user data, redirect to login
          if (Platform.OS === 'web') {
            window.location.href = '/auth/login';
          } else {
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
    loadTickets();
  }, []);

  // Load tickets from API
  const loadTickets = async () => {
    try {
      // In a production app, this would use the ticket API
      // For now, we'll use sample data until the backend is fully implemented
      import('../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch from API
          const result = await ticketApi.getTickets();
          if (result && result.tickets && result.tickets.length > 0) {
            // Map API response to our ticket format
            const apiTickets = result.tickets.map((ticket: any) => ({
              id: ticket._id,
              userId: ticket.userId,
              username: ticket.customerName,
              email: ticket.customerEmail,
              subject: ticket.subject,
              message: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              createdAt: ticket.createdAt,
              lastUpdated: ticket.updatedAt
            }));
            
            setTickets(apiTickets);
            setFilteredTickets(apiTickets);
          } else {
            // Fallback to sample data if API returns empty
            useSampleData();
          }
        } catch (error) {
          console.error('Error fetching tickets from API:', error);
          // Fallback to sample data
          useSampleData();
        } finally {
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error('Error importing ticket API:', error);
        // Fallback to sample data
        useSampleData();
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error in loadTickets:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data when API is not available
  const useSampleData = () => {
    console.log('Using sample ticket data');
    // Sample data
    const sampleTickets: SupportTicket[] = [
      {
        id: '1',
        userId: 'user123',
        username: 'john_doe',
        email: 'john@example.com',
        subject: 'App crashes on startup',
        message: 'Every time I open the app, it crashes immediately. I\'m using an iPhone 13 with iOS 16.2.',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        lastUpdated: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        userId: 'user456',
        username: 'jane_smith',
        email: 'jane@example.com',
        subject: 'Cannot update profile picture',
        message: 'I\'ve tried multiple times to update my profile picture but it keeps showing the old one.',
        status: 'in-progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastUpdated: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: '3',
        userId: 'user789',
        username: 'sam_wilson',
        email: 'sam@example.com',
        subject: 'Payment failed but money deducted',
        message: 'I tried to pay for a ride but got an error. However, the money was deducted from my account.',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        lastUpdated: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '4',
        userId: 'user101',
        username: 'maria_garcia',
        email: 'maria@example.com',
        subject: 'How do I cancel a scheduled ride?',
        message: 'I need to cancel a ride I scheduled for tomorrow but can\'t find the option.',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        lastUpdated: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '5',
        userId: 'user202',
        username: 'alex_wong',
        email: 'alex@example.com',
        subject: 'Driver never arrived',
        message: 'I waited for 30 minutes but my driver never showed up. I was charged a cancellation fee.',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        lastUpdated: new Date(Date.now() - 345600000).toISOString()
      }
    ];

    setTickets(sampleTickets);
    setFilteredTickets(sampleTickets);
  };

  // Filter tickets based on search query and filters
  useEffect(() => {
    let result = [...tickets];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.subject.toLowerCase().includes(query) || 
        ticket.message.toLowerCase().includes(query) ||
        ticket.username.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }
    
    setFilteredTickets(result);
  }, [searchQuery, statusFilter, priorityFilter, tickets]);

  // Handle responding to a ticket
  const handleRespondToTicket = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    
    try {
      // In a production app, this would use the ticket API
      const ticketApi = await import('../services/api/ticket.api');
      
      try {
        // Add comment to ticket
        await ticketApi.addComment(selectedTicket.id, responseText);
        
        // Update ticket status if needed
        if (selectedTicket.status === 'open') {
          await ticketApi.updateTicket(selectedTicket.id, { status: 'in-progress' });
        }
        
        // Refresh tickets
        loadTickets();
        
        // Clear response and selected ticket
        setResponseText('');
        setSelectedTicket(null);
      } catch (error) {
        console.error('Error responding to ticket via API:', error);
        
        // Fallback to local state update if API fails
        fallbackRespondToTicket();
      }
    } catch (error) {
      console.error('Error importing ticket API:', error);
      
      // Fallback to local state update
      fallbackRespondToTicket();
    }
  };
  
  // Fallback method when API is not available
  const fallbackRespondToTicket = () => {
    console.log('Using fallback response method');
    
    // Update the local state
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket?.id) {
        return {
          ...ticket,
          status: 'in-progress' as const,
          lastUpdated: new Date().toISOString()
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    
    // Update the filtered tickets as well
    const updatedFilteredTickets = filteredTickets.map(ticket => {
      if (ticket.id === selectedTicket?.id) {
        return {
          ...ticket,
          status: 'in-progress' as const,
          lastUpdated: new Date().toISOString()
        };
      }
      return ticket;
    });
    
    setFilteredTickets(updatedFilteredTickets);
    
    // Clear response and selected ticket
    setResponseText('');
    setSelectedTicket(null);
  };

  // Mark a ticket as resolved
  const handleResolveTicket = async (ticketId: string) => {
    try {
      // In a production app, this would use the ticket API
      const ticketApi = await import('../services/api/ticket.api');
      
      try {
        // Update ticket status
        await ticketApi.updateTicket(ticketId, { status: 'resolved' });
        
        // Add a resolution comment
        await ticketApi.addComment(
          ticketId, 
          'This ticket has been marked as resolved.',
          true // internal note
        );
        
        // Refresh tickets
        loadTickets();
        
        // If this was the selected ticket, clear it
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
      } catch (error) {
        console.error('Error resolving ticket via API:', error);
        
        // Fallback to local state update if API fails
        fallbackResolveTicket(ticketId);
      }
    } catch (error) {
      console.error('Error importing ticket API:', error);
      
      // Fallback to local state update
      fallbackResolveTicket(ticketId);
    }
  };
  
  // Fallback method when API is not available
  const fallbackResolveTicket = (ticketId: string) => {
    console.log('Using fallback resolve method');
    
    // Update the local state
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'resolved' as const,
          lastUpdated: new Date().toISOString()
        };
      }
      return ticket;
    });
    
    setTickets(updatedTickets);
    
    // Update the filtered tickets as well
    const updatedFilteredTickets = filteredTickets.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'resolved' as const,
          lastUpdated: new Date().toISOString()
        };
      }
      return ticket;
    });
    
    setFilteredTickets(updatedFilteredTickets);
    
    // If this was the selected ticket, clear it
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#ff6b6b';
      case 'in-progress':
        return '#feca57';
      case 'resolved':
        return '#1dd1a1';
      default:
        return '#c8d6e5';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#feca57';
      case 'low':
        return '#1dd1a1';
      default:
        return '#c8d6e5';
    }
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      {/* Support Navigation Bar */}
      <SupportNavBar />
      
      {/* Main Content */}
      <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <LinearGradient
          colors={colors.gradientColors}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/PARAda-Logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Support Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {user?.username ? `Welcome, ${user.username}` : 'Support Portal'}
              </Text>
            </View>
          </View>
        </LinearGradient>

      <View style={styles.contentContainer}>
        {/* Search and filters */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer, 
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5' }
          ]}>
            <FontAwesome5 
              name="search" 
              size={16} 
              color={isDarkMode ? '#BBBBBB' : '#666666'} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              placeholder="Search tickets..."
              placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === null && styles.activeFilter
              ]}
              onPress={() => setStatusFilter(null)}
            >
              <Text style={styles.filterText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'open' && styles.activeFilter
              ]}
              onPress={() => setStatusFilter('open')}
            >
              <Text style={styles.filterText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'in-progress' && styles.activeFilter
              ]}
              onPress={() => setStatusFilter('in-progress')}
            >
              <Text style={styles.filterText}>In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'resolved' && styles.activeFilter
              ]}
              onPress={() => setStatusFilter('resolved')}
            >
              <Text style={styles.filterText}>Resolved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tickets list */}
        <View style={styles.ticketsContainer}>
          <ThemedText type="title" style={styles.sectionTitle}>Support Tickets</ThemedText>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333' }}>Loading tickets...</Text>
            </View>
          ) : filteredTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="ticket-alt" size={40} color={isDarkMode ? '#555555' : '#CCCCCC'} />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                No tickets found
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTickets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ticketCard,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' },
                    selectedTicket?.id === item.id && { 
                      borderColor: colors.primary,
                      borderWidth: 2 
                    }
                  ]}
                  onPress={() => setSelectedTicket(item)}
                >
                  <View style={styles.ticketHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.ticketSubject}>
                      {item.subject}
                    </ThemedText>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.ticketInfo}>
                    <Text style={[styles.ticketFrom, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      From: {item.username} ({item.email})
                    </Text>
                    <View style={[
                      styles.priorityBadge, 
                      { backgroundColor: getPriorityColor(item.priority) }
                    ]}>
                      <Text style={styles.priorityText}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text 
                    style={[styles.ticketPreview, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
                  
                  <View style={styles.ticketFooter}>
                    <Text style={[styles.ticketDate, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      Created: {formatDate(item.createdAt)}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.resolveButton,
                        { backgroundColor: item.status === 'resolved' ? '#CCCCCC' : '#1dd1a1' }
                      ]}
                      onPress={() => handleResolveTicket(item.id)}
                      disabled={item.status === 'resolved'}
                    >
                      <Text style={styles.resolveButtonText}>
                        {item.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.ticketsList}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

        {/* Selected ticket response */}
        {selectedTicket && (
          <View style={[
            styles.responseContainer,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }
          ]}>
            <ThemedText type="defaultSemiBold" style={styles.responseTitle}>
              Respond to Ticket
            </ThemedText>
            
            <View style={styles.selectedTicketInfo}>
              <Text style={[styles.selectedTicketSubject, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                {selectedTicket.subject}
              </Text>
              <Text style={[styles.selectedTicketFrom, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                From: {selectedTicket.username} ({selectedTicket.email})
              </Text>
              <Text style={[styles.selectedTicketMessage, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
                {selectedTicket.message}
              </Text>
            </View>
            
            <View style={[
              styles.responseInputContainer,
              { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }
            ]}>
              <TextInput
                style={[
                  styles.responseInput,
                  { color: isDarkMode ? '#FFFFFF' : '#333333' }
                ]}
                placeholder="Type your response..."
                placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
                value={responseText}
                onChangeText={setResponseText}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.responseActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#333333' : '#DDDDDD' }]}
                onPress={() => {
                  setSelectedTicket(null);
                  setResponseText('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
                  !responseText.trim() && { opacity: 0.5 }
                ]}
                onPress={handleRespondToTicket}
                disabled={!responseText.trim()}
              >
                <Text style={styles.sendButtonText}>Send Response</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row'
  },
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
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  headerTitle: { 
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  contentContainer: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#DDDDDD',
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilter: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#333333',
    fontSize: 14,
  },
  ticketsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
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
  ticketsList: {
    width: '100%',
  },
  ticketCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketSubject: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketFrom: {
    fontSize: 14,
    flex: 1,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 12,
  },
  resolveButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  responseContainer: {
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  responseTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  selectedTicketInfo: {
    marginBottom: 20,
  },
  selectedTicketSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedTicketFrom: {
    fontSize: 14,
    marginBottom: 10,
  },
  selectedTicketMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  responseInputContainer: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  responseInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 