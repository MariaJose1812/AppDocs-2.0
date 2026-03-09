import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const router = useRouter();
  
  // Estado para saber si seguimos buscando el token
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        // Buscamos el token en el celular
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          // Si hay token, lo mandamos directo al dashboard
          router.replace('/dashboard'); 
        } else {
          // Si no hay token o ya expiró y se borró, lo mandamos a loguearse
          router.replace('/login');
        }
      } catch (error) {
        console.log("Error verificando sesión:", error);
        router.replace('/login'); // Por seguridad, si hay error
      } finally {
        // Terminamos de cargar
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  // Se muestra la carga
  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' }}>
        <ActivityIndicator size="large" color="#09528e" />
        <Text style={{ marginTop: 10, color: '#09528e' }}>Verificando sesión...</Text>
      </View>
    );
  }

  return null; 
}