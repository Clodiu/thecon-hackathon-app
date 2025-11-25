import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocationsProvider } from '@/context/LocationsContext';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Previne ascunderea automată a ecranului de splash înainte ca aplicația să fie gata.
SplashScreen.preventAutoHideAsync();

/**
 * Componentă internă care așteaptă inițializarea contextului de autentificare
 * înainte de a afișa restul aplicației.
 */
function AppContent() {
  const { loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Când încărcarea s-a terminat, ascundem ecranul de splash.
    if (!authLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading]);

  // Cât timp se încarcă, nu returnăm nimic. Ecranul de splash nativ va fi vizibil.
  if (authLoading) {
    return null;
  }
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationsProvider>
        <AppContent />
      </LocationsProvider>
    </AuthProvider>
  );
}
