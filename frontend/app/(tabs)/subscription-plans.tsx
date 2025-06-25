import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AdminSubscriptionPlansManager from '../../components/AdminSubscriptionPlansManager';

export default function SubscriptionPlansScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Subscription Plans Management</Text>
      </LinearGradient>
      
      <View style={styles.content}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  }
}); 