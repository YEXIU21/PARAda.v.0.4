import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ENV from '../constants/environment';
import { Platform } from 'react-native';

// Define types for user roles and authentication context
export type UserRole = 'admin' | 'driver' | 'passenger' | 'support' | null;
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

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshUserSubscription: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getHomePathForRole: (role: UserRole) => string;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = ENV.apiUrl;

// Helper function to refresh user data
const refreshUserData = async (token: string): Promise<User | null> => {
  try {
    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.user) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return null;
  }
};

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  
  // Ref to track if we've loaded from storage
  const hasLoadedFromStorage = useRef(false);
  
  // Ref to track failed token verifications
  const failedVerificationAttempts = useRef(0);
  const maxVerificationAttempts = 3;

  // Helper function to get the home path for a user based on their role
  const getHomePathForRole = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/(tabs)'; // Admin users should go to the home page where the admin dashboard will be conditionally rendered
      case 'support':
        return '/support';
      case 'driver':
      case 'passenger':
      default:
        return '/(tabs)';
    }
  };
  
  // Helper function to check if token exists across all storage locations
  const checkTokenExists = async (): Promise<boolean> => {
    try {
      // Check AsyncStorage first
      let token = await AsyncStorage.getItem('token');
      
      // If not found, check secondary locations
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      
      // If not found, check backup location
      if (!token) {
        token = await AsyncStorage.getItem('backup_token');
      }
      
      // If on web, also check web storage
      if (!token && Platform.OS === 'web') {
        try {
          token = localStorage.getItem('parada_token') || 
                  sessionStorage.getItem('parada_token');
        } catch (e) {
          console.error('Error accessing web storage:', e);
        }
      }
      
      return !!token;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  };
  
  // Save token to all storage locations
  const saveTokenToAllLocations = async (token: string): Promise<void> => {
    if (!token) return;
    
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('backup_token', token);
      
      // If on web, also save to web storage
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem('parada_token', token);
          sessionStorage.setItem('parada_token', token);
        } catch (e) {
          console.error('Error saving to web storage:', e);
        }
      }
    } catch (error) {
      console.error('Error saving token to all locations:', error);
    }
  };
  
  // Check for stored user data on app start
  useEffect(() => {
    // Avoid loading multiple times
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;
    
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        const storedUser = await AsyncStorage.getItem('user');
        let token = await AsyncStorage.getItem('token');
        
        // If token not found in primary location, check other locations
        if (!token) {
          token = await AsyncStorage.getItem('authToken');
          
          if (!token) {
            token = await AsyncStorage.getItem('backup_token');
          }
          
          // If on web, also check web storage
          if (!token && Platform.OS === 'web') {
            try {
              token = localStorage.getItem('parada_token') || 
                      sessionStorage.getItem('parada_token');
            } catch (e) {
              console.error('Error accessing web storage:', e);
            }
          }
          
          // If token found in alternate location, save to all locations
          if (token) {
            await saveTokenToAllLocations(token);
          }
        }
        
        if (storedUser && token) {
          // First set the user from storage to avoid flashing login screen
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Then validate token with backend, but don't log out on network issues
            try {
              const response = await axios.post(`${API_URL}/api/auth/verify`, { token });
              
              if (response.data && response.data.valid) {
                console.log('Token is valid');
                
                // Reset failed verification attempts
                failedVerificationAttempts.current = 0;
                
                // Refresh user data in the background if token is valid
                try {
                  const updatedUserData = await refreshUserData(token);
                  if (updatedUserData) {
                    console.log('User data refreshed from API');
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
                    setUser(updatedUserData);
                  }
                } catch (refreshError) {
                  console.error('Error refreshing user data, keeping existing user:', refreshError);
                  // Keep the existing user on refresh error
                }
              } else if (response.data && response.data.valid === false) {
                // Token is explicitly invalid according to backend
                console.warn('Token validation failed, but keeping session active temporarily');
                
                // Increment failed verification attempts
                failedVerificationAttempts.current++;
                
                // Only log out after multiple failed attempts
                if (failedVerificationAttempts.current >= maxVerificationAttempts) {
                  console.error('Multiple token verification failures, logging out');
                  await logout();
                } else {
                  // Schedule a retry
                  setTimeout(async () => {
                    try {
                      const retryResponse = await axios.post(`${API_URL}/api/auth/verify`, { token });
                      if (retryResponse.data && retryResponse.data.valid) {
                        console.log('Token validation retry succeeded');
                        failedVerificationAttempts.current = 0;
                      }
                    } catch (retryError) {
                      console.error('Token validation retry failed:', retryError);
                    }
                  }, 5000); // Retry after 5 seconds
                }
              }
            } catch (error) {
              // Don't log user out on network errors or other validation issues
              console.log('Token validation error, but keeping user session:', error);
              
              // For network errors, schedule a retry for token validation after a delay
              if (axios.isAxiosError(error) && !error.response) {
                console.log('Network error detected, scheduling token validation retry');
                setTimeout(async () => {
                  try {
                    const retryToken = await AsyncStorage.getItem('token');
                    if (retryToken) {
                      const retryResponse = await axios.post(`${API_URL}/api/auth/verify`, { token: retryToken });
                      console.log('Token validation retry result:', retryResponse.data.valid);
                    }
                  } catch (retryError) {
                    console.error('Token validation retry failed, but keeping user session:', retryError);
                    // Still keep the user logged in even if retry fails
                  }
                }, 5000); // Retry after 5 seconds
              }
              
              // We already set the user from storage above, so no need to do it again
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            // Don't clear user on parse error, just set loading to false
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        // On error parsing user data, don't clear the user or token
        // This helps prevent logout on refresh due to JSON parse errors
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);
  
  // Add a periodic token check to ensure we don't log out during long sessions
  useEffect(() => {
    // Don't run if no user is logged in
    if (!user) return;
    
    // Setup periodic token check
    const checkInterval = setInterval(async () => {
      const hasToken = await checkTokenExists();
      
      // If user exists but token is gone, restore it from AsyncStorage
      if (user && !hasToken) {
        console.log('Token missing but user exists, attempting recovery');
        try {
          // Check if we can find user data
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            // User data exists but token is missing - this can happen due to storage issues
            // We'll keep the session active but trigger a logout after 10 minutes
            // This gives the user time to save their work
            console.log('User data found, keeping session temporarily');
            setTimeout(() => {
              console.log('Recovery period ended, logging out');
              logout();
            }, 10 * 60 * 1000); // 10 minutes
          }
        } catch (error) {
          console.error('Error during token recovery:', error);
        }
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [user]);

  // Load subscription data - avoid circular dependencies
  const loadSubscription = async () => {
    try {
      if (!user || !user.id) return;
      
      // Direct API call instead of importing subscription API
      const response = await axios.get(`${API_URL}/api/subscriptions/user`, {
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.subscription) {
        setUserSubscription(response.data.subscription);
        return response.data.subscription;
      }
      return null;
    } catch (error) {
      console.error('Error loading subscription:', error);
      return null;
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
        
        // Save token to all storage locations for redundancy
        await saveTokenToAllLocations(response.data.accessToken);
        
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
            
            // Direct API call instead of importing subscription API
            const subscriptionResponse = await axios.get(`${API_URL}/api/subscriptions/user`, {
              headers: { Authorization: `Bearer ${response.data.accessToken}` }
            });
            
            console.log('Subscription from API:', subscriptionResponse.data);
            
            if (subscriptionResponse.data && subscriptionResponse.data.subscription) {
              // Update user data with subscription
              userData.subscription = {
                type: subscriptionResponse.data.subscription.type,
                plan: subscriptionResponse.data.subscription.plan,
                planName: subscriptionResponse.data.subscription.planName,
                displayName: subscriptionResponse.data.subscription.displayName,
                verified: subscriptionResponse.data.subscription.verified || false,
                isActive: subscriptionResponse.data.subscription.isActive || false,
                expiryDate: subscriptionResponse.data.subscription.expiryDate || '',
                referenceNumber: subscriptionResponse.data.subscription.referenceNumber
              };
              
              // Save subscription data to AsyncStorage for offline access
              await AsyncStorage.setItem('userSubscription', JSON.stringify(userData.subscription));
              
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
              }
            }
          } catch (subError) {
            console.error('Error checking subscription:', subError);
            // Continue login process even if subscription check fails
          }
        }
        
        // Save user data to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Remove new registration flag
        await AsyncStorage.removeItem('isNewRegistration');
        
        // Update state
        setUser(userData);
        setIsLoading(false);
        
        // Reset failed verification attempts on successful login
        failedVerificationAttempts.current = 0;
        
        return true;
      } else {
        console.error('Invalid response from login API');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Register function
  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      
      if (response.data && response.data.success) {
        // Set a flag to indicate this is a new registration
        await AsyncStorage.setItem('isNewRegistration', 'true');
        
        setIsLoading(false);
        return true;
      } else {
        console.error('Registration failed:', response.data);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Before logging out, check if we're on a specific route that should be preserved
      // for redirection after login
      if (Platform.OS === 'web') {
        try {
          const currentPath = window.location.pathname;
          
          // Save current path for after login if it's not a login or landing page
          if (currentPath && 
              currentPath !== '/' && 
              currentPath !== '/index.html' && 
              !currentPath.includes('/auth/login')) {
            localStorage.setItem('parada_redirect_path', currentPath);
            sessionStorage.setItem('parada_redirect_path', currentPath);
          }
          
          // Clear path storage to prevent issues after logout
          localStorage.removeItem('parada_last_path');
          localStorage.removeItem('parada_current_path');
          sessionStorage.removeItem('parada_last_path');
          sessionStorage.removeItem('parada_current_path');
        } catch (e) {
          console.error('Error handling paths during logout:', e);
        }
      }
      
      // Clear all token storage locations
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('backup_token');
      await AsyncStorage.removeItem('parada_last_path');
      await AsyncStorage.removeItem('parada_current_path');
      
      // Clear user data
      await AsyncStorage.removeItem('user');
      
      // If on web, also clear web storage
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem('parada_token');
          sessionStorage.removeItem('parada_token');
        } catch (e) {
          console.error('Error clearing web storage:', e);
        }
      }
      
      // Clear state
      setUser(null);
      
      // Reset failed verification attempts
      failedVerificationAttempts.current = 0;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, { email });
      
      return response.data && response.data.success;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user || !user.id) {
        console.error('Cannot update profile: No user logged in');
        return false;
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Cannot update profile: No auth token');
        return false;
      }
      
      const response = await axios.put(
        `${API_URL}/api/users/${user.id}`, 
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.user) {
        // Update user in state and storage
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } else {
        console.error('Update profile failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Refresh user subscription function
  const refreshUserSubscription = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.error('Cannot refresh subscription: No user logged in');
        return false;
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Cannot refresh subscription: No auth token');
        return false;
      }
      
      // Direct API call instead of importing subscription API
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.subscription) {
          console.log('Subscription refreshed from API:', response.data.subscription);
          
          // Update user with subscription data
          const updatedUser: User = {
            ...user,
            subscription: {
              type: response.data.subscription.type,
              plan: response.data.subscription.plan,
              planName: response.data.subscription.planName,
              displayName: response.data.subscription.displayName,
              verified: response.data.subscription.verified || false,
              isActive: response.data.subscription.isActive || false,
              expiryDate: response.data.subscription.expiryDate || '',
              referenceNumber: response.data.subscription.referenceNumber
            }
          };
          
          // Update state and storage
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Also update subscription in AsyncStorage
          await AsyncStorage.setItem('userSubscription', JSON.stringify(updatedUser.subscription));
          
          return true;
        } else {
          console.log('No subscription found for user');
          
          // Clear subscription data
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
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      if (!user) {
        console.error('Cannot change password: No user logged in');
        throw new Error('You must be logged in to change your password');
      }
      
      console.log(`Attempting to change password for user ID: ${user.id}`);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Direct API call instead of importing auth API
      const response = await axios.post(
        `${API_URL}/api/auth/change-password`,
        { userId: user.id, currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Password change successful:', response.data);
      
      // Force a token refresh to ensure the new password is used for future requests
      try {
        // Verify the token is still valid with the new password
        const verifyResponse = await axios.post(`${API_URL}/api/auth/verify`, { token });
        console.log('Token verification after password change:', verifyResponse.data);
      } catch (tokenError) {
        console.error('Error verifying token after password change:', tokenError);
        // Don't throw here, as the password change itself was successful
      }
      
      return;
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
      changePassword,
      getHomePathForRole
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