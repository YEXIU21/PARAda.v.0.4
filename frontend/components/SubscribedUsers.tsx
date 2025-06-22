import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllSubscriptions, approveSubscriptionByReference, verifySubscription, cancelSubscription, getPendingSubscriptions, adminPendingSubscriptions, getVerifiedSubscriptions } from '../services/api/subscription.api';
import { initializeSocket } from '../services/socket/socket.service';
import { subscribeToSubscriptionEvents, unsubscribeFromSubscriptionEvents, subscribeToAdminEvents, unsubscribeFromAdminEvents } from '../services/socket/subscription.socket';

const { width } = Dimensions.get('window');

// Filter states for the subscription view
enum FilterState {
  PENDING_ONLY = 'pending',
  ALL_SUBSCRIPTIONS = 'all',
  VERIFIED_ONLY = 'verified'
}

interface SubscribedUser {
  _id?: string;
  userId?: string;
  type: string;
  plan: string;
  expiryDate: string;
  referenceNumber: string;
  paymentDate: string;
  username: string;
  busCompany: string;
  verified: boolean;
}

interface SubscribedUsersProps {
  isDarkMode: boolean;
  theme: {
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    gradientColors: [string, string];
  };
  initialPendingFilter?: boolean;
}

export default function SubscribedUsers({ isDarkMode, theme, initialPendingFilter = false }: SubscribedUsersProps) {
  const [subscribedUsers, setSubscribedUsers] = useState<SubscribedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(
    initialPendingFilter ? FilterState.PENDING_ONLY : FilterState.ALL_SUBSCRIPTIONS
  );
  const [socketConnected, setSocketConnected] = useState(false);

  // Load initial data
  useEffect(() => {
    loadSubscribedUsers();
    setupSocketConnection();
    
    // Cleanup socket connection when component unmounts
    return () => {
      cleanupSocketConnection();
    };
  }, [filterState]);

  // Setup socket connection
  const setupSocketConnection = async () => {
    try {
      await initializeSocket();
      setSocketConnected(true);
      
      // Subscribe to admin events to receive all subscription updates
      subscribeToAdminEvents();
      
      // Subscribe to specific subscription events
      subscribeToSubscriptionEvents(
        handleSubscriptionCreated,
        handleSubscriptionUpdated,
        handleSubscriptionVerified,
        handleSubscriptionCancelled,
        handleSubscriptionExpired
      );
      
      console.log('Socket connection and event subscriptions set up');
    } catch (error) {
      console.error('Failed to set up socket connection:', error);
      setSocketConnected(false);
    }
  };

  // Cleanup socket connection
  const cleanupSocketConnection = () => {
    unsubscribeFromSubscriptionEvents(
      handleSubscriptionCreated,
      handleSubscriptionUpdated,
      handleSubscriptionVerified,
      handleSubscriptionCancelled,
      handleSubscriptionExpired
    );
    
    unsubscribeFromAdminEvents();
  };

  // Socket event handlers
  const handleSubscriptionCreated = useCallback((subscription: any) => {
    console.log('Subscription created event received:', subscription);
    
    // Only update if we're showing all subscriptions
    if (filterState === FilterState.ALL_SUBSCRIPTIONS) {
      setSubscribedUsers(prev => {
        // Transform the subscription to match our component's format
        const newSubscription = transformSubscription(subscription);
        
        // Add to the list if it doesn't exist already
        if (!prev.some(sub => sub._id === newSubscription._id)) {
          return [...prev, newSubscription];
        }
        return prev;
      });
    }
  }, [filterState]);

  const handleSubscriptionUpdated = useCallback((subscription: any) => {
    console.log('Subscription updated event received:', subscription);
    
    setSubscribedUsers(prev => {
      // Transform the subscription to match our component's format
      const updatedSubscription = transformSubscription(subscription);
      
      // Replace the existing subscription with the updated one
      return prev.map(sub => 
        sub._id === updatedSubscription._id ? updatedSubscription : sub
      );
    });
  }, []);

  const handleSubscriptionVerified = useCallback((subscription: any) => {
    console.log('Subscription verified event received:', subscription);
    
    setSubscribedUsers(prev => {
      // If we're showing pending only, remove the verified subscription
      if (filterState === FilterState.PENDING_ONLY) {
        return prev.filter(sub => sub._id !== subscription._id);
      }
      
      // If we're showing verified only, add the subscription
      if (filterState === FilterState.VERIFIED_ONLY) {
        const verifiedSubscription = transformSubscription(subscription);
        if (!prev.some(sub => sub._id === verifiedSubscription._id)) {
          return [...prev, verifiedSubscription];
        }
      }
      
      // If we're showing all, update the subscription
      return prev.map(sub => 
        sub._id === subscription._id ? { ...sub, verified: true } : sub
      );
    });
  }, [filterState]);

  const handleSubscriptionCancelled = useCallback((subscription: any) => {
    console.log('Subscription cancelled event received:', subscription);
    
    // Remove the cancelled subscription from the list
    setSubscribedUsers(prev => 
      prev.filter(sub => sub._id !== subscription._id)
    );
  }, []);

  const handleSubscriptionExpired = useCallback((subscription: any) => {
    console.log('Subscription expired event received:', subscription);
    
    // Update the expired subscription
    setSubscribedUsers(prev => 
      prev.map(sub => 
        sub._id === subscription._id ? { ...sub, expired: true } : sub
      )
    );
  }, []);

  // Helper function to transform subscription data
  const transformSubscription = (subscription: any): SubscribedUser => {
    return {
      _id: subscription._id,
      userId: subscription.userId?._id || subscription.userId,
      type: subscription.type || 'Unknown',
      plan: subscription.planId || 'Unknown',
      expiryDate: subscription.expiryDate ? new Date(subscription.expiryDate).toISOString().split('T')[0] : 'Unknown',
      referenceNumber: subscription.paymentDetails?.referenceNumber || 'Unknown',
      paymentDate: subscription.paymentDetails?.paymentDate ? 
        new Date(subscription.paymentDetails.paymentDate).toISOString().split('T')[0] : 'Unknown',
      username: subscription.userId?.username || 'User',
      busCompany: subscription.type || 'Unknown',
      verified: subscription.verification?.verified || false
    };
  };

  const loadSubscribedUsers = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching ${filterState} subscriptions...`);
      
      let subscriptions;
      
      // Choose which API to call based on the filter state
      switch (filterState) {
        case FilterState.PENDING_ONLY:
          subscriptions = await adminPendingSubscriptions();
          break;
        case FilterState.VERIFIED_ONLY:
          subscriptions = await getVerifiedSubscriptions();
          break;
        case FilterState.ALL_SUBSCRIPTIONS:
        default:
          subscriptions = await getAllSubscriptions();
          break;
      }
      
      console.log('Loaded subscriptions:', subscriptions);
      
      if (subscriptions && subscriptions.length > 0) {
        // Transform the MongoDB subscription data to match our component's expected format
        const subscribers: SubscribedUser[] = subscriptions.map((sub: any) => transformSubscription(sub));
        
        console.log('Transformed subscribers:', subscribers);
        setSubscribedUsers(subscribers);
      } else {
        // No subscribers found, set empty array
        console.log('No subscriptions found, setting empty array');
        setSubscribedUsers([]);
      }
    } catch (error: any) {
      console.error('Error loading subscribed users:', error);
      
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
        console.error('Response error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error message:', error.message);
      }
      
      // Show error but don't use mock data
      Alert.alert('Error', `Failed to load subscription data: ${error.message || 'Unknown error'}`);
      setSubscribedUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSubscribedUsers();
  };

  const handleVerifySubscription = async (referenceNumber: string) => {
    try {
      const userToVerify = subscribedUsers.find(user => user.referenceNumber === referenceNumber);
      
      if (!userToVerify || !userToVerify.userId) {
        Alert.alert('Error', 'Could not find user information for this subscription');
        return;
      }
      
      // Call the API to approve the subscription
      await approveSubscriptionByReference(userToVerify.userId, referenceNumber);
      
      // Update the local state
      const updatedUsers = subscribedUsers.map(user => 
        user.referenceNumber === referenceNumber 
          ? { ...user, verified: true } 
          : user
      );
      
      setSubscribedUsers(updatedUsers);
      Alert.alert('Success', 'Subscription has been verified');
      
      // Reload subscriptions to get fresh data
      loadSubscribedUsers();
    } catch (error) {
      console.error('Error verifying subscription:', error);
      Alert.alert('Error', 'Failed to verify subscription');
    }
  };

  const handleCancelSubscription = (referenceNumber: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              const userToCancel = subscribedUsers.find(user => user.referenceNumber === referenceNumber);
              
              if (!userToCancel || !userToCancel._id) {
                Alert.alert('Error', 'Could not find subscription information');
                return;
              }
              
              // Call the API to cancel the subscription
              await cancelSubscription(userToCancel._id);
              
              // Remove subscription from state
              const updatedUsers = subscribedUsers.filter(
                user => user.referenceNumber !== referenceNumber
              );
              setSubscribedUsers(updatedUsers);
              
              Alert.alert('Success', 'Subscription has been cancelled');
              
              // Reload subscriptions to get fresh data
              loadSubscribedUsers();
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const toggleUserDetails = (referenceNumber: string) => {
    if (selectedUser === referenceNumber) {
      setSelectedUser(null);
    } else {
      setSelectedUser(referenceNumber);
    }
  };

  // Cycle through filter states: Pending -> All -> Verified -> Pending
  const cycleFilterState = () => {
    switch (filterState) {
      case FilterState.PENDING_ONLY:
        setFilterState(FilterState.ALL_SUBSCRIPTIONS);
        break;
      case FilterState.ALL_SUBSCRIPTIONS:
        setFilterState(FilterState.VERIFIED_ONLY);
        break;
      case FilterState.VERIFIED_ONLY:
        setFilterState(FilterState.PENDING_ONLY);
        break;
    }
  };

  // Get filter button properties based on current state
  const getFilterButtonProps = () => {
    switch (filterState) {
      case FilterState.PENDING_ONLY:
        return {
          color: '#FF9500',
          icon: 'clock',
          text: 'Pending Only'
        };
      case FilterState.ALL_SUBSCRIPTIONS:
        return {
          color: '#4B6BFE',
          icon: 'check-circle',
          text: 'All Subscriptions'
        };
      case FilterState.VERIFIED_ONLY:
        return {
          color: '#4CAF50',
          icon: 'shield-alt',
          text: 'Verified Only'
        };
      default:
        return {
          color: '#FF9500',
          icon: 'clock',
          text: 'Pending Only'
        };
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.card }]}>
        <ActivityIndicator size="large" color="#4B6BFE" />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading subscribers...</Text>
      </View>
    );
  }

  const filterDescription = filterState === FilterState.PENDING_ONLY ? 'pending' : 
                           filterState === FilterState.VERIFIED_ONLY ? 'verified' : 'active';
  const filterButtonProps = getFilterButtonProps();

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <LinearGradient
        colors={theme.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Subscribed Users</Text>
            <Text style={styles.headerSubtitle}>
              {subscribedUsers.length} {filterDescription} subscribers
              {socketConnected && <Text style={styles.realtimeText}> • Real-time</Text>}
            </Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <FontAwesome5 
                name="sync" 
                size={16} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: filterButtonProps.color }
              ]}
              onPress={cycleFilterState}
            >
              <FontAwesome5 
                name={filterButtonProps.icon} 
                size={14} 
                color="white" 
              />
              <Text style={styles.filterButtonText}>
                {filterButtonProps.text}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {subscribedUsers.length > 0 ? (
        <FlatList
          data={subscribedUsers}
          keyExtractor={(item) => item.referenceNumber}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.userCard,
                { 
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                  borderColor: theme.border
                }
              ]}
              onPress={() => toggleUserDetails(item.referenceNumber)}
              activeOpacity={0.8}
            >
              <View style={styles.userCardHeader}>
                <View style={[styles.planBadge, { 
                  backgroundColor: 
                    item.plan === 'premium' ? '#4B6BFE' : 
                    item.plan === 'annual' ? '#34A853' : '#FF9500'
                }]}>
                  <Text style={styles.planText}>
                    {item.plan.charAt(0).toUpperCase() + item.plan.slice(1)}
                  </Text>
                </View>
                
                <View style={styles.statusContainer}>
                  {item.verified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#4CAF50' }]}>
                      <FontAwesome5 name="check" size={10} color="white" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={[styles.pendingBadge, { backgroundColor: '#FF9500' }]}>
                      <FontAwesome5 name="clock" size={10} color="white" />
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.userInfo}>
                <View style={styles.userInfoRow}>
                  <FontAwesome5 name="user" size={14} color={isDarkMode ? '#BBB' : '#555'} style={styles.infoIcon} />
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {item.username}
                  </Text>
                </View>
                
                <View style={styles.userInfoRow}>
                  <FontAwesome5 
                    name="calendar-alt"
                    size={14} 
                    color={isDarkMode ? '#BBB' : '#555'} 
                    style={styles.infoIcon} 
                  />
                  <Text style={[styles.companyText, { color: theme.textSecondary }]}>
                    Expires: {item.expiryDate}
                  </Text>
                </View>
              </View>
              
              {selectedUser === item.referenceNumber && (
                <View style={[styles.detailsContainer, { borderTopColor: theme.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Reference:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.referenceNumber}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Payment Date:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.paymentDate}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Expiry Date:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.expiryDate}</Text>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    {!item.verified && (
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={() => handleVerifySubscription(item.referenceNumber)}
                      >
                        <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.verifyButtonText}>Verify</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelSubscription(item.referenceNumber)}
                    >
                      <FontAwesome5 name="times-circle" size={16} color="#FF3B30" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <View style={styles.cardFooter}>
                <FontAwesome5 
                  name={selectedUser === item.referenceNumber ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color={theme.textSecondary} 
                />
                <Text style={[styles.viewDetailsText, { color: theme.textSecondary }]}>
                  {selectedUser === item.referenceNumber ? "Hide Details" : "View Details"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          refreshing={isLoading}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome5 
            name={filterState === FilterState.PENDING_ONLY ? "clock" : filterState === FilterState.VERIFIED_ONLY ? "shield-alt" : "users-slash"} 
            size={50} 
            color={theme.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {filterState === FilterState.PENDING_ONLY ? 'No pending subscriptions' : filterState === FilterState.VERIFIED_ONLY ? 'No verified subscriptions' : 'No subscribers found'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            {filterState === FilterState.PENDING_ONLY 
              ? 'All subscriptions have been processed' 
              : filterState === FilterState.VERIFIED_ONLY 
                ? 'No subscriptions have been verified yet' 
              : 'When passengers subscribe to the service, they will appear here'}
          </Text>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme.gradientColors[0] }]}
            onPress={handleRefresh}
          >
            <FontAwesome5 name="sync" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  planText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  userInfo: {
    padding: 15,
    paddingTop: 0,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  companyText: {
    fontSize: 14,
  },
  detailsContainer: {
    padding: 15,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
  },
  verifyButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4CAF50',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  cancelButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FF3B30',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  viewDetailsText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 140,
  },
  filterButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 12,
    color: 'white',
    flexShrink: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realtimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic'
  },
}); 