import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../components/layouts/SupportLayout';
import { createTicket, Ticket } from '../../services/api/support.api';
import { useRouter } from 'expo-router';

const CreateTicketScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Form state
  const [userEmail, setUserEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  
  // Categories
  const categories = [
    { label: 'General Inquiry', value: 'general' },
    { label: 'Account Issue', value: 'account' },
    { label: 'Payment Problem', value: 'payment' },
    { label: 'App Bug', value: 'bug' },
    { label: 'Feature Request', value: 'feature' },
    { label: 'Complaint', value: 'complaint' },
    { label: 'Other', value: 'other' }
  ];
  
  // Priorities
  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];
  
  // Get category label
  const getCategoryLabel = () => {
    const found = categories.find(cat => cat.value === category);
    return found ? found.label : 'Select Category';
  };
  
  // Get priority label
  const getPriorityLabel = () => {
    const found = priorities.find(pri => pri.value === priority);
    return found ? found.label : 'Select Priority';
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!userEmail || !subject || !description) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const ticketData = {
        userEmail,
        subject,
        description,
        category,
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        status: 'open' as 'open' | 'in-progress' | 'resolved' | 'closed'
      };
      
      const response = await createTicket(ticketData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Ticket created successfully',
          [
            {
              text: 'View Ticket',
              onPress: () => router.push(`/support/ticket/${response.data.id}`)
            },
            {
              text: 'Create Another',
              onPress: () => {
                setUserEmail('');
                setSubject('');
                setDescription('');
                setCategory('general');
                setPriority('medium');
              }
            }
          ]
        );
      } else {
        setError(response.message || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('An error occurred while creating the ticket');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render category modal
  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <FontAwesome5 name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalItem,
                  category === item.value && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setCategory(item.value);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: colors.text },
                  category === item.value && { fontWeight: '600', color: colors.primary }
                ]}>
                  {item.label}
                </Text>
                {category === item.value && (
                  <FontAwesome5 name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  // Render priority modal
  const renderPriorityModal = () => (
    <Modal
      visible={showPriorityModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPriorityModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPriorityModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Priority</Text>
            <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
              <FontAwesome5 name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {priorities.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalItem,
                  priority === item.value && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setPriority(item.value);
                  setShowPriorityModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: colors.text },
                  priority === item.value && { fontWeight: '600', color: colors.primary }
                ]}>
                  {item.label}
                </Text>
                {priority === item.value && (
                  <FontAwesome5 name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  return (
    <SupportLayout title="Create Support Ticket">
      {renderCategoryModal()}
      {renderPriorityModal()}
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
              <FontAwesome5 name="exclamation-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>User Email *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }
              ]}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="Enter user's email address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Subject *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter ticket subject"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: colors.inputBackground, borderColor: colors.border }
              ]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>
                {getCategoryLabel()}
              </Text>
              <FontAwesome5 name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: colors.inputBackground, borderColor: colors.border }
              ]}
              onPress={() => setShowPriorityModal(true)}
            >
              <Text style={[styles.selectButtonText, { color: colors.text }]}>
                {getPriorityLabel()}
              </Text>
              <FontAwesome5 name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter detailed description of the issue"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome5 name="ticket-alt" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Create Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  selectButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalItemText: {
    fontSize: 16,
  },
});

export default CreateTicketScreen; 