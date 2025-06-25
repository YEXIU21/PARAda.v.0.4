import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getSubscriptionPlans } from '../services/api/subscription.api';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionPlan {
  id: string;
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
      plan.id && 
      plan.name && 
      (typeof plan.price === 'number' || typeof plan.price === 'string') && 
      (typeof plan.duration === 'number' || typeof plan.duration === 'string') && 
      Array.isArray(plan.features)
    );
    
    if (validPlans.length === 0) {
      return [];
    }
    
    // Convert string prices to numbers if needed
    return validPlans.map(plan => ({
      ...plan,
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
    // Navigate back to home screen and pass the selected plan
    router.push({
      pathname: '/(tabs)',
      params: { selectedPlan: plan.id }
    });
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
  const plansToDisplay = Array.isArray(subscriptionPlans) && subscriptionPlans.length > 0 
    ? subscriptionPlans 
    : defaultSubscriptionPlans;

  // Show error banner if there's an error, but we still have plans to display
  const showErrorBanner = error !== null && subscriptionPlans.length > 0;

  return (
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

      {plansToDisplay.map((plan) => (
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
      ))}
    </ScrollView>
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
});

export default PassengerSubscriptionPlans; 