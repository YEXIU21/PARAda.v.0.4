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

  const values = [
    { icon: 'clock', title: 'Reliability', description: 'Providing consistent and dependable transportation services.' },
    { icon: 'shield-alt', title: 'Safety', description: 'Ensuring the security and well-being of all passengers.' },
    { icon: 'leaf', title: 'Sustainability', description: 'Promoting eco-friendly transportation solutions.' },
    { icon: 'users', title: 'Community', description: 'Building connections and serving local communities.' }
  ];

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

      <View style={styles.heroSection}>
        <ThemedText type="title" style={styles.heroTitle}>Transforming Transportation</ThemedText>
        <Text style={[styles.heroDescription, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          PARAda is on a mission to revolutionize public transportation in the Philippines through 
          innovative technology and a commitment to excellent service.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Our Mission</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          PARAda is dedicated to revolutionizing public transportation with real-time tracking and efficient route management. 
          We strive to make transportation more accessible, reliable, and convenient for everyone in Toledo City and beyond.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Our Story</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Founded in 2025 in Toledo City, Philippines, PARAda started as a simple tracking app and has grown into a comprehensive 
          transportation platform. Our team of dedicated professionals is committed to improving the way people travel by providing 
          real-time information and innovative solutions to common transportation challenges.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Our Values</ThemedText>
        <View style={styles.valuesGrid}>
          {values.map((value, index) => (
            <View 
              key={index} 
              style={[
                styles.valueCard, 
                { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                  shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)' }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <FontAwesome5 name={value.icon} size={20} color="#FFFFFF" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.valueTitle}>{value.title}</ThemedText>
              <Text style={[styles.valueDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                {value.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.teamSection}>
        <ThemedText type="title" style={styles.sectionTitle}>Our Team</ThemedText>
        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
            shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'
          }]}>
            <FontAwesome5 name="users" size={24} color={colors.primary} />
            <ThemedText type="defaultSemiBold">Dedicated Professionals</ThemedText>
            <Text style={[styles.featureDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Our team consists of expert developers, transportation specialists, and customer service professionals.
            </Text>
          </View>
          <View style={[styles.featureCard, { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
            shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'
          }]}>
            <FontAwesome5 name="globe" size={24} color={colors.primary} />
            <ThemedText type="defaultSemiBold">Local Focus, Global Vision</ThemedText>
            <Text style={[styles.featureDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Starting in Toledo City, we aim to expand our services to cities across the Philippines and beyond.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <ThemedText type="defaultSemiBold" style={styles.ctaText}>Want to join our team?</ThemedText>
        <TouchableOpacity 
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/careers';
            } else {
              router.push('/careers');
            }
          }}
        >
          <Text style={styles.ctaButtonText}>View Careers</Text>
          <FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" style={styles.ctaIcon} />
        </TouchableOpacity>
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
  heroSection: {
    padding: 30,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
  },
  heroTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  section: { 
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    marginBottom: 15,
  },
  description: { 
    fontSize: 16, 
    marginTop: 10,
    lineHeight: 24,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  valueCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueTitle: {
    marginBottom: 5,
    textAlign: 'center',
  },
  valueDesc: {
    textAlign: 'center',
    fontSize: 14,
  },
  teamSection: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  featuresGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  featureCard: { 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 10, 
    width: '48%',
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureDesc: { 
    textAlign: 'center', 
    marginTop: 10,
    lineHeight: 20,
  },
  ctaSection: {
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  ctaText: {
    fontSize: 18,
    marginBottom: 15,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  ctaIcon: {
    marginTop: 1,
  }
}); 