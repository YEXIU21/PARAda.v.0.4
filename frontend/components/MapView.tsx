import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import WebMapView from './WebMapView';
import { usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

// Only import react-native-maps on non-web platforms
let NativeMapView: any = null;
if (Platform.OS !== 'web') {
  // Dynamic import to avoid importing on web
  NativeMapView = require('react-native-maps').default;
}

interface MapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  children?: React.ReactNode;
  showLocationButton?: boolean;
  [key: string]: any; // Allow any other props
}

/**
 * A cross-platform MapView component that uses the appropriate implementation
 * based on the platform (react-native-maps on native, WebMapView on web)
 */
const MapView: React.FC<MapViewProps> = (props) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [shouldShowLocationButton, setShouldShowLocationButton] = useState(props.showLocationButton);
  
  // Use useEffect to immediately respond to pathname changes
  useEffect(() => {
    let showButton = props.showLocationButton;
    
    // Only show location button on the home tab
    if (pathname !== '/' && pathname !== '/index') {
        showButton = false;
    }
    
    setShouldShowLocationButton(showButton);
  }, [pathname, props.showLocationButton]);
  
  // Update props with our conditional logic
  const updatedProps = {
    ...props,
    showLocationButton: shouldShowLocationButton
  };
  
  // Use WebMapView on web, NativeMapView on native platforms
  if (Platform.OS === 'web') {
    return <WebMapView {...updatedProps} />;
  }
  
  // Use react-native-maps on native platforms
  return <NativeMapView {...updatedProps} />;
};

// Export any needed sub-components from react-native-maps
const Marker = Platform.OS === 'web' 
  ? (props: any) => null // Placeholder for web
  : require('react-native-maps').Marker;

const Polyline = Platform.OS === 'web'
  ? (props: any) => null // Placeholder for web
  : require('react-native-maps').Polyline;

export { Marker, Polyline };
export default MapView; 