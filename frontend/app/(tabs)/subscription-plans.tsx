import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AdminSubscriptionPlansManager from '../../components/AdminSubscriptionPlansManager';
import PassengerSubscriptionPlans from '../../components/PassengerSubscriptionPlans';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionPlansScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </LinearGradient>
      
      <View style={styles.content}>
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
        )}
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
  }
}); 