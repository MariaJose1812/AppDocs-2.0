import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { generarHTMLRecepcion } from "../utils/actaRecepcionHTML";
import { useTheme } from "../hooks/themeContext";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

// ── Paleta de colores por tema ───────────────────────────────────────────────
const P = {
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    surface2: "#2C2C2C",
    border: "#333333",
    border2: "#444444",
    text: "#FFFFFF",
    textMuted: "#A0A0A0",
    textSub: "#E0E0E0",
    accent: "#60A5FA",
    pickerBg: "#2C2C2C",
    pickerColor: "#FFFFFF",
    inputBg: "#2C2C2C",
    inputBorder: "#444444",
    cardShadow: "#000",
    toggleBg: "#1E293B",
    toggleInactive: "#A0A0A0",
    danger: "#ef4444",
    primary: "#09528e",
    success: "#16a34a",
    warning: "#f59e0b",
  },
  light: {
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    surface2: "#F1F5F9",
    border: "#E2E8F0",
    border2: "#CBD5E1",
    text: "#0F172A",
    textMuted: "#64748B",
    textSub: "#334155",
    accent: "#09528E",
    pickerBg: "#F1F5F9",
    pickerColor: "#0F172A",
    inputBg: "#F1F5F9",
    inputBorder: "#CBD5E1",
    cardShadow: "#94A3B8",
    toggleBg: "#F1F5F9",
    toggleInactive: "#64748B",
    danger: "#dc2626",
    primary: "#09528e",
    success: "#16a34a",
    warning: "#f59e0b",
  },
};

// ── Componentes reutilizables con tema ──────────────────────────────────────
const ThemedInput = ({
  value,
  onChangeText,
  placeholder,
  multiline,
  editable,
  keyboardType,
  autoCapitalize,
  style,
  colors,
}) => (
  <TextInput
    style={[
      {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
      },
      style,
    ]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    multiline={multiline}
    editable={editable}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
  />
);

const ThemedPicker = ({
  selectedValue,
  onValueChange,
  enabled,
  children,
  colors,
}) => (
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
      enabled={enabled !== false}
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

// ── Función para obtener la fecha de hoy evitando fallos de timezone ────────
const obtenerFechaActual = () => {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

export default function ActaRecepcionScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const tipoActa = "RECEPCION";

  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  const [receptoresBD, setReceptoresBD] = useState([]);

  // Emisor
  const [emisorNombre, setEmisorNombre] = useState("");
  const [emisorCargo, setEmisorCargo] = useState("");
  const [tituloActa, setTituloActa] = useState("ACTA DE RECEPCIÓN");
  const [editandoEmisor, setEditandoEmisor] = useState(false);

  // Receptor/Proveedor
  const [receptorSelId, setReceptorSelId] = useState("");
  const [receptorSelNombre, setReceptorSelNombre] = useState("");
  const [receptorEmpresa, setReceptorEmpresa] = useState("");

  // Descripción general
  const [descripcion, setDescripcion] = useState("");

  // Temp item
  const [tempDescProd, setTempDescProd] = useState("");
  const [tempPrecio, setTempPrecio] = useState("");
  const [tempEquivalente, setTempEquivalente] = useState("");
  const [tempNumRecibo, setTempNumRecibo] = useState("");
  const [tempNumFact, setTempNumFact] = useState("");
  const [tempFecha, setTempFecha] = useState(obtenerFechaActual());

  const [items, setItems] = useState([]);
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const TASA_CAMBIO = 25.5;

  // ── Cargar emisor + receptores ────────────────────────────────────────────
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const emisorRaw = await AsyncStorage.getItem("recepcion_emisor");
        if (emisorRaw) {
          const e = JSON.parse(emisorRaw);
          setEmisorNombre(e.nombre || "");
          setEmisorCargo(e.cargo || "Jefe de la Unidad de Infotecnologia");
          const tituloLimpio = (e.titulo || "ACTA DE RECEPCIÓN")
            .replace(/DE PRODUCTO DIGITAL\s*/i, "")
            .trim();
          setTituloActa(tituloLimpio || "ACTA DE RECEPCIÓN");
        }
        const resRec = await api.get("/receptores");
        setReceptoresBD(resRec.data);
      } catch (err) {
        console.error(err);
      }
    };
    cargarTodo();
  }, []);

  // Cargar acta en modo vista
  useEffect(() => {
    const cargarActa = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/actas/detalle/RECEPCION/${id}`);
        const acta = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!acta) return;

        const firmante = acta.firmante || {};
        setEmisorNombre(firmante.nombre || acta.emisor?.nombre || "");
        setEmisorCargo(
          firmante.cargo ||
            acta.emisor?.cargo ||
            "Jefe de la Unidad de Infotecnologia",
        );
        setTituloActa("ACTA DE RECEPCIÓN");

        const receptor = acta.receptor || {};
        setReceptorSelNombre(receptor.nombre || "");
        setReceptorEmpresa(receptor.empresa || receptor.cargo || "");

        setDescripcion(acta.descripcion || "");
        setCorrelativo(acta.correlativo || "");

        if (acta.items?.length > 0) {
          setItems(
            acta.items.map((item, idx) => ({
              ...item,
              _idTemporal: idx.toString(),
            })),
          );
        }
      } catch (err) {
        console.error("Error trayendo acta:", err);
        Alert.alert("Error", "No se pudo cargar el detalle del acta");
      }
    };
    cargarActa();
  }, [id]);

  const mostrarAlerta = (titulo, mensaje = "", botones = []) => {
    if (Platform.OS === "web") {
      const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
      if (botones.length > 1) {
        if (window.confirm(texto))
          botones.find((b) => b.style !== "cancel")?.onPress?.();
      } else {
        window.alert(texto);
        botones[0]?.onPress?.();
      }
    } else {
      Alert.alert(
        titulo,
        mensaje,
        botones.length > 0 ? botones : [{ text: "OK" }],
      );
    }
  };

  const guardarEmisor = async () => {
    try {
      await AsyncStorage.setItem(
        "recepcion_emisor",
        JSON.stringify({
          nombre: emisorNombre,
          cargo: emisorCargo,
          titulo: tituloActa,
        }),
      );
      setEditandoEmisor(false);
    } catch {
      mostrarAlerta("Error", "No se pudieron guardar los datos del firmante.");
    }
  };

  // ── Agregar ítem ──────────────────────────────────────────────────────────
  const agregarItem = () => {
    if (!tempDescProd.trim()) {
      mostrarAlerta("Atención", "La descripción del producto es obligatoria.");
      return;
    }
    if (!tempNumRecibo.trim() || !tempNumFact.trim()) {
      mostrarAlerta(
        "Atención",
        "El # de recibo y # de factura son obligatorios.",
      );
      return;
    }
    setItems([
      ...items,
      {
        descr_prod: tempDescProd,
        precio_prod: tempPrecio,
        equivalente_lps: tempEquivalente,
        num_recibo: tempNumRecibo,
        num_fact: tempNumFact,
        fech_ARCEnc: tempFecha,
        fech_ARCDet: tempFecha,
        _idTemporal: Date.now().toString(),
      },
    ]);
    setTempDescProd("");
    setTempPrecio("");
    setTempEquivalente("");
    setTempNumRecibo("");
    setTempNumFact("");
    setTempFecha(obtenerFechaActual());
  };

  const eliminarItem = (idTemp) =>
    setItems(items.filter((i) => i._idTemporal !== idTemp));

  const cancelarActa = () => {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "¿Estás seguro?\n\nSi cancelas, perderás todos los datos.",
        )
      )
        router.replace("/generarDocs");
    } else {
      Alert.alert("¿Estás seguro?", "Si cancelas, perderás todos los datos.", [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => router.replace("/generarDocs"),
        },
      ]);
    }
  };

  // ── Guardar acta ──────────────────────────────────────────────────────────
  const generarActa = async () => {
    if (!emisorNombre.trim()) {
      mostrarAlerta("Error", "Ingresa el nombre del firmante.");
      return;
    }
    if (!receptorSelId) {
      mostrarAlerta("Error", "Selecciona el proveedor.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Error", "Agrega al menos un producto.");
      return;
    }

    await AsyncStorage.setItem(
      "recepcion_emisor",
      JSON.stringify({
        nombre: emisorNombre,
        cargo: emisorCargo,
        titulo: tituloActa,
      }),
    );

    const payload = {
      idReceptores: parseInt(receptorSelId) || null,
      idEmpleados: null,
      descripcion: descripcion,
      firmante_nombre: emisorNombre,
      firmante_cargo: emisorCargo,
      items: items.map((item) => ({
        descr_prod: item.descr_prod,
        precio_prod: parseFloat(item.precio_prod) || 0,
        equivalente_lps: parseFloat(item.equivalente_lps) || null,
        num_recibo: item.num_recibo,
        num_fact: item.num_fact,
      })),
    };

    try {
      const response = await api.post("/actas/recepcion", payload);
      const correlativoNuevo = response.data.correlativo || "";
      setCorrelativo(correlativoNuevo);
      await generarPDF(correlativoNuevo);
      router.replace("/dashboard");
    } catch (error) {
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error || "Ocurrió un error inesperado.",
      );
    }
  };

  // ── Generar PDF ───────────────────────────────────────────────────────────
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención", "Guarda el acta para generar el PDF.");
      return;
    }
    if (!emisorNombre.trim()) {
      mostrarAlerta("Atención", "Falta el nombre del firmante.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Atención", "No hay productos para mostrar.");
      return;
    }

    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([getLogoURIs(), obtenerPlantillaActiva("RECEPCION")]);

      const proveedorNombre = receptorEmpresa || receptorSelNombre || "—";

      const htmlContent = generarHTMLRecepcion({
        data: {
          emisorNombre,
          emisorCargo,
          proveedorNombre,
          descripcion,
          items,
          tituloActa,
          correlativoFinal,
        },
        config: cPlantilla,
        logos: { uriConadeh, uriInfo },
      });

      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        } else {
          mostrarAlerta("Ventana bloqueada", "Permite los pop-ups.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        const puedCompartir = await Sharing.isAvailableAsync();
        if (puedCompartir) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Guardar o compartir Acta",
            UTI: "com.adobe.pdf",
          });
        } else {
          mostrarAlerta("PDF generado", `Guardado en: ${uri}`);
        }
      }
    } catch (err) {
      mostrarAlerta("Error", "No se pudo generar el documento: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Estilos dinámicos con useMemo ─────────────────────────────────────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.bg },
        scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },
        formContainer: { width: "100%", maxWidth: 900 },
        mainTitle: {
          fontSize: 24,
          fontWeight: "800",
          color: c.text,
          marginBottom: 15,
        },
        card: {
          backgroundColor: c.surface,
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: c.cardShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
        cardTitleRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        },
        sectionTitle: { fontSize: 16, fontWeight: "700", color: c.text },
        editBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
        editBtnText: { fontSize: 13, fontWeight: "600", color: c.accent },
        emisorNombre: { fontSize: 15, fontWeight: "700", color: c.text },
        emisorCargo: { fontSize: 13, color: c.textMuted, marginTop: 2 },
        hintText: {
          fontSize: 11,
          color: c.textMuted,
          marginTop: 10,
          fontStyle: "italic",
        },
        sinEmisorBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: c.surface2,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: c.border,
        },
        sinEmisorText: { fontSize: 13, color: c.accent, fontWeight: "600" },
        receptorInfo: { fontSize: 13, color: c.textMuted, marginTop: 8 },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: c.textMuted,
          marginBottom: 6,
        },
        input: {
          backgroundColor: c.inputBg,
          borderWidth: 1,
          borderColor: c.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          color: c.text,
        },
        readOnlyInput: { backgroundColor: c.surface2, color: c.textMuted },
        pickerWrapper: {
          backgroundColor: c.pickerBg,
          borderWidth: 1,
          borderColor: c.border2,
          borderRadius: 10,
          justifyContent: "center",
          height: 44,
          marginBottom: 8,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        },
        itemRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: 10,
          borderBottomWidth: 1,
          borderColor: c.border,
        },
        itemDesc: {
          fontWeight: "600",
          color: c.text,
          marginBottom: 4,
          fontSize: 14,
        },
        itemMeta: { fontSize: 12, color: c.textMuted },
        itemFecha: { fontSize: 11, color: c.textMuted, marginTop: 2 },
        buttonsContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 10,
        },
        cancelBtn: {
          flex: 1,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          paddingVertical: 16,
          borderRadius: 8,
          alignItems: "center",
        },
        cancelBtnText: { color: c.textMuted, fontSize: 16, fontWeight: "700" },
        saveBtn: {
          flex: 1,
          backgroundColor: "#3ac40d",
          paddingVertical: 16,
          borderRadius: 8,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
      }),
    [c],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Text style={styles.mainTitle}>
          {isReadOnly ? "DETALLE DE ACTA" : "NUEVA ACTA DE RECEPCIÓN"}
        </Text>

        <View style={styles.formContainer}>
          {/* CARD: Firmante */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.sectionTitle}>Firmante del acta</Text>
              {!isReadOnly && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    editandoEmisor ? guardarEmisor() : setEditandoEmisor(true)
                  }
                >
                  <MaterialCommunityIcons
                    name={editandoEmisor ? "check-circle" : "pencil-outline"}
                    size={20}
                    color={editandoEmisor ? c.success : c.accent}
                  />
                  <Text
                    style={[
                      styles.editBtnText,
                      editandoEmisor && { color: c.success },
                    ]}
                  >
                    {editandoEmisor ? "Confirmar" : "Cambiar"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {editandoEmisor ? (
              <>
                <Text style={styles.label}>Nombre:</Text>
                <ThemedInput
                  value={emisorNombre}
                  onChangeText={setEmisorNombre}
                  placeholder="Nombre completo del firmante..."
                  colors={c}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.label}>Cargo:</Text>
                <ThemedInput
                  value={emisorCargo}
                  onChangeText={setEmisorCargo}
                  placeholder="Cargo del firmante..."
                  colors={c}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.label}>Título del acta:</Text>
                <ThemedInput
                  value={tituloActa}
                  onChangeText={setTituloActa}
                  placeholder="ACTA DE RECEPCIÓN"
                  colors={c}
                />
                <Text style={styles.hintText}>
                  Estos datos se guardan como valores por defecto.
                </Text>
              </>
            ) : (
              <View>
                {emisorNombre ? (
                  <>
                    <Text style={styles.emisorNombre}>{emisorNombre}</Text>
                    <Text style={styles.emisorCargo}>{emisorCargo}</Text>
                    <Text
                      style={[
                        styles.emisorCargo,
                        { marginTop: 6, color: c.accent },
                      ]}
                    >
                      Título: {tituloActa}
                    </Text>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.sinEmisorBtn}
                    onPress={() => setEditandoEmisor(true)}
                  >
                    <MaterialCommunityIcons
                      name="account-edit-outline"
                      size={20}
                      color={c.accent}
                    />
                    <Text style={styles.sinEmisorText}>
                      Configura el firmante — presiona "Cambiar"
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* CARD: Proveedor */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Proveedor / Empresa</Text>
            <View style={{ height: 12 }} />

            {isReadOnly ? (
              <>
                <Text style={styles.label}>Empresa:</Text>
                <ThemedInput
                  value={receptorEmpresa || receptorSelNombre}
                  editable={false}
                  style={styles.readOnlyInput}
                  colors={c}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Seleccionar receptor:</Text>
                <ThemedPicker
                  selectedValue={String(receptorSelId)}
                  onValueChange={(val) => {
                    setReceptorSelId(val);
                    const rec = receptoresBD.find(
                      (r) => String(r.idReceptores) === String(val),
                    );
                    setReceptorSelNombre(rec?.nomRec || "");
                    setReceptorEmpresa(rec?.emprRec || "");
                  }}
                  colors={c}
                >
                  <Picker.Item
                    label="Seleccione..."
                    value=""
                    color={c.textMuted}
                  />
                  {receptoresBD
                    .filter((r) => r.estRec === "Activo")
                    .map((rec) => (
                      <Picker.Item
                        key={`rec-${rec.idReceptores}`}
                        label={`${rec.nomRec} — ${rec.emprRec}`}
                        value={String(rec.idReceptores)}
                        color={c.pickerColor}
                      />
                    ))}
                </ThemedPicker>
                {receptorEmpresa ? (
                  <Text style={styles.receptorInfo}>
                    <Text style={{ fontWeight: "700" }}>Empresa: </Text>
                    {receptorEmpresa}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* CARD: Descripción */}
          <View style={styles.card}>
            <Text style={styles.label}>Descripción de lo recibido:</Text>
            <ThemedInput
              style={{ height: 70, textAlignVertical: "top" }}
              multiline
              value={descripcion}
              onChangeText={setDescripcion}
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* CARD: Agregar Producto */}
          {!isReadOnly && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AGREGAR PRODUCTO</Text>
              <View style={{ height: 12 }} />

              <Text style={styles.label}>Descripción del producto:</Text>
              <ThemedInput
                style={{
                  height: 65,
                  textAlignVertical: "top",
                  marginBottom: 14,
                }}
                multiline
                value={tempDescProd}
                onChangeText={setTempDescProd}
                colors={c}
              />

              {/* Precio + Equivalente en lempiras */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Precio ($):</Text>
                  <ThemedInput
                    value={tempPrecio}
                    onChangeText={(val) => {
                      setTempPrecio(val);
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 0) {
                        setTempEquivalente((num * TASA_CAMBIO).toFixed(2));
                      } else {
                        setTempEquivalente("");
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    colors={c}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Equivalente (L.):</Text>
                  <ThemedInput
                    value={tempEquivalente}
                    onChangeText={setTempEquivalente}
                    keyboardType="decimal-pad"
                    placeholder="Auto-calculado"
                    colors={c}
                  />
                </View>
              </View>

              {/* Fecha */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Fecha:</Text>
                  <ThemedInput
                    value={tempFecha}
                    onChangeText={setTempFecha}
                    placeholder="DD/MM/YYYY"
                    colors={c}
                  />
                </View>
                <View style={{ flex: 1 }} />
              </View>

              {/* Recibo + Factura */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.label, { color: c.danger }]}>
                    # Recibo *:
                  </Text>
                  <ThemedInput
                    value={tempNumRecibo}
                    onChangeText={setTempNumRecibo}
                    colors={c}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: c.danger }]}>
                    # Factura *:
                  </Text>
                  <ThemedInput
                    value={tempNumFact}
                    onChangeText={setTempNumFact}
                    colors={c}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: "#0369a1", marginTop: 5 },
                ]}
                onPress={agregarItem}
              >
                <Text style={styles.saveBtnText}>+ Agregar Producto</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CARD: Lista de productos */}
          {items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>Productos ({items.length}):</Text>
              {items.map((item) => (
                <View key={item._idTemporal} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.descr_prod}</Text>
                    <Text style={styles.itemMeta}>
                      {item.precio_prod
                        ? `$${parseFloat(item.precio_prod).toFixed(2)}`
                        : ""}
                      {item.equivalente_lps
                        ? ` · L. ${parseFloat(item.equivalente_lps).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
                        : ""}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Recibo: {item.num_recibo || "—"} · Factura:{" "}
                      {item.num_fact || "—"}
                    </Text>
                    <Text style={styles.itemFecha}>
                      Fecha: {item.fech_ARCDet || item.fech_ARCEnc || "—"}
                    </Text>
                  </View>
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() => eliminarItem(item._idTemporal)}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={24}
                        color={c.danger}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* BOTONES */}
          <View style={styles.buttonsContainer}>
            {!isReadOnly && (
              <TouchableOpacity style={styles.saveBtn} onPress={generarActa}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: isPrinting ? "#93c5fd" : "#2563eb" },
              ]}
              onPress={() => generarPDF(correlativo)}
              disabled={isPrinting}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={20}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.saveBtnText}>
                {isPrinting ? "Generando..." : "Exportar PDF"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={isReadOnly ? () => router.back() : cancelarActa}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}
