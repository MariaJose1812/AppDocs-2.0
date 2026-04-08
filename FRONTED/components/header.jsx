import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../hooks/themeContext'; 
import { Colors } from '../constants/theme';

export default function Header() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados para guardar los datos del usuario
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState(null);

  const { theme, toggleTheme, isDarkMode } = useTheme();
  const colorScheme = theme; // 'light' o 'dark'

  // Efecto para cargar los datos cuando se monta el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('nomUsu');
        const role = await AsyncStorage.getItem('cargoUsu');
        if (name) setUserName(name);
        if (role) setUserRole(role);
      } catch (error) {
        console.error("Error al obtener datos del usuario", error);
      }
    };
    fetchUserData();
  }, []);


  const ejecutarCerrarSesion = async () => {
    setModalVisible(false);
    try {
      await AsyncStorage.multiRemove(['userToken', 'nomUsu', 'cargoUsu']);
      router.replace('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <View style={[
      styles.headerTop, 
      { 
        backgroundColor: Colors[colorScheme].background,
        borderBottomColor: isDarkMode ? '#1e293b' : '#e2e8f0' 
      }
    ]}>
      
      {/* --- SECCIÓN IZQUIERDA: Perfil del Usuario --- */}
      <View style={styles.userInfoContainer}>
        {/* El icono cambia a un gris más claro en modo oscuro */}
        <MaterialCommunityIcons 
          name="account-circle" 
          size={38} 
          color={isDarkMode ? '#cbd5e1' : '#94a3b8'} 
        />
        <View style={styles.userDetails}>
          {/* El nombre toma el color principal del tema (Blanco en oscuro, Negro en claro) */}
          <Text style={[styles.userNameText, { color: Colors[colorScheme].text }]} numberOfLines={1}>
            {userName || 'Cargando...'}
          </Text>
          {/* El cargo usa un gris adaptable */}
          <Text style={[styles.userRoleText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
            {userRole || 'Usuario'}
          </Text>
        </View>
      </View>

      {/* --- SECCIÓN CENTRAL: Título --- */}
      <View pointerEvents="none" style={styles.titleContainer}>
        <Text style={[styles.logoText, { color: Colors[colorScheme].text }]}>INFOTECNOLOGÍA</Text>
      </View>
      
      {/* --- SECCIÓN DERECHA: Acciones --- */}
      <View style={styles.rightActions}>
        
        <TouchableOpacity 
          style={styles.themeBtn} 
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isDarkMode ? "weather-sunny" : "weather-night"} 
            size={24} 
            color={isDarkMode ? "#fbbf24" : "#64748b"} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setModalVisible(true)}>
           <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        
      </View>
      
      {/* --- MODAL --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            
            <View style={styles.headerModal}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#64748b" />
              <Text style={styles.modalTitle}>Confirmación de salida</Text>
            </View>

            <View style={styles.bodyModal}>
              <Text style={styles.modalSubTitle}>
                ¿Está seguro que desea finalizar su sesión actual en el sistema?
              </Text>
            </View>

            <View style={styles.footerModal}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.btnConfirm]} 
                onPress={ejecutarCerrarSesion}
              >
                <Text style={styles.btnTextConfirm}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>

          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderBottomWidth: 1,
    position: 'relative',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  themeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  
  /* --- ESTILOS DEL USUARIO --- */
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '30%', 
  },
  userDetails: {
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    // ¡Eliminamos el color fijo de aquí!
  },
  userRoleText: {
    fontSize: 12,
    marginTop: 2,
    // ¡Eliminamos el color fijo de aquí!
  },

  /* --- RESTO DE ESTILOS INTACTOS --- */
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center', 
    justifyContent: 'center',
    height: '100%', 
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c52b10',
  },
  logoutText: {
    color: '#c52b10',
    fontWeight: '600',
    fontSize: 13
  },

  // Modal styles (se mantienen iguales)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 400,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2a160f',
  },
  bodyModal: {
    padding: 24,
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  footerModal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnConfirm: {
    backgroundColor: '#0f172a', 
  },
  btnTextCancel: {
    color: '#695047',
    fontWeight: '600',
    fontSize: 14,
  },
  btnTextConfirm: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});