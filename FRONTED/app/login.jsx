import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity, // Mejor para botones personalizados que 'Button'
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import api from "../services/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [userSeleccionado, setUserSeleccionado] = useState(null);
  const [pass, setPass] = useState("");
  const [hoveredProfile, setHoveredProfile] = useState(null);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nomUsu: "",
    corUsu: "",
    cargoUsu: "",
    conUsu: "",
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      console.log("Error cargando usuarios:", err.message);
    }
  };

  const intentarLogin = async () => {
    if (!pass) return Alert.alert("Error", "Ingresa la contraseña");
    try {
      const res = await api.post("/auth/login", {
        idUsuarios: userSeleccionado.idUsuarios,
        conUsu: pass,
      });

      if (res.data.token) {
        await AsyncStorage.setItem("userToken", res.data.token);
        await AsyncStorage.setItem("nomUsu", userSeleccionado.nomUsu);
        await AsyncStorage.setItem("cargoUsu", userSeleccionado.cargoUsu);
        await AsyncStorage.setItem("idUsuarios", userSeleccionado.idUsuarios.toString());
        setUserSeleccionado(null);
        setPass("");
        router.replace("/dashboard");
      }
    } catch (err) {
      Alert.alert("Error", "Contraseña incorrecta");
    }
  };

  const guardarNuevoUsuario = async () => {
    const { nomUsu, corUsu, cargoUsu, conUsu } = nuevoUsuario;
    if (!nomUsu || !corUsu || !cargoUsu || !conUsu) {
      return Alert.alert(
        "Campos requeridos",
        "Por favor, completa todos los campos.",
      );
    }

    try {
      await api.post("/usuarios", nuevoUsuario);
      Alert.alert("Éxito", "Usuario creado correctamente");
      setModalCrearVisible(false);
      setNuevoUsuario({ nomUsu: "", corUsu: "", cargoUsu: "", conUsu: "" });
      cargarUsuarios(); // Refrescamos la lista desde el servidor
    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudo registrar el usuario. El correo podría estar duplicado.",
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Fondo Gradiente */}
      <View pointerEvents="none" style={styles.backgroundWrapper}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="grad1" cx="12%" cy="18%" rx="35%" ry="35%">
              <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="#08142b" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        </Svg>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Selecciona tu Perfil</Text>

        <View style={styles.profilesGrid}>
          {usuarios.map((item) => (
            <Pressable
              key={item.idUsuarios}
              onPress={() => setUserSeleccionado(item)}
              style={({ pressed }) => [
                styles.profileCard,
                pressed && styles.profileCardPressed,
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.nomUsu?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.nomUsu}
              </Text>
              <Text style={styles.role} numberOfLines={1}>
                {item.cargoUsu}
              </Text>
            </Pressable>
          ))}

          {/* Botón Agregar */}
          <Pressable
            onPress={() => setModalCrearVisible(true)}
            style={({ pressed }) => [
              styles.profileCard,
              pressed && styles.profileCardPressed,
            ]}
          >
            <View style={[styles.avatar, styles.addAvatar]}>
              <Text style={styles.addIcon}>+</Text>
            </View>
            <Text style={styles.addText}>Agregar usuario</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Login */}
      <Modal visible={!!userSeleccionado} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Hola, {userSeleccionado?.nomUsu}
            </Text>
            <TextInput
              secureTextEntry
              style={styles.input}
              value={pass}
              onChangeText={setPass}
              placeholder="Contraseña"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnMain]}
                onPress={intentarLogin}
              >
                <Text style={styles.btnText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setUserSeleccionado(null);
                  setPass("");
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Usuario */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo Perfil</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#999"
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, nomUsu: t })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Correo"
              placeholderTextColor="#999"
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, corUsu: t })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Cargo (Ej: IT)"
              placeholderTextColor="#999"
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, cargoUsu: t })
              }
            />
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Contraseña"
              placeholderTextColor="#999"
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, conUsu: t })
              }
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnMain]}
                onPress={guardarNuevoUsuario}
              >
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setModalCrearVisible(false)}
              >
                <Text style={styles.btnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08142b" },
  backgroundWrapper: { ...StyleSheet.absoluteFillObject },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 32, color: "#FFF", fontWeight: "bold", marginBottom: 40, textAlign: "center" },

  // Grid Responsivo
  profilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 1000,
    paddingHorizontal: 10,
    gap: 30,
  },
  profileCard: {
    width: width > 600 ? 160 : width * 0.4, // Se adapta a tablets o móviles
    alignItems: "center",
    marginBottom: 20,
  },
  profileCardPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 15,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarText: { fontSize: 40, color: "#FFF", fontWeight: "bold" },
  addAvatar: { backgroundColor: "#1e293b", borderStyle: "dashed" },
  addIcon: { fontSize: 50, color: "#0ea5e9" },

  name: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  role: { color: "#64748b", fontSize: 13 },
  addText: { color: "#0ea5e9", fontSize: 14, marginTop: 5 },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "#1e293b",
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 15,
    color: "#FFF",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalButtonsRow: { flexDirection: "column", gap: 10 },
  btn: { padding: 15, borderRadius: 10, alignItems: "center" },
  btnMain: { backgroundColor: "#0ea5e9" },
  btnCancel: { backgroundColor: "transparent" },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
