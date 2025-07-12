import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function AboutUs() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  const goToLandingPage = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goToLandingPage} style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>About PARAda</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <ThemedText type="title">Our Mission</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          PARAda is dedicated to revolutionizing public transportation with real-time tracking and efficient route management.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title">Our Story</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Founded in 2025, PARAda started as a simple tracking app and has grown into a comprehensive transportation platform.
        </Text>
      </View>

      <View style={styles.featuresGrid}>
        <View style={[styles.featureCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }]}>
          <FontAwesome5 name="users" size={24} color={colors.primary} />
          <ThemedText type="defaultSemiBold">Team</ThemedText>
          <Text style={[styles.featureDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Expert developers and transportation specialists.</Text>
        </View>
        <View style={[styles.featureCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }]}>
          <FontAwesome5 name="globe" size={24} color={colors.primary} />
          <ThemedText type="defaultSemiBold">Global Reach</ThemedText>
          <Text style={[styles.featureDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Serving users in multiple cities worldwide.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerTitle: { 
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  section: { padding: 20 },
  description: { fontSize: 16, marginTop: 10 },
  featuresGrid: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  featureCard: { alignItems: 'center', padding: 10, borderRadius: 8, width: '45%' },
  featureDesc: { textAlign: 'center', marginTop: 5 }
}); 