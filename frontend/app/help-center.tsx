import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function HelpCenter() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const goToLandingPage = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  const faqItems = [
    {
      question: 'How do I track my transportation in real-time?',
      answer: 'Open the PARAda app and navigate to the "Track" tab. Your current transportation options will be displayed on the map with real-time location updates.'
    },
    {
      question: 'How do I schedule a ride?',
      answer: 'Go to the "Schedule" section in the app, select your pickup location, destination, and preferred time. You can then choose from available transportation options.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'PARAda accepts various payment methods including credit/debit cards, mobile wallets, and in some locations, cash payments directly to drivers.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our customer support team through the app\'s "Help" section, by emailing support@parada.com, or by calling our support line at +63 991 314 2960.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, PARAda uses industry-standard encryption and security measures to protect your personal information. You can review our Privacy Policy for more details.'
    },
    {
      question: 'How do I become a driver for PARAda?',
      answer: 'Visit our Careers page or contact us directly. You\'ll need to meet certain requirements including a valid driver\'s license, vehicle registration, and background check.'
    }
  ];

  const helpCategories = [
    { icon: 'user-circle', title: 'Account Help' },
    { icon: 'map-marked-alt', title: 'Using the App' },
    { icon: 'credit-card', title: 'Payments' },
    { icon: 'shield-alt', title: 'Safety & Security' },
    { icon: 'car', title: 'Transportation' },
    { icon: 'headset', title: 'Technical Support' }
  ];

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goToLandingPage} style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Help Center</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.heroSection}>
        <ThemedText type="title" style={styles.heroTitle}>How Can We Help You?</ThemedText>
        <Text style={[styles.heroDescription, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Find answers to common questions and learn how to get the most out of PARAda.
        </Text>

        <View style={[styles.searchContainer, { 
          backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
          borderColor: isDarkMode ? '#333333' : '#DDDDDD' 
        }]}>
          <FontAwesome5 name="search" size={16} color={isDarkMode ? '#BBBBBB' : '#666666'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}
            placeholder="Search for help topics..."
            placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <ThemedText type="title" style={styles.sectionTitle}>Help Categories</ThemedText>
        <View style={styles.categoriesGrid}>
          {helpCategories.map((category, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryCard, { 
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'
              }]}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: colors.primary }]}>
                <FontAwesome5 name={category.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.categoryTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.faqSection}>
        <ThemedText type="title" style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
        
        {faqItems.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.faqItem, 
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }
            ]}
          >
            <TouchableOpacity 
              style={styles.faqQuestion}
              onPress={() => toggleFaq(index)}
            >
              <Text style={[styles.questionText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                {item.question}
              </Text>
              <FontAwesome5 
                name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={isDarkMode ? '#BBBBBB' : '#666666'} 
              />
            </TouchableOpacity>
            
            {expandedFaq === index && (
              <View style={styles.faqAnswer}>
                <Text style={[styles.answerText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  {item.answer}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.contactSection}>
        <ThemedText type="title" style={styles.sectionTitle}>Still Need Help?</ThemedText>
        <Text style={[styles.contactText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          Our support team is always ready to assist you with any questions or issues.
        </Text>
        
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = '/contact';
              } else {
                router.push('/contact');
              }
            }}
          >
            <FontAwesome5 name="envelope" size={16} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Contact Us</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: isDarkMode ? '#333333' : '#EEEEEE' }]}
            onPress={() => Linking.openURL('mailto:support@parada.com')}
          >
            <FontAwesome5 name="headset" size={16} color={isDarkMode ? '#FFFFFF' : '#333333'} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerTitle: { 
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  heroTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 500,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
  },
  categoriesSection: {
    padding: 20,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryCard: {
    width: 150,
    height: 130,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  faqSection: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  faqItem: {
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionText: {
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  answerText: {
    lineHeight: 22,
  },
  contactSection: {
    padding: 30,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 30,
  },
  contactText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 10,
    marginBottom: 10,
    minWidth: 140,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 