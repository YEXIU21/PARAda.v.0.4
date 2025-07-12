import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function Contact() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', { name, email, message });
    setName(''); setEmail(''); setMessage('');
  };

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
            <Text style={styles.headerTitle}>Contact Us</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <ThemedText type="title">Get in Touch</ThemedText>
        <Text style={[styles.description, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          We'd love to hear from you. Please fill out the form below.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8', color: isDarkMode ? '#FFFFFF' : '#333333' }]}
          placeholder="Your Name"
          placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8', color: isDarkMode ? '#FFFFFF' : '#333333' }]}
          placeholder="Your Email"
          placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8', color: isDarkMode ? '#FFFFFF' : '#333333' }]}
          placeholder="Your Message"
          placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.submitText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText type="title">Contact Information</ThemedText>
        <View style={styles.infoItem}>
          <FontAwesome5 name="envelope" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}> support@parada.com</Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name="phone" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}> 0991 314 2960</Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name="map-marker-alt" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}> Toledo, Toledo City, Philippines</Text>
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
  form: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 5, padding: 10, marginBottom: 15 },
  textarea: { height: 100 },
  submitButton: { padding: 15, borderRadius: 5, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: 'bold' },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  infoText: { marginLeft: 10, fontSize: 16 }
}); 