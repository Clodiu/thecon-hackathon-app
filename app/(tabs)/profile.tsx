import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';

// Componenta pentru formularul de autentificare (când user-ul nu e logat)
const AuthForm = ({ theme }: { theme: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Toggle între Login și Sign Up

  const styles = createStyles(theme);


    // Funcția de Login
  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // Forțăm o reîmprospătare a datelor utilizatorului pentru a prelua cele mai noi metadate (inclusiv avatar_url)
    if (data.user) await supabase.auth.refreshSession();

    if (error) Alert.alert("Eroare Login", error.message);
    setLoading(false);
  }

  // Funcția de Înregistrare (Sign Up)
  async function signUpWithEmail() {
    if (!username) {
      Alert.alert("Eroare", "Username-ul este obligatoriu.");
      return;
    }
    setLoading(true);
    
    // 1. Creăm utilizatorul cu username
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          // Nu mai punem avatar_url aici, îl vom adăuga după upload
        }
      }
    });

    if (signUpError) {
      Alert.alert("Eroare la înregistrare", signUpError.message);
      setLoading(false);
      return;
    }

    // 2. Verificăm dacă trebuie confirmat emailul sau dacă avem deja o sesiune
    if (!authData.session && authData.user) {
      Alert.alert("Cont creat!", "Te rugăm să îți verifici emailul pentru a activa contul.");
      setLoading(false);
      return; // Oprim execuția aici. User-ul trebuie să confirme email-ul.
    }

    Alert.alert("Succes!", "Contul a fost creat.");
    setLoading(false);
  }

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>{isLogin ? "Log In" : "Sign Up"}</Text>

      <View style={styles.inputContainer}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={theme.subtext}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.subtext}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={isLogin ? signInWithEmail : signUpWithEmail}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.buttonText}>{isLogin ? "Log In" : "Sign Up"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setIsLogin(!isLogin)}>
          <Ionicons name="swap-horizontal" size={24} color={theme.tint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Componenta principală a ecranului de profil
export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const styles = createStyles(theme);

  async function changeAvatar() {
    if (!user) return;

    // 1. Cere permisiunea și alege imaginea
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiune pentru a accesa galeria foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // Utilizatorul a anulat selecția
    }

    const imageUri = result.assets[0].uri;

    // 2. Încarcă imaginea în Supabase Storage
    setUploading(true);
    const fileExt = imageUri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    const contentType = `image/${fileExt}`;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: contentType,
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, formData);

    if (uploadError) {
      Alert.alert("Eroare la încărcare", uploadError.message);
      setUploading(false);
      return;
    }

    // 3. Actualizează metadatele utilizatorului cu noul URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { avatar_url: urlData.publicUrl }
    });

    if (updateUserError) {
      Alert.alert("Eroare la actualizarea profilului", updateUserError.message);
    }

    // Forțăm o reîmprospătare a sesiunii pentru a afișa noua imagine imediat
    await supabase.auth.refreshSession();
    setUploading(false);
  }

  if (authLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color={theme.tint} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContent}>
        <Text style={styles.mainTitle}>Profile</Text>
        {user ? (
          // Afișăm dacă user-ul este logat
          <View style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.usernameValue} numberOfLines={1}>{user.user_metadata.username || 'Welcome'}</Text>
                <Text style={styles.emailText} numberOfLines={1}>{user.email}</Text>
              </View>
              <TouchableOpacity onPress={changeAvatar} disabled={uploading}>
                <Image
                  source={user.user_metadata.avatar_url ? { uri: user.user_metadata.avatar_url } : require('../../assets/images/default-avatar.png')}
                  style={styles.profileAvatar}
                />
                {uploading && (
                  <View style={styles.avatarOverlay}><ActivityIndicator color="#fff" /></View>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <AuthForm theme={theme} />
        )}
      </View>
    </SafeAreaView>
  );
}

// Funcție care creează stilurile pe baza temei
const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  mainContent: { flex: 1, padding: 20 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: theme.text, marginBottom: 30 },
  authContainer: { flex: 1, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 20, textAlign: 'center' },  
  profileContent: {
    alignItems: 'center',
    gap: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: { gap: 15, marginBottom: 20 },
  input: { backgroundColor: theme.card, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.border, color: theme.text },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutButton: {
    backgroundColor: theme.tint,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
  },
  mainButton: { flex: 1, backgroundColor: theme.tint, padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchButton: {
    height: 54, // Aliniem la înălțimea butonului principal
    aspectRatio: 1, // Facem butonul pătrat
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPicker: { alignItems: 'center', gap: 8, marginBottom: 10 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.border },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.tint,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  userInfo: {
    flex: 1,
    marginRight: 20,
  },
  usernameValue: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  emailText: { fontSize: 16, color: theme.subtext },
});