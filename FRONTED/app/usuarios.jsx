import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [miCargo, setMiCargo] = useState("");
  const [miNombre, setMiNombre] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNom, setNuevoNom] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [nuevoPass, setNuevoPass] = useState("");

  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    cargarUsuarios();
    cargarDatosSesion();
  }, []);

  // Función para obtener quién está logueado
  const cargarDatosSesion = async () => {
    try {
      const cargo = await AsyncStorage.getItem("cargoUsuario");
      const nombre = await AsyncStorage.getItem("nombreUsuario");

      if (cargo) setMiCargo(cargo);
      if (nombre) setMiNombre(nombre);
    } catch (error) {
      console.error("Error leyendo AsyncStorage:", error);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  };

  const crearUsuario = async () => {
    if (!nuevoNom || !nuevoCorreo || !nuevoCargo || !nuevoPass) {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
      return;
    }

    try {
      const payload = {
        nomUsu: nuevoNom,
        corUsu: nuevoCorreo,
        cargoUsu: nuevoCargo,
        conUsu: nuevoPass,
      };

      await api.post("/usuarios", payload);
      Alert.alert("Éxito", "Usuario creado correctamente.");

      setNuevoNom("");
      setNuevoCorreo("");
      setNuevoCargo("");
      setNuevoPass("");
      setModalVisible(false);

      cargarUsuarios();
    } catch (error) {
      console.error("Error al crear usuario:", error);
      if (error.response && error.response.status === 409) {
        Alert.alert("Error", "Este correo ya está registrado.");
      } else {
        Alert.alert("Error", "No se pudo crear el usuario.");
      }
    }
  };

  const confirmarEliminacion = (id, nombre) => {
    setUsuarioSeleccionado({ id, nombre });
    setModalConfirmarVisible(true);
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter((usu) => usu.idUsuarios !== id));
    } catch (error) {
      console.error("Error al eliminar:", error);
      Alert.alert("Error", "No se pudo eliminar el usuario.");
    }
  };

  const getInicial = (nombre) => {
    return nombre ? nombre.charAt(0).toUpperCase() : "U";
  };

  //BUSCADOR DE USUARIOS
  const usuariosFiltrados = usuarios.filter((usu) => {
    const textoBuscado = busqueda.toLowerCase();
    return (
      (usu.nomUsu && usu.nomUsu.toLowerCase().includes(textoBuscado)) ||
      (usu.corUsu && usu.corUsu.toLowerCase().includes(textoBuscado)) ||
      (usu.cargoUsu && usu.cargoUsu.toLowerCase().includes(textoBuscado))
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.mainTitle}>Usuarios</Text>
              <Text style={styles.subTitle}>
                Administra los accesos al sistema
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.addBtnText}>Nuevo Usuario</Text>
            </TouchableOpacity>
          </View>

          {/* BARRA DE BÚSQUEDA */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color="#94a3b8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, correo o cargo..."
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                style={styles.clearIcon}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            )}
          </View>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#2563eb"
              style={{ marginTop: 50 }}
            />
          ) : (
            <View style={styles.listContainer}>
              {usuariosFiltrados.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <MaterialCommunityIcons
                      name={
                        busqueda
                          ? "account-search-outline"
                          : "account-group-outline"
                      }
                      size={48}
                      color="#94a3b8"
                    />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    {busqueda ? "No hay resultados" : "Sin usuarios"}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {busqueda
                      ? `No encontramos a nadie que coincida con "${busqueda}".`
                      : "Aún no hay usuarios registrados. Comienza agregando uno nuevo."}
                  </Text>
                </View>
              ) : (
                usuariosFiltrados.map((usu) => (
                  <View key={usu.idUsuarios} style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {getInicial(usu.nomUsu)}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {usu.nomUsu}
                      </Text>
                      <View style={styles.badgeContainer}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>
                            {usu.cargoUsu}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.emailRow}>
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={16}
                          color="#64748b"
                        />
                        <Text style={styles.emailText}>{usu.corUsu}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() =>
                        confirmarEliminacion(usu.idUsuarios, usu.nomUsu)
                      }
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={22}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </CustomScrollView>

      {/* MODAL PARA CREAR USUARIO*/}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons
                  name="account-plus"
                  size={24}
                  color="#2563eb"
                />
              </View>
              <Text style={styles.modalTitle}>Crear Usuario</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={nuevoNom}
                onChangeText={setNuevoNom}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                value={nuevoCorreo}
                onChangeText={setNuevoCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ejemplo@empresa.com"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cargo / Rol</Text>
              <TextInput
                style={styles.input}
                value={nuevoCargo}
                onChangeText={setNuevoCargo}
                placeholder="Ej. Administrador"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={nuevoPass}
                onChangeText={setNuevoPass}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={crearUsuario}
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal
        visible={modalConfirmarVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: "#fef2f2" },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-alert"
                  size={28}
                  color="#ef4444"
                />
              </View>
              <Text style={styles.modalTitle}>¿Eliminar usuario?</Text>
            </View>

            <Text style={styles.confirmText}>
              Estás a punto de eliminar a{" "}
              <Text style={{ fontWeight: "700", color: "#1e293b" }}>
                {usuarioSeleccionado?.nombre}
              </Text>
              . ¿Seguro que deseas continuar? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalConfirmarVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#ef4444" }]}
                onPress={() => {
                  eliminarUsuario(usuarioSeleccionado.id);
                  setModalConfirmarVisible(false);
                }}
              >
                <Text style={styles.saveBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },
  contentWidth: { width: "100%", maxWidth: 900 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  mainTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subTitle: { fontSize: 14, color: "#64748b", marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 15 },

  // ESTILOS DEL BUSCADOR
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#1e293b",
    outlineStyle: "none",
  },
  clearIcon: { padding: 5 },

  listContainer: { gap: 16 },

  userCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#2563eb" },

  userInfo: { flex: 1, justifyContent: "center" },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

  badgeContainer: { flexDirection: "row", marginBottom: 6 },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: "#475569" },

  emailRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  emailText: { fontSize: 14, color: "#64748b", marginLeft: 6 },

  deleteIcon: { padding: 10, backgroundColor: "#fef2f2", borderRadius: 10 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 250,
  },
  confirmText: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 22,
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: { color: "#475569", fontSize: 15, fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
