// Fișier: app/(tabs)/index.tsx
import CustomPicker from '@/components/CustomPicker';
import LocationDetailModal from '@/components/LocationDetailModal';
import { Colors } from '@/constants/Colors';
import { Location, useLocations, UserCoordinates } from '@/context/LocationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as LocationExpo from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, LayoutAnimation, Linking, Platform, Animated as RNAnimated, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

// =============================
// COMPONENTE
// =============================

const LocationCard = ({ item, theme, onPress }: any) => (
  <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => onPress(item)}>
    <Image source={{ uri: item.image_url }} style={styles.cardImg} />
    <View style={styles.cardInfo}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.cardAddr, { color: theme.subtext }]} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.ratingTxt, { color: theme.text }]}>{item.rating}/5</Text>
        </View>
      </View>
      <View style={[styles.mapIcon, { backgroundColor: theme.background }]}>
        <Ionicons name="map-outline" size={20} color={theme.tint} />
      </View>
    </View>
  </TouchableOpacity>
);

const MapLocationPreview = ({ location, theme, onPress }: any) => {
  const handleDirections = () => {
    const { lat, long } = location.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}&travelmode=driving`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <TouchableOpacity style={[styles.previewContainer, { backgroundColor: theme.card }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.previewImageContainer}>
        <Image source={{ uri: location.image_url }} style={styles.previewImage} />
        <View style={[styles.ratingRow, { marginTop: 4 }]}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.ratingTxt, { color: theme.text }]}>{location.rating}/5</Text>
        </View>
      </View>
      <View style={styles.previewDetails}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{location.name}</Text>
        <Text style={[styles.cardAddr, { color: theme.subtext }]} numberOfLines={1}>
          {location.address}
        </Text>
      </View>
      <View style={styles.previewActions}>
        <TouchableOpacity style={styles.previewButton} onPress={handleDirections}>
          <Ionicons name="navigate-circle-outline" size={32} color={theme.tint} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const CustomMarker = React.memo(
  ({ rating, theme, isSelected }: { rating: number; theme: any; isSelected: boolean }) => {
    const markerColor = isSelected ? '#FF6347' : theme.tint;

    return (
      <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
        <View style={[styles.markerBubble, { backgroundColor: markerColor }]}>
          <Text style={styles.markerText}>{rating}</Text>
        </View>
        <View style={[styles.markerPointer, { borderTopColor: markerColor }]} />
      </View>
    );
  }
);

const EmptyState = ({ theme }: any) => (
  <View style={styles.emptyState}>
    <Text style={{ color: theme.subtext }}>No locations found. Try other filters.</Text>
  </View>
);


export default function IndexScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);
  const params = useLocalSearchParams<{ toggleView?: string }>();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { locations, recommendedLocation, clearRecommendedLocation, userLocation, setUserLocation, viewMode, setViewMode } = useLocations();

  // =============================
  // 2️⃣ Generăm lista orașelor unice
  // =============================
  const cities = useMemo(() => {
    const setCity = new Set(locations.map(loc => loc.city));
    return Array.from(setCity);
  }, [locations]);

  // =============================
  // 3️⃣ Aplicăm filtrele
  // =============================
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        loc.name.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q);

      const matchesCity = selectedCity === 'all' || loc.city === selectedCity;
      const matchesRating = minRating === null || loc.rating >= minRating;

      return matchesSearch && matchesCity && matchesRating;
    });
  }, [locations, searchQuery, selectedCity, minRating]);

  // =============================
  // 4️⃣ Grupăm pe orașe dacă e "all"
  // =============================
  const groupedLocations = useMemo(() => {
    if (selectedCity !== 'all') return [];

    const groups: Record<string, Location[]> = {};

    filteredLocations.forEach(loc => {
      if (!groups[loc.city]) groups[loc.city] = [];
      groups[loc.city].push(loc);
    });

    return Object.keys(groups).map(city => ({
      title: city,
      data: groups[city],
    }));
  }, [filteredLocations, selectedCity]);

  // =============================
  // Efect pentru a gestiona recomandarea de la AI
  // =============================
  useEffect(() => {
    if (recommendedLocation) {
      setViewMode('map');
      setSelectedLocation(recommendedLocation);
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: recommendedLocation.coordinates.lat,
          longitude: recommendedLocation.coordinates.long,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }, 200); // O mică întârziere pentru a asigura că harta este gata

      // Resetăm recomandarea pentru a nu re-activa efectul la revenirea pe tab
      clearRecommendedLocation();
    }
  }, [recommendedLocation]);

  // =============================
  // Efect pentru a gestiona comutarea hartă/listă la apăsarea tab-ului
  // =============================
  useEffect(() => {
    // Acest efect rulează de fiecare dată când parametrul 'toggleView' se schimbă
    if (params.toggleView) {
      setViewMode(currentMode => (currentMode === 'list' ? 'map' : 'list'));
    }
  }, [params.toggleView]);

  // Efect pentru a cere permisiunea și a obține locația utilizatorului
  useEffect(() => {
    (async () => {
      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access location was denied. You can enable it in your phone settings.'
        );
        return;
      }

      try {
        let location = await LocationExpo.getCurrentPositionAsync({});
        setUserLocation(location.coords as UserCoordinates);
      } catch (error) {
        console.error("Could not get user location", error);
      }
    })();
  }, []);

  // =============================
  // Navigare List → Map
  // =============================
  const handleCardPress = (loc: Location) => {
    setViewMode('map');
    setSelectedLocation(loc); // Setăm locația selectată pentru a afișa preview-ul
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coordinates.lat,
          longitude: loc.coordinates.long,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }, 100);
  };

  const openModal = (loc: Location) => {
    setSelectedLocation(loc);
    setModalVisible(true);
  };

  const handleMapPress = () => {
    // Ascundem preview-ul dacă utilizatorul apasă pe hartă (în afara unui marker)
    if (selectedLocation) {
      setSelectedLocation(null);
    }
  };

  const toggleExtraFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowExtraFilters(prev => !prev);
  };
  const areFiltersActive = selectedCity !== 'all' || minRating !== null;

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    }
  };

  const handleResetBearing = async () => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      camera.heading = 0;
      mapRef.current.animateCamera(camera, { duration: 500 });
    }
  };

  const handleCameraChange = async () => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      // Rotunjim pentru a evita actualizări inutile la mișcări foarte mici
      const newBearing = Math.round(camera.heading);
      if (newBearing !== mapBearing) setMapBearing(newBearing);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.filtersContainer}>

            {/* Search */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.subtext} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search"
                  placeholderTextColor={theme.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]} onPress={toggleExtraFilters}>
                <Ionicons name="filter" size={20} color={theme.text} />
                {areFiltersActive && <View style={[styles.filterDot, { backgroundColor: theme.tint }]} />}
              </TouchableOpacity>
            </View>

            {/* Filtre extra - apar/dispar */}
            {showExtraFilters && (
              <View style={styles.row}>
                {/* Picker orașe */}
                <CustomPicker
                  theme={theme}
                  iconName="business-outline"
                  selectedValue={selectedCity}
                  onValueChange={val => setSelectedCity(val)}
                  items={[
                    { label: 'All cities', value: 'all' },
                    ...cities.map(city => ({ label: city, value: city })),
                  ]}
                />

                {/* Picker Rating */}
                <CustomPicker
                  theme={theme}
                  iconName="star-outline"
                  selectedValue={minRating === null ? 'all' : String(minRating)}
                  onValueChange={val => setMinRating(val === 'all' ? null : Number(val))}
                  items={[
                    { label: 'Any rating', value: 'all' },
                    ...[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5].map(r => ({ label: `${r}+ ⭐`, value: String(r) })),
                  ]}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <View style={styles.content}>
        {viewMode === 'list' ? (
          selectedCity === 'all' ? (
            <SectionList
              sections={groupedLocations}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              renderItem={({ item }) => (
                <LocationCard item={item} theme={theme} onPress={handleCardPress} />
              )}
              renderSectionHeader={({ section }) => (
                <Text style={[styles.sectionHeader, { color: theme.text }]}>
                  {section.title}
                </Text>
              )}
              ListEmptyComponent={<EmptyState theme={theme} />}
            />
          ) : (
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.name}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <LocationCard item={item} theme={theme} onPress={handleCardPress} />
              )}
              ListEmptyComponent={<EmptyState theme={theme} />}
            />
          )
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              // Centrat pe România
              latitude: 45.9432,
              longitude: 24.9668,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
            onPress={handleMapPress}
            onRegionChangeComplete={handleCameraChange}
            showsUserLocation={true} // Păstrăm afișarea punctului albastru pentru locație
            showsMyLocationButton={false} // Ascundem butonul default pentru locație
            showsCompass={false} // Ascundem busola (orientare)
            toolbarEnabled={false} // Pe Android, ascundem butoanele de indicații la apăsarea unui marker
            showsPointsOfInterest={false} // Ascundem punctele de interes default (parcuri, aeroporturi etc.)
          >
            {/* Am comentat UrlTile pentru a folosi harta nativă (Google/Apple Maps) și a ascunde punctele de interes */}
            {/* <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} /> */}
            {filteredLocations.map(loc => (
              <Marker
                key={loc.name}
                coordinate={{ latitude: loc.coordinates.lat, longitude: loc.coordinates.long }}
                onPress={() => setSelectedLocation(loc)} // La apăsare, setăm locația pentru preview
              >
                <CustomMarker rating={loc.rating} theme={theme} isSelected={selectedLocation?.name === loc.name} />
              </Marker>
            ))}
          </MapView>
        )}

        {/* Butonul pentru busolă (orientare), afișat mereu pe hartă */}
        {viewMode === 'map' && (
          <TouchableOpacity style={[styles.compassButton, { backgroundColor: theme.card }]} onPress={handleResetBearing}>
            <RNAnimated.View style={{ transform: [{ rotate: `${360 - mapBearing}deg` }] }}>
              <Ionicons name="compass" size={28} color={theme.tint} />
            </RNAnimated.View>
          </TouchableOpacity>
        )}

        {/* Butonul pentru locația utilizatorului, afișat doar pe hartă */}
        {viewMode === 'map' && (
          <TouchableOpacity style={[styles.locationButton, { backgroundColor: theme.card }]} onPress={handleCenterOnUser} disabled={!userLocation}>
            <Ionicons name="navigate-outline" size={24} color={userLocation ? theme.tint : theme.subtext} />
          </TouchableOpacity>
        )}

        {/* Preview Card pe Hartă */}
        {viewMode === 'map' && selectedLocation && (
          <MapLocationPreview
            location={selectedLocation}
            theme={theme}
            onPress={() => openModal(selectedLocation)}
          />
        )}
      </View>

      <LocationDetailModal
        visible={modalVisible}
        location={selectedLocation}
        onClose={() => setModalVisible(false)}
        theme={theme}
      />
    </View>
  );
}

// =============================
// STILURI
// =============================
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 16, // Mărit de la 16 pentru mai mult spațiu
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  filtersContainer: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
  },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 8, height: '100%' },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  content: { flex: 1 },
  map: {
    flex: 1,
    marginTop: -20, // Tragem harta în jos pentru a se vedea sub header
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'transparent', // Asigură transparența
    paddingVertical: 10,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },

  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },

  cardImg: { width: '100%', height: 140 },
  cardInfo: { padding: 14, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardAddr: { fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingTxt: { marginLeft: 4, fontWeight: 'bold', fontSize: 14 },
  mapIcon: { padding: 8, borderRadius: 50, marginLeft: 10 },

  // Stiluri pentru Marker personalizat
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    // Adăugăm o umbră pentru pin-ul selectat
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  markerBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  markerPointer: {
    // Vârful pin-ului (triunghi)
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2, // Suprapunem puțin peste bulă
  },

  // Stiluri pentru Preview Card pe hartă
  previewContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 25, // Mutat mai sus
    left: 10, // Apropiat de margine
    right: 10, // Apropiat de margine
    flexDirection: 'row',
    alignItems: 'flex-start', // Aliniem la început pentru a permite rating-ului să fie sub imagine
    padding: 10,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  previewImageContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  previewImage: { width: 70, height: 70, borderRadius: 8 },
  previewDetails: { flex: 1, justifyContent: 'center', paddingTop: 10 },
  previewActions: {
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  previewButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  locationButton: {
    position: 'absolute',
    top: 10, // Apropiat de header
    right: 10, // Apropiat de margine
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compassButton: {
    position: 'absolute',
    top: 10, // Apropiat de header
    left: 10, // Apropiat de margine
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
