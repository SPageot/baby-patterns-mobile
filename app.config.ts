import type { ExpoConfig, ConfigContext } from 'expo/config'

const PUBLIC_SITE_URL = 'https://baby-pattern.com'
const PRIVACY_POLICY_URL = `${PUBLIC_SITE_URL}/privacy`
const TERMS_OF_SERVICE_URL = `${PUBLIC_SITE_URL}/terms`

const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true'

const splash = {
  backgroundColor: '#ffffff',
  image: './assets/images/splash-icon.png',
  resizeMode: 'contain' as const,
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Baby Pattern',
  slug: 'baby-pattern',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'babypattern',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.babypattern.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.babypattern.app',
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
        photosPermission: 'Allow Baby Pattern to access your photos for profile pictures.',
        cameraPermission: 'Allow Baby Pattern to use your camera for profile pictures.',
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
  extra: {
    ...config.extra,
    siteUrl: PUBLIC_SITE_URL,
    privacyPolicyUrl: PRIVACY_POLICY_URL,
    termsUrl: TERMS_OF_SERVICE_URL,
    supportEmail: 'admin@baby-pattern.com',
    androidPackage: 'com.babypattern.app',
    eas: {
      projectId: '187a1cf9-64ce-46ec-9dc4-8774c8874d7e',
    },
  },
})
