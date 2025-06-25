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

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  recommended?: boolean;
}

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
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
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
      const plans = await getSubscriptionPlans();
      setSubscriptionPlans(plans);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
      console.error('Error loading subscription plans:', err);
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

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>Error loading subscription plans</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptionPlans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.text }]}>Choose Your Subscription Plan</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select a plan that fits your transportation needs
      </Text>

      {subscriptionPlans.map((plan) => (
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
              /{plan.duration === 30 ? 'month' : 'year'}
            </Text>
          </View>
          
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => renderFeature(feature, index))}
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