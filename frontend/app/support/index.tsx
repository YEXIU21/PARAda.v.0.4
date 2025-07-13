import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for dashboard data
interface TicketStat {
  label: string;
  count: number;
  icon: string;
  color: string;
}

interface RecentTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';
}

export default function SupportDashboardPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [ticketStats, setTicketStats] = useState<TicketStat[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<RecentTicket[]>([]);
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
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // In a production app, this would use the ticket API
      import('../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch statistics from API
          const statistics = await ticketApi.getTicketStatistics();
          
          if (statistics) {
            // Set ticket stats
            setTicketStats([
              {
                label: 'Open',
                count: statistics.openCount || 0,
                icon: 'envelope-open',
                color: '#dc3545'
              },
              {
                label: 'In Progress',
                count: statistics.inProgressCount || 0,
                icon: 'spinner',
                color: '#007bff'
              },
              {
                label: 'Pending',
                count: statistics.pendingCount || 0,
                icon: 'clock',
                color: '#ffc107'
              },
              {
                label: 'Resolved',
                count: statistics.resolvedCount || 0,
                icon: 'check-circle',
                color: '#28a745'
              }
            ]);
            
            // Try to fetch recent tickets
            const recentResult = await ticketApi.getTickets({
              sortBy: 'createdAt',
              sortOrder: 'desc',
              limit: 5
            });
            
            if (recentResult && recentResult.tickets) {
              setRecentTickets(recentResult.tickets);
            }
            
            // Try to fetch urgent tickets
            const urgentResult = await ticketApi.getTickets({
              priority: 'urgent',
              status: ['open', 'in-progress'].join(','),
              limit: 5
            });
            
            if (urgentResult && urgentResult.tickets) {
              setUrgentTickets(urgentResult.tickets);
            }
          } else {
            // Fallback to sample data
            useSampleData();
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
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
      console.error('Error in loadDashboardData:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data
  const useSampleData = () => {
    console.log('Using sample dashboard data');
    
    // Sample ticket stats
    setTicketStats([
      {
        label: 'Open',
        count: 12,
        icon: 'envelope-open',
        color: '#dc3545'
      },
      {
        label: 'In Progress',
        count: 8,
        icon: 'spinner',
        color: '#007bff'
      },
      {
        label: 'Pending',
        count: 5,
        icon: 'clock',
        color: '#ffc107'
      },
      {
        label: 'Resolved',
        count: 24,
        icon: 'check-circle',
        color: '#28a745'
      }
    ]);
    
    // Sample recent tickets
    const sampleRecent: RecentTicket[] = [
      {
        id: '1',
        ticketNumber: 'TKT-23-05-0010',
        subject: 'Cannot access my account',
        customerName: 'Maria Rodriguez',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        priority: 'high',
        status: 'open'
      },
      {
        id: '2',
        ticketNumber: 'TKT-23-05-0009',
        subject: 'App crashes when selecting a destination',
        customerName: 'James Wilson',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        priority: 'medium',
        status: 'open'
      },
      {
        id: '3',
        ticketNumber: 'TKT-23-05-0008',
        subject: 'Subscription payment failed',
        customerName: 'Sarah Johnson',
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        priority: 'high',
        status: 'in-progress'
      },
      {
        id: '4',
        ticketNumber: 'TKT-23-05-0007',
        subject: 'Driver never arrived',
        customerName: 'Michael Brown',
        createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        priority: 'urgent',
        status: 'in-progress'
      },
      {
        id: '5',
        ticketNumber: 'TKT-23-05-0006',
        subject: 'Wrong fare calculation',
        customerName: 'Emily Chen',
        createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        priority: 'medium',
        status: 'pending'
      }
    ];
    
    setRecentTickets(sampleRecent);
    
    // Sample urgent tickets
    const sampleUrgent: RecentTicket[] = [
      {
        id: '4',
        ticketNumber: 'TKT-23-05-0007',
        subject: 'Driver never arrived',
        customerName: 'Michael Brown',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        priority: 'urgent',
        status: 'in-progress'
      },
      {
        id: '6',
        ticketNumber: 'TKT-23-05-0004',
        subject: 'Payment double-charged',
        customerName: 'David Lee',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        priority: 'urgent',
        status: 'open'
      }
    ];
    
    setUrgentTickets(sampleUrgent);
  };

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
      case 'resolved':
        return '#28a745';
      case 'closed':
        return '#6c757d';
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
              <Text style={styles.headerTitle}>Support Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Overview of support tickets and activity
              </Text>
            </View>
            <FontAwesome5 name="tachometer-alt" size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Loading dashboard data...</Text>
          </View>
        ) : (
          <>
            {/* Ticket Statistics */}
            <View style={styles.statsContainer}>
              {ticketStats.map((stat, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.statCard,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                  ]}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                    <FontAwesome5 name={stat.icon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={[styles.statCount, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {stat.count}
                    </Text>
                    <Text style={[styles.statLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      {stat.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Urgent Tickets Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Urgent Tickets
                </Text>
                <TouchableOpacity onPress={() => router.push('/support/open-tickets')}>
                  <Text style={[styles.seeAllLink, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {urgentTickets.length > 0 ? (
                <View style={styles.ticketsContainer}>
                  {urgentTickets.map((ticket) => (
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
                      
                      <View style={styles.ticketFooter}>
                        <Text style={[styles.customerName, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                          {ticket.customerName}
                        </Text>
                        
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
                <View style={[
                  styles.emptyContainer,
                  { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                ]}>
                  <Text style={{ color: isDarkMode ? '#AAAAAA' : '#666666' }}>
                    No urgent tickets at the moment
                  </Text>
                </View>
              )}
            </View>
            
            {/* Recent Tickets Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Recent Tickets
                </Text>
                <TouchableOpacity onPress={() => router.push('/support/open-tickets')}>
                  <Text style={[styles.seeAllLink, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentTickets.length > 0 ? (
                <View style={styles.ticketsContainer}>
                  {recentTickets.map((ticket) => (
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
                      
                      <View style={styles.ticketFooter}>
                        <Text style={[styles.customerName, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                          {ticket.customerName}
                        </Text>
                        
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
                <View style={[
                  styles.emptyContainer,
                  { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                ]}>
                  <Text style={{ color: isDarkMode ? '#AAAAAA' : '#666666' }}>
                    No recent tickets
                  </Text>
                </View>
              )}
            </View>
          </>
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statContent: {
    flex: 1,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllLink: {
    fontSize: 14,
  },
  ticketsContainer: {
    marginBottom: 10,
  },
  ticketCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 