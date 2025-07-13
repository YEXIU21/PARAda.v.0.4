import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { useRouter } from 'expo-router';

export default function PrivacyPolicy() {
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
      title: 'Information We Collect',
      content: 'We collect personal information that you provide to us, such as your name, email address, phone number, and payment information when you register for an account or use our services. We also automatically collect certain information about your device and how you interact with our app, including your IP address, device type, operating system, browser type, and usage data.'
    },
    {
      title: 'How We Use Your Information',
      content: 'We use your information to provide, maintain, and improve our services, process transactions, send notifications, communicate with you, and personalize your experience. We may also use your information for research and analytics purposes to better understand how users interact with our app and services.'
    },
    {
      title: 'Information Sharing',
      content: 'We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and customer service. We may also share information when required by law, to protect our rights, or in connection with a business transfer.'
    },
    {
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect the security of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.'
    },
    {
      title: 'Your Rights and Choices',
      content: 'You may access, update, or delete your account information at any time through your account settings. You can also opt out of receiving promotional communications from us by following the instructions in those communications. Please note that even if you opt out, we may still send you non-promotional messages, such as those about your account or our ongoing business relations.'
    },
    {
      title: 'Children\'s Privacy',
      content: 'Our services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will promptly delete that information.'
    },
    {
      title: 'Changes to This Privacy Policy',
      content: 'We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.'
    },
    {
      title: 'Contact Us',
      content: 'If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@parada.com or through our Contact page.'
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.introSection}>
          <ThemedText type="title" style={styles.pageTitle}>Privacy Policy</ThemedText>
          <Text style={[styles.lastUpdated, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Last Updated: May 1, 2025
          </Text>
          <Text style={[styles.introText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
            At PARAda, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
            transportation tracking services. Please read this policy carefully to understand our practices regarding your 
            personal data.
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
            Questions or Concerns?
          </ThemedText>
          <Text style={[styles.contactText, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
            If you have any questions about our privacy practices, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <FontAwesome5 name="envelope" size={16} color={colors.primary} style={styles.contactIcon} />
              <Text style={[styles.contactDetail, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                privacy@parada.com
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
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 