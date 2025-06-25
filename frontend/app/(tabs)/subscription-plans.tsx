import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image
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
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/admin')}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Subscription Plans</Text>
            <Text style={styles.headerSubtitle}>Manage subscription offerings</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
        </View>
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
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
  },
  logo: {
    width: 34,
    height: 34,
  },
  content: {
    flex: 1,
  }
}); 