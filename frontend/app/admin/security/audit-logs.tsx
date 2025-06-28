import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { getAuditLogs, getAuditStats } from '../../../services/api/admin.api';
// Import DateTimePicker and Picker conditionally to avoid build errors
let DateTimePicker: any;
let Picker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
  Picker = require('@react-native-picker/picker').Picker;
} catch (err) {
  console.warn('DateTimePicker or Picker not available');
}
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import AdminLayout from '../../../components/layouts/AdminLayout';

// Define the audit log interface
interface AuditLog {
  _id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  category: string;
  description: string;
  ipAddress: string;
  status: string;
  severity: string;
  createdAt: string;
}

// Define the audit stats interface
interface AuditStats {
  categoryStats: Array<{ _id: string, count: number }>;
  severityStats: Array<{ _id: string, count: number }>;
  statusStats: Array<{ _id: string, count: number }>;
  roleStats: Array<{ _id: string, count: number }>;
  topUsers: Array<{ userId: string, username: string, count: number }>;
}

const AuditLogsScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // State for audit logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for filters
  const [filters, setFilters] = useState({
    username: '',
    category: '',
    severity: '',
    status: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(),
  });
  
  // State for filter UI
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Check if user has admin role
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigation.navigate('Home' as never);
    }
  }, [user, navigation]);
  
  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '20');
      
      if (filters.username) queryParams.append('username', filters.username);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.severity) queryParams.append('severity', filters.severity);
      if (filters.status) queryParams.append('status', filters.status);
      
      queryParams.append('startDate', filters.startDate.toISOString());
      queryParams.append('endDate', filters.endDate.toISOString());
      
      // Fetch logs
      const response = await getAuditLogs(queryParams.toString());
      
      if (response.success) {
        setLogs(response.data);
        setTotalPages(response.pages);
      } else {
        setError('Failed to fetch audit logs');
      }
      
      // Fetch stats
      const statsResponse = await getAuditStats(
        `startDate=${filters.startDate.toISOString()}&endDate=${filters.endDate.toISOString()}`
      );
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('An error occurred while fetching audit logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch logs when page or filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);
  
  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when filters change
    fetchAuditLogs();
    setShowFilters(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      username: '',
      category: '',
      severity: '',
      status: '',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    setPage(1);
  };
  
  // Render severity badge
  const renderSeverityBadge = (severity: string) => {
    let color = '';
    
    switch (severity) {
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
        <Text style={styles.badgeText}>{severity}</Text>
      </View>
    );
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    let color = '';
    
    switch (status) {
      case 'success':
        color = '#28a745';
        break;
      case 'failure':
        color = '#dc3545';
        break;
      case 'warning':
        color = '#ffc107';
        break;
      case 'info':
        color = '#17a2b8';
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
  
  // Render category badge
  const renderCategoryBadge = (category: string) => {
    let color = '';
    let icon = '';
    
    switch (category) {
      case 'authentication':
        color = '#007bff';
        icon = 'lock';
        break;
      case 'user_management':
        color = '#6f42c1';
        icon = 'users';
        break;
      case 'message':
        color = '#17a2b8';
        icon = 'envelope';
        break;
      case 'payment':
        color = '#28a745';
        icon = 'credit-card';
        break;
      case 'subscription':
        color = '#fd7e14';
        icon = 'tag';
        break;
      case 'system':
        color = '#6c757d';
        icon = 'cog';
        break;
      case 'data_access':
        color = '#dc3545';
        icon = 'database';
        break;
      default:
        color = '#6c757d';
        icon = 'question';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <FontAwesome5 name={icon} size={10} color="#fff" style={styles.badgeIcon} />
        <Text style={styles.badgeText}>{category}</Text>
      </View>
    );
  };
  
  // Render audit log item
  const renderLogItem = ({ item }: { item: AuditLog }) => (
    <View style={[styles.logItem, { backgroundColor: colors.card }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      
      <Text style={[styles.description, { color: colors.text }]}>{item.description}</Text>
      
      <View style={styles.logDetails}>
        <View style={styles.badgeContainer}>
          {renderCategoryBadge(item.category)}
          {renderSeverityBadge(item.severity)}
          {renderStatusBadge(item.status)}
        </View>
        
        <Text style={[styles.ipAddress, { color: colors.textSecondary }]}>
          IP: {item.ipAddress}
        </Text>
      </View>
    </View>
  );
  
  // Render stats section
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Audit Summary</Text>
        
        <View style={styles.statsRow}>
          {/* Category stats */}
          <View style={styles.statBox}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Top Categories</Text>
            {stats.categoryStats.slice(0, 3).map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{stat._id}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.count}</Text>
              </View>
            ))}
          </View>
          
          {/* Severity stats */}
          <View style={styles.statBox}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Severity</Text>
            {stats.severityStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{stat._id}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.count}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.statsRow}>
          {/* Status stats */}
          <View style={styles.statBox}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Status</Text>
            {stats.statusStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{stat._id}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.count}</Text>
              </View>
            ))}
          </View>
          
          {/* Top users */}
          <View style={styles.statBox}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Top Users</Text>
            {stats.topUsers.slice(0, 3).map((user, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{user.username}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{user.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };
  
  // Render filters section
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <View style={[styles.filtersContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.filtersTitle, { color: colors.text }]}>Filters</Text>
        
        {/* Username filter */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Username</Text>
          <TextInput
            style={[styles.filterInput, { color: colors.text, borderColor: colors.border }]}
            value={filters.username}
            onChangeText={(text) => setFilters({ ...filters, username: text })}
            placeholder="Filter by username"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        {/* Category filter */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
          <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
            {Picker && (
              <Picker
                selectedValue={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
                style={{ color: colors.text }}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="All Categories" value="" />
                <Picker.Item label="Authentication" value="authentication" />
                <Picker.Item label="User Management" value="user_management" />
                <Picker.Item label="Message" value="message" />
                <Picker.Item label="Payment" value="payment" />
                <Picker.Item label="Subscription" value="subscription" />
                <Picker.Item label="System" value="system" />
                <Picker.Item label="Data Access" value="data_access" />
              </Picker>
            )}
          </View>
        </View>
        
        {/* Severity filter */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Severity</Text>
          <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
            <Picker
              selectedValue={filters.severity}
              onValueChange={(value) => setFilters({ ...filters, severity: value })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="All Severities" value="" />
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
              <Picker.Item label="Critical" value="critical" />
            </Picker>
          </View>
        </View>
        
        {/* Status filter */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Status</Text>
          <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
            <Picker
              selectedValue={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="All Statuses" value="" />
              <Picker.Item label="Success" value="success" />
              <Picker.Item label="Failure" value="failure" />
              <Picker.Item label="Warning" value="warning" />
              <Picker.Item label="Info" value="info" />
            </Picker>
          </View>
        </View>
        
        {/* Date range filters */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Start Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {format(filters.startDate, 'yyyy-MM-dd')}
            </Text>
          </TouchableOpacity>
          
          {showStartDatePicker && DateTimePicker && (
            <DateTimePicker
              value={filters.startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setFilters({ ...filters, startDate: selectedDate });
                }
              }}
            />
          )}
        </View>
        
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>End Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {format(filters.endDate, 'yyyy-MM-dd')}
            </Text>
          </TouchableOpacity>
          
          {showEndDatePicker && DateTimePicker && (
            <DateTimePicker
              value={filters.endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setFilters({ ...filters, endDate: selectedDate });
                }
              }}
            />
          )}
        </View>
        
        {/* Filter action buttons */}
        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[styles.filterButton, styles.resetButton]}
            onPress={resetFilters}
          >
            <Text style={styles.filterButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, styles.applyButton]}
            onPress={applyFilters}
          >
            <Text style={styles.filterButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render pagination controls
  const renderPagination = () => (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, page === 1 && styles.disabledButton]}
        onPress={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <FontAwesome5 name="chevron-left" size={16} color={page === 1 ? '#ccc' : colors.primary} />
      </TouchableOpacity>
      
      <Text style={[styles.pageText, { color: colors.text }]}>
        Page {page} of {totalPages}
      </Text>
      
      <TouchableOpacity
        style={[styles.pageButton, page === totalPages && styles.disabledButton]}
        onPress={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        <FontAwesome5 name="chevron-right" size={16} color={page === totalPages ? '#ccc' : colors.primary} />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <AdminLayout title="Audit Logs" subtitle="Security monitoring and compliance">
      <View style={styles.container}>
        {/* Header actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.filterToggle, { borderColor: colors.border }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <FontAwesome5 name="filter" size={16} color={colors.primary} />
            <Text style={[styles.filterToggleText, { color: colors.text }]}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.refreshButton, { borderColor: colors.border }]}
            onPress={fetchAuditLogs}
          >
            <FontAwesome5 name="sync" size={16} color={colors.primary} />
            <Text style={[styles.refreshButtonText, { color: colors.text }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filters */}
        {renderFilters()}
        
        {/* Stats */}
        {renderStats()}
        
        {/* Logs */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAuditLogs}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="search" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No audit logs found for the selected filters
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.logsList}
              showsVerticalScrollIndicator={false}
            />
            
            {renderPagination()}
          </>
        )}
      </View>
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
  filtersContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateButton: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  applyButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logsList: {
    paddingBottom: 16,
  },
  logItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 6,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ipAddress: {
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  loader: {
    marginTop: 32,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AuditLogsScreen; 