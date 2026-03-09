import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Header() {
  const router = useRouter();

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
  };

  return (
    <View style={styles.headerTop}>
      <Text style={styles.logoText}>Sistema IT</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={cerrarSesion}>
         <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14
  },
});