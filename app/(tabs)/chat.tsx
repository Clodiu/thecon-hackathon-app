import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocationExpo from 'expo-location';
import { useNavigation } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useLocations, UserCoordinates } from '@/context/LocationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateChatResponse } from '@/services/GeminiService';

interface Message {
  id: string;
  role: 'user' | 'model' | 'loading';
  text: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! 👋 I'm your AI guide. How can I help you explore the city today?",
    },
  ]);
  const [input, setInput] = useState('');
  const { locations, setRecommendedLocation, userLocation, setUserLocation } = useLocations();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Creăm o listă detaliată a locațiilor pentru a o trimite la AI
  const locationsInfo = useMemo(
    () =>
      locations
        .map(loc => `Nume: ${loc.name}; Adresă: ${loc.address}; Descriere: ${loc.short_description}; Rating: ${loc.rating}/5`)
        .join('\n- '),
    [locations]);

  const handleSend = useCallback(async () => {
    if (input.trim().length === 0) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    const loadingMessage: Message = { id: 'loading', role: 'loading', text: 'Typing...' };
    let finalLocationsInfo = locationsInfo;
    let currentUserLocation = userLocation;

    // Verificăm dacă mesajul conține cuvinte cheie pentru locație și dacă avem permisiunea
    const locationKeywords = ['near me', 'around me', 'nearby', 'aproape de mine', 'lângă mine', 'în jur'];
    if (locationKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
      if (!currentUserLocation) {
        // Dacă nu avem locația, o cerem acum
        let { status } = await LocationExpo.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location is needed to find places near you. Please enable it in settings.');
          setMessages(prev => [...prev, { id: 'error', role: 'model', text: "I can't find places near you without location access." }]);
          return;
        }
        try {
          const location = await LocationExpo.getCurrentPositionAsync({});
          currentUserLocation = location.coords as UserCoordinates;
          setUserLocation(currentUserLocation); // Salvăm în context pentru viitor
        } catch (error) {
          console.error("Could not get user location for chat", error);
        }
      }
      if (currentUserLocation) {
        finalLocationsInfo += `\n\nUser's current location (latitude, longitude): ${currentUserLocation.latitude}, ${currentUserLocation.longitude}. Use this to find nearby places.`;
      }
    }

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    flatListRef.current?.scrollToEnd({ animated: true });

    // Pregătim istoricul pentru API
    const history = messages.map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    }));
    history.push({ role: 'user', parts: [{ text: userMessage.text }] });

    const aiResponseText = await generateChatResponse(history, finalLocationsInfo);

    if (aiResponseText) {
      // Căutăm dacă răspunsul AI conține numele unei locații
      const recommendedLoc = locations.find(loc => aiResponseText.includes(loc.name));

      if (recommendedLoc) {
        setRecommendedLocation(recommendedLoc);
        // @ts-ignore - Navigarea către un tab specific
        navigation.navigate('index');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
      };
      setMessages(prev => [...prev.filter(m => m.id !== 'loading'), aiMessage]);
    } else {
      // Eliminăm "Typing..." dacă a apărut o eroare
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
    }
  }, [input, messages, locations, locationsInfo, setRecommendedLocation, navigation, userLocation, setUserLocation]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    if (item.role === 'loading') {
      return (
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: theme.card }]}>
          <ActivityIndicator size="small" color={theme.text} />
        </View>
      );
    }
    return (
      <View
        style={[
          styles.bubble,
          isUser ? [styles.userBubble, { backgroundColor: theme.tint }] : [styles.aiBubble, { backgroundColor: theme.card }],
        ]}
      >
        <Text style={isUser ? styles.userText : [styles.aiText, { color: theme.text }]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={[styles.inputContainer, { backgroundColor: theme.headerBackground, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            value={input}
            onChangeText={setInput}
            placeholder="Write a message..."
            placeholderTextColor={theme.subtext}
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.tint }]} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  aiText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 19, // 12px original + 7px extra
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});