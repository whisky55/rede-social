import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import * as FileSystem from 'expo-file-system';

export default function CreatePostScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Permissões para câmera e galeria
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // Permissão para localização
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissões necessárias',
          'Este app precisa de acesso à câmera e galeria para funcionar corretamente.'
        );
      }

      if (locationPermission.status !== 'granted') {
        Alert.alert(
          'Permissão de localização',
          'Para usar a localização automática, permita o acesso nas configurações.'
        );
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
    }
  };

  // Função para converter imagem para base64
  const convertImageToBase64 = async (uri) => {
    try {
      setIsProcessingImage(true);
      
      // Ler o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Detectar o tipo MIME da imagem
      let mimeType = 'image/jpeg'; // padrão
      if (uri.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (uri.toLowerCase().includes('.gif')) {
        mimeType = 'image/gif';
      }

      // Criar o formato completo de base64
      const fullBase64 = `data:${mimeType};base64,${base64}`;
      
      return fullBase64;
    } catch (error) {
      console.error('Erro ao converter para base64:', error);
      throw new Error('Não foi possível processar a imagem');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        // Converter para base64
        const base64 = await convertImageToBase64(uri);
        setImageBase64(base64);
        
        console.log('Imagem capturada e convertida para base64');
      }
    } catch (error) {
      console.error('Erro ao capturar imagem da câmera:', error);
      Alert.alert('Erro', 'Não foi possível capturar a imagem');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        // Converter para base64
        const base64 = await convertImageToBase64(uri);
        setImageBase64(base64);
        
        console.log('Imagem selecionada e convertida para base64');
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem da galeria:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Selecionar Imagem',
      'Como você gostaria de adicionar uma imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: pickImageFromCamera },
        { text: 'Galeria', onPress: pickImageFromGallery },
      ]
    );
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
  };

  // Função para obter localização atual
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const address = await Location.reverseGeocodeAsync({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude
      });

      if (address.length > 0) {
        const addr = address[0];
        const locationString = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''} - ${addr.region || ''}`.trim();
        setLocation(locationString);
        setCurrentLocation(locationResult.coords);
        console.log('Localização obtida:', locationString);
      } else {
        setLocation(`${locationResult.coords.latitude.toFixed(6)}, ${locationResult.coords.longitude.toFixed(6)}`);
        setCurrentLocation(locationResult.coords);
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização atual');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const createPost = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, adicione uma descrição ao seu post');
      return;
    }

    if (!imageBase64) {
      Alert.alert('Erro', 'Por favor, adicione uma imagem ao seu post');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      // Criar post com todos os campos necessários
      const postData = {
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userEmail: user.email,
        userPhoto: user.photoURL || null,
        description: description.trim(),
        location: location.trim() || 'Localização não informada',
        imageBase64: imageBase64, // Imagem em base64 para exibição
        likes: [],
        createdAt: serverTimestamp(),
      };

      // Salvar no Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      console.log('Post criado com ID:', docRef.id);
      console.log('Post Data:', {
        ...postData,
        imageBase64: `${imageBase64.substring(0, 50)}... (${imageBase64.length} chars)`
      });
      
      Alert.alert(
        'Sucesso!', 
        'Seu post foi criado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

      // Limpar formulário
      setDescription('');
      setLocation('');
      setCurrentLocation(null);
      setImageUri(null);
      setImageBase64(null);

    } catch (error) {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Seção da Imagem */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Foto do Treino</Text>
            
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={30} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imagePlaceholder}
                onPress={showImagePicker}
                disabled={isProcessingImage}
              >
                {isProcessingImage ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.processingText}>Processando imagem...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera" size={50} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>
                      Toque para adicionar uma foto
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Descrição do Treino</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Conte como foi seu treino..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>

          {/* Localização */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Localização</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={styles.locationInput}
                placeholder="Digite a localização ou use GPS"
                value={location}
                onChangeText={setLocation}
                editable={!isLoading && !isGettingLocation}
              />
              <TouchableOpacity
                style={[
                  styles.gpsButton,
                  { opacity: (isLoading || isGettingLocation) ? 0.5 : 1 }
                ]}
                onPress={getCurrentLocation}
                disabled={isLoading || isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="location" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Info (apenas em desenvolvimento) */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>
                ImageUri: {imageUri ? '✓' : '✗'}
              </Text>
              <Text style={styles.debugText}>
                ImageBase64: {imageBase64 ? `✓ (${imageBase64.length} chars)` : '✗'}
              </Text>
              <Text style={styles.debugText}>
                Location: {location || 'Não definida'}
              </Text>
              <Text style={styles.debugText}>
                CurrentLocation: {currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Não obtida'}
              </Text>
            </View>
          )}

          {/* Botão Publicar */}
          <TouchableOpacity 
            style={[
              styles.publishButton,
              (!description.trim() || !imageBase64 || isLoading) && styles.publishButtonDisabled
            ]}
            onPress={createPost}
            disabled={!description.trim() || !imageBase64 || isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loadingText}>Publicando...</Text>
              </View>
            ) : (
              <Text style={styles.publishButtonText}>Publicar Treino</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  gpsButton: {
    backgroundColor: '#4A90E2',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
  },
  publishButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  publishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
});