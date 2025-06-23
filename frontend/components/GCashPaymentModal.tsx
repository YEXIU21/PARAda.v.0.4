import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SubscriptionId } from '../constants/SubscriptionPlans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

// Images
const images = {
  gcash: require('../assets/images/gcash.jpg'),
  logo: require('../assets/images/adaptive-icon.png'),
  instapay: require('../assets/images/gcash.jpg') // Using gcash.jpg as a placeholder for the InstaPay QR code
};

interface GCashPaymentModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (planId: SubscriptionId, referenceNumber: string) => void;
  selectedPlan: {
    id: SubscriptionId;
    name: string;
    price: string;
  } | null;
  theme: any; // Accept any theme object to avoid type mismatches
}

export default function GCashPaymentModal({
  isVisible,
  onClose,
  onSuccess,
  selectedPlan,
  theme
}: GCashPaymentModalProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { user } = useAuth();

  const handlePaymentSubmit = async () => {
    // Reset any previous errors
    setPaymentError(null);
    
    if (!referenceNumber.trim()) {
      setPaymentError('Please enter the reference number from your GCash payment');
      return;
    }

    if (referenceNumber.length < 8) {
      setPaymentError('Please enter a valid reference number (at least 8 characters)');
      return;
    }

    setIsProcessing(true);

    try {
      // In a real app, you would validate the reference number with your backend
      // For demo purposes, we'll just simulate a successful payment after a delay
      setTimeout(() => {
        if (selectedPlan) {
          // Create payment data including username
          const paymentData = {
            username: user?.username || 'User',
            type: 'latransco', // Default type, no longer using selectedVehicleType
            plan: selectedPlan.id,
            referenceNumber: referenceNumber,
            paymentDate: new Date().toISOString(),
            verified: false
          };
          
          // Store payment reference with full data
          AsyncStorage.setItem(`payment_${selectedPlan.id}_${Date.now()}`, JSON.stringify(paymentData))
            .then(() => {
              setIsProcessing(false);
              onSuccess(selectedPlan.id, referenceNumber);
              // Reset state for next time
              setReferenceNumber('');
              
              // Show admin approval message
              Alert.alert(
                'Payment Submitted',
                'Your payment reference has been submitted and is pending admin approval. Your subscription will be activated once approved.',
                [{ text: 'OK' }]
              );
            })
            .catch(error => {
              console.error('Error saving payment reference:', error);
              setIsProcessing(false);
              setPaymentError('Failed to process payment. Please try again.');
            });
        }
      }, 1500);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      setPaymentError('Failed to process payment. Please try again.');
    }
  };

  const resetModal = () => {
    setReferenceNumber('');
    setPaymentError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors as [string, string]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>GCash Payment</Text>
            {!isProcessing && (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <View style={styles.closeButtonCircle}>
                  <FontAwesome5 name="times" size={16} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <ScrollView 
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.qrContainer, { backgroundColor: '#0055FF' }]}>
            <View style={styles.qrBackground}>
              <Image 
                source={images.gcash} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.paymentDetailsContainer}>
              <Text style={styles.transferFees}>Transfer fees may apply.</Text>
              <Text style={styles.payeeName}>M** JU**Y A** D.</Text>
              <Text style={styles.payeeDetails}>Mobile No.: 097• ••••395</Text>
              <Text style={styles.payeeDetails}>User ID: ••••••••••OATR9N</Text>
            </View>
          </View>

          <View style={styles.referenceContainer}>
            <Text style={[styles.referenceTitle, { color: theme.text }]}>
              Enter Reference Number
            </Text>
            
            <Text style={[styles.referenceSubtitle, { color: theme.textSecondary }]}>
              Your payment will be reviewed by an admin before your subscription is activated.
            </Text>

            <View style={[
              styles.inputContainer, 
              { 
                backgroundColor: theme.card,
                borderColor: paymentError ? theme.error : theme.border
              }
            ]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g. GC0123456789"
                placeholderTextColor={theme.textSecondary}
                value={referenceNumber}
                onChangeText={(text) => {
                  setReferenceNumber(text);
                  if (paymentError) setPaymentError(null);
                }}
                editable={!isProcessing}
                autoCapitalize="characters"
              />
            </View>

            {paymentError && (
              <Text style={[styles.errorText, { color: theme.error }]}>{paymentError}</Text>
            )}

            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.processingText, { color: theme.text }]}>
                  Verifying payment...
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                onPress={handlePaymentSubmit}
              >
                <Text style={styles.confirmButtonText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  qrBackground: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  paymentDetailsContainer: {
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  transferFees: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  payeeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  payeeDetails: {
    fontSize: 16,
    color: 'white',
    marginBottom: 3,
  },
  referenceContainer: {
    width: '100%',
    alignItems: 'center',
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  referenceSubtitle: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
  },
  confirmButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 