import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for dashboard stats
interface DashboardStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  highPriorityTickets: number;
  averageResponseTime: string;
  ticketsSolvedToday: number;
}

// Define types for recent tickets
interface RecentTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function SupportDashboard() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    highPriorityTickets: 0,
    averageResponseTime: '0h 0m',
    ticketsSolvedToday: 0
  });
  
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

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      // In a production app, this would use the ticket API
      import('../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch stats from API
          const dashboardStats = await ticketApi.getDashboardStats();
          if (dashboardStats) {
            setStats(dashboardStats);
          } else {
            // Fallback to sample data
            useSampleStats();
          }
          
          // Try to fetch recent tickets from API
          const recent = await ticketApi.getRecentTickets();
          if (recent && recent.length > 0) {
            setRecentTickets(recent);
          } else {
            // Fallback to sample data
            useSampleRecentTickets();
          }
          
          // Try to fetch urgent tickets from API
          const urgent = await ticketApi.getUrgentTickets();
          if (urgent && urgent.length > 0) {
            setUrgentTickets(urgent);
          } else {
            // Fallback to sample data
            useSampleUrgentTickets();
          }
        } catch (error) {
          console.error('Error fetching dashboard data from API:', error);
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
  
  // Use all sample data
  const useSampleData = () => {
    useSampleStats();
    useSampleRecentTickets();
    useSampleUrgentTickets();
  };
  
  // Fallback to sample stats when API is not available
  const useSampleStats = () => {
    console.log('Using sample dashboard stats');
    setStats({
      openTickets: 12,
      inProgressTickets: 8,
      resolvedTickets: 45,
      highPriorityTickets: 5,
      averageResponseTime: '2h 15m',
      ticketsSolvedToday: 7
    });
  };
  
  // Fallback to sample recent tickets when API is not available
  const useSampleRecentTickets = () => {
    console.log('Using sample recent tickets');
    setRecentTickets([
      {
        id: '1',
        subject: 'App crashes on startup',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        subject: 'Cannot update profile picture',
        status: 'in-progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        subject: 'Payment failed but money deducted',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '4',
        subject: 'How do I cancel a scheduled ride?',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 259200000).toISOString()
      }
    ]);
  };
  
  // Fallback to sample urgent tickets when API is not available
  const useSampleUrgentTickets = () => {
    console.log('Using sample urgent tickets');
    setUrgentTickets([
      {
        id: '1',
        subject: 'App crashes on startup',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        subject: 'Payment failed but money deducted',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '5',
        subject: 'Driver never arrived',
        status: 'in-progress',
        priority: 'high',
        createdAt: new Date(Date.now() - 432000000).toISOString()
      }
    ]);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF6B6B';
      case 'in-progress':
        return '#FFD166';
      case 'resolved':
        return '#06D6A0';
      default:
        return '#A5A5A5';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFD166';
      case 'low':
        return '#06D6A0';
      default:
        return '#A5A5A5';
    }
  };

  // Navigate to ticket details
  const navigateToTicket = (ticketId: string) => {
    router.push(`/support/ticket/${ticketId}`);
  };

  // Navigate to open tickets
  const navigateToOpenTickets = () => {
    router.push('/support/open-tickets');
  };

  // Navigate to my tickets
  const navigateToMyTickets = () => {
    router.push('/support/my-tickets');
  };

  // Navigate to reports
  const navigateToReports = () => {
    router.push('/support/reports');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SupportNavBar />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <FontAwesome5 name="ticket-alt" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{stats.openTickets}</ThemedText>
            <ThemedText style={styles.statLabel}>Open Tickets</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <FontAwesome5 name="clock" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{stats.inProgressTickets}</ThemedText>
            <ThemedText style={styles.statLabel}>In Progress</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <FontAwesome5 name="check-circle" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{stats.resolvedTickets}</ThemedText>
            <ThemedText style={styles.statLabel}>Resolved</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <FontAwesome5 name="exclamation-triangle" size={24} color="#FF6B6B" />
            <ThemedText style={styles.statValue}>{stats.highPriorityTickets}</ThemedText>
            <ThemedText style={styles.statLabel}>High Priority</ThemedText>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <MaterialIcons name="timer" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{stats.averageResponseTime}</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Response Time</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <FontAwesome5 name="calendar-check" size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{stats.ticketsSolvedToday}</ThemedText>
            <ThemedText style={styles.statLabel}>Solved Today</ThemedText>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
              onPress={navigateToOpenTickets}
            >
              <FontAwesome5 name="ticket-alt" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Open Tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
              onPress={navigateToMyTickets}
            >
              <FontAwesome5 name="tasks" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>My Tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
              onPress={navigateToReports}
            >
              <FontAwesome5 name="chart-bar" size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Urgent Tickets */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Urgent Tickets</ThemedText>
          {urgentTickets.length > 0 ? (
            urgentTickets.map((ticket) => (
              <TouchableOpacity 
                key={ticket.id}
                style={[styles.ticketCard, { backgroundColor: colors.background }]}
                onPress={() => navigateToTicket(ticket.id)}
              >
                <View style={styles.ticketHeader}>
                  <ThemedText style={styles.ticketSubject}>{ticket.subject}</ThemedText>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                    <Text style={styles.priorityText}>{ticket.priority}</Text>
                  </View>
                </View>
                <View style={styles.ticketFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  <ThemedText style={styles.ticketDate}>{formatDate(ticket.createdAt)}</ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.emptyStateText}>No urgent tickets at the moment</ThemedText>
            </View>
          )}
        </View>
        
        {/* Recent Tickets */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Recent Tickets</ThemedText>
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <TouchableOpacity 
                key={ticket.id}
                style={[styles.ticketCard, { backgroundColor: colors.background }]}
                onPress={() => navigateToTicket(ticket.id)}
              >
                <View style={styles.ticketHeader}>
                  <ThemedText style={styles.ticketSubject}>{ticket.subject}</ThemedText>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                    <Text style={styles.priorityText}>{ticket.priority}</Text>
                  </View>
                </View>
                <View style={styles.ticketFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  <ThemedText style={styles.ticketDate}>{formatDate(ticket.createdAt)}</ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.emptyStateText}>No recent tickets</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    opacity: 0.7,
  },
}); 