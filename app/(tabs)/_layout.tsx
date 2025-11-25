// Polyfill-uri necesare pentru funcționalități native (ex: FormData pe Android)
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
// Folosim Ionicons pentru că e mai sigur și are iconițele de care ai nevoie rapid
import Ionicons from '@expo/vector-icons/Ionicons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/Colors';
import { useLocations } from '@/context/LocationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { viewMode } = useLocations();

  return (
    <Tabs
      initialRouteName="index" // Setăm ecranul 'index' (Explore) ca fiind cel inițial
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0)', // Asigură transparența pentru blur
          },
          default: {
            backgroundColor: theme.headerBackground, // Culoare fundal pentru Android
          },
        }),
      }}>
      
      {/* 1. CHAT / AI - Legat de fișierul chat.tsx */}
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color }) => <Ionicons size={28} name="chatbubbles-sharp" color={color} />,
          tabBarLabel: 'AI Guide',
        }}
      />

      {/* 2. EXPLORE (Harta + Lista) - Butonul central */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: () => null, // Setăm eticheta ca fiind goală, fără a afecta celelalte tab-uri
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: Platform.OS === 'ios' ? 5 : -5 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.tint, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}>
                <Ionicons size={32} name={viewMode === 'list' ? 'map' : 'list'} color={focused ? '#fff' : '#f0f0f0'} />
              </View>
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Verificăm dacă tab-ul este deja focalizat
            if (navigation.isFocused()) {
              // Prevenim acțiunea default (care nu ar face nimic)
              e.preventDefault();
              // Navigăm la ecranul 'index' cu un parametru care se schimbă
              // pentru a declanșa un efect în ecranul respectiv.
              navigation.navigate('index', {
                toggleView: Date.now(),
              });
            }
          },
        })}
      />

      {/* 3. PROFILE - Legat de fișierul profile.tsx */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person" color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}