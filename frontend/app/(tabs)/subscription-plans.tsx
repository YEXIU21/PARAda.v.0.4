import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AdminSubscriptionPlansManager from '../../components/AdminSubscriptionPlansManager';
import { useRouter } from 'expo-router';

export default function SubscriptionPlansScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Subscription Plans</Text>
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
      
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/admin')}
      >
        <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  }
}); 