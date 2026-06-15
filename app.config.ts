import type { ExpoConfig, ConfigContext } from 'expo/config'

const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true'

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
      backgroundColor: '#EDE6FA',
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
        backgroundColor: '#F8F4FF',
        image: './assets/images/splash.png',
        resizeMode: 'cover',
        dark: {
          backgroundColor: '#0a0c10',
          image: './assets/images/splash-dark.png',
          resizeMode: 'cover',
        },
        android: {
          image: './assets/images/splash.png',
          resizeMode: 'cover',
          dark: {
            image: './assets/images/splash-dark.png',
            resizeMode: 'cover',
          },
        },
        ios: {
          image: './assets/images/splash.png',
          resizeMode: 'cover',
          dark: {
            image: './assets/images/splash-dark.png',
            resizeMode: 'cover',
          },
        },
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
