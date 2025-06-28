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

  return (
    <SupportLayout title="Support Dashboard" showBackButton={false}>
      <View style={styles.container}>
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
              style={[styles.newTicketButton, { backgroundColor: colors.primary }]}
              onPress={() => console.log('Create new ticket')}
            >
              <FontAwesome5 name="plus" size={14} color="#fff" />
              <Text style={styles.newTicketText}>New Ticket</Text>
            </TouchableOpacity>
          </View>
          
          {renderFilterTabs()}
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredTickets}
              renderItem={renderTicketItem}
              keyExtractor={item => item.id}
              style={styles.ticketsList}
              contentContainerStyle={styles.ticketsListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <FontAwesome5 name="ticket-alt" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No tickets found
                  </Text>
                </View>
              }
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  newTicketText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ticketsList: {
    flex: 1,
  },
  ticketsListContent: {
    paddingBottom: 16,
  },
  ticketItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ticketInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ticketInfoText: {
    fontSize: 12,
    marginRight: 16,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketDate: {
    fontSize: 11,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default SupportDashboard; 