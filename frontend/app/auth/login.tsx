import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  KeyboardTypeOptions,
  TextStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { Link, router } from 'expo-router';
import axios from 'axios';
import { ThemeColors } from '../../types/ThemeTypes';

// Define props interface for CustomInputField
interface CustomInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  rightElement?: React.ReactNode;
  theme: ThemeColors;
}

// Custom Input Field Component
const CustomInputField: React.FC<CustomInputFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  isFocused,
  onFocus,
  onBlur,
  rightElement,
  theme,
}) => {
  const inputRef = useRef<TextInput>(null);
  
  // Force the input to use a specific style that eliminates selection highlight
  useEffect(() => {
    if (Platform.OS === 'web' && inputRef.current) {
      // For web platform, apply direct CSS to eliminate selection highlight
      const inputElement = inputRef.current as any;
      if (inputElement && inputElement.style) {
        // Apply inline styles to eliminate selection highlight
        inputElement.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
        inputElement.style.outline = 'none';
        inputElement.style.caretColor = theme.primary;
      }
    }
  }, [inputRef.current, theme.primary]);
  
  const handleContainerPress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (onFocus) onFocus();
    }
  };

  // Define additional styles for web platform
  const additionalStyles = Platform.OS === 'web' ? {
    // Use any to bypass TypeScript checking for web-specific styles
    // that aren't part of the standard TextStyle type
    ...(Platform.OS === 'web' ? {
      WebkitUserSelect: 'text',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    } : {})
  } : {};

  return (
    <Pressable
      onPress={handleContainerPress}
      style={[
        styles.inputContainer,
        {
          borderColor: isFocused ? theme.primary : theme.border,
          backgroundColor: theme.card,
          borderWidth: isFocused ? 2 : 1,
        },
      ]}
    >
      <FontAwesome5
        name={icon}
        size={20}
        color={isFocused ? theme.primary : theme.textSecondary}
        style={styles.inputIcon}
      />
      
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          { color: theme.text },
          additionalStyles as TextStyle
        ]}
        onFocus={() => {
          if (onFocus) onFocus();
        }}
        onBlur={() => {
          if (onBlur) onBlur();
        }}
        selectionColor="transparent"
        cursorColor={theme.primary}
        underlineColorAndroid="transparent"
        caretHidden={false}
        textAlignVertical="center"
      />
      
      {rightElement}
    </Pressable>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { login, isLoading, getHomePathForRole } = useAuth();
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
        // After successful login, get the updated user from AsyncStorage
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          if (userData && userData.role) {
            // Use the helper function to get the correct home path
            const homePath = getHomePathForRole(userData.role);
            console.log(`${userData.role} user logged in, redirecting to ${homePath}`);
            router.replace(homePath);
          } else {
            // Fallback to tabs if role is not available
            console.log('User role not found, using fallback redirect');
            router.replace('/(tabs)');
          }
        } else {
          // Fallback to tabs if user data isn't available
          console.log('No user data found after login, using fallback redirect');
          router.replace('/(tabs)');
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 401) {
            setError('Invalid email or password.');
          } else if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('Login failed. Please try again later.');
          }
        } else if (err.request) {
          setError('Server not responding. Check your internet connection.');
        } else {
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
                source={require('../../assets/images/PARAda-Logo.png')} 
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

          <CustomInputField
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            icon="envelope"
            keyboardType="email-address"
            autoCapitalize="none"
            isFocused={focusedInput === 'email'}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            theme={theme}
            rightElement={null}
          />

          <CustomInputField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            icon="lock"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            isFocused={focusedInput === 'password'}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            theme={theme}
            rightElement={
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <FontAwesome5 
                  name={showPassword ? "eye" : "eye-slash"} 
                  size={18} 
                  color={focusedInput === 'password' ? theme.primary : theme.textSecondary} 
                />
              </TouchableOpacity>
            }
          />

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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 12 : 4,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 