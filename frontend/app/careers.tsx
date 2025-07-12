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
    { title: 'Software Engineer', description: 'Develop innovative transportation solutions.' },
    { title: 'UI/UX Designer', description: 'Create intuitive user interfaces for our app.' },
    { title: 'Data Analyst', description: 'Analyze transportation patterns and optimize routes.' }
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

      <View style={styles.section}>
        <ThemedText type="title">Join Our Team</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Be part of a dynamic team revolutionizing public transportation.
        </Text>
      </View>

      <View style={styles.section}>
        <ThemedText type="title">Open Positions</ThemedText>
        {jobs.map((job, index) => (
          <View key={index} style={[styles.jobCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }]}>
            <ThemedText type="defaultSemiBold">{job.title}</ThemedText>
            <Text style={[styles.jobDesc, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>{job.description}</Text>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.applyText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  jobCard: { padding: 15, borderRadius: 8, marginBottom: 15 },
  jobDesc: { marginVertical: 5 },
  applyButton: { padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  applyText: { color: '#FFFFFF', fontWeight: 'bold' }
}); 