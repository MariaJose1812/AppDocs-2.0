import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Navbar from '../components/navBar';  
import CustomScrollView from "../components/ScrollView"; 
import Header from '../components/header';

export default function GenerarDocsScreen() {
  const router = useRouter();

  const modulos = [
    { id: '1', titulo: 'Acta de Entrega', ruta: '/actaEntrega', color: '#3ac40d', icon: "file-document-check-outline", desc: 'Gestión y control de actas de entrega de equipo.' },
    { id: '2', titulo: 'Acta de Retiro', ruta: '/actaRetiro', color: '#cc7625', icon: "file-document-arrow-right-outline", desc: 'Gestión y control de actas de retiro de equipo.' },
    { id: '3', titulo: 'Acta de Recepción', ruta: '/actaRecepcion', color: '#09528e', icon: "folder-download-outline", desc: 'Registro formal de recepción física de equipo.' },
    { id: '4', titulo: 'Memorándums', ruta: '/memorandum', color: '#70e0f4', icon: "file-sign", desc: 'Redacción de memorándums corporativos internos.' },
    { id: '5', titulo: 'Oficios', ruta: '/oficios', color: '#333333', icon: "file-document-multiple-outline", desc: 'Gestión de oficios y comunicados oficiales externos.' },
    { id: '6', titulo: 'Pase de Salida', ruta: '/paseSalida', color: '#e63946', icon: "exit-to-app", desc: 'Autorización y control de salidas de personal o equipos.' },
    { id: '7', titulo: 'Reportes', ruta: '/reportes', color: '#2a9d8f', icon: "file-chart-outline", desc: 'Generación de reportes de equipo.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header/>

      <Navbar/> 

      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>  

      {/* CONTENEDOR DE CUADRÍCULA */}
      <ScrollView contentContainerStyle={styles.scrollCenter} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Generación de Documentos</Text>
          <Text style={styles.subTitle}>Seleccione el tipo de documento que desea procesar hoy</Text>
        </View>

        <View style={styles.gridContainer}>
          {modulos.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.8} 
              style={styles.executiveCard}
              onPress={() => router.push(item.ruta)}
            >
              <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
              
              <View style={styles.cardContent}>
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={36} 
                  color={item.color} 
                  style={styles.iconStyle} 
                />
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc'
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1, 
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 80, 
  },
  scrollCenter: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 60,
    paddingTop: 40
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20
  },
  mainTitle: {
    fontSize: 28, 
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1000, 
    gap: 25, // Espacio uniforme entre tarjetas
  },
  executiveCard: {
    backgroundColor: '#ffffff',
    width: 280, // Tarjetas mucho más grandes y rectangulares
    minHeight: 180,
    borderRadius: 12, 
    elevation: 3,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden', 
    marginHorizontal: 10, 
    marginBottom: 20,
  },
  cardAccent: {
    height: 6,
    width: '100%',
  },
  cardContent: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  iconStyle: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20, 
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20, 
  }
});