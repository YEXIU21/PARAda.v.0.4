// Jest setup file
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock canvas-related modules
jest.mock('canvas', () => ({}), { virtual: true });

// Mock Expo modules that might cause issues
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      expoClient: {
        releaseChannel: 'development'
      }
    }
  }
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: class MockMapView extends React.Component {
      render() {
        return React.createElement('MockMapView', this.props, this.props.children);
      }
    },
    Marker: class MockMarker extends React.Component {
      render() {
        return React.createElement('MockMarker', this.props, this.props.children);
      }
    },
    Polyline: class MockPolyline extends React.Component {
      render() {
        return React.createElement('MockPolyline', this.props, this.props.children);
      }
    }
  };
}); 