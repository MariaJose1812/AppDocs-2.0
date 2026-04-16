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

import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

//Paleta de colores por tema
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
  },
};

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

export default function ActaRetiroScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const tipoActa = "RETIRO";
  const { showAlert } = useAlert();

  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  // Estados catálogos
  const [oficinasBD, setOficinasBD] = useState([]);
  const [unidadesList, setUnidadesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [empleadosBD, setEmpleadosBD] = useState([]);
  const [tiposEquipoBD, setTiposEquipoBD] = useState([]);
  const [marcasBD, setMarcasBD] = useState([]);
  const [modelosBD, setModelosBD] = useState([]);
  const [receptoresBD, setReceptoresBD] = useState([]);

  // Estados de filtros dinámicos
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);

  // Estados del formulario
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
  const [tempAsignado, setTempAsignado] = useState("");
  const [tempObs, setTempObs] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const [imagenes, setImagenes] = useState([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  //CARGAR DATOS
  useEffect(() => {
    const cargarDatosActa = async () => {
      if (id) {
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
            const itemsMapeados = acta.items.map((item) => ({
              ...item,
              tipo: item.tipo || "Equipo",
              marca: item.marca || "",
              modelo: item.modelo || "",
              serie: item.serie || "",
              numFicha: item.numFicha || "",
              numInv: item.numInv || "",
              asignado_a: item.asignado_a || "",
              _idTemporal: Math.random().toString(),
            }));
            setItems(itemsMapeados);
          }
          if (acta.imagenes && acta.imagenes.length > 0) {
            const imagenesFormateadas = acta.imagenes.map((url, idx) => ({
              uri: url, // URL pública de Supabase
              fileName: `img_${idx}.jpg`,
              type: "image/jpeg",
            }));
            setImagenes(imagenesFormateadas);
          }
        } catch (error) {
          console.error("Error trayendo acta:", error);
          showAlert({
            title: "Error",
            message: "No se pudo cargar el detalle del acta",
          });
        }
      }
    };
    cargarDatosActa();
  }, [id]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const nombre = await AsyncStorage.getItem("nomUsu");
        const cargo = await AsyncStorage.getItem("cargoUsu");
        if (nombre) setUsuarioLogueado(nombre);
        if (cargo) setCargoLogueado(cargo);

        const [resEmp, resOfi, resTipo, resMarca, resMod, resRec] =
          await Promise.all([
            api.get("/catalogos/empleados"),
            api.get("/catalogos/oficinas"),
            api.get("/catalogos/tiposEquipo"),
            api.get("/catalogos/marcas"),
            api.get("/catalogos/modelos"),
            api.get("/receptores"),
          ]);

        setEmpleadosBD(resEmp.data);
        setOficinasBD(resOfi.data);
        setTiposEquipoBD(resTipo.data);
        setMarcasBD(resMarca.data);
        setModelosBD(resMod.data);
        setReceptoresBD(resRec.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    cargarCatalogos();
  }, []);

  //UNIDADES Y CARGOS
  useEffect(() => {
    if (oficinaSel) {
      const filtradas = oficinasBD.filter(
        (item) => String(item.nomOficina).trim() === String(oficinaSel).trim(),
      );
      const unicas = [
        ...new Set(
          filtradas.map((item) =>
            item.unidad ? String(item.unidad).trim() : null,
          ),
        ),
      ].filter(Boolean);
      setUnidadesList(unicas);
    } else {
      setUnidadesList([]);
    }
  }, [oficinaSel, oficinasBD]);

  useEffect(() => {
    if (oficinaSel && unidadSel) {
      const filtrados = oficinasBD.filter(
        (item) =>
          String(item.nomOficina).trim() === String(oficinaSel).trim() &&
          String(item.unidad).trim() === String(unidadSel).trim(),
      );
      const unicos = [
        ...new Set(filtrados.map((item) => item.cargoOfi)),
      ].filter(Boolean);
      setCargosList(unicos);
    } else {
      setCargosList([]);
    }
  }, [oficinaSel, unidadSel, oficinasBD]);

  //FILTRO EMPLEADOS
  useEffect(() => {
    if (!oficinaSel) {
      setEmpleadosFiltrados([]);
      setEmpleadoSelId("");
      setEmpleadoSelNombre("");
      return;
    }
    api
      .get(`/catalogos/empleados/porOficina/${encodeURIComponent(oficinaSel)}`)
      .then((res) => setEmpleadosFiltrados(res.data))
      .catch((err) => console.error("Error filtrando empleados:", err));
  }, [oficinaSel]);

  // FILTRO MARCAS
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
      .catch((err) => console.error("Error filtrando marcas:", err))
      .finally(() => setCargandoMarcas(false));
  }, [tempTipo]);

  //FILTRO MODELOS
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
      .catch((err) => console.error("Error filtrando modelos:", err))
      .finally(() => setCargandoModelos(false));
  }, [tempTipo, tempMarca]);

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

  const agregarItem = () => {
    if (!tempTipo || !tempMarca || !tempModelo) {
      mostrarAlerta(
        "Atención",
        "Por favor selecciona Tipo, Marca y Modelo del equipo.",
      );
      return;
    }
    if (!tempSerie.trim()) {
      mostrarAlerta("Atención", "El número de serie es obligatorio.");
      return;
    }
    const nuevoItem = {
      tipo: tempTipo,
      marca: tempMarca,
      modelo: tempModelo,
      serie: tempSerie,
      numFicha: tempFicha,
      numInv: tempInv,
      asignado_a: tempAsignado,
      _idTemporal: Date.now().toString(),
    };
    setItems([...items, nuevoItem]);
    setTempTipo("");
    setTempMarca("");
    setTempModelo("");
    setTempSerie("");
    setTempFicha("");
    setTempInv("");
    setTempAsignado("");
  };

  const eliminarItem = (idTemp) => {
    setItems(items.filter((item) => item._idTemporal !== idTemp));
  };

  const cancelarActa = () => {
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
          // Crear una URL temporal para la vista previa
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

    // Para móviles
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
      console.error("Error detallado:", error);
      mostrarAlerta("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const removerImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  // GUARDAR ACTA
  const generarActa = async () => {
    // Validaciones
    if (
      tipoDestinatario === "EMPLEADO" &&
      (!empleadoSelId || !empleadoSelNombre)
    ) {
      mostrarAlerta("Error", "Por favor selecciona un empleado.");
      return;
    }
    if (
      tipoDestinatario === "RECEPTOR" &&
      (!receptorSelId || !receptorSelNombre)
    ) {
      mostrarAlerta("Error", "Por favor selecciona un receptor.");
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

    // Adjuntar imágenes
    imagenes.forEach((img, idx) => {
      if (Platform.OS === "web" && img.file) {
        // Web
        formData.append("imagenes", img.file, img.fileName);
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
    });

    try {
      const response = await api.post("/actas/procesadas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const actaGuardada = response.data;
      const correlativoNuevo = actaGuardada.correlativo || "";
      setCorrelativo(correlativoNuevo);
      await generarPDF(correlativoNuevo);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error al guardar acta:", error.response?.data || error);
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error || "Ocurrió un error inesperado.",
      );
    }
  };

  // GENERAR PDF
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención", "Guarda el acta para generar el PDF");
      return;
    }
    const nombreDestinatario =
      tipoDestinatario === "EMPLEADO" ? empleadoSelNombre : receptorSelNombre;
    if (!nombreDestinatario) {
      mostrarAlerta("Atención", "Falta el nombre del destinatario.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Atención", "Agrega al menos un equipo.");
      return;
    }

    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";

      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([getLogoURIs(), obtenerPlantillaActiva("RETIRO")]);

      const fechaActual = new Date().toLocaleDateString("es-HN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const cargoDestinatario =
        tipoDestinatario === "EMPLEADO" ? cargoSel : receptorCargo;
      const asignadoA =
        tipoDestinatario === "EMPLEADO"
          ? unidadSel || oficinaSel || "-"
          : receptorEmpresa || "-";

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
        // Móvil
        if (uri.startsWith("http")) return uri;
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      };

      let imagenesHTML = "";
      if (imagenes.length > 0) {
        const imgsBase64 = await Promise.all(
          imagenes.map(async (img) => ({
            base64: await convertirImagenABase64(img.uri),
          })),
        );
        imagenesHTML = `
          <div style="margin-top:20px;page-break-inside:avoid;">
            <p style="font-weight:bold;font-size:11px;margin-bottom:8px;">Evidencias fotográficas:</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;">
              ${imgsBase64.map((img) => `<img src="${img.base64}" style="max-width:200px;max-height:200px;border-radius:4px;border:1px solid #ccc;"/>`).join("")}
            </div>
          </div>`;
      }

      const htmlContent = generarHTMLRetiro({
        data: {
          emisorNombre: usuarioLogueado || "",
          emisorCargo: cargoLogueado || "",
          receptorNombre: nombreDestinatario,
          receptorCargo: cargoDestinatario,
          asunto: tempDesc,
          descripcion: tempDescripcion,
          observacion: tempObs,
          fecha: fechaActual,
          correlativoFinal,
          items: items.map((item) => ({ ...item, asignado_a: asignadoA })),
        },
        config: cPlantilla,
        logos: { uriConadeh, uriInfo },
        imagenesHTML: imagenesHTML,
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

        const opt = {
          margin: [0, 0, 0, 0],
          filename: `Acta_Retiro_${correlativoFinal || "temp"}.pdf`,
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
        // Móvil: usar expo-print
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
        value: { fontSize: 15, fontWeight: "500", color: c.text },
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
            <Text style={styles.value}>
              {usuarioLogueado || "Cargando..."} /{" "}
              {cargoLogueado || "Infotecnología"}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  tipoDestinatario === "EMPLEADO" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setTipoDestinatario("EMPLEADO");
                  setReceptorSelId("");
                  setReceptorSelNombre("");
                  setReceptorEmpresa("");
                  setReceptorCargo("");
                }}
                disabled={isReadOnly}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    tipoDestinatario === "EMPLEADO" &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Empleado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  tipoDestinatario === "RECEPTOR" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setTipoDestinatario("RECEPTOR");
                  setEmpleadoSelId("");
                  setEmpleadoSelNombre("");
                  setOficinaSel("");
                  setUnidadSel("");
                  setCargoSel("");
                }}
                disabled={isReadOnly}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    tipoDestinatario === "RECEPTOR" &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Receptor externo
                </Text>
              </TouchableOpacity>
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
                            oficinasBD.map((item) =>
                              String(item.nomOficina).trim(),
                            ),
                          ),
                        ]
                          .filter(Boolean)
                          .map((nom, idx) => (
                            <Picker.Item
                              key={`ofi-${idx}`}
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
                        onValueChange={(val) => {
                          setUnidadSel(val);
                          setCargoSel("");
                        }}
                        enabled={unidadesList.length > 0}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {unidadesList.map((unidad, idx) => (
                          <Picker.Item
                            key={`uni-${idx}`}
                            label={unidad}
                            value={unidad}
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
                        colors={c}
                        onValueChange={setCargoSel}
                        enabled={cargosList.length > 0}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {cargosList.map((cargo, idx) => (
                          <Picker.Item
                            key={`car-${idx}`}
                            label={cargo}
                            value={cargo}
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
                        onValueChange={(val) => {
                          setEmpleadoSelId(val);
                          const emp = empleadosFiltrados.find(
                            (e) => String(e.idEmpleados) === String(val),
                          );
                          setEmpleadoSelNombre(emp?.nomEmp || "");
                        }}
                        enabled={
                          empleadosFiltrados.length > 0 && oficinaSel !== ""
                        }
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color={c.textMuted}
                        />
                        {empleadosFiltrados.map((item) => (
                          <Picker.Item
                            key={`emp-${item.idEmpleados}`}
                            label={item.nomEmp}
                            value={String(item.idEmpleados)}
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
                        const rec = receptoresBD.find(
                          (r) => String(r.idReceptores) === String(val),
                        );
                        setReceptorSelNombre(rec?.nomRec || "");
                        setReceptorEmpresa(rec?.emprRec || "");
                        setReceptorCargo(rec?.cargoRec || "");
                      }}
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
                            label={rec.nomRec}
                            value={String(rec.idReceptores)}
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
                    {tiposEquipoBD.map((item, idx) => (
                      <Picker.Item
                        key={`tipo-${idx}`}
                        label={item.tipo}
                        value={item.tipo}
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
                          ? "Elige tipo primero"
                          : cargandoMarcas
                            ? "Cargando..."
                            : "Seleccione..."
                      }
                      value=""
                      color={c.textMuted}
                    />
                    {marcasFiltradas.map((item, idx) => (
                      <Picker.Item
                        key={`marca-${idx}`}
                        label={item.marca}
                        value={item.marca}
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
                          ? "Elige marca primero"
                          : cargandoModelos
                            ? "Cargando..."
                            : "Seleccione..."
                      }
                      value=""
                      color={c.textMuted}
                    />
                    {modelosFiltrados.map((item, idx) => (
                      <Picker.Item
                        key={`modelo-${idx}`}
                        label={item.modelo}
                        value={item.modelo}
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
                  <Text style={styles.label}>Número de Ficha:</Text>
                  <ThemedInput
                    value={tempFicha}
                    onChangeText={setTempFicha}
                    colors={c}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Número de Inventario:</Text>
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
                <Text style={styles.saveBtnText}>
                  + Agregar Equipo a la lista
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>
                Equipos agregados ({items.length}):
              </Text>
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

          {/* CARD: Evidencias — agregar antes de buttonsContainer */}
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
                </RNScrollView>
              )}
            </View>
          )}

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
