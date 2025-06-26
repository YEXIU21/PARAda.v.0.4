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
import { getSubscriptions, verifySubscription, cancelSubscription, rejectSubscription } from '../../services/api/admin.api';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmationModal from '../../components/ConfirmationModal';
import { defaultSubscriptionPlans } from '../../constants/SubscriptionPlans';

// Define interfaces for API data
interface Subscription {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  planId: string;
  planName?: string;
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
  displayName?: string;
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
      await verifySubscription(selectedSubscriptionId);
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
      await rejectSubscription(selectedSubscriptionId);
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

  // Get proper plan name based on plan ID
  const getPlanName = (planId: string) => {
    // First check if it's a MongoDB ID format (like 685db8517f982c2bfaa1d1bd)
    if (planId && planId.length === 24 && /^[0-9a-f]{24}$/i.test(planId)) {
      // Try to find this subscription in the subscriptions list
      const subscription = subscriptions.find(sub => sub._id === planId || sub.planId === planId);
      if (subscription) {
        // Check for planName field first (from backend)
        if (subscription.planName) {
          return subscription.planName;
        }
        // Check for displayName field as fallback
        if (subscription.displayName) {
          return subscription.displayName;
        }
      }
    }
    
    // If not found or not a MongoDB ID, use standard plan names
    switch (planId.toLowerCase()) {
      case 'basic':
        return 'Basic Plan';
      case 'premium':
        return 'Premium Plan';
      case 'annual':
        return 'Annual Plan';
      default:
        return planId.charAt(0).toUpperCase() + planId.slice(1);
    }
  };

  // Filter subscriptions based on search text
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    const username = subscription.userId?.username?.toLowerCase() || '';
    const email = subscription.userId?.email?.toLowerCase() || '';
    const reference = subscription.paymentDetails?.referenceNumber?.toLowerCase() || '';
    
    return username.includes(searchLower) ||
           email.includes(searchLower) ||
           reference.includes(searchLower);
  });

  const renderSubscriptionCard = (subscription: Subscription) => {
    return (
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
              {subscription.planName || getPlanName(subscription.planId)}
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

        <View style={styles.subscriptionDetails}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar-alt" size={16} color={theme.primary} style={styles.icon} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Expires: {formatDate(subscription.expiryDate)}
            </Text>
          </View>
          
          {subscription.paymentDetails?.referenceNumber && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="receipt" size={16} color={theme.primary} style={styles.icon} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                Ref: {subscription.paymentDetails.referenceNumber}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.subscriptionStatus}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Status:</Text>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: subscription.verification?.verified 
                ? '#4CAF50' 
                : subscription.isActive 
                  ? '#2196F3' 
                  : '#FF9800'
            }
          ]}>
            <Text style={styles.statusText}>
              {subscription.verification?.verified 
                ? 'Verified' 
                : subscription.isActive 
                  ? 'Active' 
                  : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {!subscription.verification?.verified && (
            <TouchableOpacity
              style={[styles.actionButton, styles.verifyButton]}
              onPress={() => handleVerifySubscription(subscription._id)}
            >
              <FontAwesome5 name="check-circle" size={16} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
          
          {!subscription.verification?.verified && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectSubscription(subscription._id)}
            >
              <FontAwesome5 name="times-circle" size={16} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          )}
          
          {subscription.isActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelSubscription(subscription._id)}
            >
              <FontAwesome5 name="ban" size={16} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
            filteredSubscriptions.map((subscription) => renderSubscriptionCard(subscription))
          )}
        </ScrollView>

        {/* Confirmation Modals */}
        <ConfirmationModal
          visible={verifyModalVisible}
          title="Verify Subscription"
          message="Are you sure you want to verify this subscription? This will grant the user access to subscription features."
          confirmText="Verify"
          cancelText="Cancel"
          confirmColor={theme.success}
          cancelColor={theme.textSecondary}
          icon="check-circle"
          iconColor={theme.success}
          onConfirm={confirmVerifySubscription}
          onCancel={() => {
            setVerifyModalVisible(false);
            setSelectedSubscriptionId(null);
          }}
          isLoading={actionLoading}
          theme={theme}
        />
        
        <ConfirmationModal
          visible={rejectModalVisible}
          title="Reject Subscription"
          message="Are you sure you want to reject this subscription? The user will be notified that their payment was rejected."
          confirmText="Reject"
          cancelText="Cancel"
          confirmColor={theme.warning}
          cancelColor={theme.textSecondary}
          icon="ban"
          iconColor={theme.warning}
          onConfirm={confirmRejectSubscription}
          onCancel={() => {
            setRejectModalVisible(false);
            setSelectedSubscriptionId(null);
          }}
          isLoading={actionLoading}
          theme={theme}
        />
        
        <ConfirmationModal
          visible={cancelModalVisible}
          title="Cancel Subscription"
          message="Are you sure you want to cancel this subscription? This will immediately revoke the user's access to subscription features."
          confirmText="Cancel"
          cancelText="Go Back"
          confirmColor={theme.error}
          cancelColor={theme.textSecondary}
          icon="times-circle"
          iconColor={theme.error}
          onConfirm={confirmCancelSubscription}
          onCancel={() => {
            setCancelModalVisible(false);
            setSelectedSubscriptionId(null);
          }}
          isLoading={actionLoading}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
  },
  tabText: {
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  userEmail: {
    fontSize: 14,
  },
  subscriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
  },
  subscriptionStatus: {
    marginTop: 8,
    marginBottom: 12,
  },
  statusLabel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#FF5733',
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4B6BFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  subscriptionsList: {
    flex: 1,
  },
}); 