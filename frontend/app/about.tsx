import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';

export default function AboutUs() {
  const { colors, isDarkMode } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>About PARAda</Text>
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
          Founded in 2023, PARAda started as a simple tracking app and has grown into a comprehensive transportation platform.
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
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  section: { padding: 20 },
  description: { fontSize: 16, marginTop: 10 },
  featuresGrid: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  featureCard: { alignItems: 'center', padding: 10, borderRadius: 8, width: '45%' },
  featureDesc: { textAlign: 'center', marginTop: 5 }
}); 