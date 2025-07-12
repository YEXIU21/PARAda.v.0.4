import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';

export default function Contact() {
  const { colors, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', { name, email, message });
    setName(''); setEmail(''); setMessage('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Contact Us</Text>
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
        <View style={styles.infoItem}><FontAwesome5 name="envelope" size={20} color={colors.primary} /><Text style={styles.infoText}> support@parada.com</Text></View>
        <View style={styles.infoItem}><FontAwesome5 name="phone" size={20} color={colors.primary} /><Text style={styles.infoText}> +1 (123) 456-7890</Text></View>
        <View style={styles.infoItem}><FontAwesome5 name="map-marker-alt" size={20} color={colors.primary} /><Text style={styles.infoText}> 123 Transportation Ave, City, State</Text></View>
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
  form: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 5, padding: 10, marginBottom: 15 },
  textarea: { height: 100 },
  submitButton: { padding: 15, borderRadius: 5, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: 'bold' },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  infoText: { marginLeft: 10, fontSize: 16 }
}); 