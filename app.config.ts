import type { ExpoConfig, ConfigContext } from 'expo/config'

const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true'

const splash = {
  backgroundColor: '#ffffff',
  image: './assets/images/splash-icon.png',
  resizeMode: 'contain' as const,
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Baby Patterns',
  slug: 'baby-patterns',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'babypatterns',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.babypatterns.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.babypatterns.app',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(allowCleartext ? { usesCleartextTraffic: true } : {}),
  } as ExpoConfig['android'],
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        ...splash,
        dark: splash,
        android: splash,
        ios: splash,
      },
    ],
    '@react-native-community/datetimepicker',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Baby Patterns to access your photos for profile pictures.',
        cameraPermission: 'Allow Baby Patterns to use your camera for profile pictures.',
      },
    ],
    'expo-sharing',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#8B3FA8',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
