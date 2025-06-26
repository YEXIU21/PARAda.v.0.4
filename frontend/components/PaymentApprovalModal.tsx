import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionId } from '../constants/SubscriptionPlans';
import { getPendingSubscriptions, approveSubscriptionByReference, verifySubscription } from '../services/api/subscription.api';
import { BASE_URL } from '../services/api/api.config';

interface PendingPayment {
  id: string;
  userId: string;
  username: string;
  email: string;
  referenceNumber: string;
  planId: SubscriptionId;
  planName: string;
  price: string;
  vehicleType: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PaymentApprovalModalProps {
  isVisible: boolean;
  onClose: () => void;
  theme: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    gradientColors: [string, string];
    error: string;
    success: string;
    warning: string;
  };
  isDarkMode: boolean;
}

export default function PaymentApprovalModal({
  isVisible,
  onClose,
  theme,
  isDarkMode
}: PaymentApprovalModalProps) {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approvedRefs, setApprovedRefs] = useState<string[]>([]);

  // Load pending payments from AsyncStorage
  useEffect(() => {
    if (isVisible) {
      loadPendingPayments();
    }
  }, [isVisible]);

  // Get proper plan name based on plan ID
  const getPlanName = (planId: string) => {
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

  const loadPendingPayments = async () => {
    setIsLoading(true);
    try {
      // Get all keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter keys that start with 'payment_' (these are the payment references)
      const paymentKeys = keys.filter(key => key.startsWith('payment_'));
      
      if (paymentKeys.length > 0) {
        // Get all payment data
        const paymentValues = await AsyncStorage.multiGet(paymentKeys);
        
        // Get user subscription data to check if payments are already approved
        const userSubData = await AsyncStorage.getItem('userSubscription');
        let approvedRefs: string[] = [];
        
        if (userSubData) {
          const userData = JSON.parse(userSubData);
          if (userData.referenceNumber) {
            approvedRefs.push(userData.referenceNumber);
          }
        }
        
        // Process payment data
        const payments: PendingPayment[] = [];
        
        for (const [key, value] of paymentValues) {
          if (value) {
            try {
              // Extract plan ID from key (format: payment_planId_timestamp)
              const keyParts = key.split('_');
              const planId = keyParts[1] as SubscriptionId;
              const timestamp = keyParts[2];
              
              // Parse the JSON payment data
              const paymentData = JSON.parse(value);
              
              // Check if this reference is already approved
              const status = approvedRefs.includes(paymentData.referenceNumber) 
                ? 'approved' 
                : 'pending';
              
              // Vehicle type to display for the payment
              const vehicleType = paymentData.type || 'latransco';
              
              payments.push({
                id: key,
                userId: `user_${Math.floor(Math.random() * 1000)}`, // Mock user ID
                username: paymentData.username || 'Unknown User',
                email: `${paymentData.username?.toLowerCase() || 'user'}@example.com`, // Mock email
                referenceNumber: paymentData.referenceNumber,
                planId,
                planName: getPlanName(planId),
                price: planId === 'basic' ? '₱99' : planId === 'premium' ? '₱199' : '₱999',
                vehicleType,
                timestamp: new Date(parseInt(timestamp)).toLocaleString(),
                status
              });
            } catch (e) {
              console.error('Error parsing payment data:', e);
              // If we can't parse the payment data as JSON, try the old format
              try {
                // Extract plan ID from key (format: payment_planId_timestamp)
                const keyParts = key.split('_');
                const planId = keyParts[1] as SubscriptionId;
                const timestamp = keyParts[2];
                
              // Reference number is stored as the value
              const referenceNumber = value;
              
              // Check if this reference is already approved
              const status = approvedRefs.includes(referenceNumber) 
                ? 'approved' 
                : 'pending';
              
              // Mock user data (in a real app, you would fetch this from a database)
              const userId = `user_${Math.floor(Math.random() * 1000)}`;
              const username = `User_${userId.split('_')[1]}`;
              const email = `${username.toLowerCase()}@example.com`;
              
              payments.push({
                id: key,
                userId,
                username,
                email,
                referenceNumber,
                planId,
                planName: getPlanName(planId),
                price: planId === 'basic' ? '₱99' : planId === 'premium' ? '₱199' : '₱999',
                vehicleType: 'latransco', // Default vehicle type for old format
                timestamp: new Date(parseInt(timestamp)).toLocaleString(),
                status
              });
            } catch (e) {
                console.error('Error handling payment in old format:', e);
              }
            }
          }
        }
        
        setPendingPayments(payments);
      } else {
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
      Alert.alert('Error', 'Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayment = async (payment: PendingPayment) => {
    Alert.alert(
      'Approve Payment',
      `Are you sure you want to approve payment with reference number ${payment.referenceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              // First, try to approve the payment via the API
              try {
                await approveSubscriptionByReference(payment.userId, payment.referenceNumber);
                console.log('Subscription approved via API');
              } catch (apiError) {
                console.warn('API approval failed, using AsyncStorage fallback:', apiError);
                
                // Fallback to AsyncStorage for demo/testing purposes
              const now = new Date();
              const expiry = new Date(now);
              expiry.setDate(expiry.getDate() + (payment.planId === 'annual' ? 365 : 30));
              
              const subscriptionData = {
                username: payment.username,
                type: payment.vehicleType,
                busCompany: payment.vehicleType, // Store the vehicle type as bus company
                plan: payment.planId,
                expiryDate: expiry.toISOString(),
                referenceNumber: payment.referenceNumber,
                paymentDate: now.toISOString(),
                approved: true,
                approvedDate: now.toISOString(),
                verified: true
              };
              
              // Save the approved subscription
              await AsyncStorage.setItem('userSubscription', JSON.stringify(subscriptionData));
              }
              
              // Update the payment status in our local state
              const updatedPayments = pendingPayments.map(p => 
                p.id === payment.id ? { ...p, status: 'approved' as const } : p
              );
              
              setPendingPayments(updatedPayments);
              
              Alert.alert('Success', 'Payment has been approved and subscription activated');
            } catch (error) {
              console.error('Error approving payment:', error);
              Alert.alert('Error', 'Failed to approve payment');
            }
          }
        }
      ]
    );
  };

  const handleRejectPayment = async (payment: PendingPayment) => {
    Alert.alert(
      'Reject Payment',
      `Are you sure you want to reject payment with reference number ${payment.referenceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would update the backend database
              // Here we'll just mark the payment as rejected in our local state
              
              // Update the payment status in our local state
              const updatedPayments = pendingPayments.map(p => 
                p.id === payment.id ? { ...p, status: 'rejected' as const } : p
              );
              
              setPendingPayments(updatedPayments);
              
              Alert.alert('Payment Rejected', 'The payment has been rejected');
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert('Error', 'Failed to reject payment');
            }
          }
        }
      ]
    );
  };

  const renderPaymentItem = ({ item }: { item: PendingPayment }) => {
    const statusColors = {
      pending: theme.warning,
      approved: theme.success,
      rejected: theme.error
    };
    
    return (
      <View style={[styles.paymentCard, { 
        backgroundColor: isDarkMode ? '#2A2A2A' : '#f8f8f8',
        borderLeftColor: statusColors[item.status],
        borderLeftWidth: 4
      }]}>
        <View style={styles.paymentHeader}>
          <View style={[styles.planBadge, { 
            backgroundColor: 
              item.planId === 'premium' ? '#4B6BFE' : 
              item.planId === 'annual' ? '#34A853' : '#FF9500'
          }]}>
            <Text style={styles.planBadgeText}>{item.planName}</Text>
          </View>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
        
        <Text style={[styles.refNumber, { color: theme.text }]}>
          Ref: {item.referenceNumber}
        </Text>
        
        <Text style={[styles.userInfo, { color: theme.textSecondary }]}>
          {item.username} ({item.email})
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Amount:</Text>
          <Text style={[styles.priceValue, { color: theme.text }]}>{item.price}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprovePayment(item)}
            >
              <FontAwesome5 name="check-circle" size={16} color="white" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectPayment(item)}
            >
              <FontAwesome5 name="times-circle" size={16} color="white" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  const filteredPayments = pendingPayments.filter(payment => payment.status === activeTab);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContainer, { 
          backgroundColor: theme.card,
          borderColor: theme.border
        }]}>
          <LinearGradient
            colors={theme.gradientColors}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Payment Approvals</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'pending' && [styles.activeTab, { borderBottomColor: theme.warning }]
              ]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'pending' ? theme.warning : theme.textSecondary }
              ]}>
                Pending
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'approved' && [styles.activeTab, { borderBottomColor: theme.success }]
              ]}
              onPress={() => setActiveTab('approved')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'approved' ? theme.success : theme.textSecondary }
              ]}>
                Approved
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'rejected' && [styles.activeTab, { borderBottomColor: theme.error }]
              ]}
              onPress={() => setActiveTab('rejected')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'rejected' ? theme.error : theme.textSecondary }
              ]}>
                Rejected
              </Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4B6BFE" />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading payments...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredPayments}
              keyExtractor={(item) => item.id}
              renderItem={renderPaymentItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <FontAwesome5 
                    name={
                      activeTab === 'pending' ? 'hourglass' : 
                      activeTab === 'approved' ? 'check-circle' : 'times-circle'
                    } 
                    size={40} 
                    color={isDarkMode ? '#444' : '#DDD'} 
                  />
                  <Text style={[styles.emptyText, { color: theme.text }]}>
                    No {activeTab} payments found
                  </Text>
                </View>
              }
            />
          )}
          
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={loadPendingPayments}
          >
            <FontAwesome5 name="sync" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Refresh Payments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  refNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 