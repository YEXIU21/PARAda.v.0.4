import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { Link, router } from 'expo-router';
import { UserRole } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Extended user type with account type
export type AccountType = 'regular' | 'student';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('passenger');
  const [isStudent, setIsStudent] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { register, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isStudent && !studentId) {
      setError('Please enter your student ID');
      return;
    }
    
    if (selectedRole === 'driver' && !licensePlate) {
      setError('Please enter your license plate number');
      return;
    }

    setError('');
    
    // Load the student discount percentage set by admin
    let discountPercent = 20; // Default value
    let isDiscountEnabled = true; // Default value
    
    try {
      const savedDiscountPercent = await AsyncStorage.getItem('studentDiscountPercent');
      if (savedDiscountPercent) {
        discountPercent = parseInt(savedDiscountPercent, 10);
      }
      
      const discountEnabled = await AsyncStorage.getItem('isStudentDiscountEnabled');
      if (discountEnabled !== null) {
        isDiscountEnabled = discountEnabled === 'true';
      }
    } catch (error) {
      console.error('Error loading discount settings:', error);
    }
    
    const accountType: AccountType = isStudent ? 'student' : 'regular';
    
    try {
    const success = await register(
      username, 
      email, 
      password, 
      selectedRole, 
      accountType, 
      isStudent ? studentId : undefined,
      selectedRole === 'driver' ? licensePlate : undefined
    );
    
    if (success) {
      if (isStudent && isDiscountEnabled) {
        // Show discount information
        Alert.alert(
          "Student Discount Applied!",
          `Your account has been created with a ${discountPercent}% student discount on all subscription plans. Enjoy your ride!`,
            [{ text: "Continue", onPress: () => router.replace('/(tabs)') }]
        );
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 409) {
            if (selectedRole === 'driver') {
              setError('This email is already registered. Please use a different email or try logging in.');
            } else {
              setError('This email is already registered. Please use a different email or try logging in.');
            }
          } else if (err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else if (err.response.data && err.response.data.errors) {
            // Handle validation errors
            const validationErrors = err.response.data.errors;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
              setError(validationErrors[0].msg);
            } else {
              setError('Registration failed. Please check your information.');
            }
          } else {
            setError('Registration failed. Please try again later.');
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('Server not responding. Check your internet connection.');
        } else {
          // Something happened in setting up the request
          setError('An error occurred. Please try again.');
      }
    } else {
        setError('An unexpected error occurred during registration.');
    }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const RoleButton = ({ role, title }: { role: UserRole; title: string }) => (
    <TouchableOpacity
      style={[
        styles.roleButton,
        { 
          borderColor: selectedRole === role ? theme.primary : theme.border,
          backgroundColor: selectedRole === role ? `${theme.primary}15` : 'transparent'
        }
      ]}
      onPress={() => setSelectedRole(role)}
    >
      <Text
        style={[
          styles.roleButtonText,
          { color: selectedRole === role ? theme.primary : theme.textSecondary }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

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
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign up to get started</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedInput === 'username' ? theme.primary : theme.border, 
              backgroundColor: theme.card,
              borderWidth: focusedInput === 'username' ? 2 : 1
            }
          ]}>
            <FontAwesome5 
              name="user" 
              size={20} 
              color={focusedInput === 'username' ? theme.primary : theme.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Username"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedInput === 'email' ? theme.primary : theme.border, 
              backgroundColor: theme.card,
              borderWidth: focusedInput === 'email' ? 2 : 1
            }
          ]}>
            <FontAwesome5 
              name="envelope" 
              size={20} 
              color={focusedInput === 'email' ? theme.primary : theme.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedInput === 'password' ? theme.primary : theme.border, 
              backgroundColor: theme.card,
              borderWidth: focusedInput === 'password' ? 2 : 1
            }
          ]}>
            <FontAwesome5 
              name="lock" 
              size={20} 
              color={focusedInput === 'password' ? theme.primary : theme.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <FontAwesome5 
                name={showPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={focusedInput === 'password' ? theme.primary : theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedInput === 'confirmPassword' ? theme.primary : theme.border, 
              backgroundColor: theme.card,
              borderWidth: focusedInput === 'confirmPassword' ? 2 : 1
            }
          ]}>
            <FontAwesome5 
              name="lock" 
              size={20} 
              color={focusedInput === 'confirmPassword' ? theme.primary : theme.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              onFocus={() => setFocusedInput('confirmPassword')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
              <FontAwesome5 
                name={showConfirmPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={focusedInput === 'confirmPassword' ? theme.primary : theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>I am a:</Text>
          <View style={styles.roleContainer}>
            <RoleButton role="passenger" title="Passenger" />
            <RoleButton role="driver" title="Driver" />
          </View>

          {selectedRole === 'driver' && (
            <View style={[
              styles.inputContainer, 
              { 
                borderColor: focusedInput === 'licensePlate' ? theme.primary : theme.border, 
                backgroundColor: theme.card,
                borderWidth: focusedInput === 'licensePlate' ? 2 : 1,
                marginTop: 16
              }
            ]}>
              <FontAwesome5 
                name="car" 
                size={20} 
                color={focusedInput === 'licensePlate' ? theme.primary : theme.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="License Plate Number"
                placeholderTextColor={theme.textSecondary}
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
                onFocus={() => setFocusedInput('licensePlate')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>I am a student</Text>
            <Switch
              value={isStudent}
              onValueChange={setIsStudent}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isStudent ? theme.primary : '#f4f3f4'}
            />
          </View>

          {isStudent && (
            <View style={[
              styles.inputContainer, 
              { 
                borderColor: focusedInput === 'studentId' ? theme.primary : theme.border, 
                backgroundColor: theme.card,
                borderWidth: focusedInput === 'studentId' ? 2 : 1
              }
            ]}>
              <FontAwesome5 
                name="id-card" 
                size={20} 
                color={focusedInput === 'studentId' ? theme.primary : theme.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Student ID"
                placeholderTextColor={theme.textSecondary}
                value={studentId}
                onChangeText={setStudentId}
                onFocus={() => setFocusedInput('studentId')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account?</Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: theme.primary }]}>Login</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  roleButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
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
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 