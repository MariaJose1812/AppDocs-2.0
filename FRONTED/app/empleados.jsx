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
  Switch,
  useWindowDimensions,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

//Paletas de colores por tema
const P = {
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    surface2: "#2C2C2C",
    surface3: "#0F172A",
    border: "#333333",
    border2: "#444444",
    text: "#FFFFFF",
    textMuted: "#A0A0A0",
    textSub: "#E0E0E0",
    accent: "#60A5FA",
    pickerBg: "#2C2C2C",
    pickerColor: "#FFFFFF",
    tabInactive: "#A0A0A0",
    cardBlocked: "#2C2C2C",
    avatarBg: "#1E293B",
    avatarBorder: "#334155",
    searchBg: "#1E1E1E",
    modalBg: "#1E1E1E",
    switchTrackOff: "#444444",
  },
  light: {
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    surface2: "#F1F5F9",
    surface3: "#EFF6FF",
    border: "#E2E8F0",
    border2: "#CBD5E1",
    text: "#0F172A",
    textMuted: "#64748B",
    textSub: "#334155",
    accent: "#2563EB",
    pickerBg: "#F1F5F9",
    pickerColor: "#0F172A",
    tabInactive: "#64748B",
    cardBlocked: "#F8FAFC",
    avatarBg: "#EFF6FF",
    avatarBorder: "#BFDBFE",
    searchBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    switchTrackOff: "#CBD5E1",
  },
};

const ThemedInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  colors,
}) => (
  <TextInput
    style={{
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    }}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
  />
);

const ThemedPicker = ({ selectedValue, onValueChange, children, colors }) => (
  <View
    style={{
      backgroundColor: colors.pickerBg,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 10,
      overflow: "hidden",
    }}
  >
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={{
        height: 50,
        width: "100%",
        color: colors.pickerColor,
        backgroundColor: colors.pickerBg,
      }}
      dropdownIconColor={colors.textMuted}
    >
      {children}
    </Picker>
  </View>
);

export default function EmpleadosReceptoresScreen() {
  const { theme } = useTheme();
  const c = P[theme] ?? P.light;
  const { width, height } = useWindowDimensions();
  const isSmall = width < 400;

  const [tipoActivo, setTipoActivo] = useState("empleados");
  const [empleados, setEmpleados] = useState([]);
  const [receptores, setReceptores] = useState([]);
  const [oficinasLista, setOficinasLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [empNom, setEmpNom] = useState("");
  const [empCorreo, setEmpCorreo] = useState("");
  const [empDni, setEmpDni] = useState("");
  const [empOficinaId, setEmpOficinaId] = useState("");
  const [empUnidad, setEmpUnidad] = useState("");
  const [empCargoId, setEmpCargoId] = useState("");

  const [recNom, setRecNom] = useState("");
  const [recCorreo, setRecCorreo] = useState("");
  const [recEmpresa, setRecEmpresa] = useState("");
  const [recCargo, setRecCargo] = useState("");

  const [mostrarNuevaOficina, setMostrarNuevaOficina] = useState(false);
  const [nuevaOfNom, setNuevaOfNom] = useState("");
  const [nuevaOfUnidad, setNuevaOfUnidad] = useState("");
  const [nuevaOfCargo, setNuevaOfCargo] = useState("");

  const [mostrarNuevaUnidad, setMostrarNuevaUnidad] = useState(false);
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [nuevaUnidadCargo, setNuevaUnidadCargo] = useState("");

  const [mostrarNuevoCargo, setMostrarNuevoCargo] = useState(false);
  const [nuevoCargo, setNuevoCargo] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);
  useEffect(() => {
    setEmpUnidad("");
    setEmpCargoId("");
  }, [empOficinaId]);
  useEffect(() => {
    setEmpCargoId("");
  }, [empUnidad]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEmp, resRec, resOfi] = await Promise.all([
        api.get("/empleados"),
        api.get("/receptores"),
        api.get("/catalogos/oficinas"),
      ]);
      setEmpleados(
        resEmp.data.map((e) => ({ ...e, estado: e.estado || "Activo" })),
      );
      setReceptores(
        resRec.data.map((r) => ({ ...r, estado: r.estRec || "Activo" })),
      );
      setOficinasLista(resOfi.data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  };

  const guardarRegistro = async () => {
    try {
      if (tipoActivo === "empleados") {
        if (!empNom || !empCorreo || !empOficinaId) {
          Alert.alert("Atención", "Nombre, correo y oficina son obligatorios.");
          return;
        }
        let idOficinaFinal;
        if (empCargoId) {
          idOficinaFinal = parseInt(empCargoId);
        } else {
          const ofi = oficinasLista.find((o) => o.nomOficina === empOficinaId);
          if (!ofi) {
            Alert.alert("Error", "No se encontró la oficina.");
            return;
          }
          idOficinaFinal = ofi.idOficina;
        }
        await api.post("/empleados", {
          nomEmp: empNom,
          corEmp: empCorreo,
          idOficina: idOficinaFinal,
          dniEmp: empDni || null,
        });
        Alert.alert("Éxito", "Empleado creado correctamente.");
      } else {
        if (!recNom || !recCorreo || !recEmpresa || !recCargo) {
          Alert.alert("Atención", "Todos los campos son obligatorios.");
          return;
        }
        await api.post("/receptores", {
          nomRec: recNom,
          corRec: recCorreo,
          emprRec: recEmpresa,
          cargoRec: recCargo,
        });
        Alert.alert("Éxito", "Receptor creado correctamente.");
      }
      limpiarFormularios();
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      if (error.response?.status === 409)
        Alert.alert("Error", "Este correo ya está registrado.");
      else Alert.alert("Error", "No se pudo crear el registro.");
    }
  };

  const limpiarFormularios = () => {
    setEmpNom("");
    setEmpCorreo("");
    setEmpDni("");
    setEmpOficinaId("");
    setEmpUnidad("");
    setEmpCargoId("");
    setRecNom("");
    setRecCorreo("");
    setRecEmpresa("");
    setRecCargo("");
    setMostrarNuevaOficina(false);
    setNuevaOfNom("");
    setNuevaOfUnidad("");
    setNuevaOfCargo("");
    setMostrarNuevaUnidad(false);
    setNuevaUnidad("");
    setNuevaUnidadCargo("");
    setMostrarNuevoCargo(false);
    setNuevoCargo("");
  };

  const toggleEstado = async (id, tipo, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    const endpoint =
      tipo === "empleado"
        ? `/empleados/${id}/estado`
        : `/receptores/${id}/estado`;
    try {
      console.log("Enviando:", { id, tipo, estado: nuevoEstado });
      await api.put(endpoint, { estado: nuevoEstado });
      if (tipo === "empleado")
        setEmpleados(
          empleados.map((e) =>
            e.idEmpleados === id ? { ...e, estado: nuevoEstado } : e,
          ),
        );
      else
        setReceptores(
          receptores.map((r) =>
            r.idReceptores === id ? { ...r, estado: nuevoEstado } : r,
          ),
        );
    } catch {
      Alert.alert("Error", "No se pudo cambiar el estado.");
    }
  };

  const crearNuevaOficina = async () => {
    if (!nuevaOfNom || !nuevaOfUnidad || !nuevaOfCargo) {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
      return;
    }
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: nuevaOfNom,
        unidad: nuevaOfUnidad,
        cargoOfi: nuevaOfCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpOficinaId(String(res.data.idOficina));
      setNuevaOfNom("");
      setNuevaOfUnidad("");
      setNuevaOfCargo("");
      setMostrarNuevaOficina(false);
      Alert.alert("Éxito", "Oficina creada.");
    } catch {
      Alert.alert("Error", "No se pudo crear la oficina.");
    }
  };

  const crearNuevaUnidad = async () => {
    if (!nuevaUnidad || !nuevaUnidadCargo) {
      Alert.alert("Atención", "Unidad y cargo son obligatorios.");
      return;
    }
    const ofi = oficinasLista.find((o) => o.nomOficina === empOficinaId);
    if (!ofi) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: ofi.nomOficina,
        unidad: nuevaUnidad,
        cargoOfi: nuevaUnidadCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpUnidad(res.data.unidad);
      setNuevaUnidad("");
      setNuevaUnidadCargo("");
      setMostrarNuevaUnidad(false);
      Alert.alert("Éxito", "Unidad creada.");
    } catch {
      Alert.alert("Error", "No se pudo crear la unidad.");
    }
  };

  const crearNuevoCargo = async () => {
    if (!nuevoCargo) {
      Alert.alert("Atención", "El nombre del cargo es obligatorio.");
      return;
    }
    const ofi = oficinasLista.find((o) => o.nomOficina === empOficinaId);
    if (!ofi) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: ofi.nomOficina,
        unidad: empUnidad,
        cargoOfi: nuevoCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpCargoId(String(res.data.idOficina));
      setNuevoCargo("");
      setMostrarNuevoCargo(false);
      Alert.alert("Éxito", "Cargo creado.");
    } catch {
      Alert.alert("Error", "No se pudo crear el cargo.");
    }
  };

  const getInicial = (n) => (n ? n.charAt(0).toUpperCase() : "?");
  const oficinasUnicas = [
    ...new Map(oficinasLista.map((o) => [o.nomOficina, o])).values(),
  ];
  const unidadesDeLaOficina = empOficinaId
    ? [
        ...new Set(
          oficinasLista
            .filter((o) => o.nomOficina === empOficinaId)
            .map((o) => o.unidad)
            .filter(Boolean),
        ),
      ]
    : [];
  const cargosDeLaUnidad =
    empOficinaId && empUnidad
      ? oficinasLista.filter(
          (o) => o.nomOficina === empOficinaId && o.unidad === empUnidad,
        )
      : [];

  const datosFiltrados = (
    tipoActivo === "empleados" ? empleados : receptores
  ).filter((item) => {
    const txt = busqueda.toLowerCase();
    return (
      (item.nomEmp || item.nomRec || "").toLowerCase().includes(txt) ||
      (item.corEmp || item.corRec || "").toLowerCase().includes(txt) ||
      (item.cargoEmp || item.cargoRec || "").toLowerCase().includes(txt) ||
      (item.nomOficina || "").toLowerCase().includes(txt)
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Header />
      <Navbar />
      <CustomScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: "center",
          paddingBottom: 80,
        }}
      >
        <View style={{ width: "100%", maxWidth: 900 }}>
          {/* Header row */}
          <View style={[styles.headerRow, isSmall && styles.headerRowSmall]}>
            <View style={{ flexShrink: 1 }}>
              <Text
                style={[
                  styles.mainTitle,
                  { color: c.text },
                  isSmall && { fontSize: 20 },
                ]}
              >
                Directorio
              </Text>
              <Text style={[styles.subTitle, { color: c.textMuted }]}>
                Administra empleados y receptores
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, isSmall && styles.addBtnSmall]}
              onPress={() => {
                limpiarFormularios();
                setModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>
                {tipoActivo === "empleados"
                  ? "Nuevo Empleado"
                  : "Nuevo Receptor"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: c.surface }]}>
            {["empleados", "receptores"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  tipoActivo === tab && styles.tabActive,
                ]}
                onPress={() => setTipoActivo(tab)}
              >
                <MaterialCommunityIcons
                  name={
                    tab === "empleados"
                      ? "badge-account-horizontal-outline"
                      : "truck-delivery-outline"
                  }
                  size={isSmall ? 17 : 20}
                  color={tipoActivo === tab ? "#fff" : c.tabInactive}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: tipoActivo === tab ? "#fff" : c.tabInactive },
                    isSmall && { fontSize: 13 },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Búsqueda */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: c.searchBg, borderColor: c.border },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={c.textMuted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={`Buscar ${tipoActivo}...`}
              placeholderTextColor={c.textMuted}
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
                  color={c.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista */}
          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#09528e"
              style={{ marginTop: 50 }}
            />
          ) : datosFiltrados.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <MaterialCommunityIcons
                name="card-search-outline"
                size={48}
                color={c.textMuted}
              />
              <Text style={[styles.emptyStateTitle, { color: c.text }]}>
                Sin resultados
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {datosFiltrados.map((item) => {
                const id = item.idEmpleados || item.idReceptores;
                const nombre = item.nomEmp || item.nomRec;
                const correo = item.corEmp || item.corRec;
                const cargo = item.cargoEmp || item.cargoRec;
                const empresa = item.emprRec || "Interno";
                const isActivo = item.estado === "Activo";

                return (
                  <View
                    key={id}
                    style={[
                      styles.userCard,
                      {
                        backgroundColor: isActivo ? c.surface : c.cardBlocked,
                        borderColor: c.border,
                      },
                      !isActivo && { opacity: 0.65 },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          backgroundColor: c.avatarBg,
                          borderColor: isActivo ? c.avatarBorder : c.border2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: c.accent },
                          !isActivo && { color: c.textMuted },
                        ]}
                      >
                        {getInicial(nombre)}
                      </Text>
                    </View>

                    <View
                      style={{ flex: 1, justifyContent: "center", minWidth: 0 }}
                    >
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.userName,
                            { color: c.text },
                            !isActivo && { color: c.textMuted },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {nombre}
                        </Text>
                        {!isActivo && (
                          <View style={styles.badgeInactivo}>
                            <Text style={styles.badgeInactivoText}>
                              Bloqueado
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.badgeContainer}>
                        {cargo ? (
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: c.surface2 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                { color: c.textSub },
                              ]}
                              numberOfLines={1}
                            >
                              {cargo}
                            </Text>
                          </View>
                        ) : null}
                        {tipoActivo === "receptores" && (
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: c.surface3 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                { color: c.accent },
                              ]}
                              numberOfLines={1}
                            >
                              {empresa}
                            </Text>
                          </View>
                        )}
                        {tipoActivo === "empleados" && item.nomOficina && (
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: "#78350f22" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                { color: "#D97706" },
                              ]}
                              numberOfLines={1}
                            >
                              {item.nomOficina}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={13}
                          color={c.textMuted}
                        />
                        <Text
                          style={[styles.emailText, { color: c.textMuted }]}
                          numberOfLines={1}
                        >
                          {correo}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        alignItems: "center",
                        marginLeft: 8,
                        minWidth: 56,
                      }}
                    >
                      <Text
                        style={[styles.switchLabel, { color: c.textMuted }]}
                      >
                        {isActivo ? "Activo" : "Inactivo"}
                      </Text>
                      <Switch
                        value={isActivo}
                        onValueChange={() =>
                          toggleEstado(
                            id,
                            tipoActivo === "empleados"
                              ? "empleado"
                              : "receptor",
                            item.estado,
                          )
                        }
                        trackColor={{
                          false: c.switchTrackOff,
                          true: "#1E3A5F",
                        }}
                        thumbColor={isActivo ? "#3b82f6" : c.textMuted}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </CustomScrollView>

      {/*MODAL*/}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: c.modalBg,
                width: Math.min(width - 32, 500),
                maxHeight: height * 0.88,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: c.avatarBg },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    tipoActivo === "empleados"
                      ? "badge-account"
                      : "truck-delivery"
                  }
                  size={24}
                  color={c.accent}
                />
              </View>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                Crear {tipoActivo === "empleados" ? "Empleado" : "Receptor"}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {tipoActivo === "empleados" ? (
                <>
                  {/* Nombre */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Nombre Completo
                    </Text>
                    <ThemedInput
                      value={empNom}
                      onChangeText={setEmpNom}
                      placeholder="Ej. Pablo Díaz"
                      colors={c}
                    />
                  </View>
                  {/* DNI */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      DNI
                    </Text>
                    <ThemedInput
                      value={empDni}
                      onChangeText={setEmpDni}
                      placeholder="0000-0000-00000"
                      keyboardType="numeric"
                      colors={c}
                    />
                  </View>
                  {/* Correo */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Correo Electrónico
                    </Text>
                    <ThemedInput
                      value={empCorreo}
                      onChangeText={setEmpCorreo}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      colors={c}
                    />
                  </View>

                  {/* Oficina */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.label, { color: c.textMuted }]}>
                        Oficina
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setMostrarNuevaOficina(!mostrarNuevaOficina);
                          setMostrarNuevaUnidad(false);
                          setMostrarNuevoCargo(false);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            mostrarNuevaOficina
                              ? "close-circle-outline"
                              : "plus-circle-outline"
                          }
                          size={20}
                          color={c.accent}
                        />
                      </TouchableOpacity>
                    </View>
                    <ThemedPicker
                      selectedValue={empOficinaId}
                      onValueChange={setEmpOficinaId}
                      colors={c}
                    >
                      <Picker.Item
                        label="Seleccione una oficina..."
                        value=""
                        color={c.textMuted}
                      />
                      {oficinasUnicas.map((ofi) => (
                        <Picker.Item
                          key={ofi.nomOficina}
                          label={ofi.nomOficina}
                          value={ofi.nomOficina}
                          color={c.pickerColor}
                        />
                      ))}
                    </ThemedPicker>
                  </View>

                  {mostrarNuevaOficina && (
                    <View
                      style={[
                        styles.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.inlineFormTitle, { color: c.accent }]}
                      >
                        Nueva Oficina
                      </Text>
                      <ThemedInput
                        value={nuevaOfNom}
                        onChangeText={setNuevaOfNom}
                        placeholder="Nombre de la oficina"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaOfUnidad}
                        onChangeText={setNuevaOfUnidad}
                        placeholder="Unidad"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaOfCargo}
                        onChangeText={setNuevaOfCargo}
                        placeholder="Cargo"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevaOficina}
                      >
                        <Text style={styles.inlineBtnText}>
                          Guardar Oficina
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Unidad */}
                  {empOficinaId !== "" && (
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.label, { color: c.textMuted }]}>
                          Unidad
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMostrarNuevaUnidad(!mostrarNuevaUnidad);
                            setMostrarNuevaOficina(false);
                            setMostrarNuevoCargo(false);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              mostrarNuevaUnidad
                                ? "close-circle-outline"
                                : "plus-circle-outline"
                            }
                            size={20}
                            color={c.accent}
                          />
                        </TouchableOpacity>
                      </View>
                      <ThemedPicker
                        selectedValue={empUnidad}
                        onValueChange={setEmpUnidad}
                        colors={c}
                      >
                        <Picker.Item
                          label="Seleccione una unidad..."
                          value=""
                          color={c.textMuted}
                        />
                        {unidadesDeLaOficina.map((u) => (
                          <Picker.Item
                            key={u}
                            label={u}
                            value={u}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    </View>
                  )}

                  {mostrarNuevaUnidad && empOficinaId !== "" && (
                    <View
                      style={[
                        styles.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.inlineFormTitle, { color: c.accent }]}
                      >
                        Nueva Unidad
                      </Text>
                      <ThemedInput
                        value={nuevaUnidad}
                        onChangeText={setNuevaUnidad}
                        placeholder="Nombre de la unidad"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaUnidadCargo}
                        onChangeText={setNuevaUnidadCargo}
                        placeholder="Cargo de esta unidad"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevaUnidad}
                      >
                        <Text style={styles.inlineBtnText}>Guardar Unidad</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Cargo */}
                  {empUnidad !== "" && (
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.label, { color: c.textMuted }]}>
                          Cargo
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMostrarNuevoCargo(!mostrarNuevoCargo);
                            setMostrarNuevaOficina(false);
                            setMostrarNuevaUnidad(false);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              mostrarNuevoCargo
                                ? "close-circle-outline"
                                : "plus-circle-outline"
                            }
                            size={20}
                            color={c.accent}
                          />
                        </TouchableOpacity>
                      </View>
                      <ThemedPicker
                        selectedValue={empCargoId}
                        onValueChange={setEmpCargoId}
                        colors={c}
                      >
                        <Picker.Item
                          label="Seleccione un cargo..."
                          value=""
                          color={c.textMuted}
                        />
                        {cargosDeLaUnidad.map((fila) => (
                          <Picker.Item
                            key={fila.idOficina}
                            label={fila.cargoOfi}
                            value={String(fila.idOficina)}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    </View>
                  )}

                  {mostrarNuevoCargo && empUnidad !== "" && (
                    <View
                      style={[
                        styles.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.inlineFormTitle, { color: c.accent }]}
                      >
                        Nuevo Cargo
                      </Text>
                      <ThemedInput
                        value={nuevoCargo}
                        onChangeText={setNuevoCargo}
                        placeholder="Nuevo cargo"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevoCargo}
                      >
                        <Text style={styles.inlineBtnText}>Guardar Cargo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Nombre Completo
                    </Text>
                    <ThemedInput
                      value={recNom}
                      onChangeText={setRecNom}
                      placeholder="Ej. Carlos Mendoza"
                      colors={c}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Correo Electrónico
                    </Text>
                    <ThemedInput
                      value={recCorreo}
                      onChangeText={setRecCorreo}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      colors={c}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Empresa
                    </Text>
                    <ThemedInput
                      value={recEmpresa}
                      onChangeText={setRecEmpresa}
                      placeholder="Ej. Tech Solutions S.A."
                      colors={c}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: c.textMuted }]}>
                      Cargo
                    </Text>
                    <ThemedInput
                      value={recCargo}
                      onChangeText={setRecCargo}
                      placeholder="Ej. Técnico de Soporte"
                      colors={c}
                    />
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: c.surface2, borderColor: c.border2 },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: c.textSub }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={guardarRegistro}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnSmall: { alignSelf: "stretch", justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 14 },

  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: "#09528e", elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  userCard: {
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  userName: { fontSize: 15, fontWeight: "700", flexShrink: 1 },
  badgeInactivo: {
    backgroundColor: "#450a0a",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactivoText: { fontSize: 9, color: "#ef4444", fontWeight: "bold" },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 5,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "600" },
  emailText: { fontSize: 13, marginLeft: 5, flex: 1 },
  switchLabel: { fontSize: 10, marginBottom: 3, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
  },
  emptyStateTitle: { fontSize: 17, fontWeight: "700", marginTop: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
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

  inputGroup: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    marginBottom: 4,
    gap: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#09528e",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    elevation: 3,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  inlineForm: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginTop: -6,
  },
  inlineFormTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inlineBtn: {
    backgroundColor: "#0369a1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  inlineBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
