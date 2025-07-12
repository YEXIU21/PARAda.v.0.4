import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image, Pressable } from 'react-native';
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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);

  // Apply web-specific styles to remove default highlight
  useEffect(() => {
    if (Platform.OS === 'web') {
      [nameInputRef, emailInputRef, messageInputRef].forEach(ref => {
        if (ref.current) {
          const inputElement = ref.current as any;
          if (inputElement && inputElement.style) {
            inputElement.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
            inputElement.style.outline = 'none';
            inputElement.style.caretColor = colors.primary;
          }
        }
      });
    }
  }, [nameInputRef.current, emailInputRef.current, messageInputRef.current, colors.primary]);

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', { name, email, message });
    setName(''); setEmail(''); setMessage('');
    setFocusedInput(null);
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

      <View style={styles.heroSection}>
        <ThemedText type="title" style={styles.heroTitle}>Get in Touch</ThemedText>
        <Text style={[styles.heroDescription, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          We'd love to hear from you. Whether you have a question about our services, need support, 
          or want to partner with us, our team is ready to help.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formSection}>
          <ThemedText type="defaultSemiBold" style={styles.formTitle}>Send Us a Message</ThemedText>
          
          <Pressable
            style={[
              styles.inputContainer,
              {
                borderColor: focusedInput === 'name' ? colors.primary : isDarkMode ? '#333333' : '#DDDDDD',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                borderWidth: focusedInput === 'name' ? 2 : 1,
              },
            ]}
            onPress={() => nameInputRef.current?.focus()}
          >
            <FontAwesome5
              name="user"
              size={16}
              color={focusedInput === 'name' ? colors.primary : isDarkMode ? '#BBBBBB' : '#666666'}
              style={styles.inputIcon}
            />
            <TextInput
              ref={nameInputRef}
              style={[
                styles.input, 
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              placeholder="Your Name"
              placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
            />
          </Pressable>
          
          <Pressable
            style={[
              styles.inputContainer,
              {
                borderColor: focusedInput === 'email' ? colors.primary : isDarkMode ? '#333333' : '#DDDDDD',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                borderWidth: focusedInput === 'email' ? 2 : 1,
              },
            ]}
            onPress={() => emailInputRef.current?.focus()}
          >
            <FontAwesome5
              name="envelope"
              size={16}
              color={focusedInput === 'email' ? colors.primary : isDarkMode ? '#BBBBBB' : '#666666'}
              style={styles.inputIcon}
            />
            <TextInput
              ref={emailInputRef}
              style={[
                styles.input, 
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              placeholder="Your Email"
              placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
            />
          </Pressable>
          
          <Pressable
            style={[
              styles.inputContainer,
              styles.textareaContainer,
              {
                borderColor: focusedInput === 'message' ? colors.primary : isDarkMode ? '#333333' : '#DDDDDD',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                borderWidth: focusedInput === 'message' ? 2 : 1,
              },
            ]}
            onPress={() => messageInputRef.current?.focus()}
          >
            <FontAwesome5
              name="comment"
              size={16}
              color={focusedInput === 'message' ? colors.primary : isDarkMode ? '#BBBBBB' : '#666666'}
              style={styles.inputIcon}
            />
            <TextInput
              ref={messageInputRef}
              style={[
                styles.input, 
                styles.textarea, 
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}
              placeholder="Your Message"
              placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
              value={message}
              onChangeText={setMessage}
              multiline
              onFocus={() => setFocusedInput('message')}
              onBlur={() => setFocusedInput(null)}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              textAlignVertical="top"
            />
          </Pressable>
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>Send Message</Text>
            <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" style={styles.submitIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>Contact Information</ThemedText>
          
          <View style={styles.infoCard}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="envelope" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Email Us</Text>
              <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>support@parada.com</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="phone-alt" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Call Us</Text>
              <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>+63 991 314 2960</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Visit Us</Text>
              <Text style={[styles.infoText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Toledo, Toledo City, Philippines</Text>
            </View>
          </View>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}>
              <FontAwesome5 name="facebook" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}>
              <FontAwesome5 name="twitter" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}>
              <FontAwesome5 name="instagram" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
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
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    padding: 20,
    justifyContent: 'space-between',
  },
  formSection: {
    flex: 1,
    marginRight: Platform.OS === 'web' ? 20 : 0,
    maxWidth: Platform.OS === 'web' ? '60%' : '100%',
  },
  formTitle: {
    marginBottom: 20,
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  textareaContainer: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 10,
  },
  submitIcon: {
    marginTop: 1,
  },
  infoSection: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? '35%' : '100%',
    marginTop: Platform.OS === 'web' ? 0 : 30,
  },
  infoTitle: {
    marginBottom: 20,
    fontSize: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: 30,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
}); 