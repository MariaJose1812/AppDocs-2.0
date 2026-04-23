import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Svg, {
  Defs,
  Rect,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import { useAlert } from "../context/alertContext";
import api from "../services/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isLarge = width > 768;

const C = {
  bg: "#060e1f",
  surface: "#0d1b35",
  surfaceHi: "#112040",
  border: "#1a2d4d",
  borderHi: "#1e3d6a",
  accent: "#09528e",
  accentLt: "#1a72b8",
  teal: "#1eb9de",
  tealDim: "#0d7a96",
  text: "#e8eef8",
  textMuted: "#5c7a9a",
  textDim: "#3d5472",
  white: "#ffffff",
};

const AVATAR_COLORS = [
  ["#09528e", "#1a72b8"],
  ["#0d7a96", "#1eb9de"],
  ["#1a4d80", "#2a6daa"],
  ["#0a6b6b", "#12a0a0"],
  ["#1a3a7a", "#2a5ab8"],
];

const getAvatarColors = (idx) =>
  AVATAR_COLORS[
    (((idx ?? 0) % AVATAR_COLORS.length) + AVATAR_COLORS.length) %
      AVATAR_COLORS.length
  ];

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("") || "?";

function ProfileCard({ item, index, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [colors] = useState(getAvatarColors(index));
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);
  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 30,
    }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  return (
    <Animated.View
      style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}
    >
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarWrap, { backgroundColor: colors[0] }]}>
            <View style={styles.avatarShine} />
            <Text style={styles.avatarText}>{getInitials(item.nomUsu)}</Text>
            <View style={[styles.avatarBar, { backgroundColor: colors[1] }]} />
          </View>
          <Text style={styles.profileName} numberOfLines={1}>
            {item.nomUsu}
          </Text>
          <View style={styles.roleChip}>
            <Text style={styles.profileRole} numberOfLines={1}>
              {item.cargoUsu}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AddCard({ onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 30,
    }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={styles.addCard}>
          <View style={styles.addCircle}>
            <Text style={styles.addIcon}>＋</Text>
          </View>
          <Text style={styles.addLabel}>Nuevo perfil</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ModalInput({
  label,
  secureTextEntry,
  placeholder,
  value,
  onChangeText,
  autoFocus,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
      />
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [usuarios, setUsuarios] = useState([]);
  const [userSeleccionado, setUserSeleccionado] = useState(null);
  const [pass, setPass] = useState("");
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nomUsu: "",
    corUsu: "",
    cargoUsu: "",
    conUsu: "",
  });
  const headerY = useRef(new Animated.Value(-24)).current;
  const headerO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarUsuarios();
    Animated.parallel([
      Animated.timing(headerY, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(headerO, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      console.log("Error:", err.message);
    }
  };

  const intentarLogin = async () => {
    if (!pass)
      return showAlert({ title: "Error", message: "Ingresa la contraseña" });
    try {
      const res = await api.post("/auth/login", {
        idUsuarios: userSeleccionado.idUsuarios,
        conUsu: pass,
      });
      if (res.data.token) {
        await AsyncStorage.setItem("userToken", res.data.token);
        await AsyncStorage.setItem("nomUsu", userSeleccionado.nomUsu);
        await AsyncStorage.setItem("cargoUsu", userSeleccionado.cargoUsu);
        await AsyncStorage.setItem(
          "idUsuarios",
          userSeleccionado.idUsuarios.toString(),
        );
        setUserSeleccionado(null);
        setPass("");
        router.replace("/dashboard");
      }
    } catch {
      showAlert({ title: "Error", message: "Contraseña incorrecta" });
    }
  };

  const guardarNuevoUsuario = async () => {
    const { nomUsu, corUsu, cargoUsu, conUsu } = nuevoUsuario;
    if (!nomUsu || !corUsu || !cargoUsu || !conUsu)
      return showAlert({
        title: "Error",
        message: "Completa todos los campos.",
      });
    try {
      await api.post("/usuarios", nuevoUsuario);
      showAlert({ title: "Éxito", message: "Usuario creado correctamente" });
      setModalCrearVisible(false);
      setNuevoUsuario({ nomUsu: "", corUsu: "", cargoUsu: "", conUsu: "" });
      cargarUsuarios();
    } catch {
      showAlert({
        title: "Error",
        message: "El correo podría estar duplicado.",
      });
    }
  };

  const modalIdx = userSeleccionado
    ? Math.max(
        0,
        usuarios.findIndex((u) => u === userSeleccionado),
      )
    : 0;
  const modalColors = getAvatarColors(modalIdx);

  return (
    <View style={styles.container}>
      {/* Fondo */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#060e1f" />
              <Stop offset="100%" stopColor="#091628" />
            </LinearGradient>
            <RadialGradient id="o1" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#09528e" stopOpacity="0.32" />
              <Stop offset="100%" stopColor="#09528e" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="o2" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#1eb9de" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#1eb9de" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
          <Ellipse cx="10%" cy="15%" rx="280" ry="260" fill="url(#o1)" />
          <Ellipse cx="92%" cy="82%" rx="300" ry="270" fill="url(#o2)" />
        </Svg>
        {isWeb && (
          <View style={styles.gridOverlay} pointerEvents="none">
            {Array.from({ length: 22 }).map((_, i) => (
              <View key={i} style={[styles.gridLine, { left: `${i * 5}%` }]} />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.layout, isLarge && styles.layoutLarge]}>
        {/* Panel branding */}
        {isLarge && (
          <View style={styles.brandPanel}>
            <View style={styles.brandContent}>
              <View style={styles.emblemWrap}>
                <View style={styles.emblemOuter}>
                  <View style={styles.emblemInner}>
                    <Text style={styles.emblemText}>IT</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.ring,
                    { width: 94, height: 94, opacity: 0.18 },
                  ]}
                />
                <View
                  style={[
                    styles.ring,
                    { width: 116, height: 116, opacity: 0.08 },
                  ]}
                />
              </View>
              <View style={{ gap: 3 }}>
                <Text style={styles.brandTag}>CONADEH</Text>
                <Text style={styles.brandLight}>Unidad de</Text>
                <Text style={styles.brandBold}>Infotecnología</Text>
                <View style={styles.brandBar} />
                <Text style={styles.brandDesc}>
                  Sistema de Gestión{"\n"}de Documentos IT
                </Text>
              </View>

              <View style={styles.brandFooter}>
                <View style={styles.brandFooterDot} />
                <View
                  style={{ flex: 1, height: 1, backgroundColor: C.border }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Panel perfiles */}
        <View style={styles.profilesPanel}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.headerBlock,
                { transform: [{ translateY: headerY }], opacity: headerO },
              ]}
            >
              {!isLarge && (
                <View style={styles.mobileBrand}>
                  <View style={styles.mobileEmblem}>
                    <Text style={styles.mobileEmblemText}>IT</Text>
                  </View>
                  <View>
                    <Text style={styles.mobileBrandName}>CONADEH</Text>
                    <Text style={styles.mobileBrandSub}>
                      Unidad de Infotecnología
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.heading}>Selecciona tu perfil</Text>
              <Text style={styles.subheading}>
                Accede al sistema con tu cuenta institucional
              </Text>
            </Animated.View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.profilesGrid}>
              {usuarios.map((item, idx) => (
                <ProfileCard
                  key={item.idUsuarios}
                  item={item}
                  index={idx}
                  onPress={() => setUserSeleccionado(item)}
                />
              ))}
              <AddCard onPress={() => setModalCrearVisible(true)} />
            </View>

            <Text style={styles.footerText}>
              © 2026 CONADEH — Honduras, C.A.
            </Text>
          </ScrollView>
        </View>
      </View>

      {/* Modal Login */}
      <Modal visible={!!userSeleccionado} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.backdrop} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalAvatar,
                  { backgroundColor: modalColors[0] },
                ]}
              >
                <Text style={styles.modalAvatarText}>
                  {getInitials(userSeleccionado?.nomUsu)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalGreet}>Bienvenido,</Text>
                <Text style={styles.modalName}>{userSeleccionado?.nomUsu}</Text>
                <Text style={styles.modalCargo}>
                  {userSeleccionado?.cargoUsu}
                </Text>
              </View>
            </View>
            <View style={styles.modalDivider} />
            <ModalInput
              label="Contraseña"
              secureTextEntry
              placeholder="Ingresa tu contraseña"
              value={pass}
              onChangeText={setPass}
              autoFocus
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={intentarLogin}>
              <Text style={styles.btnPrimaryText}>Iniciar Sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => {
                setUserSeleccionado(null);
                setPass("");
              }}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Crear */}
      <Modal visible={modalCrearVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.backdrop} />
          <View style={[styles.modalCard, { maxWidth: 420 }]}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Text
                  style={{ color: C.teal, fontSize: 18, fontWeight: "700" }}
                >
                  +
                </Text>
              </View>
              <Text style={styles.modalCardTitle}>Nuevo Perfil</Text>
            </View>
            <View style={styles.modalDivider} />
            <ModalInput
              label="Nombre completo"
              placeholder="Ej: Pablo Pérez"
              value={nuevoUsuario.nomUsu}
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, nomUsu: t })
              }
            />
            <ModalInput
              label="Correo institucional"
              placeholder="correo@conadeh.hn"
              value={nuevoUsuario.corUsu}
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, corUsu: t })
              }
            />
            <ModalInput
              label="Cargo"
              placeholder="Ej: Auxiliar "
              value={nuevoUsuario.cargoUsu}
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, cargoUsu: t })
              }
            />
            <ModalInput
              label="Contraseña"
              secureTextEntry
              placeholder="Mínimo 6 caracteres"
              value={nuevoUsuario.conUsu}
              onChangeText={(t) =>
                setNuevoUsuario({ ...nuevoUsuario, conUsu: t })
              }
            />
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={guardarNuevoUsuario}
            >
              <Text style={styles.btnPrimaryText}>Crear Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => setModalCrearVisible(false)}
            >
              <Text style={styles.btnGhostText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CARD_W = isLarge ? 148 : width * 0.42;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  gridOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(30,185,222,0.035)",
  },
  layout: { flex: 1 },
  layoutLarge: { flexDirection: "row" },

  brandPanel: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingVertical: 60,
    paddingHorizontal: 36,
    justifyContent: "center",
  },
  brandContent: { gap: 28 },
  emblemWrap: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  emblemOuter: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.accentLt,
    zIndex: 2,
  },
  emblemInner: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: C.accentLt,
    justifyContent: "center",
    alignItems: "center",
  },
  emblemText: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.teal,
  },
  brandTag: {
    color: C.teal,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
  },
  brandLight: { color: C.textMuted, fontSize: 20, fontWeight: "300" },
  brandBold: { color: C.text, fontSize: 24, fontWeight: "800", marginTop: -2 },
  brandBar: {
    width: 36,
    height: 3,
    backgroundColor: C.teal,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 10,
  },
  brandDesc: { color: C.textMuted, fontSize: 12, lineHeight: 19 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: C.surfaceHi,
  },
  chipText: { color: C.textMuted, fontSize: 10, fontWeight: "600" },
  brandFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  brandFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.teal,
  },

  profilesPanel: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  headerBlock: { width: "100%", maxWidth: 680, marginBottom: 8 },
  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  mobileEmblem: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  mobileEmblemText: { color: C.white, fontSize: 14, fontWeight: "800" },
  mobileBrandName: {
    color: C.teal,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  mobileBrandSub: { color: C.textMuted, fontSize: 11 },
  heading: {
    color: C.text,
    fontSize: isLarge ? 30 : 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subheading: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 680,
    marginVertical: 22,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },

  profilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 680,
    gap: 14,
  },
  profileCard: {
    width: CARD_W,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: "center",
    overflow: "hidden",
    ...(isWeb && { cursor: "pointer" }),
  },
  avatarWrap: {
    width: isLarge ? 70 : 62,
    height: isLarge ? 70 : 62,
    borderRadius: isLarge ? 17 : 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
    overflow: "hidden",
    position: "relative",
  },
  avatarShine: {
    position: "absolute",
    top: -18,
    left: -18,
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    transform: [{ rotate: "45deg" }],
  },
  avatarBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  avatarText: {
    color: C.white,
    fontSize: isLarge ? 22 : 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  profileName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  roleChip: {
    backgroundColor: C.surfaceHi,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  profileRole: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },

  addCard: {
    width: CARD_W,
    backgroundColor: C.surfaceHi,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.borderHi,
    padding: 14,
    paddingVertical: 22,
    alignItems: "center",
    gap: 10,
    ...(isWeb && { cursor: "pointer" }),
  },
  addCircle: {
    width: isLarge ? 70 : 62,
    height: isLarge ? 70 : 62,
    borderRadius: isLarge ? 17 : 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.tealDim,
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: { color: C.teal, fontSize: 24, fontWeight: "300" },
  addLabel: { color: C.teal, fontSize: 11, fontWeight: "600" },
  footerText: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 40,
    letterSpacing: 0.5,
  },

  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,14,31,0.92)",
  },
  modalCard: {
    width: "88%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.borderHi,
    padding: 26,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 36,
    elevation: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 2,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: { color: C.white, fontSize: 17, fontWeight: "800" },
  modalGreet: { color: C.textMuted, fontSize: 11, fontWeight: "500" },
  modalName: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 1 },
  modalCargo: { color: C.teal, fontSize: 10, fontWeight: "600", marginTop: 2 },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  modalTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.surfaceHi,
    borderWidth: 1,
    borderColor: C.tealDim,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCardTitle: { color: C.text, fontSize: 17, fontWeight: "800" },
  modalDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },

  inputWrap: { marginBottom: 12 },
  inputLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: C.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputFocused: { borderColor: C.tealDim, backgroundColor: "#070f22" },

  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: 11,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.accentLt,
  },
  btnPrimaryText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  btnArrow: { color: C.teal, fontSize: 17 },
  btnGhost: { paddingVertical: 10, alignItems: "center" },
  btnGhostText: { color: C.textMuted, fontSize: 13, fontWeight: "600" },
});
