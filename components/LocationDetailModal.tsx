// Fișier: components/LocationDetailModal.tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert // Am adăugat Alert pentru debugging vizual
  ,








  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// 👇 Asigură-te că calea este corectă către fișierul de la Pasul 2
import { generateLocationVibe } from '../services/GeminiService';

interface Location {
  name: string;
  address: string;
  coordinates: { lat: number; long: number; };
  image_url: string;
  short_description: string;
  rating: number;
}

interface ModalProps {
  visible: boolean;
  location: Location | null;
  onClose: () => void;
  theme: any;
}

export default function LocationDetailModal({ visible, location, onClose, theme }: ModalProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [description, setDescription] = useState('');
  
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);
  const context = useSharedValue({ y: 0 });
  const scrollRef = useRef(null);
  const scrollPosition = useSharedValue(0);

  useEffect(() => {
    if (location) {
      setDescription(location.short_description);
    }
  }, [location]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 100 });
    } else {
      translateY.value = withSpring(screenHeight, { damping: 100 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: translateY.value }] };
  });

  // --- FUNCȚIA DE GENERARE ---
  const handleGenerateVibe = async () => {
    if (!location) return;

    setAiLoading(true);

    // Apelăm serviciul
    const generatedText = await generateLocationVibe(
      location.name,
      location.address,
      location.short_description
    );

    setAiLoading(false);

    if (generatedText) {
      setDescription(generatedText + "\n\n✨ (Gemini AI)");
    } else {
      // Dacă generatedText e null, înseamnă că a fost o eroare în serviciu
      // Logurile detaliate sunt în consolă, aici dăm doar un mesaj userului
      Alert.alert(
        "Error", 
        "Couldn't generate the description. Check the console for details (if you are a developer)."
      );
    }
  };
  // ---------------------------

  const handleBookWhatsApp = () => {
    if (!location) return;
    const message = `Hello! I'd like to make a reservation at ${location.name} (${location.address}).`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  };

  if (!location) return null;

  const nativeScroll = Gesture.Native();
  const pan = Gesture.Pan()
    .onStart(() => { context.value = { y: translateY.value }; })
    .onUpdate((event) => {
      // Permitem glisarea doar dacă suntem la începutul scroll-ului
      if (scrollPosition.value <= 0) {
        translateY.value = Math.max(context.value.y + event.translationY, 0);
      }
    })
    .onEnd(() => {
      if (translateY.value > screenHeight / 4) {
        runOnJS(onClose)();
      } else {
        // Revenim la poziția inițială doar dacă am mișcat fereastra
        if (scrollPosition.value <= 0) {
          translateY.value = withSpring(0, { damping: 25 });
        }
      }
    }).simultaneousWithExternalGesture(nativeScroll);

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.modalContainer, animatedStyle]}>
            <Image source={{ uri: location.image_url }} style={styles.image} />
            {/* Rating-ul mutat peste imagine */}
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{location.rating}/5</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.card }]}>              
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                onScroll={({ nativeEvent }) => {
                  scrollPosition.value = nativeEvent.contentOffset.y;
                }}>
                <View style={styles.contentHeader}>
                  <Text style={[styles.title, { color: theme.text }]}>{location.name}</Text>
                  <Text style={[styles.address, { color: theme.subtext }]}>
                    <Ionicons name="location" size={16} /> {location.address}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                </View>
                <Text style={[styles.description, { color: theme.text }]}>{description}</Text>
                {/* Butoanele de acțiune, acum în interiorul ScrollView */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: theme.tint }, aiLoading && { opacity: 0.7 }]}
                    onPress={handleGenerateVibe}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <ActivityIndicator color="#fff" /> : <Ionicons name="sparkles" size={20} color="#fff" />}
                    <Text style={[styles.btnText, { color: '#fff' }]}>
                      {aiLoading ? "Thinking..." : "Generate Vibe (AI)"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.tint }]}
                    onPress={handleBookWhatsApp}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color={theme.tint} />
                    <Text style={[styles.btnText, { color: theme.tint }]}>
                      Book
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="chevron-down-circle" size={44} color={theme.tint} />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 10, // Margine pe laterale
    marginBottom: 20, // Margine în partea de jos
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  card: { flex: 1, marginTop: -50, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  closeButton: { position: 'absolute', bottom: 20, alignSelf: 'center', zIndex: 10 },
  image: { width: '100%', height: 250, borderRadius: 20 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  contentHeader: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 5 },
  address: { fontSize: 14, marginBottom: 15 },
  ratingBox: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundal semi-transparent
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingText: { fontWeight: 'bold', color: '#fff', marginLeft: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 16, lineHeight: 24 },
  buttonGroup: {
    marginTop: 30,
    gap: 15,
  },
  btn: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});