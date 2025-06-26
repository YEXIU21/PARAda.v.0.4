import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ENV from '../constants/environment';
import { refreshUserData } from '../services/api/auth.api';
import { initializeSocket, disconnectSocket } from '../services/socket/socket.service';

// Define types for user roles and authentication context
export type UserRole = 'admin' | 'driver' | 'passenger' | null;
export type AccountType = 'regular' | 'student';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accountType?: AccountType;
  studentId?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
  lastLogin?: string;
  subscription?: {
    type: string;
    plan: string;
    planName?: string;
    displayName?: string;
    verified: boolean;
    isActive?: boolean;
    expiryDate: string;
    referenceNumber: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, role: UserRole, accountType?: AccountType, studentId?: string, licensePlate?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshUserSubscription: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = ENV.apiUrl;

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState(null);

  // Check for stored user data on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        if (storedUser && token) {
          // Validate token with backend
          try {
            const response = await axios.post(`${API_URL}/api/auth/verify`, { token });
            if (response.data.valid) {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              
              // Initialize socket connection for authenticated user
              try {
                await initializeSocket();
                console.log('Socket connection initialized on app start');
              } catch (socketError) {
                console.error('Failed to initialize socket on app start:', socketError);
              }
            } else {
              // Token invalid, clear storage
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('token');
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear storage on error
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Load subscription data
  const loadSubscription = async () => {
    try {
      if (!user || !user.id) return;
      
      // Import API functions dynamically to avoid circular dependencies
      const subscriptionApi = require('../services/api/subscription.api');
      
      // Fetch subscription directly from the API
      const subscription = await subscriptionApi.getUserSubscription();
      setUserSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      if (response.data && response.data.accessToken) {
        // Format the user object to match our User interface
        const userData: User = {
          id: response.data.user._id,
          username: response.data.user.username,
          email: response.data.user.email,
          role: response.data.user.role,
          accountType: response.data.user.accountType || 'regular',
          studentId: response.data.user.studentId,
          profilePicture: response.data.user.profilePicture,
          isEmailVerified: response.data.user.isEmailVerified,
          lastLogin: response.data.user.lastLogin || null
      };
        
        // Save token first so we can make API calls
        await AsyncStorage.setItem('token', response.data.accessToken);
        
        // Check if this is a brand new registration
        const isNewRegistration = await AsyncStorage.getItem('isNewRegistration') === 'true';
        
        // For new registrations, ensure subscription data is cleared
        if (isNewRegistration) {
          console.log('New registration detected in login - clearing subscription data');
          await AsyncStorage.removeItem('userSubscription');
          
          // For new registrations, explicitly set subscription to undefined
          userData.subscription = undefined;
          
          // Ensure we set a flag in AsyncStorage to identify this as a new user
          // This helps other components know this is a first-time login
          await AsyncStorage.setItem('isNewUser', 'true');
        } else if (userData.role === 'passenger') {
          // Only check for subscription if not a new registration
          try {
            console.log('Checking subscription status from backend API for existing user');
            
            // Import the subscription API dynamically to avoid circular dependencies
            const subscriptionApi = require('../services/api/subscription.api');
            const subscription = await subscriptionApi.getUserSubscription();
            
            console.log('Subscription from API:', subscription);
            
            // Only set subscription data if it has a reference number (payment made)
            if (subscription && 
                subscription.paymentDetails && 
                subscription.paymentDetails.referenceNumber && 
                subscription.paymentDetails.referenceNumber.trim() !== '') {
              console.log('Valid subscription with reference number found');
              // Update user data with subscription info from API
              userData.subscription = {
                type: subscription.type,
                plan: subscription.planId,
                planName: subscription.planName || undefined,
                displayName: subscription.displayName || undefined,
                verified: subscription.verification?.verified || false,
                isActive: subscription.isActive || false,
                expiryDate: subscription.expiryDate || '',
                referenceNumber: subscription.paymentDetails.referenceNumber
              };
              
              // Also update AsyncStorage with the latest subscription data
              const storageData = {
                type: subscription.type,
                plan: subscription.planId,
                planName: subscription.planName || undefined,
                displayName: subscription.displayName || undefined,
                verified: subscription.verification?.verified || false,
                isActive: subscription.isActive || false,
                approved: subscription.verification?.verified || false,
                expiryDate: subscription.expiryDate || '',
                referenceNumber: subscription.paymentDetails.referenceNumber,
                paymentDate: subscription.paymentDetails?.paymentDate || new Date().toISOString()
              };
              
              await AsyncStorage.setItem('userSubscription', JSON.stringify(storageData));
              console.log('Updated AsyncStorage with subscription data from API');
              
              // Remove the new user flag if we have subscription data
              await AsyncStorage.removeItem('isNewUser');
            } else {
              // Check if we have local subscription data
              const localSub = await AsyncStorage.getItem('userSubscription');
              if (localSub) {
                try {
                  const parsedSub = JSON.parse(localSub);
                  if (parsedSub.referenceNumber && parsedSub.plan && parsedSub.type) {
                    console.log('Found valid local subscription data:', parsedSub);
                    
                    // Use the local subscription data
                    userData.subscription = {
                      type: parsedSub.type,
                      plan: parsedSub.plan,
                      planName: parsedSub.planName || undefined,
                      displayName: parsedSub.displayName || undefined,
                      verified: parsedSub.verified || false,
                      isActive: parsedSub.isActive || false,
                      expiryDate: parsedSub.expiryDate || '',
                      referenceNumber: parsedSub.referenceNumber
                    };
                    
                    // Remove the new user flag if we have subscription data
                    await AsyncStorage.removeItem('isNewUser');
                  } else {
                    // No valid subscription with reference number found
                    console.log('No valid subscription with reference number found');
                    userData.subscription = undefined;
                    await AsyncStorage.removeItem('userSubscription');
                  }
                } catch (parseError) {
                  console.error('Error parsing local subscription data:', parseError);
                  userData.subscription = undefined;
                  await AsyncStorage.removeItem('userSubscription');
                }
              } else {
                // No valid subscription with reference number found
                console.log('No valid subscription with reference number found');
                userData.subscription = undefined;
                await AsyncStorage.removeItem('userSubscription');
              }
            }
          } catch (subError) {
            console.error('Error fetching subscription from API:', subError);
            // Don't set any subscription data on error for safety
            userData.subscription = undefined;
            await AsyncStorage.removeItem('userSubscription');
          }
        }
        
        // Save user data
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Initialize socket connection after successful login
        try {
          await initializeSocket();
          console.log('Socket connection initialized after login');
        } catch (socketError) {
          console.error('Failed to initialize socket after login:', socketError);
          // Continue even if socket initialization fails
        }
        
        // Clear the new user flag after first login if it's a new registration
        if (isNewRegistration) {
          // We'll clear the isNewRegistration flag immediately
          await AsyncStorage.removeItem('isNewRegistration');
          
          // But keep the isNewUser flag for a short time to ensure components can check it
          setTimeout(async () => {
            await AsyncStorage.removeItem('isNewUser');
            console.log('Cleared isNewUser flag after first login');
          }, 5000);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string,
    role: UserRole,
    accountType: AccountType = 'regular',
    studentId?: string,
    licensePlate?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Clear any existing subscription data from AsyncStorage for new users
      await AsyncStorage.removeItem('userSubscription');
      
      const registrationData = {
        username,
        email,
        password,
        role,
        accountType,
        studentId,
        licensePlate,
        // Add any other vehicle details if role is driver
        vehicleType: role === 'driver' ? 'jeep' : undefined,
      };
      
      // Log registration data for debugging (omit password)
      console.log('Registering with data:', {
        ...registrationData,
        password: '[REDACTED]'
      });
      
      const response = await axios.post(`${API_URL}/api/auth/register`, registrationData);
      
      if (response.status === 201 && response.data.user) {
        console.log('Registration successful - setting up for new user login');
        
        // Set a flag to indicate this is a brand new registration
        await AsyncStorage.setItem('isNewRegistration', 'true');
        
        // Auto-login after registration
        console.log('Attempting automatic login after registration');
        const loginSuccess = await login(email, password);
        
        if (loginSuccess) {
          console.log('Automatic login successful');
        } else {
          console.error('Automatic login failed after successful registration');
        }
        
        // After login completes, clear the flag
        await AsyncStorage.removeItem('isNewRegistration');
        
        // For newly registered users, ensure subscription is undefined
        if (loginSuccess && user) {
          console.log('Ensuring new user has no subscription data');
          const updatedUser = {
            ...user,
            subscription: undefined
          };
          
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return true; // Return true if registration was successful, even if auto-login failed
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      // Let the error propagate to be handled by the component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Disconnect socket before clearing user data
      disconnectSocket();
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password-request`, { email });
      return response.status === 200;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) return false;
      
      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        userData,
        {
          headers: {
            'x-access-token': token
          }
        }
      );
      
      if (response.status === 200 && response.data.user) {
      // Update local user data
        const updatedUser = {
          ...user,
          ...userData
        };
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  // Refresh user subscription function
  const refreshUserSubscription = async (): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Check if this is a brand new registration
      const isNewRegistration = await AsyncStorage.getItem('isNewRegistration') === 'true';
      
      // Only consider a user new if it's explicitly marked as a new registration
      // Don't use lastLogin as it might be missing for legitimate reasons
      const isNewUser = isNewRegistration;
      
      // For brand new registrations, we should never show subscription data
      if (isNewUser) {
        console.log('Brand new registration detected, clearing any subscription data');
        // If this is a new registration, remove any subscription data
        const updatedUser: User = {
          ...user,
          subscription: undefined
        };
        
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        await AsyncStorage.removeItem('userSubscription');
        return true;
      }
      
      console.log('Refreshing subscription data from backend API');
      
      try {
        // Call the refreshUserData function and handle the returned data
        const userData = await refreshUserData();
        
        // Check if userData and subscription exist with valid data
        if (userData && 
            'subscription' in userData && 
            userData.subscription && 
            userData.subscription.type && 
            userData.subscription.plan) {
          
          console.log('Received valid subscription data from API:', userData.subscription);
          
          // Update local user data with refreshed subscription info
          const updatedUser: User = {
            ...user,
            subscription: {
              type: userData.subscription.type,
              plan: userData.subscription.plan,
              planName: userData.subscription.planName || undefined,
              displayName: userData.subscription.displayName || undefined,
              verified: userData.subscription.verified || false,
              isActive: userData.subscription.isActive || false,
              expiryDate: userData.subscription.expiryDate || '',
              referenceNumber: userData.subscription.referenceNumber || ''
            }
          };
        
          setUser(updatedUser);
          
          // Also update AsyncStorage with the latest subscription data
          const storageData = {
            type: userData.subscription.type,
            plan: userData.subscription.plan,
            planName: userData.subscription.planName || undefined,
            displayName: userData.subscription.displayName || undefined,
            verified: userData.subscription.verified || false,
            isActive: userData.subscription.isActive || false,
            approved: userData.subscription.verified || false,
            expiryDate: userData.subscription.expiryDate || '',
            referenceNumber: userData.subscription.referenceNumber || '',
            paymentDate: new Date().toISOString()
          };
          
          await AsyncStorage.setItem('userSubscription', JSON.stringify(storageData));
          console.log('Updated AsyncStorage with refreshed subscription data');
          
          // Remove the new user flag if we have subscription data
          await AsyncStorage.removeItem('isNewUser');
          
          return true;
        } else {
          // Even if no subscription data from API, check if we have a pending subscription locally
          const localSub = await AsyncStorage.getItem('userSubscription');
          if (localSub) {
            try {
              const parsedSub = JSON.parse(localSub);
              if (parsedSub.referenceNumber && parsedSub.plan && parsedSub.type) {
                console.log('Found valid local subscription data:', parsedSub);
                
                // Update the user with the local subscription data
                const updatedUser: User = {
                  ...user,
                  subscription: {
                    type: parsedSub.type,
                    plan: parsedSub.plan,
                    planName: parsedSub.planName || undefined,
                    displayName: parsedSub.displayName || undefined,
                    verified: parsedSub.verified || false,
                    isActive: parsedSub.isActive || false,
                    expiryDate: parsedSub.expiryDate || '',
                    referenceNumber: parsedSub.referenceNumber || ''
                  }
                };
                
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
              }
            } catch (parseError) {
              console.error('Error parsing local subscription data:', parseError);
            }
          }
          
          // If there's no valid subscription data, clear subscription data
          console.log('No valid subscription data found in API response or local storage');
          const updatedUser: User = {
            ...user,
            subscription: undefined
          };
          
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          await AsyncStorage.removeItem('userSubscription');
          return true;
        }
      } catch (apiError) {
        console.error('Error fetching subscription from API:', apiError);
        
        // If API call fails, try to use local storage data as fallback
        const userSub = await AsyncStorage.getItem('userSubscription');
        if (userSub) {
          try {
            const data = JSON.parse(userSub);
            console.log('Using local storage subscription data as fallback:', data);
            
            // Only use valid data
            if (data.type && data.plan && data.type !== 'null' && data.plan !== 'null') {
              const updatedUser: User = {
                ...user,
                subscription: {
                  type: data.type,
                  plan: data.plan,
                  planName: data.planName || undefined,
                  displayName: data.displayName || undefined,
                  verified: data.verified || false,
                  isActive: data.isActive || false,
                  expiryDate: data.expiryDate || '',
                  referenceNumber: data.referenceNumber || ''
                }
              };
              
              setUser(updatedUser);
              return true;
            }
          } catch (parseError) {
            console.error('Error parsing local subscription data:', parseError);
          }
        }
        
        // If all else fails, clear subscription data
        const updatedUser: User = {
          ...user,
          subscription: undefined
        };
        
        setUser(updatedUser);
        await AsyncStorage.removeItem('userSubscription');
        return false;
      }
    } catch (error) {
      console.error('Refresh user subscription error:', error);
      return false;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Import changePassword function dynamically to avoid circular dependencies
      const { changePassword: apiChangePassword } = require('../services/api/auth.api');
      
      // Call the API to change password
      await apiChangePassword(user.id, currentPassword, newPassword);
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error; // Rethrow to handle in the component
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout,
      resetPassword,
      updateProfile,
      refreshUserSubscription,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 