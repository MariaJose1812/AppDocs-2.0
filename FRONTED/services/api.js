// Para que Expo/Electron se comuniquen con el servidor
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";
import { Platform } from "react-native";
import { router } from 'expo-router';


const API_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://192.168.88.115:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    // Buscamos el token guardado en el celular
    const token = await AsyncStorage.getItem('userToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//Maneja cuando el Token se vence
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Borramos el token vencido
      await AsyncStorage.removeItem('userToken');
      
      // Le avisamos al usuario 
      if (Platform.OS === 'web') {
        window.alert("Tu sesión ha caducado por seguridad. Por favor, ingresa tu contraseña de nuevo.");
        router.replace('/login');
      } else {
        Alert.alert(
          "Sesión expirada", 
          "Tu sesión ha caducado por seguridad. Por favor, ingresa tu contraseña de nuevo.",
          [
            { text: "OK", onPress: () => router.replace('/login') }
          ]
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;