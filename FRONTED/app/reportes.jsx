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
import { generarHTMLReporte } from "../utils/documentosHTML";
import { useTheme } from "../hooks/themeContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAlert } from "../context/alertContext";

import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
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
  const { showAlert } = useAlert();

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
  const [oficinasList, setOficinasList] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [equiposFiltrados, setEquiposFiltrados] = useState([]);

  // Meta del reporte (correlativo) y estado de impresión
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const [imagenes, setImagenes] = useState([]); // Array de objetos { uri, base64 }
  const [subiendoImagen, setSubiendoImagen] = useState(false);

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

        const [resEq, resOfi] = await Promise.all([
          api.get("/equipos"),
          api.get("/catalogos/oficinas/unicas"),
        ]);
        setEquiposBD(resEq.data);
        setOficinasList(resOfi.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    cargarTodo();
  }, []);
  // Filtrar equipos según búsqueda
  useEffect(() => {
    if (busquedaEquipo.trim() === "") {
      setEquiposFiltrados([]);
      return;
    }
    const filtrados = equiposBD.filter((eq) =>
      `${eq.marca} ${eq.modelo} ${eq.serie}`
        .toLowerCase()
        .includes(busquedaEquipo.toLowerCase()),
    );
    setEquiposFiltrados(filtrados);
  }, [busquedaEquipo, equiposBD]);

  //Cargar reporte en modo vista
  useEffect(() => {
    const cargarReporte = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/actas/detalle/REPORTE/${id}`);
        const rp = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!rp) return;

        setCorrelativo(rp.correlativo || "");
        setOficina(rp.oficina || "");
        setMotivo(rp.motivo || "");
        setDiagnostico(rp.diagnostico || "");
        setRecomendaciones(rp.recomendaciones || "");

        if (rp.equipoMarca || rp.equipoModelo || rp.equipoSerie) {
          setEquipoInfo({
            marca: rp.equipoMarca || "N/A",
            modelo: rp.equipoModelo || "N/A",
            serie: rp.equipoSerie || "N/A",
            numFicha: rp.numFicha || "N/A",
            numInv: rp.numInv || "N/A",
          });
        }

        if (rp.imagenes && rp.imagenes.length > 0) {
          const imagenesFormateadas = rp.imagenes.map((url, idx) => ({
            uri: url,
            fileName: `img_${idx}.jpg`,
            type: "image/jpeg",
          }));
          setImagenes(imagenesFormateadas);
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

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = false;
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const previewUri = URL.createObjectURL(file);
          setImagenes((prev) => [
            ...prev,
            {
              uri: previewUri,
              file: file,
              fileName: file.name,
              type: file.type,
            },
          ]);
        }
      };
      input.click();
      return;
    }

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
    const alertButtons =
      botones.length > 0
        ? botones.map((btn) => ({
            text: btn.text,
            style:
              btn.style === "cancel"
                ? "cancel"
                : btn.style === "destructive"
                  ? "danger"
                  : "primary",
            onPress: btn.onPress,
          }))
        : [{ text: "Aceptar" }];

    showAlert({
      title: titulo,
      message: mensaje,
      buttons: alertButtons,
    });
  };

  const cancelar = () => {
    mostrarAlerta(
      "¿Estás seguro?",
      "Si cancelas, perderás todos los datos ingresados.",
      [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "danger",
          onPress: () => router.replace("/generarDocs"),
        },
      ],
    );
  };

  // Guardar reporte
  const guardarReporte = async () => {
    if (!motivo.trim()) {
      mostrarAlerta("Error", "La descripción del reporte es obligatoria.");
      return;
    }

    // Obtener ID de usuario
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

    console.log(
      "📸 Imágenes a enviar:",
      imagenes.map((img) => ({
        hasFile: !!img.file,
        uri: img.uri,
        fileName: img.fileName,
      })),
    );

    const formData = new FormData();
    formData.append("idEquipo", equipoSelId ? parseInt(equipoSelId) : "");
    formData.append("oficina", oficina);
    formData.append("motivo_RpDet", motivo);
    formData.append("diagnostic_RpDet", diagnostico);
    formData.append("recomen_RpDet", recomendaciones);
    formData.append("asignado_a", firmanteNombre || "");
    formData.append("idUsuarios", idUsuarios);

    // Adjuntar imágenes (versión robusta para web)
    for (let idx = 0; idx < imagenes.length; idx++) {
      const img = imagenes[idx];
      if (Platform.OS === "web") {
        if (img.file) {
          formData.append("imagenes", img.file, img.fileName);
        } else if (img.uri && img.uri.startsWith("blob:")) {
          const blob = await fetch(img.uri).then((r) => r.blob());
          const file = new File(
            [blob],
            img.fileName || `evidencia_${idx}.jpg`,
            { type: blob.type || "image/jpeg" },
          );
          formData.append("imagenes", file);
        } else if (img.uri && img.uri.startsWith("http")) {
          console.log("Imagen ya en Supabase, omitiendo:", img.uri);
        }
      } else {
        // Móvil
        const fileUri =
          Platform.OS === "android" && !img.uri.startsWith("file://")
            ? `file://${img.uri}`
            : img.uri;
        formData.append("imagenes", {
          uri: fileUri,
          type: img.type || "image/jpeg",
          name: img.fileName || `evidencia_${idx}.jpg`,
        });
      }
    }

    try {
      const response = await api.post("/actas/reporte", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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

      // ---------- CONVERTIR IMÁGENES A BASE64 ----------
      const convertirImagenABase64 = async (uri) => {
        if (Platform.OS === "web") {
          if (uri.startsWith("http") || uri.startsWith("blob:")) return uri;
          if (uri.startsWith("data:")) return uri;
          const response = await fetch(uri);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
        if (uri.startsWith("http")) return uri;
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      };

      const imagenesBase64 = [];
      for (const img of imagenes) {
        const base64 = await convertirImagenABase64(img.uri);
        imagenesBase64.push(base64);
      }

      const htmlContent = generarHTMLReporte({
        data: {
          asignado: firmanteNombre,
          asignadoCargo: firmanteCargo,
          correlativoFinal,
          fecha: fechaHoy,
          oficina: oficina,
          motivo: motivo,
          diagnostico: diagnostico,
          recomendaciones: recomendaciones,
          equipo: eq,
        },
        config: cPlantilla,
        logos: { uriConadeh, uriInfo },
        imagenesBase64: imagenesBase64, // ← array de base64
      });

      // ---------- WEB / ELECTRON con html2pdf ----------
      if (Platform.OS === "web") {
        if (typeof window.html2pdf === "undefined") {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const opt = {
          margin: [0, 0, 0, 0],
          filename: `Reporte_Daño_${correlativoFinal || "temp"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            letterRendering: true,
            useCORS: true,
            allowTaint: true,
            logging: false,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        try {
          await window.html2pdf().set(opt).from(htmlContent, "string").save();
        } catch (err) {
          console.error("html2pdf error:", err);
          mostrarAlerta("Error", "No se pudo generar el PDF: " + err.message);
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
      console.error("Error al generar PDF:", err.message);
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
          backgroundColor: "#b57227",
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
                <Text style={styles.label}>Buscar equipo:</Text>
                <ThemedInput
                  value={busquedaEquipo}
                  onChangeText={setBusquedaEquipo}
                  placeholder="Escribe marca, modelo o serie..."
                  colors={c}
                  style={{ marginBottom: 4 }}
                />
                {equiposFiltrados.length > 0 && (
                  <ScrollView style={{ maxHeight: 150, marginBottom: 8 }}>
                    {equiposFiltrados.map((eq) => (
                      <TouchableOpacity
                        key={eq.idEquipo}
                        style={{
                          padding: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: c.border,
                        }}
                        onPress={() => {
                          setEquipoSelId(eq.idEquipo);
                          setEquipoInfo({
                            numFicha: eq.numFicha || "N/A",
                            numInv: eq.numInv || "N/A",
                            serie: eq.serie || "N/A",
                            marca: eq.marca || "N/A",
                            modelo: eq.modelo || "N/A",
                            tipo: eq.tipo || "",
                          });
                          setBusquedaEquipo("");
                          setEquiposFiltrados([]);
                        }}
                      >
                        <Text style={{ color: c.text }}>
                          {eq.marca} {eq.modelo} — {eq.serie || "S/N"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {equipoInfo && !isReadOnly && (
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
            <Text style={styles.label}>Oficina:</Text>
            {isReadOnly ? (
              <ThemedInput
                value={oficina}
                editable={false}
                style={styles.readOnlyInput}
                colors={c}
              />
            ) : (
              <ThemedPicker
                selectedValue={oficina}
                onValueChange={setOficina}
                colors={c}
              >
                <Picker.Item
                  label="Seleccione una oficina..."
                  value=""
                  color={c.textMuted}
                />
                {oficinasList.map((ofi) => (
                  <Picker.Item
                    key={ofi.nomOficina}
                    label={ofi.nomOficina}
                    value={ofi.nomOficina}
                    color={c.pickerColor}
                  />
                ))}
              </ThemedPicker>
            )}
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
                { backgroundColor: isPrinting ? "#93c5fd" : "#075985" },
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
        <Footer />
      </CustomScrollView>
    </SafeAreaView>
  );
}
