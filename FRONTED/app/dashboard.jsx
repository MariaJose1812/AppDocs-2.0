import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

import Navbar from '../components/navBar';
import Header from '../components/header';

export default function DashboardScreen() {
  const router = useRouter();

  const [historialDocs, setHistorialDocs] = useState([]);
  const [cargando, setCargando] = useState(true);

  //PIDE LOS DATOS
  React.useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/dashboard/historial');
      setHistorialDocs(response.data);
    } catch (error) {
      console.log("Error trayendo el historial:", error);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
  };

  //DISEÑO DE CADA DOCUMENTO EN EL HISTORIAL
  const renderDocCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{item.tipo}</Text>
        <Text style={styles.cardDate}>{item.fecha}</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBody}>
        <Text style={styles.cardDetail}><Text style={styles.bold}>N°:</Text> {item.correlativo}</Text>
        <Text style={styles.cardDetail}><Text style={styles.bold}>Creado por:</Text> {item.usuario}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header/>

      <Navbar/> 

      {/*HISTORIAL */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Historial de Documentos</Text>
        
        {cargando ? (
          <ActivityIndicator size="large" color="#09528e" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={historialDocs}
            keyExtractor={(item) => item.id.toString() + item.tipo} 
            renderItem={renderDocCard}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>
                No hay documentos recientes.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f6f9' 
  },
  // Estilos del Contenido Principal
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  // Estilos de la Tarjeta
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2, // Sombra Android
    shadowColor: '#000', // Sombras iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#09528e'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
    color: '#333'
  }
});