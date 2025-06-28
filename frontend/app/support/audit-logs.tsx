import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuditLogs } from '../../services/api/support.api';

// Define types for audit logs
interface AuditLog {
  _id: string;
  action: string;
  userId: string;
  userEmail?: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

const AuditLogsScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Check if user has support role
  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to access this page.');
      router.replace('/auth/login');
      return;
    }
    
    if (user.role !== 'support' && user.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access the audit logs.');
      router.replace('/(tabs)');
      return;
    }
    
    fetchAuditLogs();
  }, [user, router]);

  // Fetch audit logs
  const fetchAuditLogs = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setPage(1);
        pageNumber = 1;
      }

      const logsData = await getAuditLogs({
        page: pageNumber,
        limit: 10
      });
      
      if (logsData && logsData.logs) {
        if (pageNumber === 1) {
          setAuditLogs(logsData.logs);
        } else {
          setAuditLogs(prev => [...prev, ...logsData.logs]);
        }
        
        setHasMore(logsData.hasMore || false);
        setPage(pageNumber);
      } else {
        // If no logs data, set empty array
        if (pageNumber === 1) {
          setAuditLogs([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      Alert.alert('Error', 'Failed to load audit logs. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuditLogs(1, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchAuditLogs(page + 1);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get icon for action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'sign-in-alt';
      case 'LOGOUT':
        return 'sign-out-alt';
      case 'CREATE':
        return 'plus-circle';
      case 'UPDATE':
        return 'edit';
      case 'DELETE':
        return 'trash-alt';
      case 'VIEW':
        return 'eye';
      default:
        return 'history';
    }
  };

  // Get color for action type
  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return '#34C759';
      case 'LOGOUT':
        return '#FF9500';
      case 'CREATE':
        return '#007AFF';
      case 'UPDATE':
        return '#5856D6';
      case 'DELETE':
        return '#FF3B30';
      case 'VIEW':
        return '#64D2FF';
      default:
        return '#8E8E93';
    }
  };

  // Render audit log item
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => (
    <View style={[styles.logItem, { backgroundColor: colors.card }]}>
      <View style={styles.logHeader}>
        <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(item.action)}20` }]}>
          <FontAwesome5 
            name={getActionIcon(item.action)} 
            size={14} 
            color={getActionColor(item.action)} 
            style={styles.actionIcon} 
          />
          <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>
            {item.action}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      
      <Text style={[styles.resourceText, { color: colors.text }]}>
        <Text style={styles.resourceLabel}>Resource: </Text>
        {item.resourceType} {item.resourceId ? `(${item.resourceId})` : ''}
      </Text>
      
      <Text style={[styles.userText, { color: colors.text }]}>
        <Text style={styles.userLabel}>User: </Text>
        {item.userEmail || item.userId}
      </Text>
      
      {item.details && (
        <Text style={[styles.detailsText, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.details}
        </Text>
      )}
      
      {item.ipAddress && (
        <Text style={[styles.ipText, { color: colors.textSecondary }]}>
          IP: {item.ipAddress}
        </Text>
      )}
    </View>
  );

  // Render footer (loading indicator for pagination)
  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {isLoading && auditLogs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading audit logs...</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.headerText, { color: colors.text }]}>
              Showing recent system activity logs
            </Text>
            
            <FlatList
              data={auditLogs}
              renderItem={renderAuditLogItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.logsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <FontAwesome5 name="clipboard-list" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No audit logs found</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
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
  logsList: {
    paddingBottom: 20,
  },
  logItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  resourceText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resourceLabel: {
    fontWeight: '600',
  },
  userText: {
    fontSize: 14,
    marginBottom: 8,
  },
  userLabel: {
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 13,
    marginBottom: 8,
  },
  ipText: {
    fontSize: 12,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuditLogsScreen; 