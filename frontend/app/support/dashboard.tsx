import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getSupportDashboardData, 
  getSupportTickets 
} from '../../services/api/support.api';

// Define types for the dashboard
interface DashboardStats {
  pendingTickets: number;
  resolvedTickets: number;
  totalUsers: number;
  activeUsers: number;
}

interface Ticket {
  id: string;
  title: string;
  user: string;
  status: string;
  priority: string;
  createdAt: string;
}

const SupportDashboard = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  // Check if user has support role
  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to access this page.');
      router.replace('/auth/login');
      return;
    }
    
    if (user.role !== 'support' && user.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access the support dashboard.');
      router.replace('/(tabs)');
      return;
    }
    
    fetchDashboardData();
  }, [user, router]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      const dashboardData = await getSupportDashboardData();
      
      // Extract relevant stats
      const dashboardStats: DashboardStats = {
        pendingTickets: dashboardData.messageStats?.unread || 0,
        resolvedTickets: dashboardData.messageStats?.read || 0,
        totalUsers: dashboardData.userStats?.total || 0,
        activeUsers: dashboardData.userStats?.active || 0
      };
      
      setStats(dashboardStats);
      
      // Fetch recent tickets (using messages as tickets)
      const ticketsData = await getSupportTickets({ limit: 4 });
      setRecentTickets(ticketsData.tickets);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#34C759';
      case 'low':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#4B6BFE', '#2D3AF2']} // Support-specific colors
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Support Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {user?.email || 'Support Agent'}
            </Text>
          </View>
          <View style={styles.supportBadge}>
            <Text style={styles.supportBadgeText}>SUPPORT</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B6BFE" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4B6BFE"]}
              tintColor="#4B6BFE"
            />
          }
        >
          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <FontAwesome5 name="headset" size={24} color="#FFFFFF" style={styles.welcomeIcon} />
            <View>
              <Text style={styles.welcomeTitle}>Welcome to Support Portal</Text>
              <Text style={styles.welcomeSubtitle}>Manage tickets and help users</Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: '#FF9500' }]}>
                <FontAwesome5 name="ticket-alt" size={20} color="#FFF" />
              </View>
              <Text style={[styles.statsValue, { color: colors.text }]}>{stats.pendingTickets}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Pending Tickets</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: '#34C759' }]}>
                <FontAwesome5 name="check-circle" size={20} color="#FFF" />
              </View>
              <Text style={[styles.statsValue, { color: colors.text }]}>{stats.resolvedTickets}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Resolved Tickets</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: '#007AFF' }]}>
                <FontAwesome5 name="users" size={20} color="#FFF" />
              </View>
              <Text style={[styles.statsValue, { color: colors.text }]}>{stats.totalUsers}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Users</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: '#5856D6' }]}>
                <FontAwesome5 name="user-check" size={20} color="#FFF" />
              </View>
              <Text style={[styles.statsValue, { color: colors.text }]}>{stats.activeUsers}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Active Users</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/support/tickets')}
              >
                <FontAwesome5 name="ticket-alt" size={20} color="#4B6BFE" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: colors.text }]}>View Tickets</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/support/audit-logs')}
              >
                <FontAwesome5 name="clipboard-list" size={20} color="#4B6BFE" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: colors.text }]}>Audit Logs</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/messages')}
              >
                <FontAwesome5 name="envelope" size={20} color="#4B6BFE" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: colors.text }]}>Messages</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/support/users')}
              >
                <FontAwesome5 name="user-friends" size={20} color="#4B6BFE" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: colors.text }]}>User Management</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Tickets */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Support Tickets</Text>
            <View style={styles.ticketsContainer}>
              {recentTickets.map((ticket) => (
                <TouchableOpacity 
                  key={ticket.id}
                  style={[styles.ticketCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/support/ticket/${ticket.id}`)}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={[styles.ticketTitle, { color: colors.text }]}>{ticket.title}</Text>
                    <View 
                      style={[
                        styles.priorityBadge, 
                        { backgroundColor: `${getPriorityColor(ticket.priority)}20` }
                      ]}
                    >
                      <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.ticketUser, { color: colors.textSecondary }]}>
                    From: {ticket.user}
                  </Text>
                  <View style={styles.ticketFooter}>
                    <Text style={[styles.ticketTime, { color: colors.textSecondary }]}>
                      {formatDate(ticket.createdAt)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#FF950020' }]}>
                      <Text style={[styles.statusText, { color: '#FF9500' }]}>Pending</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity 
                style={[styles.viewAllButton, { borderColor: colors.border }]}
                onPress={() => router.push('/support/tickets')}
              >
                <Text style={[styles.viewAllText, { color: "#4B6BFE" }]}>View All Tickets</Text>
                <FontAwesome5 name="arrow-right" size={16} color="#4B6BFE" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  supportBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  supportBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B6BFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  welcomeIcon: {
    marginRight: 12,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ticketsContainer: {
    marginBottom: 16,
  },
  ticketCard: {
    borderRadius: 12,
    padding: 16,
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
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketUser: {
    fontSize: 14,
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SupportDashboard; 