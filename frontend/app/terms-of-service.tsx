import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function TermsOfService() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  const goToLandingPage = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing or using the PARAda application and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These Terms of Service apply to all visitors, users, and others who access or use the PARAda service.'
    },
    {
      title: 'Account Registration',
      content: 'To use certain features of our service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.'
    },
    {
      title: 'User Conduct',
      content: 'You agree not to use the PARAda service for any illegal or unauthorized purpose. You agree to comply with all laws, rules, and regulations applicable to your use of the service. You agree not to interfere with or disrupt the service or servers or networks connected to the service.'
    },
    {
      title: 'Payment Terms',
      content: 'Certain aspects of the service may be provided for a fee. You will be responsible for paying all applicable fees for the services you use. Payment terms will be specified at the time of purchase. All payments are non-refundable unless otherwise specified or required by law.'
    },
    {
      title: 'Intellectual Property',
      content: 'The PARAda service and its original content, features, and functionality are owned by PARAda and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our service.'
    },
    {
      title: 'Limitation of Liability',
      content: 'In no event shall PARAda, its officers, directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.'
    },
    {
      title: 'Termination',
      content: 'We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.'
    },
    {
      title: 'Changes to Terms',
      content: 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days\' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.'
    },
    {
      title: 'Governing Law',
      content: 'These Terms shall be governed and construed in accordance with the laws of the Philippines, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.'
    }
  ];

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
            <Text style={styles.headerTitle}>Terms of Service</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.introSection}>
          <ThemedText type="title" style={styles.pageTitle}>Terms of Service</ThemedText>
          <Text style={[styles.lastUpdated, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Last Updated: May 1, 2023
          </Text>
          <Text style={[styles.introText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
            Welcome to PARAda. These Terms of Service govern your use of the PARAda application and services 
            provided by PARAda Transportation. By using our services, you agree to these terms. Please read 
            them carefully.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <Text style={[styles.sectionContent, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <ThemedText type="defaultSemiBold" style={styles.contactTitle}>
            Questions About Our Terms?
          </ThemedText>
          <Text style={[styles.contactText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
            If you have any questions about these Terms of Service, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <FontAwesome5 name="envelope" size={16} color={colors.primary} style={styles.contactIcon} />
              <Text style={[styles.contactDetail, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                legal@parada.com
              </Text>
            </View>
            <View style={styles.contactItem}>
              <FontAwesome5 name="phone" size={16} color={colors.primary} style={styles.contactIcon} />
              <Text style={[styles.contactDetail, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                +63 991 314 2960
              </Text>
            </View>
            <View style={styles.contactItem}>
              <FontAwesome5 name="map-marker-alt" size={16} color={colors.primary} style={styles.contactIcon} />
              <Text style={[styles.contactDetail, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                Toledo, Toledo City, Philippines
              </Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
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
              <Text style={styles.contactButtonText}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: isDarkMode ? '#333333' : '#EEEEEE' }]}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.location.href = '/privacy-policy';
                } else {
                  router.push('/privacy-policy');
                }
              }}
            >
              <Text style={[styles.contactButtonText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
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
  contentContainer: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  introSection: {
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
  contactSection: {
    marginTop: 30,
    marginBottom: 40,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  contactTitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  contactInfo: {
    marginBottom: 25,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactIcon: {
    marginRight: 10,
    width: 20,
  },
  contactDetail: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    margin: 10,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 