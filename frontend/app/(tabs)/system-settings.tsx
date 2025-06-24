import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from '../../context/ThemeContext';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'input' | 'select' | 'button';
  value: any;
  options?: { label: string; value: any }[];
  icon: string;
  iconColor: string;
}

export default function SystemSettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'darkMode',
      title: 'Dark Mode',
      description: 'Enable dark mode for the app',
      type: 'toggle',
      value: isDarkMode,
      icon: 'moon',
      iconColor: '#6200EA'
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Enable push notifications for updates',
      type: 'toggle',
      value: true,
      icon: 'bell',
      iconColor: '#FF9500'
    },
    {
      id: 'dataSync',
      title: 'Background Data Sync',
      description: 'Allow app to sync data in the background',
      type: 'toggle',
      value: true,
      icon: 'sync',
      iconColor: '#4B6BFE'
    },
    {
      id: 'etaBuffer',
      title: 'ETA Buffer Time (minutes)',
      description: 'Additional time added to estimated arrival times',
      type: 'input',
      value: '5',
      icon: 'clock',
      iconColor: '#34A853'
    },
    {
      id: 'maxActiveRoutes',
      title: 'Maximum Active Routes',
      description: 'Set the maximum number of active routes',
      type: 'input',
      value: '20',
      icon: 'route',
      iconColor: '#FF3B30'
    },
    {
      id: 'mapProvider',
      title: 'Map Provider',
      description: 'Choose the map provider for the app',
      type: 'select',
      value: 'google',
      options: [
        { label: 'Google Maps', value: 'google' },
        { label: 'Apple Maps', value: 'apple' },
        { label: 'OpenStreetMap', value: 'osm' }
      ],
      icon: 'map',
      iconColor: '#4285F4'
    },
    {
      id: 'clearCache',
      title: 'Clear App Cache',
      description: 'Clear cached data to free up space',
      type: 'button',
      value: null,
      icon: 'trash',
      iconColor: '#FF3B30'
    },
    {
      id: 'resetSettings',
      title: 'Reset to Default Settings',
      description: 'Reset all settings to their default values',
      type: 'button',
      value: null,
      icon: 'undo',
      iconColor: '#FF9500'
    }
  ]);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('systemSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Update settings with saved values, preserving the structure
          setSettings(settings.map(setting => {
            if (parsedSettings[setting.id] !== undefined) {
              return { ...setting, value: parsedSettings[setting.id] };
            }
            return setting;
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = async (updatedSettings: SettingItem[]) => {
    try {
      // Convert settings array to object for storage
      const settingsObject = updatedSettings.reduce((obj: { [key: string]: any }, item) => {
        obj[item.id] = item.value;
        return obj;
      }, {});
      
      await AsyncStorage.setItem('systemSettings', JSON.stringify(settingsObject));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleToggleSetting = (id: string) => {
    const updatedSettings = settings.map(setting => {
      if (setting.id === id) {
        // Special handling for dark mode
        if (id === 'darkMode') {
          toggleDarkMode();
          return { ...setting, value: !setting.value };
        }
        return { ...setting, value: !setting.value };
      }
      return setting;
    });
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleInputChange = (id: string, value: string) => {
    const updatedSettings = settings.map(setting => {
      if (setting.id === id) {
        return { ...setting, value };
      }
      return setting;
    });
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleSelectOption = (id: string, value: any) => {
    const updatedSettings = settings.map(setting => {
      if (setting.id === id) {
        return { ...setting, value };
      }
      return setting;
    });
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleButtonAction = (id: string) => {
    switch (id) {
      case 'clearCache':
        Alert.alert(
          'Clear Cache',
          'Are you sure you want to clear the app cache?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Clear', 
              style: 'destructive',
              onPress: () => {
                // Implement cache clearing logic
                Alert.alert('Success', 'Cache cleared successfully');
              }
            }
          ]
        );
        break;
        
      case 'resetSettings':
        Alert.alert(
          'Reset Settings',
          'Are you sure you want to reset all settings to default?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reset', 
              style: 'destructive',
              onPress: () => {
                // Reset settings to default
                const defaultSettings = settings.map(setting => {
                  if (setting.id === 'darkMode') {
                    // Keep the current theme
                    return setting;
                  }
                  
                  switch (setting.id) {
                    case 'notifications':
                    case 'dataSync':
                      return { ...setting, value: true };
                    case 'etaBuffer':
                      return { ...setting, value: '5' };
                    case 'maxActiveRoutes':
                      return { ...setting, value: '20' };
                    case 'mapProvider':
                      return { ...setting, value: 'google' };
                    default:
                      return setting;
                  }
                });
                
                setSettings(defaultSettings);
                saveSettings(defaultSettings);
                Alert.alert('Success', 'Settings reset to default');
              }
            }
          ]
        );
        break;
        
      default:
        break;
    }
  };

  const renderSettingItem = (item: SettingItem) => {
    return (
      <View 
        key={item.id} 
        style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.settingHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
            <FontAwesome5 name={item.icon} size={18} color={item.iconColor} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.settingControl}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={() => handleToggleSetting(item.id)}
              trackColor={{ false: "#767577", true: item.iconColor }}
              thumbColor={item.value ? "#fff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          )}
          
          {item.type === 'input' && (
            <TextInput
              style={[styles.inputField, { 
                color: theme.text,
                backgroundColor: isDarkMode ? '#333' : '#f5f5f5',
                borderColor: theme.border
              }]}
              value={item.value}
              onChangeText={(text) => handleInputChange(item.id, text)}
              keyboardType="number-pad"
              maxLength={3}
            />
          )}
          
          {item.type === 'select' && (
            <View style={styles.selectContainer}>
              {item.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    item.value === option.value && { 
                      backgroundColor: item.iconColor,
                      borderColor: item.iconColor
                    }
                  ]}
                  onPress={() => handleSelectOption(item.id, option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    item.value === option.value && { color: 'white' }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {item.type === 'button' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: item.iconColor }]}
              onPress={() => handleButtonAction(item.id)}
            >
              <Text style={styles.actionButtonText}>
                {item.id === 'clearCache' ? 'Clear' : 'Reset'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>System Settings</Text>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>App Configuration</Text>
        {settings.slice(0, 3).map(renderSettingItem)}
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Advanced Settings</Text>
        {settings.slice(3, 6).map(renderSettingItem)}
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Maintenance</Text>
        {settings.slice(6).map(renderSettingItem)}
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            App Version: 1.0.0
          </Text>
          <Text style={[styles.buildText, { color: theme.textSecondary }]}>
            Build: 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  settingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingControl: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  inputField: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  versionContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
  },
}); 