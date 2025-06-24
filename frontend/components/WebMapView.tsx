import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import env from '../constants/environment';
import '../styles/WebMapView.css';

interface WebMapViewProps {
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
  locations?: {
    driver?: { latitude: number; longitude: number };
    passenger?: { latitude: number; longitude: number };
  };
  mapStyle?: any[];
  showLocationButton?: boolean;
}

/**
 * A web-compatible map component that renders Google Maps
 * This is used as a fallback when react-native-maps is not available on web
 */
const WebMapView: React.FC<WebMapViewProps> = (props) => {
  // Only continue with the component if we're on web platform
  if (Platform.OS !== 'web') {
    return null;
  }

  // Destructure props after the early return
  const { 
    style, 
    initialRegion,
    children,
    showsUserLocation,
    locations,
    mapStyle,
    showLocationButton = true
  } = props;

  const [mapError, setMapError] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  
  const latitude = initialRegion?.latitude || 14.6091;
  const longitude = initialRegion?.longitude || 121.0223;
  const zoom = 15;
  const apiKey = env.googleMapsApiKey;
  const mapId = env.googleMapsId;

  // Parse children to find polyline components
  const findPolylines = () => {
    if (!children) return [];
    
    const polylines: any[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && 
          child.type && 
          typeof child.type === 'function' && 
          (child.type as any).name === 'WebPolyline') {
        polylines.push(child.props);
      }
    });
    
    return polylines;
  };

  // Load the Google Maps API script
  useEffect(() => {
    if (!apiKey) {
      setMapError(true);
      console.error('Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
      return;
    }
    
    // Define the callback function in the window scope
    window.initGoogleMap = () => {
      console.log('Google Maps API loaded');
      setMapLoaded(true);
    };
    
    // Add specific error handling for Google Maps API errors
    window.gm_authFailure = () => {
      setMapError(true);
      console.error('Google Maps authentication error: The API key may not be valid or billing is not enabled');
    };
    
    // Check if the script is already loaded
    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&loading=async&libraries=marker&v=beta`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        setMapError(true);
        console.error('Failed to load Google Maps API');
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Cleanup script when component unmounts
        if (document.getElementById('google-maps-script')) {
          document.head.removeChild(script);
        }
        
        // Clean up global functions
        delete window.initGoogleMap;
        delete window.gm_authFailure;
      };
    } else if (window.google && window.google.maps) {
      // If script exists and maps is loaded, set loaded state
      setMapLoaded(true);
    }
  }, [apiKey]);
  
  // Initialize the map once the API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    try {
      // Create map instance
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
        // Only use mapId if it exists, otherwise use styles
        ...(mapId ? { mapId } : { styles: mapStyle || [] })
      });
      
      // Remove any existing location button first
      const existingLocationButton = document.getElementById("custom-location-button");
      if (existingLocationButton) {
        try {
          existingLocationButton.parentNode?.removeChild(existingLocationButton);
        } catch (error) {
          console.error('Error removing existing location button:', error);
        }
      }
      
      // Only create the location button if showLocationButton is true
      if (showLocationButton) {
        // Enable the built-in My Location control
        const locationButton = document.createElement("button");
        locationButton.id = "custom-location-button";
        locationButton.classList.add("custom-map-location-button");
        locationButton.style.background = "none rgb(255, 255, 255)";
        locationButton.style.border = "0px";
        locationButton.style.margin = "10px";
        locationButton.style.padding = "0px";
        locationButton.style.cursor = "pointer";
        locationButton.style.borderRadius = "50%"; // Make it circular
        locationButton.style.height = "40px"; // Standard size
        locationButton.style.width = "40px";  // Standard size
        locationButton.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
        locationButton.style.display = "flex";
        locationButton.style.alignItems = "center";
        locationButton.style.justifyContent = "center";
        locationButton.style.position = "absolute";
        locationButton.style.bottom = "80px"; // Position it closer to the bottom of the screen
        locationButton.style.right = "10px";
        locationButton.style.zIndex = "10"; // Higher z-index to ensure it's above other elements
        locationButton.title = "Your Location";
        
        // Add a visual feedback effect when hovering
        locationButton.onmouseover = () => {
          locationButton.style.backgroundColor = "#f8f8f8";
          locationButton.style.transform = "scale(1.05)";
        };
        
        locationButton.onmouseout = () => {
          locationButton.style.backgroundColor = "rgb(255, 255, 255)";
          locationButton.style.transform = "scale(1)";
        };
        
        // Add a visual feedback effect when clicking
        locationButton.onmousedown = () => {
          locationButton.style.backgroundColor = "#e8e8e8";
          locationButton.style.transform = "scale(0.95)";
        };
        
        locationButton.onmouseup = () => {
          locationButton.style.backgroundColor = "rgb(255, 255, 255)";
          locationButton.style.transform = "scale(1)";
        };
        
        // Create an SVG for the location icon instead of using an image
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("viewBox", "0 0 24 24");
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("fill", "#1A73E8");
        path.setAttribute("d", "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z");
        
        svg.appendChild(path);
        locationButton.appendChild(svg);
        
        locationButton.addEventListener("click", () => {
          if (navigator.geolocation) {
            // Show a loading state on the button
            locationButton.innerHTML = `
              <div style="width: 18px; height: 18px; border: 2px solid #1A73E8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            `;
            
            // Add a style for the spinner animation
            if (!document.getElementById('location-spinner-style')) {
              const style = document.createElement('style');
              style.id = 'location-spinner-style';
              style.textContent = `
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `;
              document.head.appendChild(style);
            }
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                
                // Reset the button content
                locationButton.innerHTML = '';
                svg.appendChild(path);
                locationButton.appendChild(svg);
                
                googleMapRef.current.setCenter(pos);
                googleMapRef.current.setZoom(15);
                
                // Update the user marker if it exists, otherwise create a new one
                const existingUserMarker = mapMarkersRef.current.find(marker => marker.getTitle() === "Your Location");
                
                if (existingUserMarker) {
                  existingUserMarker.setPosition(pos);
                } else {
                  try {
                    // Try to use advanced marker if available
                    if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
                      const userMarkerElement = document.createElement('div');
                      userMarkerElement.innerHTML = `
                        <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #4285F4; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,.3); position: relative;">
                          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                        </div>
                      `;
                      
                      const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
                        position: pos,
                        map: googleMapRef.current,
                        title: "Your Location",
                        content: userMarkerElement
                      });
                      
                      mapMarkersRef.current.push(userMarker);
                    } else {
                      throw new Error("AdvancedMarkerElement not available");
                    }
                  } catch (error) {
                    // Fallback to legacy Marker
                    console.log("Using legacy marker for user location:", error);
                    const userMarker = new window.google.maps.Marker({
                      position: pos,
                      map: googleMapRef.current,
                      title: "Your Location",
                      icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF"
                      }
                    });
                    
                    mapMarkersRef.current.push(userMarker);
                  }
                }
              },
              (error) => {
                // Reset the button content
                locationButton.innerHTML = '';
                svg.appendChild(path);
                locationButton.appendChild(svg);
                
                console.error('Error getting user location:', error);
                
                // Show a user-friendly error message
                let errorMessage = 'Could not get your location. ';
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    errorMessage += 'Please allow location access in your browser settings.';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                  case error.TIMEOUT:
                    errorMessage += 'The request to get your location timed out.';
                    break;
                  default:
                    errorMessage += 'An unknown error occurred.';
                }
                
                // Create a toast notification
                const toast = document.createElement('div');
                toast.style.position = 'absolute';
                toast.style.bottom = '140px';
                toast.style.right = '10px';
                toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                toast.style.color = 'white';
                toast.style.padding = '10px 15px';
                toast.style.borderRadius = '4px';
                toast.style.maxWidth = '300px';
                toast.style.zIndex = '1000';
                toast.style.fontSize = '14px';
                toast.textContent = errorMessage;
                
                if (mapRef.current) {
                  mapRef.current.appendChild(toast);
                  
                  // Remove the toast after 5 seconds
                  setTimeout(() => {
                    if (toast.parentNode) {
                      toast.parentNode.removeChild(toast);
                    }
                  }, 5000);
                }
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          } else {
            console.error('Geolocation is not supported by this browser');
            
            // Show a user-friendly error message
            const toast = document.createElement('div');
            toast.style.position = 'absolute';
            toast.style.bottom = '140px';
            toast.style.right = '10px';
            toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            toast.style.color = 'white';
            toast.style.padding = '10px 15px';
            toast.style.borderRadius = '4px';
            toast.style.maxWidth = '300px';
            toast.style.zIndex = '1000';
            toast.style.fontSize = '14px';
            toast.textContent = 'Geolocation is not supported by your browser.';
            
            if (mapRef.current) {
              mapRef.current.appendChild(toast);
              
              // Remove the toast after 5 seconds
              setTimeout(() => {
                if (toast.parentNode) {
                  toast.parentNode.removeChild(toast);
                }
              }, 5000);
            }
          }
        });
        
        mapRef.current.appendChild(locationButton);
      }
      
      // Automatically center map on user location if showsUserLocation is true
      if (showsUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            googleMapRef.current.setCenter(pos);
            
            // Create a user location marker using AdvancedMarkerElement if available
            try {
              if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
                // Create a marker with the modern API
                const userMarkerElement = document.createElement('div');
                userMarkerElement.className = 'user-location-marker';
                userMarkerElement.style.backgroundColor = '#007AFF';
                userMarkerElement.style.borderRadius = '50%';
                userMarkerElement.style.border = '2px solid white';
                userMarkerElement.style.width = '16px';
                userMarkerElement.style.height = '16px';
                userMarkerElement.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
                
                const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
                  position: pos,
                  map: googleMapRef.current,
                  title: "Your Location",
                  content: userMarkerElement
                });
                mapMarkersRef.current.push(userMarker);
              } else {
                throw new Error("AdvancedMarkerElement not available");
              }
            } catch (error) {
              // Fallback to legacy Marker
              console.log("Using legacy marker instead:", error);
              const userMarker = new window.google.maps.Marker({
                position: pos,
                map: googleMapRef.current,
                title: "Your Location",
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#007AFF",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF"
                }
              });
              mapMarkersRef.current.push(userMarker);
            }
          },
          () => {
            console.log("Error: The Geolocation service failed.");
          }
        );
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }

    // Clean up when component unmounts or showLocationButton changes
    return () => {
      // Remove the location button from the DOM if it exists
      const locationButton = document.getElementById("custom-location-button");
      if (locationButton) {
        try {
          locationButton.parentNode?.removeChild(locationButton);
        } catch (error) {
          console.error('Error removing location button:', error);
        }
      }
      
      // Clean up polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [mapLoaded, latitude, longitude, zoom, locations, showsUserLocation, mapStyle, showLocationButton]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    
    try {
      // Clear existing markers
      mapMarkersRef.current.forEach(marker => marker.setMap(null));
      mapMarkersRef.current = [];
      
      // Add driver marker if available
      if (locations?.driver) {
        try {
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            // Create a marker with the modern API
            const driverMarkerElement = document.createElement('div');
            driverMarkerElement.className = 'driver-location-marker';
            
            // Use FontAwesome car icon
            driverMarkerElement.innerHTML = `
              <div style="background-color: #4dabf7; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                <i class="fas fa-car" style="color: white; font-size: 16px;"></i>
              </div>
            `;
            
            const driverMarker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { 
                lat: locations.driver.latitude, 
                lng: locations.driver.longitude 
              },
              map: googleMapRef.current,
              title: "Driver",
              content: driverMarkerElement
            });
            mapMarkersRef.current.push(driverMarker);
          } else {
            throw new Error("AdvancedMarkerElement not available");
          }
        } catch (error) {
          // Fallback to legacy Marker
          console.log("Using legacy marker for driver:", error);
          const driverMarker = new window.google.maps.Marker({
            position: { 
              lat: locations.driver.latitude, 
              lng: locations.driver.longitude 
            },
            map: googleMapRef.current,
            title: "Driver",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4dabf7",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF"
            }
          });
          mapMarkersRef.current.push(driverMarker);
        }
      }
      
      // Add passenger marker if available
      if (locations?.passenger) {
        try {
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            // Create a marker with the modern API
            const passengerMarkerElement = document.createElement('div');
            passengerMarkerElement.className = 'passenger-location-marker';
            
            // Use FontAwesome user icon
            passengerMarkerElement.innerHTML = `
              <div style="background-color: #FF3B30; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                <i class="fas fa-user" style="color: white; font-size: 16px;"></i>
              </div>
            `;
            
            const passengerMarker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { 
                lat: locations.passenger.latitude, 
                lng: locations.passenger.longitude 
              },
              map: googleMapRef.current,
              title: "Passenger",
              content: passengerMarkerElement
            });
            mapMarkersRef.current.push(passengerMarker);
          } else {
            throw new Error("AdvancedMarkerElement not available");
          }
        } catch (error) {
          // Fallback to legacy Marker
          console.log("Using legacy marker for passenger:", error);
          const passengerMarker = new window.google.maps.Marker({
            position: { 
              lat: locations.passenger.latitude, 
              lng: locations.passenger.longitude 
            },
            map: googleMapRef.current,
            title: "Passenger",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#FF3B30",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF"
            }
          });
          mapMarkersRef.current.push(passengerMarker);
        }
      }
      
      // Draw polyline between driver and passenger if both are available
      if (locations?.driver && locations?.passenger) {
        // Remove existing polyline
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }
        
        // Create new polyline
        const polylinePath = [
          { lat: locations.driver.latitude, lng: locations.driver.longitude },
          { lat: locations.passenger.latitude, lng: locations.passenger.longitude }
        ];
        
        polylineRef.current = new window.google.maps.Polyline({
          path: polylinePath,
          geodesic: true,
          strokeColor: '#4dabf7',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: googleMapRef.current
        });
      }
      
      // Also render any polylines from children
      const polylines = findPolylines();
      polylines.forEach(polylineProps => {
        if (polylineProps.coordinates && polylineProps.coordinates.length >= 2) {
          const path = polylineProps.coordinates.map(coord => ({
            lat: coord.latitude,
            lng: coord.longitude
          }));
          
          new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: polylineProps.strokeColor || '#4dabf7',
            strokeOpacity: polylineProps.strokeOpacity || 0.8,
            strokeWeight: polylineProps.strokeWidth || 3,
            map: googleMapRef.current
          });
        }
      });
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [mapLoaded, locations, children]);

  if (!apiKey) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Google Maps API key is missing</Text>
        <Text style={styles.errorSubText}>
          Please add your Google Maps API key to the environment variables.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {mapError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Map could not be loaded
          </Text>
          <Text style={styles.errorSubText}>
            The Google Maps API key may be invalid, or billing may not be enabled for this project.
            Please check the Google Cloud Console to enable billing for the Maps JavaScript API.
          </Text>
        </View>
      ) : (
        <div 
          ref={mapRef}
          className="map-iframe"
          style={styles.mapDiv}
        />
      )}
      
      {/* Render a placeholder for children components */}
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
};

// Web Polyline component for compatibility with react-native-maps Polyline
interface WebPolylineProps {
  coordinates: Array<{latitude: number, longitude: number}>;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  lineDashPattern?: number[];
  [key: string]: any; // Allow any other props
}

const WebPolyline = (props: WebPolylineProps) => {
  // This is just a placeholder component that gets parsed by WebMapView
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  childrenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    padding: 20,
  },
  errorSubText: {
    color: '#6c757d',
    textAlign: 'center',
    padding: 10,
  },
  mapDiv: {
    width: '100%',
    height: '100%',
  }
});

// Add types for global window object
declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Marker: any;
        Polyline: any;
        LatLng: any;
        LatLngBounds: any;
        event: any;
        ControlPosition: any;
        SymbolPath: any;
        marker?: {
          AdvancedMarkerElement: any;
        }
      };
    };
    initGoogleMap: (() => void) | undefined;
    gm_authFailure: (() => void) | undefined;
  }
}

export { WebPolyline };
export default WebMapView; 