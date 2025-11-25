import { ConfigContext, ExpoConfig } from 'expo/config';
// Încarcă variabilele de mediu din fișierul .env
require('dotenv').config();

const { Colors } = require('./constants/Colors.ts');

const brandColor = Colors.light.tint.substring(0, 7); 

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Take a break',
  slug: 'thecon-hackathon-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'theconhackathonapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: Colors.light.background,
    dark: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: Colors.dark.background,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.thecon.hackathon.app' // Opțional, dar recomandat și pentru iOS
  },
  android: {
    // 👇👇 AICI AM ADĂUGAT PACKAGE NAME-UL NECESAR 👇👇
    package: 'com.thecon.hackathon.app', 
    // 👆👆 Poți schimba acest nume, dar trebuie să arate ca un domeniu inversat (com.ceva.nume)
    
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: brandColor,
    },
    // 👇👇 AICI ADĂUGĂM CONFIGURAREA PENTRU GOOGLE MAPS 👇👇
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY // Citim cheia din .env
      }
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: "aa00ba97-c028-43ca-a72d-52cdafeb6def"
    }
  }
});