import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

// Paleta de colores por tema
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
    infoBoxBg: "#0F172A",
    infoBoxBorder: "#1E293B",
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
    infoBoxBg: "#F0F9FF",
    infoBoxBorder: "#BAE6FD",
  },
};

// Componentes reutilizables con tema
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

const CARGO_DEFAULT = "Auxiliar Infotecnología";

export default function ReportesScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";

  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  // Firmante — viene del login automáticamente
  const [firmanteNombre, setFirmanteNombre] = useState("");
  const [firmanteCargo, setFirmanteCargo] = useState(CARGO_DEFAULT);

  // Equipo
  const [equiposBD, setEquiposBD] = useState([]);
  const [equipoSelId, setEquipoSelId] = useState("");
  const [equipoInfo, setEquipoInfo] = useState(null);

  // Campos del reporte
  const [oficina, setOficina] = useState("");
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");

  // Meta del reporte (correlativo) y estado de impresión
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const [imagenes, setImagenes] = useState([]); // Array de objetos { uri, base64 }
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Obtener la base URL de la API desde la configuración de Axios
  const API_BASE_URL =
    api.defaults.baseURL?.replace(/\/$/, "") || "http://localhost:3000";

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${normalizedUrl}`;
  };

  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  //CARGAR DATOS INICIALES
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const nomUsu = await AsyncStorage.getItem("nomUsu");
        const cargoUsu = await AsyncStorage.getItem("cargoUsu");

        if (nomUsu) {
          setFirmanteNombre(nomUsu);
          setFirmanteCargo(cargoUsu || CARGO_DEFAULT);
        } else {
          const userRaw = await AsyncStorage.getItem("userData");
          if (userRaw) {
            const u = JSON.parse(userRaw);
            setFirmanteNombre(u.nomUsu || u.nombre || "");
            setFirmanteCargo(u.cargoUsu || u.cargo || CARGO_DEFAULT);
          }
        }

        const resEq = await api.get("/equipos");
        setEquiposBD(resEq.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    cargarTodo();
  }, []);

  //Cargar reporte en modo vista
  useEffect(() => {
    const cargarReporte = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/actas/detalle/REPORTE/${id}`);
        const rp = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!rp) return;

        setCorrelativo(rp.correlativo || "");
        setMotivo(rp.motivo || "");
        setDiagnostico(rp.diagnostico || "");
        setRecomendaciones(rp.recomendaciones || "");
        setOficina(rp.oficina || "");

        if (rp.equipoMarca || rp.equipoModelo || rp.equipoSerie) {
          setEquipoInfo({
            marca: rp.equipoMarca || "N/A",
            modelo: rp.equipoModelo || "N/A",
            serie: rp.equipoSerie || "N/A",
            numFicha: rp.numFicha || "N/A",
            numInv: rp.numInv || "N/A",
          });
        }

        if (rp.imagenes) {
          let imgs = rp.imagenes;

          if (typeof imgs === "string") {
            try {
              imgs = JSON.parse(imgs);
            } catch {
              imgs = [];
            }
          }

          setImagenes(
            imgs.map((url) => ({
              uri: url,
              fileName: url.split("/").pop(),
              type: "image/jpeg",
            })),
          );
        }

        const nomUsu = await AsyncStorage.getItem("nomUsu");
        const cargoUsu = await AsyncStorage.getItem("cargoUsu");
        if (nomUsu) {
          setFirmanteNombre(nomUsu);
          setFirmanteCargo(cargoUsu || CARGO_DEFAULT);
        }
      } catch (err) {
        console.error("Error trayendo reporte:", err);
        mostrarAlerta("Error", "No se pudo cargar el detalle del reporte.");
      }
    };
    cargarReporte();
  }, [id]);

  const seleccionarImagen = async () => {
    if (subiendoImagen) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      mostrarAlerta("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    setSubiendoImagen(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImagenes((prev) => [
          ...prev,
          {
            uri: asset.uri,
            fileName: asset.fileName || `img_${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg",
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const removerImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Guardar reporte
  const guardarReporte = async () => {
    if (!motivo.trim()) {
      mostrarAlerta("Error", "La descripción del reporte es obligatoria.");
      return;
    }

    // Obtener ID de usuario - asegurar que sea número
    const idUsuariosRaw = await AsyncStorage.getItem("idUsuarios");
    const idUsuarios =
      idUsuariosRaw && idUsuariosRaw !== "null"
        ? parseInt(idUsuariosRaw, 10)
        : null;

    if (!idUsuarios) {
      mostrarAlerta(
        "Error",
        "No se pudo identificar al usuario. Por favor, cierra sesión y vuelve a iniciar.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("idEquipo", equipoSelId ? parseInt(equipoSelId) : "");
    formData.append("oficina", oficina);
    formData.append("motivo_RpDet", motivo);
    formData.append("diagnostic_RpDet", diagnostico);
    formData.append("recomen_RpDet", recomendaciones);
    formData.append("asignado_a", firmanteNombre || "");
    formData.append("idUsuarios", idUsuarios);

    // Adjuntar imágenes
    imagenes.forEach((img, idx) => {
      // En Android a veces la URI necesita empezar estrictamente con file://
      const fileUri =
        Platform.OS === "android" && !img.uri.startsWith("file://")
          ? `file://${img.uri}`
          : img.uri;

      formData.append("imagenes", {
        uri: fileUri,
        type: img.type || "image/jpeg",
        name: img.fileName || `evidencia_${idx}.jpg`,
      }); // <-- Eliminamos el "as any"
    });

    try {
      const response = await api.post("/actas/reporte", formData, {
        headers: {
          Accept: "application/json",
          // IMPORTANTE: NO pongas 'Content-Type': 'multipart/form-data' aquí.
          // Deja que Axios lo establezca automáticamente para que genere el "boundary" correcto.
        },
      });

      const correlativoNuevo = response.data.correlativo || "";
      setCorrelativo(correlativoNuevo);
      await generarPDF(correlativoNuevo);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error al subir:", error);
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error ||
          "Ocurrió un error al enviar los datos al servidor.",
      );
    }
  };

  // Generar PDF
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta(
        "Atención",
        "Guarda el reporte primero para generar el PDF.",
      );
      return;
    }

    setIsPrinting(true);
    let imagenesHTML = "";
    try {
      const correlativoFinal = correlativoParam || correlativo || "";
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([
          getLogoURIs(),
          obtenerPlantillaActiva("REPORTE").catch(() => ({
            colorLinea: "#09528e",
          })),
        ]);

      let eq = equipoInfo;
      if (!eq && equipoSelId) {
        const found = equiposBD.find(
          (e) => String(e.idEquipo) === String(equipoSelId),
        );
        if (found)
          eq = {
            numFicha: found.numFicha || "N/A",
            numInv: found.numInv || "N/A",
            serie: found.serie || "N/A",
            marca: found.marca || "N/A",
            modelo: found.modelo || "N/A",
            tipo: found.tipo || "",
          };
      }
      if (!eq)
        eq = {
          numFicha: "N/A",
          numInv: "N/A",
          serie: "N/A",
          marca: "N/A",
          modelo: "N/A",
          tipo: "",
        };

      const convertirImagenABase64 = async (uri) => {
        if (Platform.OS === "web") {
          return uri; // usar directamente la URL
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      };

      if (imagenes.length > 0) {
        const imgsBase64 = await Promise.all(
          imagenes.map(async (img) => ({
            base64: await convertirImagenABase64(img.uri),
          })),
        );

        imagenesHTML = `
    <div style="margin-top: 20px;">
      <h3 style="font-size: 12px; font-weight: bold;">Evidencias:</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${imgsBase64
          .map(
            (img) => `
          <img src="${img.base64}" style="max-width: 200px; max-height: 200px;" />
        `,
          )
          .join("")}
      </div>
    </div>
  `;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Reporte ${correlativoFinal}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #000; font-size: 11px; padding: 10mm 14mm 14mm 14mm; }

  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .header-table td { vertical-align: middle; }
  .logo-left  { width: 100px; text-align: left; }
  .logo-right { width: 100px; text-align: right; }
  .header-center { text-align: center; }
  .doc-title {
    font-size: 16px; font-weight: bold; font-style: italic;
    text-transform: uppercase; color: ${cPlantilla.colorLinea};
    line-height: 1.4;
  }
  .logo-conadeh { height: 60px; object-fit: contain; }
  .logo-info    { height: 55px; object-fit: contain; }
  .linea-header { border-top: 3px solid ${cPlantilla.colorLinea}; margin: 4px 0 8px 0; }

  .doc-table { width: 100%; border-collapse: collapse; border: 1px solid #888; }
  .doc-table td, .doc-table th {
    border: 1px solid #888;
    padding: 5px 8px;
    font-size: 11px;
    vertical-align: top;
  }
  .row-header {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 11px;
    background: #fff;
    padding: 5px 8px;
  }
  .row-content {
    min-height: 22px;
    padding: 5px 8px;
    font-size: 11px;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .row-content-big {
    height: 210px;
    padding: 5px 8px;
    font-size: 11px;
    word-break: break-word;
    white-space: pre-wrap;
    vertical-align: top;
  }
  .firma-table { width: 100%; border-collapse: collapse; border: 1px solid #888; border-top: none; }
  .firma-table td { border: 1px solid #888; padding: 6px 10px; font-size: 11px; width: 50%; }
  .firma-cargo  { font-style: italic; }
</style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td class="logo-left">
        <img src="${uriConadeh}" class="logo-conadeh" alt="CONADEH"/>
      </td>
      <td class="header-center">
        <div class="doc-title">Reporte de<br/>Daño de Equipo</div>
      </td>
      <td class="logo-right">
        <img src="${uriInfo}" class="logo-info" alt="Infotecnología"/>
      </td>
    </tr>
  </table>
  <div class="linea-header"></div>

  <table class="doc-table">
    <tr><td style="width:50%">${correlativoFinal}</td><td style="width:50%">${fechaHoy}</td></tr>
    <tr><td colspan="2"><strong>Oficina o Departamento:</strong> ${oficina || "—"}<\/td></tr>
    <tr><td colspan="2" class="row-header">Características del Equipo:<\/td></tr>
    <tr><td><strong>N/F:</strong> ${eq.numFicha}<\/td><td><strong>INV:</strong> ${eq.numInv}<\/td></tr>
    <tr><td><strong>Service Tag / Serie:</strong> ${eq.serie}<\/td><td><strong>Tipo / Marca / Modelo:</strong> ${eq.tipo || ""} ${eq.marca} ${eq.modelo}<\/td></tr>
    <tr><td colspan="2" class="row-header">Descripción del Reporte:<\/td></tr>
    <tr><td colspan="2" class="row-content">${motivo || "&nbsp;"}<\/td></tr>
    <tr><td colspan="2" class="row-header">Diagnóstico:<\/td></tr>
    <tr><td colspan="2" class="row-content-big">${diagnostico || "&nbsp;"}<\/td></tr>
    ${
      recomendaciones
        ? `


    <tr><td colspan="2" class="row-header">Recomendaciones:<\/td></tr>
    <tr><td colspan="2" class="row-content">${recomendaciones}<\/td></tr>`
        : ""
    }
  </table>

  ${imagenesHTML}

  <table class="firma-table">
    <tr><td class="firma-cargo">${firmanteCargo}.<\/td><td class="firma-nombre">(Firma)&nbsp;&nbsp;${firmanteNombre}<\/td></tr>
  </table>
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
            dialogTitle: "Guardar o compartir Reporte",
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

  //Estilos dinámicos con useMemo
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
        autoBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: c.surface2,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: c.border2,
        },
        autoBadgeTxt: { fontSize: 11, color: c.success, fontWeight: "600" },
        emisorNombre: { fontSize: 15, fontWeight: "700", color: c.text },
        emisorCargo: { fontSize: 13, color: c.textMuted, marginTop: 2 },
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
        pickerWrapper: {
          backgroundColor: c.pickerBg,
          borderWidth: 1,
          borderColor: c.border2,
          borderRadius: 10,
          justifyContent: "center",
          height: 44,
          marginBottom: 8,
        },
        equipoInfoBox: {
          backgroundColor: c.infoBoxBg,
          borderRadius: 8,
          padding: 10,
          borderWidth: 1,
          borderColor: c.infoBoxBorder,
          marginTop: 4,
        },
        equipoInfoText: { fontSize: 14, color: c.text, fontWeight: "600" },
        equipoInfoMeta: { fontSize: 12, color: c.textMuted, marginTop: 3 },
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

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.mainTitle}>
          {isReadOnly ? "DETALLE DE REPORTE" : "NUEVO REPORTE DE DAÑO"}
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.sectionTitle}>Asignado a</Text>
              <View style={styles.autoBadge}>
                <MaterialCommunityIcons
                  name="account-check"
                  size={14}
                  color={c.success}
                />
                <Text style={styles.autoBadgeTxt}>Usuario logueado</Text>
              </View>
            </View>
            <Text style={styles.emisorNombre}>
              {firmanteNombre || "Cargando..."}
            </Text>
            <Text style={styles.emisorCargo}>{firmanteCargo}</Text>
          </View>

          {/* CARD: Equipo y Oficina */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Equipo y Ubicación</Text>
            <View style={{ height: 12 }} />

            {isReadOnly ? (
              <>
                <Text style={styles.label}>Equipo:</Text>
                <View style={styles.equipoInfoBox}>
                  <Text style={styles.equipoInfoText}>
                    {equipoInfo
                      ? `${equipoInfo.marca} ${equipoInfo.modelo} — Serie: ${equipoInfo.serie}`
                      : "Sin equipo asociado"}
                  </Text>
                  {equipoInfo && (
                    <Text style={styles.equipoInfoMeta}>
                      N/F: {equipoInfo.numFicha} · INV: {equipoInfo.numInv}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Seleccionar equipo (opcional):</Text>
                <ThemedPicker
                  selectedValue={String(equipoSelId)}
                  onValueChange={(val) => {
                    setEquipoSelId(val);
                    const eq = equiposBD.find(
                      (e) => String(e.idEquipo) === String(val),
                    );
                    setEquipoInfo(
                      eq
                        ? {
                            numFicha: eq.numFicha || "N/A",
                            numInv: eq.numInv || "N/A",
                            serie: eq.serie || "N/A",
                            marca: eq.marca || "N/A",
                            modelo: eq.modelo || "N/A",
                            tipo: eq.tipo || "",
                          }
                        : null,
                    );
                  }}
                  colors={c}
                >
                  <Picker.Item
                    label="Sin equipo / seleccione..."
                    value=""
                    color={c.textMuted}
                  />
                  {equiposBD.map((eq) => (
                    <Picker.Item
                      key={`eq-${eq.idEquipo}`}
                      label={`${eq.marca} ${eq.modelo} — ${eq.serie || "S/N"}`}
                      value={String(eq.idEquipo)}
                      color={c.pickerColor}
                    />
                  ))}
                </ThemedPicker>
                {equipoInfo && (
                  <View style={styles.equipoInfoBox}>
                    <Text style={styles.equipoInfoMeta}>
                      N/F: {equipoInfo.numFicha} · INV: {equipoInfo.numInv} ·
                      Serie: {equipoInfo.serie}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 12 }} />
            <Text style={styles.label}>Oficina / Departamento:</Text>
            <ThemedInput
              value={oficina}
              onChangeText={setOficina}
              placeholder="Ej. Oficina Central..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* CARD: Descripción */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción del Reporte</Text>
            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: c.danger }]}>
              Motivo / Descripción *:
            </Text>
            <ThemedInput
              style={{ height: 80, textAlignVertical: "top" }}
              multiline
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Describe el problema o daño reportado..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* CARD: Diagnóstico */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            <View style={{ height: 10 }} />
            <ThemedInput
              style={{ height: 120, textAlignVertical: "top" }}
              multiline
              value={diagnostico}
              onChangeText={setDiagnostico}
              placeholder="Diagnóstico técnico del equipo..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* CARD: Recomendaciones */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recomendaciones</Text>
            <View style={{ height: 10 }} />
            <ThemedInput
              style={{ height: 70, textAlignVertical: "top" }}
              multiline
              value={recomendaciones}
              onChangeText={setRecomendaciones}
              placeholder="Recomendaciones o acciones a tomar..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {(imagenes.length > 0 || !isReadOnly) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Evidencias</Text>

              {/* Botón para adjuntar (solo en edición) */}
              {!isReadOnly && (
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: "#09528e", marginTop: 8 },
                  ]}
                  onPress={seleccionarImagen}
                  disabled={subiendoImagen}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveBtnText}>
                    {subiendoImagen ? "Cargando..." : "Adjuntar imagen"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Galería de imágenes */}
              {imagenes.length > 0 && (
                <ScrollView
                  horizontal
                  style={{ marginTop: 12 }}
                  showsHorizontalScrollIndicator={false}
                >
                  {imagenes.map((img, idx) => (
                    <View
                      key={idx}
                      style={{ marginRight: 10, position: "relative" }}
                    >
                      <Image
                        source={{ uri: img.uri }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                      {/* Botón eliminar solo en edición */}
                      {!isReadOnly && (
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            backgroundColor: c.danger,
                            borderRadius: 12,
                            padding: 2,
                          }}
                          onPress={() => removerImagen(idx)}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* BOTONES */}
          <View style={styles.buttonsContainer}>
            {!isReadOnly && (
              <TouchableOpacity style={styles.saveBtn} onPress={guardarReporte}>
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
              onPress={
                isReadOnly ? () => router.replace("/dashboard") : cancelar
              }
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}
