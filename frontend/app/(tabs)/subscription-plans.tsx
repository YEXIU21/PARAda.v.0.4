import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AdminSubscriptionPlansManager from '../../components/AdminSubscriptionPlansManager';
import { useAuth } from '../../context/AuthContext';
import SubscriptionView from '../../components/SubscriptionView';
import { getSubscriptionPlans } from '../../services/api/subscription.api';
import { Subscription, defaultSubscriptionPlans } from '../../constants/SubscriptionPlans';

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

    // For passengers (including students), show the subscription view
    // Always ensure we have plans to display, even if there was an error
    return (
      <SubscriptionView
        subscriptionPlans={subscriptionPlans.length > 0 ? subscriptionPlans : defaultSubscriptionPlans}
        onSubscribe={handleSubscribe}
        onClose={() => {}}
        theme={{
          background: theme.background,
          card: theme.card,
          text: theme.text,
          textSecondary: theme.textSecondary,
          border: theme.border,
          primary: theme.primary,
          gradientColors: theme.gradientColors as [string, string]
        }}
        isDarkMode={isDarkMode}
      />
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
  }
}); 