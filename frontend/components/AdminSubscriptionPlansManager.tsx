import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Switch
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getSubscriptionPlans } from '../services/api/subscription.api';
import { 
  updateSubscriptionPlan, 
  createSubscriptionPlan, 
  deleteSubscriptionPlan,
  getStudentDiscountSettings,
  updateStudentDiscountSettings,
  getAdminSubscriptionPlans
} from '../services/api/admin.api';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  recommended?: boolean;
}

interface AdminSubscriptionPlansManagerProps {
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

const AdminSubscriptionPlansManager: React.FC<AdminSubscriptionPlansManagerProps> = ({ theme }) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<SubscriptionPlan>({
    id: '',
    name: '',
    price: 0,
    duration: 30,
    features: []
  });
  const [newFeature, setNewFeature] = useState('');

  // Student discount settings
  const [isStudentDiscountEnabled, setIsStudentDiscountEnabled] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [showDiscountSettings, setShowDiscountSettings] = useState(false);

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchStudentDiscountSettings();
  }, []);

  // Default subscription plans to use as fallback
  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 99,
      duration: 30,
      features: ['Real-time tracking', 'Schedule access', 'Traffic updates']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      duration: 30,
      features: ['All Basic features', 'Priority notifications', 'Offline maps', 'No advertisements'],
      recommended: true
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 999,
      duration: 365,
      features: ['All Premium features', '24/7 support', 'Schedule alarms', 'Trip history']
    }
  ];

  const fetchSubscriptionPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get plans from API
        const plans = await getAdminSubscriptionPlans();
        
        if (plans && Array.isArray(plans) && plans.length > 0) {
          console.log('Successfully loaded subscription plans from API:', plans);
          setSubscriptionPlans(plans);
        } else {
          console.log('API returned empty plans array, using default plans');
          setSubscriptionPlans(defaultPlans);
        }
      } catch (apiError) {
        console.error('Error fetching from API, using default plans:', apiError);
        
        // If API call fails, use default plans
        setSubscriptionPlans(defaultPlans);
        
        // Show a user-friendly error message
        setError('Could not connect to server. Using default plans.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
      console.error('Error in fetchSubscriptionPlans:', err);
      
      // Ensure we always have plans to display
      setSubscriptionPlans(defaultPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDiscountSettings = async () => {
    try {
      try {
        const settings = await getStudentDiscountSettings();
        
        if (settings && typeof settings.isEnabled === 'boolean' && typeof settings.discountPercent === 'number') {
          console.log('Successfully loaded student discount settings from API:', settings);
          setIsStudentDiscountEnabled(settings.isEnabled);
          setDiscountPercent(settings.discountPercent);
        } else {
          console.log('API returned invalid settings, using defaults');
          // Use default values
          setIsStudentDiscountEnabled(true);
          setDiscountPercent(20);
        }
      } catch (apiError) {
        console.error('Error fetching student discount settings from API:', apiError);
        
        // Use default values
        setIsStudentDiscountEnabled(true);
        setDiscountPercent(20);
      }
    } catch (err: any) {
      console.error('Error in fetchStudentDiscountSettings:', err);
      
      // Use default values
      setIsStudentDiscountEnabled(true);
      setDiscountPercent(20);
    }
  };

  const handleCreatePlan = () => {
    setIsCreatingPlan(true);
    setEditingPlan(null);
    setFormData({
      id: '',
      name: '',
      price: 0,
      duration: 30,
      features: []
    });
    setModalVisible(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setIsCreatingPlan(false);
    setEditingPlan(plan);
    setFormData({ ...plan });
    setModalVisible(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this subscription plan? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              await deleteSubscriptionPlan(planId);
              await fetchSubscriptionPlans();
              Alert.alert('Success', 'Subscription plan deleted successfully');
            }
          }
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete subscription plan');
      Alert.alert('Error', 'Failed to delete subscription plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() === '') return;
    setFormData({
      ...formData,
      features: [...formData.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.id || !formData.name || formData.price <= 0 || formData.duration <= 0) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      setIsLoading(true);
      
      if (isCreatingPlan) {
        await createSubscriptionPlan(formData);
        Alert.alert('Success', 'Subscription plan created successfully');
      } else {
        await updateSubscriptionPlan(formData.id, formData);
        Alert.alert('Success', 'Subscription plan updated successfully');
      }
      
      await fetchSubscriptionPlans();
      setModalVisible(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription plan');
      Alert.alert('Error', 'Failed to save subscription plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDiscountSettings = async () => {
    try {
      setIsSavingDiscount(true);
      
      // Validate discount percent
      if (discountPercent < 0 || discountPercent > 100) {
        Alert.alert('Validation Error', 'Discount percentage must be between 0 and 100');
        setIsSavingDiscount(false);
        return;
      }
      
      const settings = {
        isEnabled: isStudentDiscountEnabled,
        discountPercent
      };
      
      await updateStudentDiscountSettings(settings);
      Alert.alert('Success', 'Student discount settings updated successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update student discount settings');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  if (isLoading && subscriptionPlans.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading subscription plans...</Text>
      </View>
    );
  }

  // Show error banner if there's an error, but still show plans if we have them
  const showErrorBanner = error !== null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Error banner */}
      {showErrorBanner && (
        <View style={[styles.errorBanner, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
          <FontAwesome5 name="exclamation-circle" size={16} color={theme.error} style={styles.errorIcon} />
          <Text style={[styles.errorBannerText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity onPress={fetchSubscriptionPlans}>
            <FontAwesome5 name="sync" size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Header with actions */}
      <View style={styles.actionsHeader}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreatePlan}
        >
          <FontAwesome5 name="plus" size={14} color="#FFF" style={styles.createButtonIcon} />
          <Text style={styles.createButtonText}>Create Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.discountSettingsButton, { backgroundColor: theme.success + '20' }]}
          onPress={() => setShowDiscountSettings(!showDiscountSettings)}
        >
          <FontAwesome5 name="graduation-cap" size={14} color={theme.success} style={styles.discountButtonIcon} />
          <Text style={[styles.discountButtonText, { color: theme.success }]}>
            {showDiscountSettings ? 'Hide Discount Settings' : 'Student Discount Settings'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student Discount Settings Section - Collapsible */}
      {showDiscountSettings && (
        <View style={[styles.discountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.discountHeader}>
            <FontAwesome5 name="graduation-cap" size={18} color={theme.primary} style={styles.icon} />
            <Text style={[styles.discountTitle, { color: theme.text }]}>Student Discount Settings</Text>
          </View>
          
          <View style={styles.discountContent}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Student Discount</Text>
              <Switch
                value={isStudentDiscountEnabled}
                onValueChange={setIsStudentDiscountEnabled}
                trackColor={{ false: '#767577', true: theme.primary + '80' }}
                thumbColor={isStudentDiscountEnabled ? theme.primary : '#f4f3f4'}
              />
            </View>
            
            {isStudentDiscountEnabled && (
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
                  />
                  <Text style={[styles.percentSymbol, { color: theme.text }]}>%</Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.saveDiscountButton,
                { backgroundColor: theme.primary },
                isSavingDiscount && { opacity: 0.7 }
              ]}
              onPress={handleSaveDiscountSettings}
              disabled={isSavingDiscount}
            >
              {isSavingDiscount ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <FontAwesome5 name="save" size={14} color="#FFF" style={styles.saveIcon} />
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Subscription Plans List */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: showDiscountSettings ? 16 : 0 }]}>
        Available Plans
      </Text>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      <FlatList
        data={subscriptionPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {item.recommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.planPrice, { color: theme.primary }]}>
                ₱{item.price}/{item.duration === 365 ? 'year' : 'month'}
              </Text>
            </View>
            <Text style={[styles.planDuration, { color: theme.textSecondary }]}>
              Duration: {item.duration} days
            </Text>

            <View style={styles.featuresContainer}>
              <Text style={[styles.featuresTitle, { color: theme.text }]}>Features:</Text>
              {item.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome5 name="check-circle" size={14} color={theme.primary} style={styles.featureIcon} />
                  <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleEditPlan(item)}
              >
                <FontAwesome5 name="edit" size={14} color={theme.primary} />
                <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error + '20' }]}
                onPress={() => handleDeletePlan(item.id)}
              >
                <FontAwesome5 name="trash-alt" size={14} color={theme.error} />
                <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Plan Edit/Create Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isCreatingPlan ? 'Create Subscription Plan' : 'Edit Subscription Plan'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Plan ID</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={formData.id}
                  onChangeText={(text) => setFormData({ ...formData, id: text.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. basic, premium, annual"
                  placeholderTextColor={theme.textSecondary}
                  editable={isCreatingPlan} // Only editable when creating a new plan
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Plan Name</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g. Basic, Premium, Annual"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Price (₱)</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData({ ...formData, price: parseInt(text) || 0 })}
                  placeholder="e.g. 99, 199, 999"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Duration (days)</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={formData.duration.toString()}
                  onChangeText={(text) => setFormData({ ...formData, duration: parseInt(text) || 0 })}
                  placeholder="e.g. 30, 365"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Recommended</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { backgroundColor: formData.recommended ? theme.primary : theme.background, borderColor: theme.border }
                  ]}
                  onPress={() => setFormData({ ...formData, recommended: !formData.recommended })}
                >
                  <Text style={[styles.toggleButtonText, { color: formData.recommended ? '#FFF' : theme.textSecondary }]}>
                    {formData.recommended ? 'YES' : 'NO'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Features</Text>
                <View style={styles.featuresEditor}>
                  {formData.features.map((feature, index) => (
                    <View key={index} style={[styles.featureItemEditor, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <Text style={[styles.featureTextEditor, { color: theme.text }]}>{feature}</Text>
                      <TouchableOpacity onPress={() => handleRemoveFeature(index)}>
                        <FontAwesome5 name="times" size={14} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.addFeatureContainer}>
                  <TextInput
                    style={[
                      styles.featureInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                    ]}
                    value={newFeature}
                    onChangeText={setNewFeature}
                    placeholder="Add a feature"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TouchableOpacity
                    style={[styles.addFeatureButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddFeature}
                  >
                    <FontAwesome5 name="plus" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4
  },
  createButtonIcon: {
    marginRight: 6
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  discountSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4
  },
  discountButtonIcon: {
    marginRight: 6
  },
  discountButtonText: {
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    position: 'relative'
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8
  },
  recommendedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  planDuration: {
    marginBottom: 12
  },
  featuresContainer: {
    marginBottom: 16
  },
  featuresTitle: {
    fontWeight: 'bold',
    marginBottom: 8
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  featureIcon: {
    marginRight: 8
  },
  featureText: {
    flex: 1
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8
  },
  editButtonText: {
    marginLeft: 6,
    fontWeight: '500'
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4
  },
  deleteButtonText: {
    marginLeft: 6,
    fontWeight: '500'
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center'
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16
  },
  errorIcon: {
    marginRight: 8
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  // Student discount styles
  discountCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  discountContent: {
    paddingHorizontal: 4
  },
  icon: {
    marginRight: 4
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  percentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  percentInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    textAlign: 'right'
  },
  percentSymbol: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  saveDiscountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 4,
    marginTop: 4
  },
  saveIcon: {
    marginRight: 8
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  toggleButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  featuresEditor: {
    marginBottom: 12,
  },
  featureItemEditor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  featureTextEditor: {
    flex: 1,
    fontSize: 14,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  addFeatureButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default AdminSubscriptionPlansManager; 