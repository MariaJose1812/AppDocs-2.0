import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image, ScrollView as RNScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { generarHTMLRetiro } from "../utils/documentosHTML";
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
  },
};

const ThemedInput = ({
  value,
  onChangeText,
  placeholder,
  multiline,
  editable,
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

export default function ActaRetiroScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const tipoActa = "RETIRO";
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  const { camposExtra, tablasExtra } = usePlantillaDinamica("RETIRO");
  const [valoresCamposExtra, setValoresCamposExtra] = useState({});
  const [filasTablas, setFilasTablas] = useState({});

  const [oficinasBD, setOficinasBD] = useState([]);
  const [unidadesList, setUnidadesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [tiposEquipoBD, setTiposEquipoBD] = useState([]);
  const [receptoresBD, setReceptoresBD] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);

  const [usuarioLogueado, setUsuarioLogueado] = useState("");
  const [cargoLogueado, setCargoLogueado] = useState("");
  const [tipoDestinatario, setTipoDestinatario] = useState("EMPLEADO");
  const [oficinaSel, setOficinaSel] = useState("");
  const [unidadSel, setUnidadSel] = useState("");
  const [cargoSel, setCargoSel] = useState("");
  const [empleadoSelId, setEmpleadoSelId] = useState("");
  const [empleadoSelNombre, setEmpleadoSelNombre] = useState("");
  const [receptorSelId, setReceptorSelId] = useState("");
  const [receptorSelNombre, setReceptorSelNombre] = useState("");
  const [receptorEmpresa, setReceptorEmpresa] = useState("");
  const [receptorCargo, setReceptorCargo] = useState("");
  const [items, setItems] = useState([]);
  const [tempTipo, setTempTipo] = useState("");
  const [tempMarca, setTempMarca] = useState("");
  const [tempModelo, setTempModelo] = useState("");
  const [tempSerie, setTempSerie] = useState("");
  const [tempFicha, setTempFicha] = useState("");
  const [tempInv, setTempInv] = useState("");
  const [tempDesc, setTempDesc] = useState("");
  const [tempDescripcion, setTempDescripcion] = useState("");
  const [tempObs, setTempObs] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/actas/procesadas/${tipoActa}/${id}`);
        const acta = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!acta) return;
        const tipo = acta.tipoDestinatario || "EMPLEADO";
        setTipoDestinatario(tipo);
        if (tipo === "RECEPTOR") {
          setReceptorSelNombre(acta.receptor?.nombre || "");
          setReceptorCargo(acta.receptor?.cargo || "");
          setReceptorEmpresa(acta.receptor?.empresa || "");
        } else {
          setEmpleadoSelNombre(acta.receptor?.nombre || "");
          setCargoSel(
            acta.receptor?.cargo === "S/C" ? "" : acta.receptor?.cargo || "",
          );
          setOficinaSel(acta.receptor?.oficina || "");
          setUnidadSel(acta.receptor?.unidad || "");
        }
        setTempDesc(acta.asunto || "");
        setTempDescripcion(acta.descripcion || "");
        setTempObs(acta.observacion || "");
        setCorrelativo(acta.correlativo || "");
        if (acta.items?.length > 0) {
          setItems(
            acta.items.map((item) => ({
              ...item,
              tipo: item.tipo || "Equipo",
              _idTemporal: Math.random().toString(),
            })),
          );
        }

        if (acta.campos_extra) {
          const parsed =
            typeof acta.campos_extra === "string"
              ? JSON.parse(acta.campos_extra)
              : acta.campos_extra;
          setValoresCamposExtra(parsed.campos || {});
          setFilasTablas(parsed.tablas || {});
        }
        if (acta.imagenes?.length > 0) {
          setImagenes(
            acta.imagenes.map((url, idx) => ({
              uri: url,
              fileName: `img_${idx}.jpg`,
              type: "image/jpeg",
            })),
          );
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  // CARGA CATÁLOGOS
  useEffect(() => {
    (async () => {
      try {
        const nombre = await AsyncStorage.getItem("nomUsu");
        const cargo = await AsyncStorage.getItem("cargoUsu");
        if (nombre) setUsuarioLogueado(nombre);
        if (cargo) setCargoLogueado(cargo);
        const [resEmp, resOfi, resTipo, resRec] = await Promise.all([
          api.get("/catalogos/empleados"),
          api.get("/catalogos/oficinas"),
          api.get("/catalogos/tiposEquipo"),
          api.get("/receptores"),
        ]);
        setOficinasBD(resOfi.data);
        setTiposEquipoBD(resTipo.data);
        setReceptoresBD(resRec.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!oficinaSel) {
      setUnidadesList([]);
      return;
    }
    const filtradas = oficinasBD.filter(
      (i) => String(i.nomOficina).trim() === String(oficinaSel).trim(),
    );
    setUnidadesList(
      [
        ...new Set(
          filtradas.map((i) => (i.unidad ? String(i.unidad).trim() : null)),
        ),
      ].filter(Boolean),
    );
  }, [oficinaSel, oficinasBD]);

  useEffect(() => {
    if (!oficinaSel || !unidadSel) {
      setCargosList([]);
      return;
    }
    const filtrados = oficinasBD.filter(
      (i) =>
        String(i.nomOficina).trim() === String(oficinaSel).trim() &&
        String(i.unidad).trim() === String(unidadSel).trim(),
    );
    setCargosList(
      [...new Set(filtrados.map((i) => i.cargoOfi))].filter(Boolean),
    );
  }, [oficinaSel, unidadSel, oficinasBD]);

  useEffect(() => {
    if (!oficinaSel) {
      setEmpleadosFiltrados([]);
      return;
    }
    api
      .get(`/catalogos/empleados/porOficina/${encodeURIComponent(oficinaSel)}`)
      .then((res) => setEmpleadosFiltrados(res.data))
      .catch(console.error);
  }, [oficinaSel]);

  useEffect(() => {
    if (!tempTipo) {
      setMarcasFiltradas([]);
      setTempMarca("");
      setTempModelo("");
      setModelosFiltrados([]);
      return;
    }
    setCargandoMarcas(true);
    api
      .get(`/catalogos/marcas/porTipo/${encodeURIComponent(tempTipo)}`)
      .then((res) => {
        setMarcasFiltradas(res.data);
        setTempMarca("");
        setTempModelo("");
        setModelosFiltrados([]);
      })
      .catch(console.error)
      .finally(() => setCargandoMarcas(false));
  }, [tempTipo]);

  useEffect(() => {
    if (!tempTipo || !tempMarca) {
      setModelosFiltrados([]);
      setTempModelo("");
      return;
    }
    setCargandoModelos(true);
    api
      .get(
        `/catalogos/modelos/porTipoMarca/${encodeURIComponent(tempTipo)}/${encodeURIComponent(tempMarca)}`,
      )
      .then((res) => {
        setModelosFiltrados(res.data);
        setTempModelo("");
      })
      .catch(console.error)
      .finally(() => setCargandoModelos(false));
  }, [tempTipo, tempMarca]);

  // CAMPOS DINÁMICOS
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
        const nuevas = [...(prev[tablaId] || [])];
        nuevas[index] = { ...nuevas[index], [colId]: valor };
        return { ...prev, [tablaId]: nuevas };
      }),
    [],
  );

  //FORMULARIO HELPERS
  const mostrarAlerta = (titulo, mensaje = "", botones = []) => {
    showAlert({
      title: titulo,
      message: mensaje,
      buttons:
        botones.length > 0
          ? botones.map((btn) => ({
              text: btn.text,
              style:
                btn.style === "cancel"
                  ? "cancel"
                  : btn.style === "danger"
                    ? "danger"
                    : "primary",
              onPress: btn.onPress,
            }))
          : [{ text: "Aceptar" }],
    });
  };

  const agregarItem = () => {
    if (!tempTipo || !tempMarca || !tempModelo) {
      mostrarAlerta("Atención", "Selecciona Tipo, Marca y Modelo.");
      return;
    }
    if (!tempSerie.trim()) {
      mostrarAlerta("Atención", "El número de serie es obligatorio.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        tipo: tempTipo,
        marca: tempMarca,
        modelo: tempModelo,
        serie: tempSerie,
        numFicha: tempFicha,
        numInv: tempInv,
        _idTemporal: Date.now().toString(),
      },
    ]);
    setTempTipo("");
    setTempMarca("");
    setTempModelo("");
    setTempSerie("");
    setTempFicha("");
    setTempInv("");
  };

  const cancelarActa = () =>
    mostrarAlerta(
      "¿Estás seguro?",
      "Si cancelas, perderás los datos ingresados.",
      [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "danger",
          onPress: () => router.replace("/generarDocs"),
        },
      ],
    );

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
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 0.8,
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
    } catch (e) {
      mostrarAlerta("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  // GUARDAR ACTA
  const generarActa = async () => {
    if (
      tipoDestinatario === "EMPLEADO" &&
      (!empleadoSelId || !empleadoSelNombre)
    ) {
      mostrarAlerta("Error", "Selecciona un empleado.");
      return;
    }
    if (
      tipoDestinatario === "RECEPTOR" &&
      (!receptorSelId || !receptorSelNombre)
    ) {
      mostrarAlerta("Error", "Selecciona un receptor.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Error", "Agrega al menos un equipo.");
      return;
    }

    const formData = new FormData();
    formData.append("tipo", tipoActa);
    formData.append(
      "idEmpleados",
      tipoDestinatario === "EMPLEADO" ? parseInt(empleadoSelId) : "",
    );
    formData.append(
      "idReceptores",
      tipoDestinatario === "RECEPTOR" ? parseInt(receptorSelId) : "",
    );
    formData.append(
      "campos_extra",
      JSON.stringify({ campos: valoresCamposExtra, tablas: filasTablas }),
    );
    formData.append("asunto", tempDesc);
    formData.append("descripcion", tempDescripcion);
    formData.append("observacion", tempObs);
    formData.append(
      "items",
      JSON.stringify(
        items.map((item) => ({
          tipo: item.tipo,
          marca: item.marca,
          modelo: item.modelo,
          serie: item.serie,
          numFicha: item.numFicha,
          numInv: item.numInv,
          asignado_a:
            tipoDestinatario === "EMPLEADO"
              ? unidadSel || oficinaSel || "-"
              : receptorEmpresa || "-",
        })),
      ),
    );
    imagenes.forEach((img, idx) => {
      if (Platform.OS === "web" && img.file)
        formData.append("imagenes", img.file, img.fileName);
      else {
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
    });
    try {
      const response = await api.post("/actas/procesadas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  //GENERAR PDF
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([getLogoURIs(), obtenerPlantillaActiva("RETIRO")]);

      const nombreDestinatario =
        tipoDestinatario === "EMPLEADO" ? empleadoSelNombre : receptorSelNombre;
      const cargoDestinatario =
        tipoDestinatario === "EMPLEADO" ? cargoSel : receptorCargo;
      const asignadoA =
        tipoDestinatario === "EMPLEADO"
          ? unidadSel || oficinaSel || "-"
          : receptorEmpresa || "-";
      const fechaActual = new Date().toLocaleDateString("es-HN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Convertir imágenes a base64
      const imagenesBase64 = [];
      for (const img of imagenes) {
        try {
          if (Platform.OS === "web") {
            if (img.uri.startsWith("http") || img.uri.startsWith("blob:")) {
              const blob = await fetch(img.uri).then((r) => r.blob());
              const b64 = await new Promise((res) => {
                const r = new FileReader();
                r.onloadend = () => res(r.result);
                r.readAsDataURL(blob);
              });
              imagenesBase64.push(b64);
            } else {
              imagenesBase64.push(img.uri);
            }
          } else {
            if (img.uri.startsWith("http")) {
              imagenesBase64.push(img.uri);
              continue;
            }
            const base64 = await FileSystem.readAsStringAsync(img.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imagenesBase64.push(`data:image/jpeg;base64,${base64}`);
          }
        } catch {
          imagenesBase64.push(img.uri);
        }
      }

      const htmlContent = generarHTMLRetiro({
        data: {
          emisorNombre: usuarioLogueado,
          emisorCargo: cargoLogueado,
          receptorNombre: nombreDestinatario,
          receptorCargo: cargoDestinatario,
          asunto: tempDesc,
          descripcion: tempDescripcion,
          observacion: tempObs,
          fecha: fechaActual,
          correlativoFinal,
          items: items.map((item) => ({ ...item, asignado_a: asignadoA })),
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
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        await window
          .html2pdf()
          .set({
            margin: [0, 0, 0, 0],
            filename: `Acta_Retiro_${correlativoFinal || "temp"}.pdf`,
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
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Guardar Acta",
            UTI: "com.adobe.pdf",
          });
        } else mostrarAlerta("PDF generado", `Guardado en: ${uri}`);
      }
    } catch (err) {
      mostrarAlerta("Error", "No se pudo generar el documento: " + err.message);
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
        sectionTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: c.text,
          marginBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingBottom: 8,
        },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: c.textMuted,
          marginBottom: 6,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 15,
        },
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
        toggleBtnActive: { backgroundColor: "#09528e", elevation: 2 },
        toggleBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: c.toggleInactive,
        },
        toggleBtnTextActive: { color: "#fff" },
        buttonsContainer: { flexDirection: "row", gap: 10, marginTop: 10 },
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
          backgroundColor: "#b57227",
          paddingVertical: 16,
          borderRadius: 8,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
        readOnlyInput: { backgroundColor: c.surface2, color: c.textMuted },
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
      >
        <Text style={styles.mainTitle}>
          {isReadOnly ? "DETALLE DE ACTA" : "NUEVA ACTA DE RETIRO"}
        </Text>
        <View style={styles.formContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>De:</Text>
            <Text style={{ fontSize: 15, fontWeight: "500", color: c.text }}>
              {usuarioLogueado || "Cargando..."} /{" "}
              {cargoLogueado || "Infotecnología"}
            </Text>
          </View>

          {/* DESTINATARIO*/}
          <View style={styles.card}>
            <View style={styles.toggleContainer}>
              {["EMPLEADO", "RECEPTOR"].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.toggleBtn,
                    tipoDestinatario === tipo && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    setTipoDestinatario(tipo);
                    setEmpleadoSelId("");
                    setEmpleadoSelNombre("");
                    setReceptorSelId("");
                    setReceptorSelNombre("");
                    setReceptorEmpresa("");
                    setReceptorCargo("");
                    setOficinaSel("");
                    setUnidadSel("");
                    setCargoSel("");
                  }}
                  disabled={isReadOnly}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      tipoDestinatario === tipo && styles.toggleBtnTextActive,
                    ]}
                  >
                    {tipo === "EMPLEADO" ? "Empleado" : "Receptor externo"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoDestinatario === "EMPLEADO" ? (
              <>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Oficina:</Text>
                    {isReadOnly ? (
                      <ThemedInput
                        value={oficinaSel}
                        editable={false}
                        style={styles.readOnlyInput}
                        colors={c}
                      />
                    ) : (
                      <ThemedPicker
                        selectedValue={oficinaSel}
                        colors={c}
                        onValueChange={(val) => {
                          setOficinaSel(val);
                          setUnidadSel("");
                          setCargoSel("");
                        }}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {[
                          ...new Set(
                            oficinasBD.map((i) => String(i.nomOficina).trim()),
                          ),
                        ]
                          .filter(Boolean)
                          .map((nom, idx) => (
                            <Picker.Item
                              key={idx}
                              label={nom}
                              value={nom}
                              color={c.pickerColor}
                            />
                          ))}
                      </ThemedPicker>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Unidad:</Text>
                    {isReadOnly ? (
                      <ThemedInput
                        value={unidadSel}
                        editable={false}
                        style={styles.readOnlyInput}
                        colors={c}
                      />
                    ) : (
                      <ThemedPicker
                        selectedValue={unidadSel}
                        colors={c}
                        enabled={unidadesList.length > 0}
                        onValueChange={(val) => {
                          setUnidadSel(val);
                          setCargoSel("");
                        }}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {unidadesList.map((u, idx) => (
                          <Picker.Item
                            key={idx}
                            label={u}
                            value={u}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    )}
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Cargo:</Text>
                    {isReadOnly ? (
                      <ThemedInput
                        value={cargoSel}
                        editable={false}
                        style={styles.readOnlyInput}
                        colors={c}
                      />
                    ) : (
                      <ThemedPicker
                        selectedValue={cargoSel}
                        onValueChange={setCargoSel}
                        enabled={cargosList.length > 0}
                        colors={c}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {cargosList.map((car, idx) => (
                          <Picker.Item
                            key={idx}
                            label={car}
                            value={car}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Empleado:</Text>
                    {isReadOnly ? (
                      <ThemedInput
                        value={empleadoSelNombre}
                        editable={false}
                        style={styles.readOnlyInput}
                        colors={c}
                      />
                    ) : (
                      <ThemedPicker
                        selectedValue={String(empleadoSelId)}
                        colors={c}
                        enabled={
                          empleadosFiltrados.length > 0 && oficinaSel !== ""
                        }
                        onValueChange={(val) => {
                          setEmpleadoSelId(val);
                          const e = empleadosFiltrados.find(
                            (e) => String(e.idEmpleados) === String(val),
                          );
                          setEmpleadoSelNombre(e?.nomEmp || "");
                        }}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {empleadosFiltrados.map((e) => (
                          <Picker.Item
                            key={e.idEmpleados}
                            label={e.nomEmp}
                            value={String(e.idEmpleados)}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={{ marginBottom: 15 }}>
                  <Text style={styles.label}>Receptor:</Text>
                  {isReadOnly ? (
                    <ThemedInput
                      value={receptorSelNombre}
                      editable={false}
                      style={styles.readOnlyInput}
                      colors={c}
                    />
                  ) : (
                    <ThemedPicker
                      selectedValue={String(receptorSelId)}
                      colors={c}
                      onValueChange={(val) => {
                        setReceptorSelId(val);
                        const r = receptoresBD.find(
                          (r) => String(r.idReceptores) === String(val),
                        );
                        setReceptorSelNombre(r?.nomRec || "");
                        setReceptorEmpresa(r?.emprRec || "");
                        setReceptorCargo(r?.cargoRec || "");
                      }}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color={c.textMuted}
                      />
                      {receptoresBD
                        .filter((r) => r.estRec === "Activo")
                        .map((r) => (
                          <Picker.Item
                            key={r.idReceptores}
                            label={r.nomRec}
                            value={String(r.idReceptores)}
                            color={c.pickerColor}
                          />
                        ))}
                    </ThemedPicker>
                  )}
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Empresa:</Text>
                    <ThemedInput
                      value={receptorEmpresa}
                      editable={false}
                      style={styles.readOnlyInput}
                      colors={c}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Cargo:</Text>
                    <ThemedInput
                      value={receptorCargo}
                      editable={false}
                      style={styles.readOnlyInput}
                      colors={c}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Asunto:</Text>
              <ThemedInput
                value={tempDesc}
                onChangeText={setTempDesc}
                colors={c}
                multiline
                style={{ height: 60, textAlignVertical: "top" }}
                editable={!isReadOnly}
                placeholder="Asunto del acta..."
              />
            </View>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Descripción:</Text>
              <ThemedInput
                value={tempDescripcion}
                onChangeText={setTempDescripcion}
                colors={c}
                multiline
                style={{ height: 60, textAlignVertical: "top" }}
                editable={!isReadOnly}
                placeholder="Descripción del equipo..."
              />
            </View>
          </View>

          {/*AGREGAR EQUIPO */}
          {!isReadOnly && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AGREGAR EQUIPO</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Tipo:</Text>
                  <ThemedPicker
                    selectedValue={tempTipo}
                    onValueChange={setTempTipo}
                    colors={c}
                  >
                    <Picker.Item
                      label="Seleccione..."
                      value=""
                      color={c.textMuted}
                    />
                    {tiposEquipoBD.map((i, idx) => (
                      <Picker.Item
                        key={idx}
                        label={i.tipo}
                        value={i.tipo}
                        color={c.pickerColor}
                      />
                    ))}
                  </ThemedPicker>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>
                    Marca:{cargandoMarcas ? " ⏳" : ""}
                  </Text>
                  <ThemedPicker
                    selectedValue={tempMarca}
                    onValueChange={setTempMarca}
                    enabled={marcasFiltradas.length > 0 && !cargandoMarcas}
                    colors={c}
                  >
                    <Picker.Item
                      label={
                        !tempTipo
                          ? "Elige tipo"
                          : cargandoMarcas
                            ? "Cargando..."
                            : "Seleccione..."
                      }
                      value=""
                      color={c.textMuted}
                    />
                    {marcasFiltradas.map((i, idx) => (
                      <Picker.Item
                        key={idx}
                        label={i.marca}
                        value={i.marca}
                        color={c.pickerColor}
                      />
                    ))}
                  </ThemedPicker>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Modelo:{cargandoModelos ? " ⏳" : ""}
                  </Text>
                  <ThemedPicker
                    selectedValue={tempModelo}
                    onValueChange={setTempModelo}
                    enabled={modelosFiltrados.length > 0 && !cargandoModelos}
                    colors={c}
                  >
                    <Picker.Item
                      label={
                        !tempMarca
                          ? "Elige marca"
                          : cargandoModelos
                            ? "Cargando..."
                            : "Seleccione..."
                      }
                      value=""
                      color={c.textMuted}
                    />
                    {modelosFiltrados.map((i, idx) => (
                      <Picker.Item
                        key={idx}
                        label={i.modelo}
                        value={i.modelo}
                        color={c.pickerColor}
                      />
                    ))}
                  </ThemedPicker>
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: c.danger }]}>
                    Serie *:
                  </Text>
                  <ThemedInput
                    value={tempSerie}
                    onChangeText={setTempSerie}
                    colors={c}
                    placeholder="Obligatorio"
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>N° Ficha:</Text>
                  <ThemedInput
                    value={tempFicha}
                    onChangeText={setTempFicha}
                    colors={c}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>N° Inventario:</Text>
                  <ThemedInput
                    value={tempInv}
                    onChangeText={setTempInv}
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
                <Text style={styles.saveBtnText}>+ Agregar Equipo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Lista de equipos ── */}
          {items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>Equipos ({items.length}):</Text>
              {items.map((item) => (
                <View
                  key={item._idTemporal}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: c.text }}>
                      {item.tipo} — {item.marca} {item.modelo}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted }}>
                      S/N: {item.serie || "N/A"} | Ficha:{" "}
                      {item.numFicha || "N/A"} | Inv: {item.numInv || "N/A"}
                    </Text>
                  </View>
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() =>
                        setItems(
                          items.filter(
                            (i) => i._idTemporal !== item._idTemporal,
                          ),
                        )
                      }
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

          {/* EVIDENCIAS */}
          {(imagenes.length > 0 || !isReadOnly) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Evidencias</Text>
              {!isReadOnly && (
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: "#0369a1", marginTop: 8 },
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
                <RNScrollView
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
                </RNScrollView>
              )}
            </View>
          )}

          {/*OBSERVACIÓN */}
          <View style={styles.card}>
            <Text style={styles.label}>Observación:</Text>
            <ThemedInput
              value={tempObs}
              onChangeText={setTempObs}
              colors={c}
              multiline
              style={{ height: 60, textAlignVertical: "top" }}
              editable={!isReadOnly}
            />
          </View>

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

          {/* BOTONES*/}
          <View style={styles.buttonsContainer}>
            {!isReadOnly && (
              <TouchableOpacity style={styles.saveBtn} onPress={generarActa}>
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
              onPress={isReadOnly ? () => router.back() : cancelarActa}
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
