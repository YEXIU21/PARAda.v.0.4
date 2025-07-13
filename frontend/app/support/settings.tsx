import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Switch, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for settings
interface SupportSettings {
  notifications: {
    newTicket: boolean;
    ticketAssigned: boolean;
    ticketUpdated: boolean;
    ticketResolved: boolean;
    dailySummary: boolean;
  };
  display: {
    defaultView: 'all' | 'assigned' | 'unassigned';
    ticketsPerPage: number;
    showClosedTickets: boolean;
  };
  autoAssign: boolean;
  signature: string;
}

export default function SupportSettingsPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<SupportSettings>({
    notifications: {
      newTicket: true,
      ticketAssigned: true,
      ticketUpdated: true,
      ticketResolved: false,
      dailySummary: true
    },
    display: {
      defaultView: 'all',
      ticketsPerPage: 10,
      showClosedTickets: false
    },
    autoAssign: false,
    signature: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Check if user has support role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role !== 'support') {
            // Redirect to home if not a support user
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          }
        } else {
          // No user data, redirect to login
          if (Platform.OS === 'web') {
            window.location.href = '/auth/login';
          } else {
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
    loadSettings();
  }, []);

  // Load user settings
  const loadSettings = async () => {
    try {
      // In a production app, this would come from an API
      const savedSettings = await AsyncStorage.getItem('supportSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // In a production app, this would be saved via API
      await AsyncStorage.setItem('supportSettings', JSON.stringify(settings));
      
      // Show success message
      setSaveMessage('Settings saved successfully');
      
      // Clear message after a few seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Update notification settings
  const updateNotificationSetting = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });
  };

  // Update display settings
  const updateDisplaySetting = <K extends keyof typeof settings.display>(
    key: K, 
    value: typeof settings.display[K]
  ) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        [key]: value
      }
    });
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      {/* Support Navigation Bar */}
      <SupportNavBar />
      
      {/* Main Content */}
      <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <LinearGradient
          colors={colors.gradientColors}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Support Settings</Text>
              <Text style={styles.headerSubtitle}>
                Configure your support preferences
              </Text>
            </View>
            <FontAwesome5 name="cog" size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>
        
        {/* Notification Settings */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Notification Settings
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  New Ticket Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Get notified when a new ticket is created
                </Text>
              </View>
              <Switch
                value={settings.notifications.newTicket}
                onValueChange={(value) => updateNotificationSetting('newTicket', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Ticket Assignment Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Get notified when a ticket is assigned to you
                </Text>
              </View>
              <Switch
                value={settings.notifications.ticketAssigned}
                onValueChange={(value) => updateNotificationSetting('ticketAssigned', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Ticket Update Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Get notified when a ticket you're assigned to is updated
                </Text>
              </View>
              <Switch
                value={settings.notifications.ticketUpdated}
                onValueChange={(value) => updateNotificationSetting('ticketUpdated', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Ticket Resolution Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Get notified when a ticket is resolved
                </Text>
              </View>
              <Switch
                value={settings.notifications.ticketResolved}
                onValueChange={(value) => updateNotificationSetting('ticketResolved', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Daily Summary
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Receive a daily summary of ticket activity
                </Text>
              </View>
              <Switch
                value={settings.notifications.dailySummary}
                onValueChange={(value) => updateNotificationSetting('dailySummary', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
        
        {/* Display Settings */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Display Settings
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Default Ticket View
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Choose which tickets to show by default
                </Text>
              </View>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => updateDisplaySetting('defaultView', 'all')}
                >
                  <View style={[
                    styles.radioButton,
                    settings.display.defaultView === 'all' && { borderColor: colors.primary }
                  ]}>
                    {settings.display.defaultView === 'all' && (
                      <View style={[styles.radioButtonSelected, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => updateDisplaySetting('defaultView', 'assigned')}
                >
                  <View style={[
                    styles.radioButton,
                    settings.display.defaultView === 'assigned' && { borderColor: colors.primary }
                  ]}>
                    {settings.display.defaultView === 'assigned' && (
                      <View style={[styles.radioButtonSelected, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Assigned</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => updateDisplaySetting('defaultView', 'unassigned')}
                >
                  <View style={[
                    styles.radioButton,
                    settings.display.defaultView === 'unassigned' && { borderColor: colors.primary }
                  ]}>
                    {settings.display.defaultView === 'unassigned' && (
                      <View style={[styles.radioButtonSelected, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Unassigned</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Tickets Per Page
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Number of tickets to show per page
                </Text>
              </View>
              <View style={styles.numberSelector}>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}
                  onPress={() => {
                    if (settings.display.ticketsPerPage > 5) {
                      updateDisplaySetting('ticketsPerPage', settings.display.ticketsPerPage - 5);
                    }
                  }}
                >
                  <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.numberValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {settings.display.ticketsPerPage}
                </Text>
                <TouchableOpacity
                  style={[styles.numberButton, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]}
                  onPress={() => {
                    if (settings.display.ticketsPerPage < 50) {
                      updateDisplaySetting('ticketsPerPage', settings.display.ticketsPerPage + 5);
                    }
                  }}
                >
                  <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.settingDivider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Show Closed Tickets
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Include closed tickets in the list
                </Text>
              </View>
              <Switch
                value={settings.display.showClosedTickets}
                onValueChange={(value) => updateDisplaySetting('showClosedTickets', value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
        
        {/* Automation Settings */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Automation Settings
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Auto-assign New Tickets
                </Text>
                <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Automatically assign new tickets to you when available
                </Text>
              </View>
              <Switch
                value={settings.autoAssign}
                onValueChange={(value) => setSettings({...settings, autoAssign: value})}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
        
        {/* Response Settings */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Response Settings
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.textAreaContainer}>
              <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Email Signature
              </Text>
              <Text style={[styles.settingDescription, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                This signature will be added to all your responses
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    backgroundColor: isDarkMode ? '#333333' : '#F0F0F0'
                  }
                ]}
                multiline
                numberOfLines={4}
                value={settings.signature}
                onChangeText={(text) => setSettings({...settings, signature: text})}
                placeholder="Enter your signature here..."
                placeholderTextColor={isDarkMode ? '#AAAAAA' : '#666666'}
              />
            </View>
          </View>
        </View>
        
        {/* Save Button */}
        <View style={styles.saveContainer}>
          {saveMessage && (
            <Text style={[
              styles.saveMessage,
              { color: saveMessage.includes('Error') ? '#dc3545' : '#28a745' }
            ]}>
              {saveMessage}
            </Text>
          )}
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isSaving && { opacity: 0.7 }
            ]}
            onPress={saveSettings}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    padding: 20,
    borderRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionContainer: {
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingCard: {
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  radioGroup: {
    flexDirection: 'column',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  numberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  textAreaContainer: {
    paddingVertical: 10,
  },
  textArea: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveContainer: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveMessage: {
    marginBottom: 10,
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 