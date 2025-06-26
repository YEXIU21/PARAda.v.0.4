import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  Image,
  TextInput
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getSubscriptionPlans } from '../services/api/subscription.api';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSubscription } from '../services/api/subscription.api';

interface SubscriptionPlan {
  id: string;
  planId?: string; // Backend planId field
  _id?: string;    // MongoDB ID field
  name: string;
  price: number;
  duration: number;
  features: string[];
  recommended?: boolean;
}

// Default subscription plans to use as fallback
const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: 199,
    duration: 30,
    features: [
      'Access to all basic routes',
      'Unlimited rides during operating hours',
      'Real-time vehicle tracking',
      'Monthly billing'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pass',
    price: 499,
    duration: 90,
    features: [
      'All Monthly Pass features',
      'Priority boarding',
      'Discounted fare for premium routes',
      'Save 16% compared to monthly'
    ],
    recommended: true
  },
  {
    id: 'annual',
    name: 'Annual Pass',
    price: 1799,
    duration: 365,
    features: [
      'All Quarterly Pass features',
      'VIP access to premium routes',
      'Free companion pass on weekends',
      'Save 25% compared to monthly'
    ]
  }
];

interface PassengerSubscriptionPlansProps {
  theme: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    error: string;
    success: string;
    warning: string;
    gradientColors?: [string, string];
  };
}

const PassengerSubscriptionPlans: React.FC<PassengerSubscriptionPlansProps> = ({ theme }) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(defaultSubscriptionPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Add new states for GCash payment modal
  const [showGCashModal, setShowGCashModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  // Function to validate and normalize subscription plans
  const validateAndNormalizePlans = (plans: any[]): SubscriptionPlan[] => {
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      return [];
    }
    
    // Validate that each plan has the required fields
    const validPlans = plans.filter(plan => 
      plan && 
      typeof plan === 'object' && 
      (plan.id || plan.planId || plan._id) && 
      plan.name && 
      (typeof plan.price === 'number' || typeof plan.price === 'string') && 
      (typeof plan.duration === 'number' || typeof plan.duration === 'string') && 
      Array.isArray(plan.features)
    );
    
    if (validPlans.length === 0) {
      return [];
    }
    
    // Convert string prices to numbers if needed and ensure consistent id field
    return validPlans.map(plan => ({
      ...plan,
      // Ensure we have an id field that's used consistently in the UI
      id: plan.id || plan.planId || (plan._id ? String(plan._id) : `plan-${Math.random().toString(36).substring(2, 9)}`),
      // Keep original IDs for API interaction
      planId: plan.planId,
      _id: plan._id,
      price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
      duration: typeof plan.duration === 'string' ? parseInt(plan.duration, 10) : plan.duration
    }));
  };

  const fetchSubscriptionPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get cached plans first for immediate display
      try {
        const cachedPlans = await AsyncStorage.getItem('subscriptionPlans');
        if (cachedPlans) {
          const parsedPlans = JSON.parse(cachedPlans);
          const validCachedPlans = validateAndNormalizePlans(parsedPlans);
          if (validCachedPlans.length > 0) {
            console.log('Using cached subscription plans while fetching fresh data');
            setSubscriptionPlans(validCachedPlans);
            // Don't set isLoading to false yet, continue fetching fresh data
          }
        }
      } catch (storageError) {
        console.error('Error reading from AsyncStorage:', storageError);
      }
      
      // Try to get plans from public API
      try {
        const publicPlans = await getSubscriptionPlans();
        
        // Debug: Log the format of plans from API
        if (publicPlans && publicPlans.length > 0) {
          console.log('DEBUG - Subscription plan format from API:', JSON.stringify(publicPlans[0], null, 2));
          console.log('Plan IDs - Standard format:', publicPlans.map(p => p.id));
          console.log('Plan IDs - MongoDB format:', publicPlans.map(p => p._id));
          console.log('Plan IDs - Backend format:', publicPlans.map(p => p.planId));
        }
        
        const validPublicPlans = validateAndNormalizePlans(publicPlans);
        
        if (validPublicPlans.length > 0) {
          console.log('Successfully fetched subscription plans from public API:', validPublicPlans);
          setSubscriptionPlans(validPublicPlans);
          
          // Cache the plans for offline use
          try {
            await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(validPublicPlans));
          } catch (cacheError) {
            console.error('Error caching subscription plans:', cacheError);
          }
          
          setIsLoading(false);
          return; // Exit if we got plans from public API
        }
      } catch (publicApiError) {
        console.error('Error fetching from public API:', publicApiError);
        // Continue with default plans if public API fails
      }
      
      // If API didn't return valid plans, use default plans
      console.log('API did not return valid plans, using default plans');
      setSubscriptionPlans(defaultSubscriptionPlans);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
      console.error('Error in fetchSubscriptionPlans:', err);
      // Ensure we always have plans to display
      setSubscriptionPlans(defaultSubscriptionPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    // Check if the user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to subscribe to a plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    // Set the selected plan for payment and show payment modal
    setSelectedPlanForPayment(plan);
    setShowGCashModal(true);
  };
  
  // Add a new function to handle payment submission
  const handlePaymentSubmit = async () => {
    // Reset any previous errors
    setPaymentError(null);
    
    if (!referenceNumber.trim()) {
      setPaymentError('Please enter the reference number from your GCash payment');
      return;
    }

    if (referenceNumber.length < 8) {
      setPaymentError('Please enter a valid reference number (at least 8 characters)');
      return;
    }
    
    if (!selectedPlanForPayment) {
      setPaymentError('No plan selected. Please try again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create local subscription data first to ensure it gets saved even if API fails
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + (selectedPlanForPayment.duration || 30));
      
      const subscriptionDataLocal = {
        username: user?.username || 'User',
        type: 'all',
        plan: selectedPlanForPayment.id,
        expiryDate: expiry.toISOString(),
        referenceNumber: referenceNumber,
        paymentDate: now.toISOString(),
        approved: false,
        verified: false
      };
      
      // Always store in AsyncStorage first before attempting API call
      await AsyncStorage.setItem('userSubscription', JSON.stringify(subscriptionDataLocal));
      console.log('Subscription saved to AsyncStorage');
      
      // Prepare API subscription data
      const subscriptionData = {
        planId: selectedPlanForPayment.id,
        type: 'all', // Use 'all' to allow access to all vehicle types
        referenceNumber: referenceNumber,
        paymentMethod: 'gcash',
        autoRenew: false,
        studentDiscount: {
          applied: user?.accountType === 'student',
          percentage: 20 // Default student discount percentage
        },
        // Include user information for public API
        username: user?.username || 'Guest User',
        email: user?.email || '',
        duration: selectedPlanForPayment.duration,
        amount: selectedPlanForPayment.price
      };
      
      // Try to use the backend API for creating a subscription
      let backendSubscriptionCreated = false;
      let subscriptionResponse = null;
      
      try {
        // The API will automatically determine whether to use public or authenticated endpoint
        subscriptionResponse = await createSubscription(subscriptionData);
        console.log('Subscription created successfully via API:', subscriptionResponse);
        backendSubscriptionCreated = true;
      } catch (apiError) {
        console.error('Error creating subscription via API:', apiError);
        // We'll continue with the local storage approach
        backendSubscriptionCreated = false;
      }
      
      // Payment submitted successfully
      Alert.alert(
        'Payment Submitted',
        backendSubscriptionCreated
          ? 'Your payment reference has been submitted and is pending admin approval. Your subscription will be activated once approved.'
          : 'Your payment has been recorded locally. You may need to show your GCash receipt to an admin for verification.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Close payment modal
            setShowGCashModal(false);
            // Reset states
            setReferenceNumber('');
            setSelectedPlanForPayment(null);
            setIsProcessingPayment(false);
            
            // Navigate back to home screen
            router.push('/(tabs)');
          }
        }]
      );
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError('An error occurred saving your payment information. Please try again or contact support.');
      setIsProcessingPayment(false);
    }
  };

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <FontAwesome5 name="check-circle" size={16} color={theme.success} style={styles.featureIcon} />
      <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
    </View>
  );

  if (isLoading && subscriptionPlans.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading subscription plans...</Text>
      </View>
    );
  }
  
  if (error && subscriptionPlans.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <FontAwesome5 name="exclamation-circle" size={50} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchSubscriptionPlans}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Ensure we have plans to display
  // Only use real subscription plans from the API, not the default plans
  // This ensures that if admin created only one plan, only one plan will be shown
  const plansToDisplay = Array.isArray(subscriptionPlans) && subscriptionPlans.length > 0 
    ? subscriptionPlans 
    : [];

  // Show error banner if there's an error, but we still have plans to display
  const showErrorBanner = error !== null && subscriptionPlans.length > 0;

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {showErrorBanner && (
          <View style={[styles.errorBanner, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
            <FontAwesome5 name="exclamation-circle" size={16} color={theme.error} style={styles.errorIcon} />
            <Text style={[styles.errorBannerText, { color: theme.error }]}>
              {error || 'Could not refresh plans. Using cached data.'}
            </Text>
            <TouchableOpacity onPress={fetchSubscriptionPlans}>
              <FontAwesome5 name="sync" size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={[styles.title, { color: theme.text }]}>Choose Your Subscription Plan</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select a plan that fits your transportation needs
        </Text>

        {plansToDisplay.length === 0 ? (
          <View style={[styles.noPlansContainer, { borderColor: theme.border }]}>
            <FontAwesome5 name="info-circle" size={40} color={theme.textSecondary} style={styles.noPlansIcon} />
            <Text style={[styles.noPlansText, { color: theme.text }]}>
              No subscription plans are currently available.
            </Text>
            <Text style={[styles.noPlansSubtext, { color: theme.textSecondary }]}>
              Please check back later or contact support for assistance.
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: theme.primary }]}
              onPress={fetchSubscriptionPlans}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plansToDisplay.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard, 
              { 
                backgroundColor: theme.card,
                borderColor: plan.recommended ? theme.primary : theme.border
              }
            ]}
          >
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            )}
            
            <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={[styles.currency, { color: theme.text }]}>₱</Text>
              <Text style={[styles.price, { color: theme.text }]}>{plan.price}</Text>
              <Text style={[styles.duration, { color: theme.textSecondary }]}>
                /{plan.duration === 30 ? 'month' : plan.duration === 90 ? 'quarter' : 'year'}
              </Text>
            </View>
            
            <View style={styles.featuresContainer}>
              {Array.isArray(plan.features) ? plan.features.map((feature, index) => renderFeature(feature, index)) : (
                <Text style={[styles.noFeaturesText, { color: theme.textSecondary }]}>No features available</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => handleSubscribe(plan)}
            >
              <LinearGradient
                colors={theme.gradientColors || ['#4B6BFE', '#3451E1']}
                style={styles.subscribeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.subscribeText}>Subscribe Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )))}
      </ScrollView>
      
      {/* GCash Payment Modal */}
      <Modal
        visible={showGCashModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGCashModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>GCash Payment</Text>
              {!isProcessingPayment && (
                <TouchableOpacity 
                  onPress={() => {
                    setShowGCashModal(false);
                    setReferenceNumber('');
                    setPaymentError(null);
                  }}
                  style={styles.closeButton}
                >
                  <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.qrContainer}>
              {/* GCash QR Code */}
              <Image 
                source={require('../assets/images/gcash.jpg')} 
                style={styles.qrCode}
                resizeMode="contain"
              />
              
              <View style={styles.paymentDetailsContainer}>
                <Text style={[styles.planDetailsText, { color: theme.text }]}>
                  Plan: {selectedPlanForPayment?.name}
                </Text>
                <Text style={[styles.planDetailsText, { color: theme.text }]}>
                  Amount: ₱{selectedPlanForPayment?.price}
                </Text>
                <Text style={[styles.paymentInstructions, { color: theme.textSecondary }]}>
                  Scan the QR code with your GCash app to pay
                </Text>
              </View>
            </View>

            <View style={styles.referenceContainer}>
              <Text style={[styles.referenceTitle, { color: theme.text }]}>
                Enter Reference Number
              </Text>
              
              <TextInput
                style={[
                  styles.referenceInput, 
                  { 
                    backgroundColor: theme.background,
                    borderColor: paymentError ? theme.error : theme.border,
                    color: theme.text 
                  }
                ]}
                placeholder="e.g. GC0123456789"
                placeholderTextColor={theme.textSecondary}
                value={referenceNumber}
                onChangeText={(text) => {
                  setReferenceNumber(text);
                  if (paymentError) setPaymentError(null);
                }}
                editable={!isProcessingPayment}
                autoCapitalize="characters"
              />
              
              {paymentError && (
                <Text style={[styles.paymentErrorText, { color: theme.error }]}>
                  {paymentError}
                </Text>
              )}
              
              {isProcessingPayment ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.processingText, { color: theme.text }]}>
                    Verifying payment...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.paymentSubmitButton, { backgroundColor: theme.primary }]}
                  onPress={handlePaymentSubmit}
                >
                  <Text style={styles.paymentSubmitButtonText}>Submit Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4B6BFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  currency: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 16,
    marginBottom: 4,
    marginLeft: 2,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
  },
  noFeaturesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  subscribeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  subscribeGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16
  },
  errorIcon: {
    marginRight: 8
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
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
  noPlansContainer: {
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPlansIcon: {
    marginBottom: 16,
  },
  noPlansText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPlansSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  paymentDetailsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planDetailsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  paymentInstructions: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  referenceContainer: {
    marginTop: 16,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  referenceInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  paymentErrorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
  },
  paymentSubmitButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PassengerSubscriptionPlans; 