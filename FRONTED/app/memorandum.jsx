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
import { useTheme } from "../hooks/themeContext";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

// ── Paleta de colores por tema ────────────────────────────────────────────────
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
    toggleBg: "#1E293B",       // fondo del contenedor del toggle
    toggleInactive: "#A0A0A0", // color del texto inactivo
    danger: "#ef4444",
    primary: "#09528e",
    success: "#16a34a",
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
    toggleBg: "#F1F5F9",       // fondo del contenedor del toggle
    toggleInactive: "#64748B", // color del texto inactivo
    danger: "#dc2626",
    primary: "#09528e",
    success: "#16a34a",
  },
};

// ── Componentes reutilizables con tema ────────────────────────────────────────
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

// ─── Constantes del firmante por defecto ──────────────────────────────────────
const EMISOR_KEY = "memorandum_emisor";
const EMISOR_DEFAULT = {
  nombre: "Ing. Marco Aguilera",
  cargo: "Jefe de Infotecnología",
};

// ─── Tipo de receptor ─────────────────────────────────────────────────────────
const TIPO_RECEPTOR = { EMPLEADO: "empleado", RECEPTOR: "receptor" };

export default function MemorandumScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";

  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  // ── Estado emisor (DE) ──────────────────────────────────────────────────────
  const [emisorNombre, setEmisorNombre] = useState("");
  const [emisorCargo, setEmisorCargo] = useState(EMISOR_DEFAULT.cargo);
  const [editandoEmisor, setEditandoEmisor] = useState(false);

  // ── Estado receptor (PARA) ──────────────────────────────────────────────────
  const [tipoReceptor, setTipoReceptor] = useState(TIPO_RECEPTOR.RECEPTOR);
  const [receptoresBD, setReceptoresBD] = useState([]);
  const [empleadosBD, setEmpleadosBD] = useState([]);

  const [receptorSelId, setReceptorSelId] = useState("");
  const [receptorSelNombre, setReceptorSelNombre] = useState("");
  const [receptorCargo, setReceptorCargo] = useState("");

  const [empleadoSelId, setEmpleadoSelId] = useState("");
  const [empleadoSelNombre, setEmpleadoSelNombre] = useState("");
  const [empleadoCargo, setEmpleadoCargo] = useState("");

  // ── Asunto y párrafos ───────────────────────────────────────────────────────
  const [asunto, setAsunto] = useState("");
  const [tempItem, setTempItem] = useState("");
  const [items, setItems] = useState([]);

  // ── Metadata ────────────────────────────────────────────────────────────────
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Fecha formateada ────────────────────────────────────────────────────────
  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Cargar emisor + listas al montar ────────────────────────────────────────
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const emisorRaw = await AsyncStorage.getItem(EMISOR_KEY);
        if (emisorRaw) {
          const e = JSON.parse(emisorRaw);
          setEmisorNombre(e.nombre || "");
          setEmisorCargo(e.cargo || EMISOR_DEFAULT.cargo);
        } else {
          setEmisorNombre(EMISOR_DEFAULT.nombre);
          setEmisorCargo(EMISOR_DEFAULT.cargo);
        }

        const [resRec, resEmp] = await Promise.all([
          api.get("/receptores"),
          api.get("/empleados"),
        ]);
        setReceptoresBD(resRec.data);
        setEmpleadosBD(resEmp.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    cargarTodo();
  }, []);

  // ── Cargar memo en modo vista ────────────────────────────────────────────────
  useEffect(() => {
    const cargarMemo = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/actas/memorandum/${id}`);
        const memo = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!memo) return;

        const emisorRaw = await AsyncStorage.getItem(EMISOR_KEY);
        if (emisorRaw) {
          const e = JSON.parse(emisorRaw);
          setEmisorNombre(e.nombre || EMISOR_DEFAULT.nombre);
          setEmisorCargo(e.cargo || EMISOR_DEFAULT.cargo);
        }

        setAsunto(memo.asunto || "");
        setCorrelativo(memo.correlativo || "");
        setReceptorSelNombre(memo.receptor?.nombre || "");
        setReceptorCargo(memo.receptor?.cargo || "");
        if (memo.items?.length > 0) {
          setItems(
            memo.items.map((item, idx) => ({
              desc_MMDet: item.desc_MMDet,
              _idTemporal: idx.toString(),
            })),
          );
        }
      } catch (err) {
        console.error("Error trayendo memorándum:", err);
        mostrarAlerta("Error", "No se pudo cargar el detalle del memorándum.");
      }
    };
    cargarMemo();
  }, [id]);

  // ── Helper de alertas ────────────────────────────────────────────────────────
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

  // ── Guardar emisor ──────────────────────────────────────────────────────────
  const guardarEmisor = async () => {
    if (!emisorNombre.trim()) {
      mostrarAlerta("Atención", "El nombre del firmante no puede estar vacío.");
      return;
    }
    try {
      await AsyncStorage.setItem(
        EMISOR_KEY,
        JSON.stringify({ nombre: emisorNombre, cargo: emisorCargo }),
      );
      setEditandoEmisor(false);
    } catch {
      mostrarAlerta("Error", "No se pudieron guardar los datos del firmante.");
    }
  };

  // ── Agregar párrafo ─────────────────────────────────────────────────────────
  const agregarItem = () => {
    if (!tempItem.trim()) {
      mostrarAlerta("Atención", "El párrafo no puede estar vacío.");
      return;
    }
    setItems([
      ...items,
      { desc_MMDet: tempItem.trim(), _idTemporal: Date.now().toString() },
    ]);
    setTempItem("");
  };

  const eliminarItem = (idTemp) =>
    setItems(items.filter((i) => i._idTemporal !== idTemp));

  // ── Cancelar ────────────────────────────────────────────────────────────────
  const cancelar = () => {
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

  // ── Obtener datos del destinatario para PDF ─────────────────────────────────
  const getNombreParaPDF = () => {
    if (isReadOnly) return receptorSelNombre;
    return tipoReceptor === TIPO_RECEPTOR.EMPLEADO
      ? empleadoSelNombre
      : receptorSelNombre;
  };
  const getCargoParaPDF = () => {
    if (isReadOnly) return receptorCargo;
    return tipoReceptor === TIPO_RECEPTOR.EMPLEADO
      ? empleadoCargo
      : receptorCargo;
  };

  // ── Guardar memorándum ──────────────────────────────────────────────────────
  const guardarMemorandum = async () => {
    if (!emisorNombre.trim()) {
      mostrarAlerta("Error", "Ingresa el nombre del firmante (DE).");
      return;
    }

    const idEmp =
      tipoReceptor === TIPO_RECEPTOR.EMPLEADO
        ? parseInt(empleadoSelId) || null
        : null;
    const idRec =
      tipoReceptor === TIPO_RECEPTOR.RECEPTOR
        ? parseInt(receptorSelId) || null
        : null;

    if (!idEmp && !idRec) {
      mostrarAlerta("Error", "Selecciona un destinatario.");
      return;
    }
    if (!asunto.trim()) {
      mostrarAlerta("Error", "El asunto es obligatorio.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta(
        "Error",
        "Agrega al menos un párrafo al cuerpo del memorándum.",
      );
      return;
    }

    await AsyncStorage.setItem(
      EMISOR_KEY,
      JSON.stringify({ nombre: emisorNombre, cargo: emisorCargo }),
    );

    const payload = {
      idEmpleados: idEmp,
      idReceptores: idRec,
      asunto_MMEnc: asunto,
      items: items.map((i) => ({ desc_MMDet: i.desc_MMDet })),
    };

    try {
      const response = await api.post("/actas/memorandum", payload);
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

  // ── Generar PDF (sin cambios) ───────────────────────────────────────────────
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta(
        "Atención",
        "Guarda el memorándum primero para generar el PDF.",
      );
      return;
    }
    if (!emisorNombre.trim()) {
      mostrarAlerta("Atención", "Falta el nombre del firmante.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Atención", "No hay contenido para mostrar.");
      return;
    }

    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([
          getLogoURIs(),
          obtenerPlantillaActiva("MEMORANDUM"),
        ]);

      const nombrePara = getNombreParaPDF();
      const cargoPara = getCargoParaPDF();

      const parrafos = items
        .map((item) => `<p class="parrafo">${item.desc_MMDet}</p>`)
        .join("");

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Memorándum ${correlativoFinal}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    color: #000;
    font-size: 12px;
    line-height: 1.6;
    padding: 20mm;
  }

  .header-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2px solid ${cPlantilla.colorLinea};
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .header-logo-left { width: 120px; text-align: left; }
  .header-logo-right { width: 120px; text-align: right; }
  .header-center { text-align: center; }
  .header-inst {
    font-weight: bold;
    font-size: 13px;
    text-transform: uppercase;
  }
  .header-sub { font-size: 11px; color: #333; margin-top: 3px; }
  .logo-conadeh { height: 60px; object-fit: contain; }
  .logo-info    { height: 60px; object-fit: contain; }

  .subheader {
    text-align: center;
    margin-bottom: 30px;
  }
  .subheader-unidad {
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
  }
  .subheader-memo {
    font-size: 12px;
    color: #222;
    margin-top: 5px;
  }

  .meta-container {
    width: 75%;
    margin: 0 auto 25px auto;
  }
  .campos-table {
    width: 100%;
    border-collapse: collapse;
  }
  .campos-table td { 
    padding: 6px; 
    vertical-align: top; 
  }
  .campo-label {
    font-weight: bold;
    width: 25%;
  }
  .campo-content {
    width: 75%;
  }
  .campo-nombre { font-weight: bold; display: block; }
  .campo-cargo  { font-size: 11px; color: #444; display: block; }

  .body-content {
    width: 90%;
    margin: 0 auto;
    text-align: justify;
  }
  .parrafo {
    margin-bottom: 15px;
    line-height: 1.6;
  }
  .saludo {
    margin-top: 25px;
  }

  .firma-container {
    width: 100%;
    text-align: center;
    margin-top: 80px;
  }
  .firma-linea {
    width: 250px;
    border-top: 1px solid #000;
    margin: 0 auto 5px auto;
    padding-top: 5px;
  }
  .firma-nombre {
    font-weight: bold;
    font-size: 12px;
    display: block;
  }
  .firma-cargo {
    font-size: 11px;
    color: #333;
    display: block;
  }
</style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td class="header-logo-left">
        <img src="${uriConadeh}" class="logo-conadeh" alt="CONADEH"/>
      </td>
      <td class="header-center">
        <div class="header-inst">Comisionado Nacional de los Derechos Humanos</div>
        <div class="header-sub">(CONADEH) — Honduras, C.A.</div>
      </td>
      <td class="header-logo-right">
        <img src="${uriInfo}" class="logo-info" alt="Infotecnología"/>
      </td>
    </tr>
  </table>

  <div class="subheader">
    <div class="subheader-unidad">Unidad de Infotecnología</div>
    <div class="subheader-memo">Memorándum &nbsp;${correlativoFinal}</div>
  </div>

  <div class="meta-container">
    <table class="campos-table">
      <tr>
        <td class="campo-label">PARA:</td>
        <td class="campo-content">
          <span class="campo-nombre">${nombrePara || "—"}</span>
          <span class="campo-cargo">${cargoPara || ""}</span>
        </td>
      </tr>
      <tr>
        <td class="campo-label">DE:</td>
        <td class="campo-content">
          <span class="campo-nombre">${emisorNombre}</span>
          <span class="campo-cargo">${emisorCargo}</span>
        </td>
      </tr>
      <tr>
        <td class="campo-label">ASUNTO:</td>
        <td class="campo-content" style="font-weight:bold;">${asunto}</td>
      </tr>
      <tr>
        <td class="campo-label">FECHA:</td>
        <td class="campo-content">${fechaHoy}</td>
      </tr>
    </table>
  </div>

  <div class="body-content">
    <hr style="border:0; border-top: 1px solid #ccc; margin-bottom: 20px;" />
    ${parrafos}
    <p class="saludo">Saludos cordiales,</p>
  </div>

  <div class="firma-container">
    <div class="firma-linea"></div>
    <span class="firma-nombre">${emisorNombre}</span>
    <span class="firma-cargo">${emisorCargo}</span>
  </div>

</body>
</html>`;

      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        } else {
          mostrarAlerta(
            "Ventana bloqueada",
            "Permite los pop-ups del navegador.",
          );
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
            dialogTitle: "Guardar o compartir Memorándum",
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

  // ── Estilos dinámicos con useMemo ───────────────────────────────────────────
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
        // ---------- ESTILOS DEL TOGGLE (IGUAL A actaRetiro) ----------
        toggleContainer: {
          flexDirection: "row",
          backgroundColor: c.toggleBg,
          borderRadius: 8,
          padding: 4,
          marginBottom: 20,
        },
        toggleBtn: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 6,
          alignItems: "center",
        },
        toggleBtnActive: {
          backgroundColor: c.primary,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        },
        toggleBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: c.toggleInactive,
        },
        toggleBtnTextActive: {
          color: "#fff",
        },
        // ---------------------------------------------
        receptorInfo: { fontSize: 13, color: c.textMuted, marginTop: 6 },
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
          marginBottom: 4,
        },
        itemRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: c.border,
          gap: 10,
        },
        itemNumBadge: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: c.primary,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        },
        itemNum: { color: "#fff", fontSize: 11, fontWeight: "700" },
        itemDesc: {
          flex: 1,
          fontSize: 14,
          color: c.text,
          lineHeight: 20,
        },
        buttonsContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 10,
        },
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
      }),
    [c],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
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
          {isReadOnly ? "DETALLE DE MEMORÁNDUM" : "NUEVO MEMORÁNDUM"}
        </Text>

        <View style={styles.formContainer}>
          {/* CARD: DE (emisor / firmante) */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.sectionTitle}>DE: Firmante</Text>
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

          {/* CARD: PARA (destinatario) */}
          <View style={styles.card}>
            <View style={{ height: 12 }} />

            {isReadOnly ? (
              <>
                <Text style={styles.label}>Destinatario:</Text>
                <ThemedInput
                  value={`${receptorSelNombre}${receptorCargo ? ` — ${receptorCargo}` : ""}`}
                  editable={false}
                  style={styles.readOnlyInput}
                  colors={c}
                />
              </>
            ) : (
              <>
                {/* TOGGLE IGUAL A actaRetiro */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      tipoReceptor === TIPO_RECEPTOR.EMPLEADO && styles.toggleBtnActive,
                    ]}
                    onPress={() => {
                      setTipoReceptor(TIPO_RECEPTOR.EMPLEADO);
                      setReceptorSelId("");
                      setReceptorSelNombre("");
                      setReceptorCargo("");
                      setEmpleadoSelId("");
                      setEmpleadoSelNombre("");
                      setEmpleadoCargo("");
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        tipoReceptor === TIPO_RECEPTOR.EMPLEADO && styles.toggleBtnTextActive,
                      ]}
                    >
                      Empleado
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      tipoReceptor === TIPO_RECEPTOR.RECEPTOR && styles.toggleBtnActive,
                    ]}
                    onPress={() => {
                      setTipoReceptor(TIPO_RECEPTOR.RECEPTOR);
                      setEmpleadoSelId("");
                      setEmpleadoSelNombre("");
                      setEmpleadoCargo("");
                      setReceptorSelId("");
                      setReceptorSelNombre("");
                      setReceptorCargo("");
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        tipoReceptor === TIPO_RECEPTOR.RECEPTOR && styles.toggleBtnTextActive,
                      ]}
                    >
                      Receptor externo
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 10 }} />

                {tipoReceptor === TIPO_RECEPTOR.RECEPTOR ? (
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
                        setReceptorCargo(rec?.emprRec || "");
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
                    {receptorCargo ? (
                      <Text style={styles.receptorInfo}>
                        <Text style={{ fontWeight: "700" }}>
                          Empresa/Cargo:{" "}
                        </Text>
                        {receptorCargo}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Seleccionar empleado:</Text>
                    <ThemedPicker
                      selectedValue={String(empleadoSelId)}
                      onValueChange={(val) => {
                        setEmpleadoSelId(val);
                        const emp = empleadosBD.find(
                          (e) => String(e.idEmpleados) === String(val),
                        );
                        setEmpleadoSelNombre(emp?.nomEmp || "");
                        setEmpleadoCargo(emp?.cargoEmp || "");
                      }}
                      colors={c}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color={c.textMuted}
                      />
                      {empleadosBD.map((emp) => (
                        <Picker.Item
                          key={`emp-${emp.idEmpleados}`}
                          label={`${emp.nomEmp} — ${emp.cargoEmp}`}
                          value={String(emp.idEmpleados)}
                          color={c.pickerColor}
                        />
                      ))}
                    </ThemedPicker>
                    {empleadoCargo ? (
                      <Text style={styles.receptorInfo}>
                        <Text style={{ fontWeight: "700" }}>Cargo: </Text>
                        {empleadoCargo}
                      </Text>
                    ) : null}
                  </>
                )}
              </>
            )}
          </View>

          {/* CARD: Asunto */}
          <View style={styles.card}>
            <Text style={styles.label}>Asunto:</Text>
            <ThemedInput
              value={asunto}
              onChangeText={setAsunto}
              placeholder="Ej. Respuesta a Memorándum GAF-84-2026..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* CARD: Agregar párrafos (solo edición) */}
          {!isReadOnly && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>CUERPO DEL MEMORÁNDUM</Text>
              <View style={{ height: 12 }} />
              <Text style={styles.label}>Párrafo / punto a agregar:</Text>
              <ThemedInput
                style={{
                  height: 90,
                  textAlignVertical: "top",
                  marginBottom: 12,
                }}
                multiline
                value={tempItem}
                onChangeText={setTempItem}
                placeholder="Escribe el contenido del párrafo..."
                colors={c}
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#0369a1" }]}
                onPress={agregarItem}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>Agregar Párrafo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CARD: Lista de párrafos */}
          {items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>
                Contenido ({items.length} párrafo{items.length !== 1 ? "s" : ""}
                ):
              </Text>
              {items.map((item, index) => (
                <View key={item._idTemporal} style={styles.itemRow}>
                  <View style={styles.itemNumBadge}>
                    <Text style={styles.itemNum}>{index + 1}</Text>
                  </View>
                  <Text style={styles.itemDesc}>{item.desc_MMDet}</Text>
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() => eliminarItem(item._idTemporal)}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={22}
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
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={guardarMemorandum}
              >
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
              onPress={isReadOnly ? () => router.back() : cancelar}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}