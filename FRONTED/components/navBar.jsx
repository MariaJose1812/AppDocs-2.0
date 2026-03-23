import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { titulo: 'Documentos', ruta: '/generarDocs' },
    { titulo: 'Historial', ruta: '/dashboard' },
    { titulo: 'Usuarios', ruta: '/usuarios' },
    { titulo: 'Directorio', ruta: '/empleados' },
    { titulo: 'Plantillas', ruta: '/plantillas' },
  ];

  return (
    <View style={styles.navbarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
        {navLinks.map((link) => {

          const isActive = pathname === link.ruta;

          return (
            <TouchableOpacity 
              key={link.ruta} 
              style={[styles.navItem, isActive && styles.navItemActive]} 
              onPress={() => router.push(link.ruta)}
            >
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {link.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  navScroll: {
    paddingHorizontal: 15,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  navItemActive: {
    backgroundColor: '#09528e',
  },
  navText: {
    color: '#475569',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#ffffff',
  },
});