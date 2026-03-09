import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from "react-native";
import { router } from 'expo-router';

// Selecciona la URL dependiendo si estás en Web o en el Celular
const API_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://192.168.88.115:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. ANTES DE ENVIAR LA PETICIÓN: Le pegamos el Token
api.interceptors.request.use(
  async (config) => {
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

// 2. DESPUÉS DE RECIBIR LA RESPUESTA: Manejamos el Token vencido
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    
    // Verificamos si hubo un error 401
    if (error.response && error.response.status === 401) {
      
      // LA MAGIA ESTÁ AQUÍ: Verificamos a qué URL se hizo la petición
      // Si la petición NO era para '/auth/login', entonces sí asumimos que el token expiró.
      // Ajusta la cadena '/auth/login' si tu ruta exacta es '/login' o algo similar en el interceptor.
      const originalRequestUrl = error.config.url;

      if (!originalRequestUrl.includes('/login')) {
        
        // Borramos el token vencido
        await AsyncStorage.removeItem('userToken');
        
        // Le avisamos al usuario y lo sacamos
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
    }
    
    // Devolvemos el error para que el componente que hizo la petición también pueda reaccionar
    return Promise.reject(error);
  }
);

export default api;