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
interface OpenTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category: string;
  status: 'open' | 'in-progress';
}

export default function OpenTicketsPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<OpenTicket[]>([]);
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
    loadOpenTickets();
  }, []);

  // Load open tickets from API
  const loadOpenTickets = async () => {
    try {
      // In a production app, this would use the ticket API
      import('../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch from API with filters for open and in-progress tickets
          const result = await ticketApi.getTickets({ 
            status: ['open', 'in-progress'].join(',')
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
          console.error('Error fetching open tickets from API:', error);
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
      console.error('Error in loadOpenTickets:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data when API is not available
  const useSampleData = () => {
    console.log('Using sample open tickets data');
    // Sample data
    const sampleTickets: OpenTicket[] = [
      {
        id: '1',
        ticketNumber: 'TKT-23-05-0001',
        customerName: 'John Doe',
        subject: 'App crashes on startup',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        category: 'technical',
        status: 'open'
      },
      {
        id: '2',
        ticketNumber: 'TKT-23-05-0002',
        customerName: 'Jane Smith',
        subject: 'Cannot update profile picture',
        priority: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'account',
        status: 'in-progress'
      },
      {
        id: '3',
        ticketNumber: 'TKT-23-05-0003',
        customerName: 'Sam Wilson',
        subject: 'Payment failed but money deducted',
        priority: 'high',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'billing',
        status: 'open'
      },
      {
        id: '5',
        ticketNumber: 'TKT-23-05-0005',
        customerName: 'Alex Wong',
        subject: 'Driver never arrived',
        priority: 'high',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        category: 'ride',
        status: 'in-progress'
      },
      {
        id: '6',
        ticketNumber: 'TKT-23-05-0006',
        customerName: 'Emily Chen',
        subject: 'Wrong fare calculation',
        priority: 'medium',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        category: 'billing',
        status: 'open'
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
    return date.toLocaleString();
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#d32f2f';
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

  // Handle ticket click
  const handleTicketClick = (ticketId: string) => {
    // In a real app, navigate to ticket detail page
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
              <Text style={styles.headerTitle}>Open Tickets</Text>
              <Text style={styles.headerSubtitle}>
                Manage unresolved customer support tickets
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
            </View>
            
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  priorityFilter === null && styles.activeFilter
                ]}
                onPress={() => setPriorityFilter(null)}
              >
                <Text style={styles.filterText}>All Priorities</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  priorityFilter === 'urgent' && styles.activeFilter
                ]}
                onPress={() => setPriorityFilter('urgent')}
              >
                <Text style={styles.filterText}>Urgent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  priorityFilter === 'high' && styles.activeFilter
                ]}
                onPress={() => setPriorityFilter('high')}
              >
                <Text style={styles.filterText}>High</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  priorityFilter === 'medium' && styles.activeFilter
                ]}
                onPress={() => setPriorityFilter('medium')}
              >
                <Text style={styles.filterText}>Medium</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  priorityFilter === 'low' && styles.activeFilter
                ]}
                onPress={() => setPriorityFilter('low')}
              >
                <Text style={styles.filterText}>Low</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tickets list */}
          <View style={styles.ticketsContainer}>
            <ThemedText type="title" style={styles.sectionTitle}>
              {filteredTickets.length} Open Tickets
            </ThemedText>
            
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
                      { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }
                    ]}
                    onPress={() => handleTicketClick(item.id)}
                  >
                    <View style={styles.ticketHeader}>
                      <View style={styles.ticketInfo}>
                        <Text style={[styles.ticketNumber, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                          {item.ticketNumber}
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
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: item.status === 'open' ? '#ff6b6b' : '#feca57' }
                      ]}>
                        <Text style={styles.statusText}>
                          {item.status === 'open' ? 'Open' : 'In Progress'}
                        </Text>
                      </View>
                    </View>
                    
                    <ThemedText type="defaultSemiBold" style={styles.ticketSubject}>
                      {item.subject}
                    </ThemedText>
                    
                    <View style={styles.ticketFooter}>
                      <Text style={[styles.customerName, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                        {item.customerName}
                      </Text>
                      <View style={styles.ticketMeta}>
                        <Text style={[styles.ticketDate, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                          {formatDate(item.createdAt)}
                        </Text>
                        <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? '#333333' : '#EEEEEE' }]}>
                          <Text style={[styles.categoryText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.ticketsList}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
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
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
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
    marginBottom: 10,
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
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketNumber: {
    fontSize: 14,
    marginRight: 10,
  },
  ticketSubject: {
    fontSize: 16,
    marginBottom: 10,
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
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 12,
    marginRight: 10,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
  }
}); 