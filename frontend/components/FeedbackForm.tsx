import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, getThemeColors } from '@/context/ThemeContext';

interface FeedbackFormProps {
  isVisible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function FeedbackForm({ isVisible, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const categories = [
    { id: 'service', name: 'Service Quality' },
    { id: 'app', name: 'App Experience' },
    { id: 'driver', name: 'Driver Behavior' },
    { id: 'schedule', name: 'Schedule Accuracy' },
    { id: 'safety', name: 'Safety' },
  ];

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Please provide a rating');
      return;
    }

    // In a real app, you would send the feedback to a server
    console.log({ rating, comment, category });
    Alert.alert(
      'Thank you!', 
      'Your feedback has been submitted successfully.', 
      [{ text: 'OK', onPress: handleReset }]
    );
  };

  const handleReset = () => {
    setRating(0);
    setComment('');
    setCategory('');
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Animated.View 
          style={[
            styles.modalView,
            { 
              backgroundColor: theme.card,
              transform: [{ translateY }] 
            }
          ]}
        >
          <LinearGradient
            colors={Array.isArray(theme.gradientColors) && theme.gradientColors.length >= 2 
              ? [theme.gradientColors[0], theme.gradientColors[1]] as [string, string]
              : ['#4B6BFE', '#3451E1'] as [string, string]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.headerTitle}>Your Feedback Matters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={styles.formContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>How was your experience?</Text>

              <View style={[styles.ratingContainer, { backgroundColor: isDarkMode ? '#272727' : '#f9f9f9' }]}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setRating(value)}
                    style={styles.starContainer}
                  >
                    <FontAwesome5
                      name="star"
                      size={30}
                      color={value <= rating ? '#FFD700' : isDarkMode ? '#555555' : '#D3D3D3'}
                      solid={value <= rating}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose a Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryItem,
                      { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' },
                      category === item.id && [
                        styles.categorySelected, 
                        { backgroundColor: isDarkMode ? '#2A3451' : '#E8EDFF' }
                      ],
                    ]}
                    onPress={() => setCategory(item.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: isDarkMode ? '#BBBBBB' : '#777' },
                        category === item.id && styles.categoryTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Share your thoughts</Text>
              <TextInput
                style={[
                  styles.commentInput, 
                  { 
                    backgroundColor: isDarkMode ? '#333333' : '#f9f9f9',
                    borderColor: isDarkMode ? '#444444' : '#e0e0e0',
                    color: theme.text
                  }
                ]}
                multiline={true}
                numberOfLines={4}
                placeholder="Please share your feedback or suggestions..."
                placeholderTextColor={isDarkMode ? '#888888' : '#999'}
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Array.isArray(theme.gradientColors) && theme.gradientColors.length >= 2 
                    ? [theme.gradientColors[0], theme.gradientColors[1]] as [string, string]
                    : ['#4B6BFE', '#3451E1'] as [string, string]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: isDarkMode ? '#BBBBBB' : '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    maxHeight: '90%',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
  },
  starContainer: {
    paddingHorizontal: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
  },
  categorySelected: {
    backgroundColor: '#E8EDFF',
    borderColor: '#4B6BFE',
  },
  categoryText: {
    fontSize: 14,
    color: '#777',
  },
  categoryTextSelected: {
    color: '#4B6BFE',
    fontWeight: 'bold',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    marginTop: 25,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  }
}); 