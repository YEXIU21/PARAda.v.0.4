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
import PassengerSubscriptionPlans from '../../components/PassengerSubscriptionPlans';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

export default function SubscriptionPlansScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = user?.role === 'admin';

  // Add a short loading state to ensure components mount properly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors as [string, string]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{isAdmin ? 'Manage Subscription Plans' : 'Subscription Plans'}</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{isAdmin ? 'Manage Subscription Plans' : 'Subscription Plans'}</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        <ErrorBoundary
          onReset={() => {
            // Force refresh the component
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 300);
          }}
        >
          {isAdmin ? (
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
          ) : (
            <ErrorBoundary
              onReset={() => {
                // Force refresh the component
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 300);
              }}
            >
              <PassengerSubscriptionPlans 
                theme={{
                  background: theme.background,
                  card: theme.card,
                  text: theme.text,
                  textSecondary: theme.textSecondary,
                  border: theme.border,
                  primary: theme.primary,
                  error: theme.error,
                  success: theme.success,
                  warning: theme.warning,
                  gradientColors: theme.gradientColors as [string, string]
                }} 
              />
            </ErrorBoundary>
          )}
        </ErrorBoundary>
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
    marginTop: 12,
    fontSize: 16,
  }
}); 