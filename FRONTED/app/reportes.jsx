import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { generarHTMLReporte } from "../utils/documentosHTML";
import { useTheme } from "../hooks/themeContext";
import { useAlert } from "../context/alertContext";
import { usePlantillaDinamica } from "../hooks/usePlantillaDinamica";
import CamposDinamicos from "../components/camposDinamicos";
import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

const P = {
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    surface2: "#2C2C2C",
    border: "#333333",
    border2: "#444444",
    text: "#FFFFFF",
    textMuted: "#A0A0A0",
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

const TI = ({
  value,
  onChangeText,
  placeholder,
  multiline,
  editable,
  keyboardType,
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
  />
);
const TP = ({ selectedValue, onValueChange, enabled, children, colors }) => (
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

  // ── Plantilla dinámica ──────────────────────────────────────────────────────
  const { camposExtra, tablasExtra } = usePlantillaDinamica("REPORTE");
  const [valoresCamposExtra, setValoresCamposExtra] = useState({});
  const [filasTablas, setFilasTablas] = useState({});

  const [firmanteNombre, setFirmanteNombre] = useState("");
  const [firmanteCargo, setFirmanteCargo] = useState(CARGO_DEFAULT);
  const [equiposBD, setEquiposBD] = useState([]);
  const [equipoSelId, setEquipoSelId] = useState("");
  const [equipoInfo, setEquipoInfo] = useState(null);
  const [oficina, setOficina] = useState("");
  const [oficinasList, setOficinasList] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [equiposFiltrados, setEquiposFiltrados] = useState([]);
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    (async () => {
      try {
        const nomUsu = await AsyncStorage.getItem("nomUsu");
        const cargoUsu = await AsyncStorage.getItem("cargoUsu");
        if (nomUsu) {
          setFirmanteNombre(nomUsu);
          setFirmanteCargo(cargoUsu || CARGO_DEFAULT);
        } else {
          const raw = await AsyncStorage.getItem("userData");
          if (raw) {
            const u = JSON.parse(raw);
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
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (busquedaEquipo.trim() === "") {
      setEquiposFiltrados([]);
      return;
    }
    setEquiposFiltrados(
      equiposBD.filter((eq) =>
        `${eq.marca} ${eq.modelo} ${eq.serie}`
          .toLowerCase()
          .includes(busquedaEquipo.toLowerCase()),
      ),
    );
  }, [busquedaEquipo, equiposBD]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/actas/detalle/REPORTE/${id}`);
        const rp = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!rp) return;
        setCorrelativo(rp.correlativo || "");
        setOficina(rp.oficina || "");
        setMotivo(rp.motivo || "");
        setDiagnostico(rp.diagnostico || "");
        setRecomendaciones(rp.recomendaciones || "");
        if (rp.equipoMarca || rp.equipoModelo || rp.equipoSerie)
          setEquipoInfo({
            marca: rp.equipoMarca || "N/A",
            modelo: rp.equipoModelo || "N/A",
            serie: rp.equipoSerie || "N/A",
            numFicha: rp.numFicha || "N/A",
            numInv: rp.numInv || "N/A",
          });
        if (rp.imagenes?.length > 0)
          setImagenes(
            rp.imagenes.map((url, idx) => ({
              uri: url,
              fileName: `img_${idx}.jpg`,
              type: "image/jpeg",
            })),
          );
        // ── Cargar campos extra ──
        if (rp.campos_extra) {
          const parsed =
            typeof rp.campos_extra === "string"
              ? JSON.parse(rp.campos_extra)
              : rp.campos_extra;
          setValoresCamposExtra(parsed.campos || {});
          setFilasTablas(parsed.tablas || {});
        }
        const nomUsu = await AsyncStorage.getItem("nomUsu");
        const cargoUsu = await AsyncStorage.getItem("cargoUsu");
        if (nomUsu) {
          setFirmanteNombre(nomUsu);
          setFirmanteCargo(cargoUsu || CARGO_DEFAULT);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  const handleChangeValor = useCallback(
    (id, valor) => setValoresCamposExtra((prev) => ({ ...prev, [id]: valor })),
    [],
  );
  const handleAgregarFila = useCallback(
    (tablaId, filaVacia) =>
      setFilasTablas((prev) => ({
        ...prev,
        [tablaId]: [...(prev[tablaId] || []), { ...filaVacia }],
      })),
    [],
  );
  const handleEliminarFila = useCallback(
    (tablaId, index) =>
      setFilasTablas((prev) => ({
        ...prev,
        [tablaId]: prev[tablaId].filter((_, i) => i !== index),
      })),
    [],
  );
  const handleCambiarFila = useCallback(
    (tablaId, index, colId, valor) =>
      setFilasTablas((prev) => {
        const n = [...(prev[tablaId] || [])];
        n[index] = { ...n[index], [colId]: valor };
        return { ...prev, [tablaId]: n };
      }),
    [],
  );

  const mostrarAlerta = (titulo, mensaje = "", botones = []) =>
    showAlert({
      title: titulo,
      message: mensaje,
      buttons:
        botones.length > 0
          ? botones.map((b) => ({
              text: b.text,
              style:
                b.style === "cancel"
                  ? "cancel"
                  : b.style === "danger"
                    ? "danger"
                    : "primary",
              onPress: b.onPress,
            }))
          : [{ text: "Aceptar" }],
    });
  const cancelar = () =>
    mostrarAlerta("¿Estás seguro?", "Si cancelas, perderás los datos.", [
      { text: "No, continuar", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "danger",
        onPress: () => router.replace("/generarDocs"),
      },
    ]);

  const seleccionarImagen = async () => {
    if (subiendoImagen) return;
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file)
          setImagenes((prev) => [
            ...prev,
            {
              uri: URL.createObjectURL(file),
              file,
              fileName: file.name,
              type: file.type,
            },
          ]);
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
      });
      if (!result.canceled) {
        const a = result.assets[0];
        setImagenes((prev) => [
          ...prev,
          {
            uri: a.uri,
            fileName: a.fileName || `img_${Date.now()}.jpg`,
            type: a.mimeType || "image/jpeg",
          },
        ]);
      }
    } catch (e) {
      mostrarAlerta("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const guardarReporte = async () => {
    if (!motivo.trim()) {
      mostrarAlerta("Error", "La descripción del reporte es obligatoria.");
      return;
    }
    const idUsuariosRaw = await AsyncStorage.getItem("idUsuarios");
    const idUsuarios =
      idUsuariosRaw && idUsuariosRaw !== "null"
        ? parseInt(idUsuariosRaw, 10)
        : null;
    if (!idUsuarios) {
      mostrarAlerta("Error", "No se pudo identificar al usuario.");
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
    formData.append(
      "campos_extra",
      JSON.stringify({ campos: valoresCamposExtra, tablas: filasTablas }),
    );
    for (let idx = 0; idx < imagenes.length; idx++) {
      const img = imagenes[idx];
      if (Platform.OS === "web") {
        if (img.file) formData.append("imagenes", img.file, img.fileName);
        else if (img.uri?.startsWith("blob:")) {
          const blob = await fetch(img.uri).then((r) => r.blob());
          formData.append(
            "imagenes",
            new File([blob], img.fileName || `evidencia_${idx}.jpg`, {
              type: blob.type || "image/jpeg",
            }),
          );
        }
      } else {
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
      setCorrelativo(response.data.correlativo || "");
      await generarPDF(response.data.correlativo || "");
      router.replace("/dashboard");
    } catch (error) {
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error || "Error al enviar los datos.",
      );
    }
  };

  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención", "Guarda el reporte primero.");
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
        const f = equiposBD.find(
          (e) => String(e.idEquipo) === String(equipoSelId),
        );
        if (f)
          eq = {
            numFicha: f.numFicha || "N/A",
            numInv: f.numInv || "N/A",
            serie: f.serie || "N/A",
            marca: f.marca || "N/A",
            modelo: f.modelo || "N/A",
            tipo: f.tipo || "",
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

      const convertir = async (uri) => {
        if (Platform.OS === "web") {
          if (uri.startsWith("http") || uri.startsWith("blob:")) {
            const blob = await fetch(uri).then((r) => r.blob());
            return new Promise((res) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result);
              r.readAsDataURL(blob);
            });
          }
          if (uri.startsWith("data:")) return uri;
          return uri;
        }
        if (uri.startsWith("http")) return uri;
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${b64}`;
      };

      const imagenesBase64 = [];
      for (const img of imagenes) {
        try {
          imagenesBase64.push(await convertir(img.uri));
        } catch {
          imagenesBase64.push(img.uri);
        }
      }

      const htmlContent = generarHTMLReporte({
        data: {
          asignado: firmanteNombre,
          asignadoCargo: firmanteCargo,
          correlativoFinal,
          fecha: fechaHoy,
          oficina,
          motivo,
          diagnostico,
          recomendaciones,
          equipo: eq,
          valoresCamposExtra,
          filasTablas,
        },
        config: cPlantilla,
        logos: { uriConadeh, uriInfo },
        imagenesBase64,
      });

      if (Platform.OS === "web") {
        if (typeof window.html2pdf === "undefined") {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src =
              "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        await window
          .html2pdf()
          .set({
            margin: [0, 0, 0, 0],
            filename: `Reporte_Daño_${correlativoFinal || "temp"}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(htmlContent, "string")
          .save();
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        if (await Sharing.isAvailableAsync())
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Guardar Reporte",
            UTI: "com.adobe.pdf",
          });
        else mostrarAlerta("PDF generado", `Guardado en: ${uri}`);
      }
    } catch (err) {
      mostrarAlerta("Error", "No se pudo generar: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

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
        readOnlyInput: { backgroundColor: c.surface2, color: c.textMuted },
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
          {/* Firmante */}
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

          {/* Equipo y Oficina */}
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
                <TI
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
            <Text style={styles.label}>Oficina:</Text>
            {isReadOnly ? (
              <TI
                value={oficina}
                editable={false}
                style={styles.readOnlyInput}
                colors={c}
              />
            ) : (
              <TP selectedValue={oficina} onValueChange={setOficina} colors={c}>
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
              </TP>
            )}
          </View>

          {/* Descripción */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción del Reporte</Text>
            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: c.danger }]}>
              Motivo / Descripción *:
            </Text>
            <TI
              style={{ height: 80, textAlignVertical: "top" }}
              multiline
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Describe el problema o daño reportado..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* Diagnóstico */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            <View style={{ height: 10 }} />
            <TI
              style={{ height: 120, textAlignVertical: "top" }}
              multiline
              value={diagnostico}
              onChangeText={setDiagnostico}
              placeholder="Diagnóstico técnico del equipo..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* Recomendaciones */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recomendaciones</Text>
            <View style={{ height: 10 }} />
            <TI
              style={{ height: 70, textAlignVertical: "top" }}
              multiline
              value={recomendaciones}
              onChangeText={setRecomendaciones}
              placeholder="Recomendaciones o acciones a tomar..."
              editable={!isReadOnly}
              colors={c}
            />
          </View>

          {/* Evidencias */}
          {(imagenes.length > 0 || !isReadOnly) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Evidencias</Text>
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
                          onPress={() =>
                            setImagenes((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
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

          {/* ── Campos dinámicos de la plantilla ── */}
          <CamposDinamicos
            camposExtra={camposExtra}
            tablasExtra={tablasExtra}
            valores={valoresCamposExtra}
            onChangeValor={handleChangeValor}
            filasTablas={filasTablas}
            onAgregarFila={handleAgregarFila}
            onEliminarFila={handleEliminarFila}
            onCambiarFila={handleCambiarFila}
            c={c}
            isReadOnly={isReadOnly}
          />

          {/* Botones */}
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
