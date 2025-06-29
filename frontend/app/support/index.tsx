import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../components/layouts/SupportLayout';
import { getTickets, getTicketStats, Ticket } from '../../services/api/support.api';
import { useRouter } from 'expo-router';

const SupportDashboard = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Fetch tickets and stats from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filter !== 'all') {
          queryParams.append('status', filter);
        }
        
        // Fetch tickets
        const ticketsResponse = await getTickets(queryParams.toString());
        if (ticketsResponse.success) {
          setTickets(ticketsResponse.data);
        } else {
          setError('Failed to fetch tickets');
          setTickets([]);
        }
        
        // Fetch stats
        const statsResponse = await getTicketStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching support data:', err);
        setError('An error occurred while fetching data');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filter]);

  // Filter tickets based on status
  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

  // Render priority badge
  const renderPriorityBadge = (priority: string) => {
    let color = '';
    
    switch (priority) {
      case 'low':
        color = '#28a745';
        break;
      case 'medium':
        color = '#ffc107';
        break;
      case 'high':
        color = '#fd7e14';
        break;
      case 'critical':
        color = '#dc3545';
        break;
      default:
        color = '#6c757d';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{priority}</Text>
      </View>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let color = '';
    
    switch (status) {
      case 'open':
        color = '#17a2b8';
        break;
      case 'in-progress':
        color = '#fd7e14';
        break;
      case 'resolved':
        color = '#28a745';
        break;
      case 'closed':
        color = '#6c757d';
        break;
      default:
        color = '#6c757d';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  // Render ticket item
  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity 
      style={[styles.ticketItem, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/support/ticket/${item.id}`)}
    >
      <View style={styles.ticketHeader}>
        <Text style={[styles.ticketId, { color: colors.textSecondary }]}>#{item.id}</Text>
        <View style={styles.badgeContainer}>
          {renderPriorityBadge(item.priority)}
          {renderStatusBadge(item.status)}
        </View>
      </View>
      
      <Text style={[styles.ticketSubject, { color: colors.text }]}>{item.subject}</Text>
      
      <View style={styles.ticketInfo}>
        <Text style={[styles.ticketInfoText, { color: colors.textSecondary }]}>
          <FontAwesome5 name="user" size={12} color={colors.textSecondary} /> {item.username}
        </Text>
        <Text style={[styles.ticketInfoText, { color: colors.textSecondary }]}>
          <FontAwesome5 name="tag" size={12} color={colors.textSecondary} /> {item.category}
        </Text>
      </View>
      
      <View style={styles.ticketFooter}>
        <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          filter === 'all' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setFilter('all')}
      >
        <Text style={[
          styles.filterText, 
          filter === 'all' ? { color: '#fff' } : { color: colors.text }
        ]}>All</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          filter === 'open' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setFilter('open')}
      >
        <Text style={[
          styles.filterText, 
          filter === 'open' ? { color: '#fff' } : { color: colors.text }
        ]}>Open</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          filter === 'in-progress' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setFilter('in-progress')}
      >
        <Text style={[
          styles.filterText, 
          filter === 'in-progress' ? { color: '#fff' } : { color: colors.text }
        ]}>In Progress</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          filter === 'resolved' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setFilter('resolved')}
      >
        <Text style={[
          styles.filterText, 
          filter === 'resolved' ? { color: '#fff' } : { color: colors.text }
        ]}>Resolved</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          filter === 'closed' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setFilter('closed')}
      >
        <Text style={[
          styles.filterText, 
          filter === 'closed' ? { color: '#fff' } : { color: colors.text }
        ]}>Closed</Text>
      </TouchableOpacity>
    </View>
  );

  // Add quick action buttons
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/support/create-ticket')}
      >
        <FontAwesome5 name="ticket-alt" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Create Ticket</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
        onPress={() => router.push('/support/user-management')}
      >
        <FontAwesome5 name="users" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>User Management</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
        onPress={() => router.push('/support/analytics')}
      >
        <FontAwesome5 name="chart-bar" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Analytics</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
        onPress={() => router.push('/support/settings')}
      >
        <FontAwesome5 name="cog" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SupportLayout title="Support Dashboard" showBackButton={false}>
      <View style={styles.container}>
        {/* Quick action buttons */}
        {renderQuickActions()}
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {tickets.filter(t => t.status === 'open').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open Tickets</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {tickets.filter(t => t.status === 'in-progress').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>High Priority</Text>
          </View>
        </View>
        
        <View style={styles.ticketsContainer}>
          <View style={styles.ticketsHeader}>
            <Text style={[styles.ticketsTitle, { color: colors.text }]}>Support Tickets</Text>
            <TouchableOpacity
              style={styles.createTicketButton}
              onPress={() => router.push('/support/create-ticket')}
            >
              <FontAwesome5 name="plus" size={14} color="#fff" />
              <Text style={styles.createTicketText}>New Ticket</Text>
            </TouchableOpacity>
          </View>
          
          {renderFilterTabs()}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading tickets...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => setFilter(filter)} // This will trigger a re-fetch
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="ticket-alt" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No tickets found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {filter === 'all' 
                  ? 'There are no support tickets in the system.' 
                  : `There are no ${filter} tickets at the moment.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTickets}
              renderItem={renderTicketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.ticketList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  ticketsContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createTicketText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'scroll',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ticketList: {
    paddingBottom: 16,
  },
  ticketItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketInfoText: {
    fontSize: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketDate: {
    fontSize: 12,
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
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SupportDashboard; 