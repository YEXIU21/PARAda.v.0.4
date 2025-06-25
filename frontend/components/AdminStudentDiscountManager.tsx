import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getStudentDiscountSettings, updateStudentDiscountSettings } from '../services/api/admin.api';

interface AdminStudentDiscountManagerProps {
  theme: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    error: string;
    success: string;
    warning: string;
  };
}

const AdminStudentDiscountManager: React.FC<AdminStudentDiscountManagerProps> = ({ theme }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentDiscountSettings();
  }, []);

  const fetchStudentDiscountSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settings = await getStudentDiscountSettings();
      setIsEnabled(settings.isEnabled);
      setDiscountPercent(settings.discountPercent);
    } catch (err: any) {
      setError(err.message || 'Failed to load student discount settings');
      console.error('Error loading student discount settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate discount percent
      if (discountPercent < 0 || discountPercent > 100) {
        Alert.alert('Validation Error', 'Discount percentage must be between 0 and 100');
        setIsSaving(false);
        return;
      }
      
      const settings = {
        isEnabled,
        discountPercent
      };
      
      await updateStudentDiscountSettings(settings);
      Alert.alert('Success', 'Student discount settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update student discount settings');
      Alert.alert('Error', 'Failed to update student discount settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading student discount settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.header}>
          <FontAwesome5 name="graduation-cap" size={20} color={theme.primary} style={styles.icon} />
          <Text style={[styles.title, { color: theme.text }]}>Student Discount Settings</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Student Discount</Text>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={isEnabled ? theme.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Discount Percentage</Text>
          <View style={styles.percentInputContainer}>
            <TextInput
              style={[
                styles.percentInput,
                { 
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background
                }
              ]}
              value={discountPercent.toString()}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value)) {
                  setDiscountPercent(value);
                }
              }}
              keyboardType="numeric"
              maxLength={3}
              editable={isEnabled}
            />
            <Text style={[styles.percentSymbol, { color: theme.text }]}>%</Text>
          </View>
        </View>
        
        <View style={styles.description}>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            Student discount is automatically applied to all subscription plans for users with a student account type.
          </Text>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            isSaving && { opacity: 0.7 }
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <FontAwesome5 name="save" size={16} color="#FFF" style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  card: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  icon: {
    marginRight: 12
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500'
  },
  percentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  percentInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    textAlign: 'right'
  },
  percentSymbol: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500'
  },
  description: {
    marginTop: 8,
    marginBottom: 20
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20
  },
  errorContainer: {
    marginBottom: 16
  },
  errorText: {
    fontSize: 14
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 4
  },
  saveIcon: {
    marginRight: 8
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16
  }
});

export default AdminStudentDiscountManager; 