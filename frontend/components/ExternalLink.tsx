import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children }: ExternalLinkProps) {
  // For external links, use Linking instead of expo-router Link
  const handlePress = () => {
    Linking.openURL(href);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
}
