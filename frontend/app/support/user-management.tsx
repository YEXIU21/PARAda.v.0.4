import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../components/layouts/SupportLayout';
import axios from 'axios';
import ENV from '../../constants/environment';
import { getAuthToken } from '../../services/api/auth.api';
import { useRouter } from 'expo-router';

// User interface
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  accountType: string;
  createdAt: string;
}

const UserManagementScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch users
  const fetchUsers = async (reset = false) => {
    if (reset) {
      setPage(0);
      setUsers([]);
    }
    
    const currentPage = reset ? 0 : page;
    
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '20');
      queryParams.append('skip', (currentPage * 20).toString());
      
      if (roleFilter !== 'all') {
        queryParams.append('role', roleFilter);
      }
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const response = await axios.get(`${ENV.apiUrl}/api/admin/users?${queryParams.toString()}`, {
        headers: { 'x-access-token': token }
      });
      
      const newUsers = response.data.users;
      const pagination = response.data.pagination;
      
      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers([...users, ...newUsers]);
      }
      
      setHasMore(pagination.hasMore);
      setPage(currentPage + 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Filter users
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredUsers(users);
    } else {
      const isActive = statusFilter === 'active';
      setFilteredUsers(users.filter(user => user.isActive === isActive));
    }
  }, [users, statusFilter]);
  
  // Initial fetch
  useEffect(() => {
    fetchUsers(true);
  }, [roleFilter]);
  
  // Handle search
  const handleSearch = () => {
    fetchUsers(true);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };
  
  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchUsers();
    }
  };
  
  // Handle user status toggle
  const toggleUserStatus = async (user: User) => {
    try {
      const token = await getAuthToken();
      const newStatus = !user.isActive;
      
      const response = await axios.patch(
        `${ENV.apiUrl}/api/admin/users/${user._id}/status`,
        { isActive: newStatus },
        { headers: { 'x-access-token': token } }
      );
      
      if (response.status === 200) {
        // Update local state
        const updatedUsers = users.map(u => 
          u._id === user._id ? { ...u, isActive: newStatus } : u
        );
        setUsers(updatedUsers);
        
        Alert.alert(
          'Success',
          `User ${user.username} has been ${newStatus ? 'activated' : 'deactivated'}.`
        );
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      Alert.alert('Error', 'Failed to update user status. Please try again.');
    }
  };
  
  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userItem, { backgroundColor: colors.card }]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
          <View style={styles.badgeContainer}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: getRoleBadgeColor(item.role) }
            ]}>
              <Text style={styles.roleBadgeText}>{item.role}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? '#28a745' : '#dc3545' }
            ]}>
              <Text style={styles.statusBadgeText}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        
        <View style={styles.userMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Account Type: {item.accountType}
          </Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/support/user-details/${item._id}`)}
        >
          <FontAwesome5 name="info-circle" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: item.isActive ? '#dc3545' : '#28a745' }
          ]}
          onPress={() => {
            Alert.alert(
              'Confirm Action',
              `Are you sure you want to ${item.isActive ? 'deactivate' : 'activate'} this user?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => toggleUserStatus(item) }
              ]
            );
          }}
        >
          <FontAwesome5 name={item.isActive ? 'user-slash' : 'user-check'} size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#6c757d' }]}
          onPress={() => router.push(`/support/message/${item._id}`)}
        >
          <FontAwesome5 name="envelope" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#9c27b0';
      case 'driver':
        return '#2196f3';
      case 'passenger':
        return '#4caf50';
      case 'support':
        return '#ff9800';
      default:
        return '#6c757d';
    }
  };
  
  // Render list footer
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more users...</Text>
      </View>
    );
  };
  
  // Render empty list
  const renderEmpty = () => {
    if (loading && !refreshing) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="users-slash" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>No users found</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Try adjusting your filters or search query
        </Text>
      </View>
    );
  };
  
  return (
    <SupportLayout title="User Management">
      <View style={styles.container}>
        {/* Search and filters */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <FontAwesome5 name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username or email"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery('');
                  fetchUsers(true);
                }}
              >
                <FontAwesome5 name="times-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
          >
            <FontAwesome5 name="search" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
            {/* Role filters */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'all' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setRoleFilter('all')}
            >
              <Text style={[
                styles.filterText,
                roleFilter === 'all' ? { color: '#fff' } : { color: colors.text }
              ]}>All Roles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'passenger' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setRoleFilter('passenger')}
            >
              <Text style={[
                styles.filterText,
                roleFilter === 'passenger' ? { color: '#fff' } : { color: colors.text }
              ]}>Passengers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'driver' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setRoleFilter('driver')}
            >
              <Text style={[
                styles.filterText,
                roleFilter === 'driver' ? { color: '#fff' } : { color: colors.text }
              ]}>Drivers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'support' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setRoleFilter('support')}
            >
              <Text style={[
                styles.filterText,
                roleFilter === 'support' ? { color: '#fff' } : { color: colors.text }
              ]}>Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'admin' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setRoleFilter('admin')}
            >
              <Text style={[
                styles.filterText,
                roleFilter === 'admin' ? { color: '#fff' } : { color: colors.text }
              ]}>Admins</Text>
            </TouchableOpacity>
            
            {/* Status filters */}
            <View style={styles.filterDivider} />
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'all' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[
                styles.filterText,
                statusFilter === 'all' ? { color: '#fff' } : { color: colors.text }
              ]}>All Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'active' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setStatusFilter('active')}
            >
              <Text style={[
                styles.filterText,
                statusFilter === 'active' ? { color: '#fff' } : { color: colors.text }
              ]}>Active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'inactive' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setStatusFilter('inactive')}
            >
              <Text style={[
                styles.filterText,
                statusFilter === 'inactive' ? { color: '#fff' } : { color: colors.text }
              ]}>Inactive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* User list */}
        {error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => fetchUsers(true)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
          />
        )}
      </View>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filtersScrollContent: {
    paddingRight: 16,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userItem: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
  },
  actionButtons: {
    justifyContent: 'space-between',
    paddingLeft: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default UserManagementScreen; 