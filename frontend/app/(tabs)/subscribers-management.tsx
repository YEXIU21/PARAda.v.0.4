import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  RefreshControl
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { getSubscriptions, verifySubscription, cancelSubscription } from '../../services/api/admin.api';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmationModal from '../../components/ConfirmationModal';

// Define interfaces for API data
interface Subscription {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  planId: string;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
  paymentDetails?: {
    method: string;
    referenceNumber: string;
    amount: number;
    paymentDate: string;
  };
  verification?: {
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    status?: string;
  };
}

export default function SubscribersManagementScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [activeTab]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set the correct filter based on the active tab
      const filter: any = {};
      
      if (activeTab === 'active') {
        filter.isActive = 'true';
      } else {
        filter.pending = 'true';
      }
      
      console.log(`Fetching ${activeTab} subscriptions with filter:`, filter);
      
      const response = await getSubscriptions(filter);
      
      console.log('API Response:', response);
      
      if (response && response.subscriptions) {
        setSubscriptions(response.subscriptions);
        console.log('Set subscriptions:', response.subscriptions.length);
      } else {
        console.log('No subscriptions found in response');
        setSubscriptions([]);
      }
      
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
      setIsLoading(false);
      setIsRefreshing(false);
      console.error('Error loading subscriptions:', err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubscriptions();
  };

  const handleVerifySubscription = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setVerifyModalVisible(true);
  };

  const handleRejectSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setRejectModalVisible(true);
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setCancelModalVisible(true);
  };

  const confirmVerifySubscription = async () => {
    if (!selectedSubscriptionId) return;
    
    try {
      setActionLoading(true);
      console.log(`Attempting to verify subscription: ${selectedSubscriptionId}`);
      await verifySubscription(selectedSubscriptionId, true);
      console.log(`Verification successful for subscription: ${selectedSubscriptionId}`);
      
      setVerifyModalVisible(false);
      setSelectedSubscriptionId(null);
      Alert.alert('Success', 'Subscription verified successfully');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error verifying subscription:', error);
      Alert.alert('Error', error.message || 'Failed to verify subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRejectSubscription = async () => {
    if (!selectedSubscriptionId) return;
    
    try {
      setActionLoading(true);
      console.log(`Attempting to reject subscription: ${selectedSubscriptionId}`);
      await verifySubscription(selectedSubscriptionId, false);
      console.log(`Rejection successful for subscription: ${selectedSubscriptionId}`);
      
      setRejectModalVisible(false);
      setSelectedSubscriptionId(null);
      Alert.alert('Success', 'Subscription rejected successfully');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error rejecting subscription:', error);
      Alert.alert('Error', error.message || 'Failed to reject subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancelSubscription = async () => {
    if (!selectedSubscriptionId) return;
    
    try {
      setActionLoading(true);
      console.log(`Attempting to cancel subscription: ${selectedSubscriptionId}`);
      await cancelSubscription(selectedSubscriptionId);
      console.log(`Cancellation successful for subscription: ${selectedSubscriptionId}`);
      
      setCancelModalVisible(false);
      setSelectedSubscriptionId(null);
      Alert.alert('Success', 'Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      Alert.alert('Error', error.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlanColor = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'basic':
        return '#4B6BFE';
      case 'premium':
        return '#34A853';
      case 'annual':
        return '#FFCC00';
      default:
        return '#8E44AD';
    }
  };

  // Filter subscriptions based on search text
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const username = subscription.userId?.username?.toLowerCase() || '';
    const email = subscription.userId?.email?.toLowerCase() || '';
    const reference = subscription.paymentDetails?.referenceNumber?.toLowerCase() || '';
    const searchLower = searchText.toLowerCase();
    
    return username.includes(searchLower) || 
           email.includes(searchLower) || 
           reference.includes(searchLower);
  });

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors as [string, string]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Subscribers Management</Text>
        </LinearGradient>
        
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading subscriptions...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors as [string, string]}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Subscribers Management</Text>
        </LinearGradient>
        
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={50} color="#FF3B30" />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchSubscriptions}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Subscribers Management</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {/* Search and Filter Section */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <FontAwesome5 name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name, email or reference..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <FontAwesome5 name="times-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Tabs Section */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Subscriptions</Text>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'active' && [
                  styles.activeTab,
                  { backgroundColor: theme.primary + '20' },
                ],
              ]}
              onPress={() => setActiveTab('active')}
            >
              <FontAwesome5 
                name="check-circle" 
                size={14} 
                color={activeTab === 'active' ? theme.primary : theme.textSecondary} 
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'active' ? theme.primary : theme.textSecondary },
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'pending' && [
                  styles.activeTab,
                  { backgroundColor: theme.warning + '20' },
                ],
              ]}
              onPress={() => setActiveTab('pending')}
            >
              <FontAwesome5 
                name="clock" 
                size={14} 
                color={activeTab === 'pending' ? theme.warning : theme.textSecondary} 
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'pending' ? theme.warning : theme.textSecondary },
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on active tab */}
        <ScrollView
          style={styles.subscriptionsList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {filteredSubscriptions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="info-circle" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchText ? 'No matching subscriptions found' : `No ${activeTab} subscriptions found`}
              </Text>
            </View>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <View
                key={subscription._id}
                style={[styles.subscriptionCard, { backgroundColor: theme.card }]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.planBadge,
                      { backgroundColor: getPlanColor(subscription.planId) },
                    ]}
                  >
                    <Text style={styles.planBadgeText}>
                      {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                    {formatDate(subscription.createdAt)}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <FontAwesome5 name="user" size={16} color={theme.primary} style={styles.icon} />
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {subscription.userId?.username || 'Unknown User'}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <FontAwesome5 name="envelope" size={16} color={theme.primary} style={styles.icon} />
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                    {subscription.userId?.email || 'No email'}
                  </Text>
                </View>

                {subscription.paymentDetails && (
                  <View style={styles.paymentInfo}>
                    <FontAwesome5 name="money-bill" size={16} color={theme.primary} style={styles.icon} />
                    <View>
                      <Text style={[styles.paymentMethod, { color: theme.text }]}>
                        {subscription.paymentDetails.method?.toUpperCase() || 'Unknown Method'}
                      </Text>
                      <Text style={[styles.paymentReference, { color: theme.textSecondary }]}>
                        Ref: {subscription.paymentDetails.referenceNumber || 'N/A'}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.statusContainer}>
                  <View style={styles.statusInfo}>
                    <FontAwesome5 
                      name={activeTab === 'active' ? 'calendar-check' : 'clock'} 
                      size={16} 
                      color={activeTab === 'active' ? theme.success : theme.warning} 
                      style={styles.icon} 
                    />
                    <Text 
                      style={[
                        styles.statusText, 
                        { 
                          color: activeTab === 'active' ? theme.success : theme.warning 
                        }
                      ]}
                    >
                      {activeTab === 'active' ? 'Active until:' : 'Awaiting Approval'}
                    </Text>
                  </View>
                  
                  {activeTab === 'active' && subscription.expiryDate && (
                    <Text style={[styles.expiryDate, { color: theme.text }]}>
                      {formatDate(subscription.expiryDate)}
                    </Text>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  {activeTab === 'pending' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleVerifySubscription(subscription._id)}
                      >
                        <FontAwesome5 name="check" size={14} color="white" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectSubscription(subscription._id)}
                      >
                        <FontAwesome5 name="times" size={14} color="white" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelSubscription(subscription._id)}
                    >
                      <FontAwesome5 name="ban" size={14} color="white" style={styles.actionIcon} />
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isVisible={verifyModalVisible}
        onClose={() => setVerifyModalVisible(false)}
        onConfirm={confirmVerifySubscription}
        title="Verify Subscription"
        message="Are you sure you want to verify this subscription? This will grant the user access to the subscription features."
        confirmText="Verify"
        cancelText="Cancel"
        isLoading={actionLoading}
        confirmButtonColor="#34A853"
        theme={theme}
      />

      <ConfirmationModal
        isVisible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        onConfirm={confirmRejectSubscription}
        title="Reject Subscription"
        message="Are you sure you want to reject this subscription? This will deny the user access to the subscription features."
        confirmText="Reject"
        cancelText="Cancel"
        isLoading={actionLoading}
        confirmButtonColor="#FF3B30"
        theme={theme}
      />

      <ConfirmationModal
        isVisible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel this subscription? This will immediately revoke the user's access to the subscription features."
        confirmText="Cancel Subscription"
        cancelText="Keep Active"
        isLoading={actionLoading}
        confirmButtonColor="#FF3B30"
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4B6BFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  activeTab: {
    borderWidth: 0,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionsList: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  subscriptionCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentReference: {
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#34A853',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#FF9500',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
}); 