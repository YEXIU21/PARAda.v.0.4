import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function Careers() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  const jobs = [
    { 
      title: 'Software Engineer', 
      icon: 'laptop-code',
      description: 'Develop innovative transportation solutions using modern technologies.',
      requirements: ['Experience with React Native', 'Knowledge of mobile app development', 'Strong problem-solving skills'],
      location: 'Toledo City, Philippines (Remote available)'
    },
    { 
      title: 'UI/UX Designer', 
      icon: 'paint-brush',
      description: 'Create intuitive user interfaces and seamless user experiences for our transportation app.',
      requirements: ['Portfolio of design work', 'Experience with Figma or similar tools', 'Understanding of mobile design principles'],
      location: 'Toledo City, Philippines (Remote available)'
    },
    { 
      title: 'Data Analyst', 
      icon: 'chart-line',
      description: 'Analyze transportation patterns and optimize routes to improve efficiency and user experience.',
      requirements: ['Experience with data visualization', 'Knowledge of SQL and data processing', 'Statistical analysis skills'],
      location: 'Toledo City, Philippines (Remote available)'
    }
  ];

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
            <Text style={styles.headerTitle}>Careers at PARAda</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.heroSection}>
        <ThemedText type="title">Join Our Team</ThemedText>
        <Text style={[styles.heroDescription, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Be part of a dynamic team revolutionizing public transportation in the Philippines. 
          We're looking for talented individuals who are passionate about improving mobility and creating 
          innovative solutions for transportation challenges.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title">Open Positions</ThemedText>
        {jobs.map((job, index) => (
          <View key={index} style={[styles.jobCard, { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
            shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
          }]}>
            <View style={styles.jobHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <FontAwesome5 name={job.icon} size={18} color="#FFFFFF" />
              </View>
              <ThemedText type="defaultSemiBold">{job.title}</ThemedText>
            </View>
            
            <Text style={[styles.jobDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              {job.description}
            </Text>
            
            <View style={styles.requirementsContainer}>
              <Text style={[styles.requirementsTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                Requirements:
              </Text>
              {job.requirements.map((req, i) => (
                <View key={i} style={styles.requirementItem}>
                  <FontAwesome5 name="check-circle" size={14} color={colors.primary} style={styles.checkIcon} />
                  <Text style={[styles.requirementText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                    {req}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.locationContainer}>
              <FontAwesome5 name="map-marker-alt" size={14} color={colors.primary} style={styles.locationIcon} />
              <Text style={[styles.locationText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                {job.location}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyText}>Apply Now</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" style={styles.applyIcon} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <View style={styles.ctaSection}>
        <Text style={[styles.ctaText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
          Don't see a position that fits your skills?
        </Text>
        <TouchableOpacity 
          style={[styles.ctaButton, { borderColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/contact';
            } else {
              router.push('/contact');
            }
          }}
        >
          <Text style={[styles.ctaButtonText, { color: colors.primary }]}>Contact Us</Text>
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
    padding: 20, 
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
  },
  heroDescription: { 
    fontSize: 16, 
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: { 
    padding: 20,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  description: { fontSize: 16, marginTop: 10 },
  jobCard: { 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobDesc: { 
    marginVertical: 10,
    lineHeight: 22,
    fontSize: 15,
  },
  requirementsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  applyButton: { 
    padding: 12, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  applyText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold',
    marginRight: 8,
  },
  applyIcon: {
    marginTop: 1,
  },
  ctaSection: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
  },
  ctaButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
  },
  ctaButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  }
}); 