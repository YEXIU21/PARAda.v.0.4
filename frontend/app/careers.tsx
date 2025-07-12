import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';

export default function Careers() {
  const { colors, isDarkMode } = useTheme();

  const jobs = [
    { title: 'Software Engineer', description: 'Develop innovative transportation solutions.' },
    { title: 'UI/UX Designer', description: 'Create intuitive user interfaces for our app.' },
    { title: 'Data Analyst', description: 'Analyze transportation patterns and optimize routes.' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Careers at PARAda</Text>
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
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  section: { padding: 20 },
  description: { fontSize: 16, marginTop: 10 },
  jobCard: { padding: 15, borderRadius: 8, marginBottom: 15 },
  jobDesc: { marginVertical: 5 },
  applyButton: { padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  applyText: { color: '#FFFFFF', fontWeight: 'bold' }
}); 