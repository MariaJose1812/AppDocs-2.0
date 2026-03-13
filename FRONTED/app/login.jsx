import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert
} from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import api from '../services/api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [userSeleccionado, setUserSeleccionado] = useState(null);
  const [pass, setPass] = useState('');
  const [hoveredProfile, setHoveredProfile] = useState(null);

  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nomUsu: '',
    correoUsu: '',
    cargoUsu: '',
    conUsu: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.log('Error cargando usuarios:', err.response?.data || err.message);
    }
  };

  const intentarLogin = async () => {
    try {
      const res = await api.post('/auth/login', {
        idUsuarios: userSeleccionado.idUsuarios,
        conUsu: pass
      });

      if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
        setUserSeleccionado(null);
        setPass('');
        router.replace('/dashboard');
      }
    } catch (err) {
      console.log('ERROR COMPLETO:', err.response?.data || err.message);
      alert('Contraseña incorrecta o error de conexión');
    }
  };

  const abrirModalCrear = () => {
    setNuevoUsuario({
      nomUsu: '',
      correoUsu: '',
      cargoUsu: '',
      conUsu: ''
    });
    setModalCrearVisible(true);
  };

  const guardarNuevoUsuario = async () => {
    try {
      if (
        !nuevoUsuario.nomUsu.trim() ||
        !nuevoUsuario.correoUsu.trim() ||
        !nuevoUsuario.cargoUsu.trim() ||
        !nuevoUsuario.conUsu.trim()
      ) {
        Alert.alert('Campos requeridos', 'Completa todos los campos.');
        return;
      }

      const res = await api.post('/usuarios', nuevoUsuario);

      const usuarioCreado = res.data;

      setUsuarios((prev) => [...prev, usuarioCreado]);

      setModalCrearVisible(false);

      setNuevoUsuario({
        nomUsu: '',
        correoUsu: '',
        cargoUsu: '',
        conUsu: ''
      });

      if (usuarioCreado?.token) {
        await AsyncStorage.setItem('userToken', usuarioCreado.token);
      }

      router.replace('/dashboard');
    } catch (err) {
      console.log('Error creando usuario:', err.response?.data || err.message);
      Alert.alert(
        'Error',
        'No se pudo crear el usuario. Verifica que exista el endpoint POST /usuarios en tu backend.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundWrapper}>
        <Svg width="100%" height="100%" style={styles.backgroundSvg}>
          <Defs>
            <RadialGradient id="grad1" cx="12%" cy="18%" rx="35%" ry="35%">
              <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
              <Stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="grad2" cx="88%" cy="82%" rx="35%" ry="35%">
              <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
              <Stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="#08142b" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
        </Svg>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Selecciona tu Perfil</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.profilesRow}>
            {usuarios.map((item) => {
              const isHovered = hoveredProfile === item.idUsuarios;

              return (
                <Pressable
                  key={item.idUsuarios}
                  onPress={() => setUserSeleccionado(item)}
                  onHoverIn={() => setHoveredProfile(item.idUsuarios)}
                  onHoverOut={() => setHoveredProfile(null)}
                  style={({ pressed }) => [
                    styles.profileCard,
                    isHovered && styles.profileCardHover,
                    pressed && styles.profileCardPressed
                  ]}
                >
                  <View style={[styles.avatar, isHovered && styles.avatarHover]}>
                    <Text style={styles.avatarText}>
                      {item.nomUsu?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>

                  <Text style={[styles.name, isHovered && styles.nameHover]}>
                    {item.nomUsu}
                  </Text>

                  <Text style={[styles.role, isHovered && styles.roleHover]}>
                    {item.cargoUsu}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={abrirModalCrear}
              onHoverIn={() => setHoveredProfile('add')}
              onHoverOut={() => setHoveredProfile(null)}
              style={({ pressed }) => [
                styles.addProfileCard,
                hoveredProfile === 'add' && styles.profileCardHover,
                pressed && styles.profileCardPressed
              ]}
            >
              <View
                style={[
                  styles.addAvatar,
                  hoveredProfile === 'add' && styles.addAvatarHover
                ]}
              >
                <Text style={styles.addIcon}>+</Text>
              </View>

              <Text
                style={[
                  styles.addText,
                  hoveredProfile === 'add' && styles.nameHover
                ]}
              >
                Agregar usuario
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <Modal visible={!!userSeleccionado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Contraseña para {userSeleccionado?.nomUsu}
            </Text>

            <TextInput
              secureTextEntry
              style={styles.input}
              value={pass}
              onChangeText={setPass}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#999"
            />

            <View style={styles.buttonsContainer}>
              <View style={styles.buttonSpace}>
                <Button title="Entrar" onPress={intentarLogin} />
              </View>

              <View style={styles.buttonSpace}>
                <Button
                  title="Cancelar"
                  color="red"
                  onPress={() => {
                    setUserSeleccionado(null);
                    setPass('');
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalCrearVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear nuevo usuario</Text>

            <TextInput
              style={styles.input}
              value={nuevoUsuario.nomUsu}
              onChangeText={(text) =>
                setNuevoUsuario((prev) => ({ ...prev, nomUsu: text }))
              }
              placeholder="Nombre usuario"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={nuevoUsuario.correoUsu}
              onChangeText={(text) =>
                setNuevoUsuario((prev) => ({ ...prev, correoUsu: text }))
              }
              placeholder="Correo usuario"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={nuevoUsuario.cargoUsu}
              onChangeText={(text) =>
                setNuevoUsuario((prev) => ({ ...prev, cargoUsu: text }))
              }
              placeholder="Cargo usuario"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={nuevoUsuario.conUsu}
              onChangeText={(text) =>
                setNuevoUsuario((prev) => ({ ...prev, conUsu: text }))
              }
              placeholder="Contraseña usuario"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <View style={styles.buttonsContainer}>
              <View style={styles.buttonSpace}>
                <Button title="Guardar usuario" onPress={guardarNuevoUsuario} />
              </View>

              <View style={styles.buttonSpace}>
                <Button
                  title="Cancelar"
                  color="red"
                  onPress={() => {
                    setModalCrearVisible(false);
                    setNuevoUsuario({
                      nomUsu: '',
                      correoUsu: '',
                      cargoUsu: '',
                      conUsu: ''
                    });
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#08142b',
  },

  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  backgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 40,
    zIndex: 1,
  },

  title: {
    fontSize: 34,
    color: '#FFFFFF',
    marginBottom: 60,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  profilesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 28,
  },

  profileCard: {
    width: 170,
    alignItems: 'center',
    paddingVertical: 6,
    cursor: 'pointer',
  },

  profileCardHover: {
    transform: [{ translateY: -8 }],
  },

  profileCardPressed: {
    opacity: 0.9,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  avatarHover: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },

  avatarText: {
    fontSize: 46,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  name: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
  },

  nameHover: {
    color: '#FFFFFF',
  },

  role: {
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
  },

  roleHover: {
    color: '#D1D5DB',
  },

  addProfileCard: {
    width: 170,
    alignItems: 'center',
    paddingVertical: 6,
    cursor: 'pointer',
  },

  addAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8a8a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  addAvatarHover: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },

  addIcon: {
    fontSize: 68,
    color: '#141414',
    fontWeight: 'bold',
    lineHeight: 72,
  },

  addText: {
    fontSize: 16,
    color: '#8A8A8A',
    textAlign: 'center',
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalBox: {
    width: 380,
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },

  input: {
    height: 45,
    backgroundColor: '#2b2b2b',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFF',
    marginVertical: 8,
  },

  buttonsContainer: {
    marginTop: 12,
  },

  buttonSpace: {
    marginVertical: 5,
  },
});