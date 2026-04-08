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
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

export default function UsuariosScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 400;

  /* ── Tema ── */
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = Colors[theme].background;
  const textColor = Colors[theme].text;
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const surfaceBg2 = isDark ? "#2c3e50" : "#f1f5f9"; 
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const mutedCol = isDark ? "#475569" : "#cbd5e1";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const avatarBg = isDark ? "#1e293b" : "#e0f2fe";
  const avatarText = isDark ? "#60a5fa" : "#09528e";
  const badgeBg = isDark ? "#334155" : "#e0f2fe";
  const badgeText = isDark ? "#e2e8f0" : "#0369a1";
  const deleteBg = isDark ? "#450a0a" : "#fef2f2";
  const emptyBorder = isDark ? "#334155" : "#e2e8f0";
  const iconBg = isDark ? "#1e293b" : "#f1f5f9";
  const modalBg = isDark ? "#1e293b" : "#ffffff";
  const overlayBg = isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.45)";

  /* ── Estado ── */
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
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
  }, []);

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
      await api.post("/usuarios", {
        nomUsu: nuevoNom,
        corUsu: nuevoCorreo,
        cargoUsu: nuevoCargo,
        conUsu: nuevoPass,
      });
      Alert.alert("Éxito", "Usuario creado correctamente.");
      setNuevoNom("");
      setNuevoCorreo("");
      setNuevoCargo("");
      setNuevoPass("");
      setModalVisible(false);
      cargarUsuarios();
    } catch (error) {
      if (error.response?.status === 409)
        Alert.alert("Error", "Este correo ya está registrado.");
      else Alert.alert("Error", "No se pudo crear el usuario.");
    }
  };

  const confirmarEliminacion = (id, nombre) => {
    setUsuarioSeleccionado({ id, nombre });
    setModalConfirmarVisible(true);
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter((u) => u.idUsuarios !== id));
    } catch {
      Alert.alert("Error", "No se pudo eliminar el usuario.");
    }
  };

  const getInicial = (nombre) =>
    nombre ? nombre.charAt(0).toUpperCase() : "U";

  const usuariosFiltrados = usuarios.filter((usu) => {
    const q = busqueda.toLowerCase();
    return (
      usu.nomUsu?.toLowerCase().includes(q) ||
      usu.corUsu?.toLowerCase().includes(q) ||
      usu.cargoUsu?.toLowerCase().includes(q)
    );
  });

  /* ── Input reutilizable para el modal ── */
  const ModalInput = ({ label, value, onChange, ...props }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: subColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: inputBorder,
            color: textColor,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={subColor}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>
          {/* HEADER */}
          <View style={[styles.headerRow, isSmall && styles.headerRowSmall]}>
            <View>
              <Text
                style={[
                  styles.mainTitle,
                  { color: textColor },
                  isSmall && { fontSize: 20 },
                ]}
              >
                Usuarios
              </Text>
              <Text style={[styles.subTitle, { color: subColor }]}>
                Administra los accesos al sistema
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addBtn,
                isSmall && { alignSelf: "stretch", justifyContent: "center" },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.addBtnText}>Nuevo Usuario</Text>
            </TouchableOpacity>
          </View>

          {/* BUSCADOR */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: surfaceBg, borderColor: borderCol },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={subColor}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Buscar por nombre, correo o cargo..."
              placeholderTextColor={subColor}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                style={{ padding: 6 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={mutedCol}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* LISTA */}
          {cargando ? (
            <ActivityIndicator
              size="large"
              color={isDark ? "#60a5fa" : "#09528e"}
              style={{ marginTop: 50 }}
            />
          ) : (
            <View style={styles.listContainer}>
              {usuariosFiltrados.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    { backgroundColor: surfaceBg, borderColor: emptyBorder },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIconContainer,
                      { backgroundColor: surfaceBg2 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        busqueda
                          ? "account-search-outline"
                          : "account-group-outline"
                      }
                      size={48}
                      color={subColor}
                    />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                    {busqueda ? "No hay resultados" : "Sin usuarios"}
                  </Text>
                  <Text style={[styles.emptyStateText, { color: subColor }]}>
                    {busqueda
                      ? `No encontramos a nadie que coincida con "${busqueda}".`
                      : "Aún no hay usuarios registrados. Comienza agregando uno nuevo."}
                  </Text>
                </View>
              ) : (
                usuariosFiltrados.map((usu) => (
                  <View
                    key={usu.idUsuarios}
                    style={[
                      styles.userCard,
                      { backgroundColor: surfaceBg, borderColor: borderCol },
                    ]}
                  >
                    {/* Avatar */}
                    <View
                      style={[
                        styles.avatarContainer,
                        { backgroundColor: avatarBg, borderColor: borderCol },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: avatarText }]}>
                        {getInicial(usu.nomUsu)}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.userInfo}>
                      <Text
                        style={[styles.userName, { color: textColor }]}
                        numberOfLines={1}
                      >
                        {usu.nomUsu}
                      </Text>
                      <View style={{ flexDirection: "row", marginBottom: 5 }}>
                        <View
                          style={[
                            styles.roleBadge,
                            { backgroundColor: badgeBg },
                          ]}
                        >
                          <Text
                            style={[styles.roleBadgeText, { color: badgeText }]}
                            numberOfLines={1}
                          >
                            {usu.cargoUsu}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.emailRow}>
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={14}
                          color={subColor}
                        />
                        <Text
                          style={[styles.emailText, { color: subColor }]}
                          numberOfLines={1}
                        >
                          {usu.corUsu}
                        </Text>
                      </View>
                    </View>

                    {/* Eliminar */}
                    <TouchableOpacity
                      style={[styles.deleteIcon, { backgroundColor: deleteBg }]}
                      onPress={() =>
                        confirmarEliminacion(usu.idUsuarios, usu.nomUsu)
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

      {/* MODAL CREAR USUARIO */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: overlayBg }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: modalBg,
                borderColor: borderCol,
                width: Math.min(width - 32, 450),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: isDark ? "#1e3a5f" : "#e0f2fe" },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={24}
                  color={isDark ? "#60a5fa" : "#09528e"}
                />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Crear Usuario
              </Text>
            </View>

            <ModalInput
              label="Nombre Completo"
              value={nuevoNom}
              onChange={setNuevoNom}
              placeholder="Ej. Juan Pérez"
            />
            <ModalInput
              label="Correo Electrónico"
              value={nuevoCorreo}
              onChange={setNuevoCorreo}
              placeholder="ejemplo@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ModalInput
              label="Cargo / Rol"
              value={nuevoCargo}
              onChange={setNuevoCargo}
              placeholder="Ej. Administrador"
            />
            <ModalInput
              label="Contraseña"
              value={nuevoPass}
              onChange={setNuevoPass}
              placeholder="••••••••"
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: surfaceBg2, borderColor: borderCol },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: textColor }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={crearUsuario}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal visible={modalConfirmarVisible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: overlayBg }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: modalBg,
                borderColor: borderCol,
                width: Math.min(width - 32, 450),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: isDark ? "#450a0a" : "#fef2f2" },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-alert"
                  size={28}
                  color="#ef4444"
                />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                ¿Eliminar usuario?
              </Text>
            </View>

            <Text style={[styles.confirmText, { color: subColor }]}>
              Estás a punto de eliminar a{" "}
              <Text style={{ fontWeight: "700", color: textColor }}>
                {usuarioSeleccionado?.nombre}
              </Text>
              . ¿Seguro que deseas continuar? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: surfaceBg2, borderColor: borderCol },
                ]}
                onPress={() => setModalConfirmarVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: textColor }]}>
                  Cancelar
                </Text>
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
  container: { flex: 1 },
  scrollContent: { padding: 16, alignItems: "center", paddingBottom: 80 },
  contentWidth: { width: "100%", maxWidth: 900 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerRowSmall: { flexDirection: "column", alignItems: "flex-start" },
  mainTitle: { fontSize: 24, fontWeight: "800" },
  subTitle: { fontSize: 13, marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#09528e",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    gap: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  listContainer: { gap: 12 },

  userCard: {
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  userInfo: { flex: 1, justifyContent: "center", minWidth: 0 },
  userName: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: "100%",
  },
  roleBadgeText: { fontSize: 11, fontWeight: "600" },
  emailRow: { flexDirection: "row", alignItems: "center", marginTop: 1 },
  emailText: { fontSize: 13, marginLeft: 5, flex: 1 },
  deleteIcon: {
    padding: 9,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 40,
    alignItems: "center",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyStateTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptyStateText: {
    fontSize: 13,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#09528e",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  confirmText: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
});
