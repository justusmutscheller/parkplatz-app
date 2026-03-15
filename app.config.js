module.exports = ({ config }) => ({
  ...config,
  name: 'ParkPlatz',
  slug: 'parkplatz-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'parkplatz',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#2563EB',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.parkplatz.app',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'ParkPlatz needs your location to find nearby parking spots.',
      NSCameraUsageDescription:
        'ParkPlatz needs camera access for document verification.',
      NSPhotoLibraryUsageDescription:
        'ParkPlatz needs photo library access for document uploads.',
    },
  },
  android: {
    package: 'com.parkplatz.app',
    adaptiveIcon: {
      backgroundColor: '#2563EB',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    'expo-location',
    'expo-camera',
    'expo-image-picker',
    'expo-document-picker',
  ],
  extra: {
    eas: {
      projectId: 'f1c1b984-69ef-4909-8111-f488de3cdab5',
    },
  },
});
