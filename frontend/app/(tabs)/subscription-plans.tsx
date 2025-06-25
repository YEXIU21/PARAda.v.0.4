import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AdminSubscriptionPlansManager from '../../components/AdminSubscriptionPlansManager';
import { useAuth } from '../../context/AuthContext';
import { getSubscriptionPlans } from '../../services/api/subscription.api';
import { Subscription, defaultSubscriptionPlans, SubscriptionId } from '../../constants/SubscriptionPlans';
import { FontAwesome5 } from '@expo/vector-icons';

export default function SubscriptionPlansScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const { user } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState<Subscription[]>(defaultSubscriptionPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const plans = await getSubscriptionPlans();
      
      // Only update plans if we got a valid response with at least one plan
      if (plans && Array.isArray(plans) && plans.length > 0) {
        setSubscriptionPlans(plans);
      } else {
        console.log('API returned no plans, using default plans');
        // Keep using the default plans that were set in the initial state
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
      console.error('Error loading subscription plans:', err);
      // Keep using the default plans that were set in the initial state
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    // Handle subscription logic here
    console.log(`Subscribe to plan: ${planId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading subscription plans...</Text>
        </View>
      );
    }

    // For admin users, show the admin subscription plans manager
    if (user?.role === 'admin') {
      // If there was an error loading plans for admin, show the error
      if (error) {
        return (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        );
      }
      
      return (
        <AdminSubscriptionPlansManager 
          theme={{
            background: theme.background,
            card: theme.card,
            text: theme.text,
            textSecondary: theme.textSecondary,
            border: theme.border,
            primary: theme.primary,
            error: theme.error,
            success: theme.success,
            warning: theme.warning
          }} 
        />
      );
    }

    // For passengers (including students), show subscription plans directly
    // Always ensure we have plans to display, even if there was an error
    const plansToDisplay = subscriptionPlans.length > 0 ? subscriptionPlans : defaultSubscriptionPlans;
    
    return (
      <ScrollView style={styles.plansContainer}>
        {plansToDisplay.map((plan) => (
          <View 
            key={plan.id}
            style={[
              styles.subscriptionCard,
              { 
                backgroundColor: theme.card, 
                borderColor: plan.recommended ? theme.primary : theme.border 
              },
              plan.recommended && styles.recommendedSubscription
            ]}
          >
            {plan.recommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.recommendedText}>BEST VALUE</Text>
              </View>
            )}
            <Text style={[styles.subscriptionName, { color: theme.text }]}>{plan.name}</Text>
            <Text style={[styles.subscriptionPrice, { color: theme.primary }]}>
              {typeof plan.price === 'string' 
                ? plan.price 
                : `₱${plan.price}/${typeof plan.duration === 'string' && plan.duration.toLowerCase().includes('yearly') ? 'year' : 'month'}`
              }
            </Text>
            <Text style={[styles.subscriptionDuration, { color: theme.textSecondary }]}>{plan.duration}</Text>
            
            <View style={styles.paymentMethodIndicator}>
              <FontAwesome5 name="money-bill-wave" size={14} color={theme.textSecondary} />
              <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                Payment via GCash
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.featuresListContainer}>
              <Text style={[styles.featuresListTitle, { color: theme.text }]}>Features:</Text>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureListItem}>
                  <FontAwesome5 
                    name="check-circle" 
                    size={16} 
                    color={theme.primary} 
                    style={styles.featureIcon}
                  />
                  <Text style={[styles.featureListText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  plansContainer: {
    flex: 1,
    padding: 20,
  },
  subscriptionCard: {
    borderRadius: 10,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendedSubscription: {
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recommendedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscriptionDuration: {
    fontSize: 14,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  featuresListContainer: {
    marginTop: 5,
    marginBottom: 15,
  },
  featuresListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureListText: {
    flex: 1,
  },
  paymentMethodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
  }
}); 