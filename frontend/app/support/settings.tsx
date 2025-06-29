import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../components/layouts/SupportLayout';
import { getSupportSettings, updateSupportSettings, SupportSettings } from '../../services/api/support.api';

const SupportSettingsScreen = () => {
  const { colors } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    newTicket: true,
    ticketReply: true,
    ticketEscalation: true,
    ticketAssignment: true,
    ticketOverdue: false
  });
  
  // Display settings
  const [ticketsPerPage, setTicketsPerPage] = useState('20');
  const [defaultFilter, setDefaultFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5');
  
  // Email settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState('daily');
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await getSupportSettings();
        if (response.success) {
          const settings = response.data;
          
          // Update notification settings
          setNotificationSettings({
            newTicket: settings.notifications.newTicket,
            ticketReply: settings.notifications.ticketReply,
            ticketEscalation: settings.notifications.ticketEscalation,
            ticketAssignment: settings.notifications.ticketAssignment,
            ticketOverdue: settings.notifications.ticketOverdue
          });
          
          // Update display settings
          setTicketsPerPage(settings.display.ticketsPerPage.toString());
          setDefaultFilter(settings.display.defaultFilter);
          setAutoRefresh(settings.display.autoRefresh);
          setRefreshInterval(settings.display.refreshInterval.toString());
          
          // Update email settings
          setEmailNotifications(settings.email.emailNotifications);
          setEmailDigest(settings.email.emailDigest);
        } else {
          setError(response.message || 'Failed to fetch settings');
        }
      } catch (err) {
        console.error('Error fetching support settings:', err);
        setError('An error occurred while fetching settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle notification toggle
  const toggleNotification = (key: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings]
    });
  };
  
  // Handle save settings
  const saveSettings = async () => {
    setSaving(true);
    
    try {
      // Prepare settings object
      const settings: SupportSettings = {
        notifications: {
          newTicket: notificationSettings.newTicket,
          ticketReply: notificationSettings.ticketReply,
          ticketEscalation: notificationSettings.ticketEscalation,
          ticketAssignment: notificationSettings.ticketAssignment,
          ticketOverdue: notificationSettings.ticketOverdue
        },
        display: {
          ticketsPerPage: parseInt(ticketsPerPage) || 20,
          defaultFilter,
          autoRefresh,
          refreshInterval: parseInt(refreshInterval) || 5
        },
        email: {
          emailNotifications,
          emailDigest
        }
      };
      
      // Save settings
      const response = await updateSupportSettings(settings);
      
      if (response.success) {
        Alert.alert('Success', 'Settings saved successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving support settings:', err);
      Alert.alert('Error', 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SupportLayout title="Support Settings" showBackButton={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SupportLayout>
    );
  }
  
  return (
    <SupportLayout title="Support Settings" showBackButton={false}>
      <ScrollView style={styles.container}>
        {error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => window.location.reload()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Notification Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <FontAwesome5 name="bell" size={16} color={colors.primary} /> Notification Settings
              </Text>
              
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>New Ticket Alerts</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when a new support ticket is created
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.newTicket}
                    onValueChange={() => toggleNotification('newTicket')}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Ticket Replies</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when a user replies to a ticket you are assigned to
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.ticketReply}
                    onValueChange={() => toggleNotification('ticketReply')}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Ticket Escalations</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when a ticket is escalated to high or critical priority
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.ticketEscalation}
                    onValueChange={() => toggleNotification('ticketEscalation')}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Ticket Assignments</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when a ticket is assigned to you
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.ticketAssignment}
                    onValueChange={() => toggleNotification('ticketAssignment')}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Overdue Tickets</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when a ticket becomes overdue
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.ticketOverdue}
                    onValueChange={() => toggleNotification('ticketOverdue')}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </View>
            </View>
            
            {/* Display Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <FontAwesome5 name="desktop" size={16} color={colors.primary} /> Display Settings
              </Text>
              
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Tickets Per Page</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Number of tickets to display per page
                    </Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      value={ticketsPerPage}
                      onChangeText={setTicketsPerPage}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Default Filter</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Default filter to apply when viewing tickets
                    </Text>
                  </View>
                  <View style={styles.selectContainer}>
                    <TouchableOpacity
                      style={[
                        styles.selectOption,
                        defaultFilter === 'all' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setDefaultFilter('all')}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        defaultFilter === 'all' ? { color: '#fff' } : { color: colors.text }
                      ]}>All</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.selectOption,
                        defaultFilter === 'open' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setDefaultFilter('open')}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        defaultFilter === 'open' ? { color: '#fff' } : { color: colors.text }
                      ]}>Open</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.selectOption,
                        defaultFilter === 'assigned' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setDefaultFilter('assigned')}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        defaultFilter === 'assigned' ? { color: '#fff' } : { color: colors.text }
                      ]}>Assigned</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Auto Refresh</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Automatically refresh ticket list
                    </Text>
                  </View>
                  <Switch
                    value={autoRefresh}
                    onValueChange={setAutoRefresh}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                {autoRefresh && (
                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>Refresh Interval (minutes)</Text>
                      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        How often to refresh the ticket list
                      </Text>
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={refreshInterval}
                        onChangeText={setRefreshInterval}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            {/* Email Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <FontAwesome5 name="envelope" size={16} color={colors.primary} /> Email Settings
              </Text>
              
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Email Notifications</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Receive notifications via email
                    </Text>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                {emailNotifications && (
                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>Email Digest</Text>
                      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        How often to receive email summaries
                      </Text>
                    </View>
                    <View style={styles.selectContainer}>
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          emailDigest === 'realtime' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setEmailDigest('realtime')}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          emailDigest === 'realtime' ? { color: '#fff' } : { color: colors.text }
                        ]}>Real-time</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          emailDigest === 'daily' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setEmailDigest('daily')}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          emailDigest === 'daily' ? { color: '#fff' } : { color: colors.text }
                        ]}>Daily</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          emailDigest === 'weekly' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setEmailDigest('weekly')}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          emailDigest === 'weekly' ? { color: '#fff' } : { color: colors.text }
                        ]}>Weekly</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton, 
                { backgroundColor: colors.primary },
                saving && { opacity: 0.7 }
              ]}
              onPress={saveSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="save" size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    borderRadius: 8,
    padding: 16,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  inputContainer: {
    width: 60,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
  },
  selectContainer: {
    flexDirection: 'row',
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SupportSettingsScreen; 