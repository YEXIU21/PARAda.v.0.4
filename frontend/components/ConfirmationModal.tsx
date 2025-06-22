import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmColor: string;
  cancelColor: string;
  icon: string;
  iconColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  theme?: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  confirmColor,
  cancelColor,
  icon,
  iconColor,
  onConfirm,
  onCancel,
  isLoading = false,
  theme
}: ConfirmationModalProps) => {
  // Default light theme colors
  const defaultTheme = {
    background: '#FFFFFF',
    card: '#F8F8F8',
    text: '#000000',
    textSecondary: '#666666',
    border: '#DDDDDD'
  };

  // Use provided theme or default
  const currentTheme = theme || defaultTheme;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalContainer, { 
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.border
        }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleContainer}>
              <FontAwesome5 name={icon} size={20} color={iconColor} style={styles.titleIcon} />
              <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
            </View>
            <TouchableOpacity 
              onPress={onCancel}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <FontAwesome5
                name={icon}
                size={24}
                color={iconColor}
              />
            </View>
            <Text style={[styles.message, { color: currentTheme.text }]}>{message}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton, { 
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border 
              }]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: currentTheme.text }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  titleIcon: {
    marginRight: 10
  },
  closeButton: {
    padding: 5
  },
  contentContainer: {
    marginVertical: 20,
    alignItems: 'center'
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1
  },
  confirmButton: {
    // No additional styles needed, color comes from props
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  confirmButtonText: {
    color: 'white'
  }
});

export default ConfirmationModal; 