import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { Link, router } from 'expo-router';
import axios from 'axios';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    try {
    const success = await login(email, password);
    
    if (success) {
        router.replace('/(tabs)');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 401) {
            setError('Invalid email or password.');
          } else if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('Login failed. Please try again later.');
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('Server not responding. Check your internet connection.');
        } else {
          // Something happened in setting up the request
          setError('An error occurred. Please try again.');
        }
    } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/PARAdalogo.jpg')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>PARAda</Text>
              <Text style={styles.headerSubtitle}>Real-Time Transportation Tracking</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Login to your account</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <FontAwesome5 name="envelope" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <FontAwesome5 name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <FontAwesome5 
                name={showPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={theme.textSecondary} 
            />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account?</Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.registerLink, { color: theme.primary }]}>Register</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={[styles.loginInfoContainer, { backgroundColor: isDarkMode ? theme.card : '#f9f9f9' }]}>
            <Text style={[styles.loginInfoTitle, { color: theme.text }]}>Test Accounts (MongoDB)</Text>
            <View style={[styles.credentialBox, { backgroundColor: isDarkMode ? '#272727' : '#fff', borderColor: theme.border }]}>
              <Text style={[styles.credentialTitle, { color: theme.text }]}>Admin</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Email: admin@parada.com</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Password: admin123</Text>
            </View>
            <View style={[styles.credentialBox, { backgroundColor: isDarkMode ? '#272727' : '#fff', borderColor: theme.border }]}>
              <Text style={[styles.credentialTitle, { color: theme.text }]}>Driver</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Email: driver@parada.com</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Password: driver123</Text>
            </View>
            <View style={[styles.credentialBox, { backgroundColor: isDarkMode ? '#272727' : '#fff', borderColor: theme.border }]}>
              <Text style={[styles.credentialTitle, { color: theme.text }]}>Passenger</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Email: passenger@example.com</Text>
              <Text style={[styles.credentialText, { color: theme.textSecondary }]}>Password: passenger123</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    marginRight: 5,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    marginLeft: 8,
  },
  loginInfoContainer: {
    marginTop: 40,
    padding: 16,
    borderRadius: 8,
  },
  loginInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  credentialBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 