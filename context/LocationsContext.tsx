import React, { createContext, ReactNode, useContext, useState } from 'react';
import locationsData from '../assets/locations/locations.json'; // Asigură-te că calea e corectă

// Definim tipul unei Locații (bazat pe JSON-ul tău)
export interface Location {
  name: string;
  address: string;
  city: string;
  coordinates: { lat: number; long: number };
  image_url: string;
  short_description: string;
  rating: number;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationsContextType {
  locations: Location[];
  recommendedLocation: Location | null;
  setRecommendedLocation: (loc: Location | null) => void;
  clearRecommendedLocation: () => void;
  userLocation: UserCoordinates | null;
  setUserLocation: (coords: UserCoordinates | null) => void;
  viewMode: 'list' | 'map';
  setViewMode: React.Dispatch<React.SetStateAction<'list' | 'map'>>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  // Încărcăm datele din JSON și adăugăm câmpul 'city'
  const [locations] = useState<Location[]>(() =>
    (locationsData as any[]).map(loc => ({ ...loc, city: loc.address.split(',').pop().trim() }))
  );
  
  // Aici stocăm locația pe care AI-ul o recomandă și pe care harta trebuie să facă zoom
  const [recommendedLocation, setRecommendedLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const clearRecommendedLocation = () => {
    setRecommendedLocation(null);
  };

  return (
    <LocationsContext.Provider value={{ locations, recommendedLocation, setRecommendedLocation, clearRecommendedLocation, userLocation, setUserLocation, viewMode, setViewMode }}>
      {children}
    </LocationsContext.Provider>
  );
};

export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (!context) throw new Error("useLocations trebuie folosit în interiorul unui LocationsProvider");
  return context;
};