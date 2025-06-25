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
import { getAdminSubscriptionPlans } from '../services/api/admin.api';
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

  const fetchSubscriptionPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get plans from admin API first (this will ensure we get the same plans as the admin sees)
      try {
        const adminPlans = await getAdminSubscriptionPlans();
        
        // Ensure plans is an array before trying to use it
        if (adminPlans && Array.isArray(adminPlans) && adminPlans.length > 0) {
          console.log('Successfully fetched subscription plans from admin API:', adminPlans);
          
          // Validate that each plan has the required fields
          const validPlans = adminPlans.filter(plan => 
            plan && 
            typeof plan === 'object' && 
            plan.id && 
            plan.name && 
            (typeof plan.price === 'number' || typeof plan.price === 'string') && 
            (typeof plan.duration === 'number' || typeof plan.duration === 'string') && 
            Array.isArray(plan.features)
          );
          
          if (validPlans.length > 0) {
            // Convert string prices to numbers if needed
            const normalizedPlans = validPlans.map(plan => ({
              ...plan,
              price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
              duration: typeof plan.duration === 'string' ? parseInt(plan.duration, 10) : plan.duration
            }));
            
            setSubscriptionPlans(normalizedPlans);
            
            // Cache the plans for offline use
            try {
              await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(normalizedPlans));
            } catch (cacheError) {
              console.error('Error caching subscription plans:', cacheError);
            }
            
            return; // Exit early if we successfully got plans from admin API
          }
        }
        
        // If admin API didn't return valid plans, fall back to public API
        console.log('Admin API did not return valid plans, trying public API');
        const publicPlans = await getSubscriptionPlans();
        
        if (publicPlans && Array.isArray(publicPlans) && publicPlans.length > 0) {
          console.log('Successfully fetched subscription plans from public API:', publicPlans);
          
          // Validate that each plan has the required fields
          const validPlans = publicPlans.filter(plan => 
            plan && 
            typeof plan === 'object' && 
            plan.id && 
            plan.name && 
            (typeof plan.price === 'number' || typeof plan.price === 'string') && 
            (typeof plan.duration === 'number' || typeof plan.duration === 'string') && 
            Array.isArray(plan.features)
          );
          
          if (validPlans.length > 0) {
            // Convert string prices to numbers if needed
            const normalizedPlans = validPlans.map(plan => ({
              ...plan,
              price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
              duration: typeof plan.duration === 'string' ? parseInt(plan.duration, 10) : plan.duration
            }));
            
            setSubscriptionPlans(normalizedPlans);
            return; // Exit if we got plans from public API
          }
        }
        
        // If neither API returned valid plans, use default plans
        console.log('Neither API returned valid plans, using default plans');
        setSubscriptionPlans(defaultSubscriptionPlans);
        
      } catch (apiError) {
        console.error('Error fetching from APIs, using default plans:', apiError);
        // If API calls fail, use default plans
        setSubscriptionPlans(defaultSubscriptionPlans);
        
        // Try to get cached plans from AsyncStorage
        try {
          const cachedPlans = await AsyncStorage.getItem('subscriptionPlans');
          if (cachedPlans) {
            const parsedPlans = JSON.parse(cachedPlans);
            if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
              console.log('Using cached subscription plans');
              setSubscriptionPlans(parsedPlans);
            }
          }
        } catch (storageError) {
          console.error('Error reading from AsyncStorage:', storageError);
        }
      }
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading subscription plans...</Text>
      </View>
    );
  }

  // Ensure we have plans to display
  const plansToDisplay = Array.isArray(subscriptionPlans) && subscriptionPlans.length > 0 
    ? subscriptionPlans 
    : defaultSubscriptionPlans;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
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