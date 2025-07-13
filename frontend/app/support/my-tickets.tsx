import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for support tickets
interface MyTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category: string;
  status: 'open' | 'in-progress' | 'pending';
  updatedAt: string;
}

export default function MyTicketsPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<MyTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
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
    loadMyTickets();
  }, []);

  // Load tickets assigned to the current user
  const loadMyTickets = async () => {
    try {
      // In a production app, this would use the ticket API
      import('../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch from API with filters for tickets assigned to current user
          const result = await ticketApi.getTickets({ 
            assignedTo: user?.id,
            status: ['open', 'in-progress', 'pending'].join(',')
          });
          
          if (result && result.tickets && result.tickets.length > 0) {
            // Map API response to our ticket format
            const apiTickets = result.tickets.map((ticket: any) => ({
              id: ticket._id,
              ticketNumber: ticket.ticketNumber,
              customerName: ticket.customerName,
              subject: ticket.subject,
              priority: ticket.priority,
              createdAt: ticket.createdAt,
              updatedAt: ticket.updatedAt,
              category: ticket.category,
              status: ticket.status
            }));
            
            setTickets(apiTickets);
            setFilteredTickets(apiTickets);
          } else {
            // Fallback to sample data if API returns empty
            useSampleData();
          }
        } catch (error) {
          console.error('Error fetching my tickets from API:', error);
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
      console.error('Error in loadMyTickets:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data when API is not available
  const useSampleData = () => {
    console.log('Using sample my tickets data');
    // Sample data
    const sampleTickets: MyTicket[] = [
      {
        id: '1',
        ticketNumber: 'TKT-23-05-0001',
        customerName: 'John Doe',
        subject: 'App crashes on startup',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        category: 'technical',
        status: 'in-progress'
      },
      {
        id: '3',
        ticketNumber: 'TKT-23-05-0003',
        customerName: 'Sam Wilson',
        subject: 'Payment failed but money deducted',
        priority: 'high',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'billing',
        status: 'open'
      },
      {
        id: '6',
        ticketNumber: 'TKT-23-05-0006',
        customerName: 'Emily Chen',
        subject: 'Wrong fare calculation',
        priority: 'medium',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'billing',
        status: 'pending'
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
        ticket.customerName.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query)
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return '#28a745';
      case 'medium':
        return '#ffc107';
      case 'high':
        return '#fd7e14';
      case 'urgent':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#dc3545';
      case 'in-progress':
        return '#007bff';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  // Handle ticket click
  const handleTicketClick = (ticketId: string) => {
    router.push(`/support/ticket/${ticketId}`);
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
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>My Assigned Tickets</Text>
              <Text style={styles.headerSubtitle}>
                Manage tickets assigned to you
              </Text>
            </View>
            <FontAwesome5 name="tasks" size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>
        
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
              placeholder="Search tickets..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Status:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === null && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter(null)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === null && styles.filterOptionTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'open' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('open')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'open' && styles.filterOptionTextActive
                  ]}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'in-progress' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('in-progress')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'in-progress' && styles.filterOptionTextActive
                  ]}>In Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'pending' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('pending')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'pending' && styles.filterOptionTextActive
                  ]}>Pending</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Priority Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Priority:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    priorityFilter === null && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter(null)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priorityFilter === null && styles.filterOptionTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    priorityFilter === 'urgent' && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter('urgent')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priorityFilter === 'urgent' && styles.filterOptionTextActive
                  ]}>Urgent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    priorityFilter === 'high' && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter('high')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priorityFilter === 'high' && styles.filterOptionTextActive
                  ]}>High</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    priorityFilter === 'medium' && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter('medium')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priorityFilter === 'medium' && styles.filterOptionTextActive
                  ]}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    priorityFilter === 'low' && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter('low')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    priorityFilter === 'low' && styles.filterOptionTextActive
                  ]}>Low</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {/* Tickets List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Loading tickets...</Text>
          </View>
        ) : filteredTickets.length > 0 ? (
          <View style={styles.ticketsContainer}>
            {filteredTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={[
                  styles.ticketCard,
                  { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                ]}
                onPress={() => handleTicketClick(ticket.id)}
              >
                <View style={styles.ticketHeader}>
                  <Text style={[styles.ticketNumber, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                    {ticket.ticketNumber}
                  </Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                    <Text style={styles.priorityText}>{ticket.priority}</Text>
                  </View>
                </View>
                
                <Text style={[styles.ticketSubject, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {ticket.subject}
                </Text>
                
                <View style={styles.ticketCustomer}>
                  <FontAwesome5 name="user" size={12} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                  <Text style={[styles.customerName, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                    {ticket.customerName}
                  </Text>
                </View>
                
                <View style={styles.ticketFooter}>
                  <View style={styles.ticketMeta}>
                    <View style={styles.ticketMetaItem}>
                      <FontAwesome5 name="folder" size={12} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                      <Text style={[styles.ticketMetaText, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                        {ticket.category}
                      </Text>
                    </View>
                    <View style={styles.ticketMetaItem}>
                      <FontAwesome5 name="clock" size={12} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                      <Text style={[styles.ticketMetaText, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                        {formatDate(ticket.updatedAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>
                      {ticket.status === 'in-progress' ? 'In Progress' : 
                        ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="check-circle" size={48} color="#28a745" />
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              No tickets assigned to you
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              You don't have any assigned tickets matching your filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    padding: 20,
    borderRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterGroup: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#007bff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  ticketsContainer: {
    padding: 15,
  },
  ticketCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketNumber: {
    fontSize: 14,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  ticketCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    marginLeft: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flex: 1,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ticketMetaText: {
    fontSize: 12,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  },
}); 