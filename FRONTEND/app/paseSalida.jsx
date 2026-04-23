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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { generarHTMLPaseSalida } from "../utils/documentosHTML";
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
  },
};

const TI = ({
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

const EMISOR_KEY = "pase_salida_emisor";
const EMISOR_DEFAULT = {
  nombre: "Marco Antonio Aguilera",
  cargo: "Jefe Infotecnología",
};
const TIPO_RECEPTOR = { EMPLEADO: "empleado", RECEPTOR: "receptor" };

export default function PaseSalidaScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  const { camposExtra, tablasExtra } = usePlantillaDinamica("PASE_SALIDA");
  const [valoresCamposExtra, setValoresCamposExtra] = useState({});
  const [filasTablas, setFilasTablas] = useState({});

  const [emisorNombre, setEmisorNombre] = useState("");
  const [emisorCargo, setEmisorCargo] = useState(EMISOR_DEFAULT.cargo);
  const [editandoEmisor, setEditandoEmisor] = useState(false);
  const [tipoReceptor, setTipoReceptor] = useState(TIPO_RECEPTOR.RECEPTOR);
  const [receptoresBD, setReceptoresBD] = useState([]);
  const [empleadosBD, setEmpleadosBD] = useState([]);
  const [receptorSelId, setReceptorSelId] = useState("");
  const [receptorSelNombre, setReceptorSelNombre] = useState("");
  const [receptorEmpresa, setReceptorEmpresa] = useState("");
  const [empleadoSelId, setEmpleadoSelId] = useState("");
  const [empleadoSelNombre, setEmpleadoSelNombre] = useState("");
  const [empleadoCargo, setEmpleadoCargo] = useState("");

  const [tituloDoc, setTituloDoc] = useState("Pase de Salida");
  const [motivoDesc, setMotivoDesc] = useState("");
  const [equiposBD, setEquiposBD] = useState([]);
  const [equiposItems, setEquiposItems] = useState([]);
  const [equipoSelId, setEquipoSelId] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(EMISOR_KEY);
        if (raw) {
          const e = JSON.parse(raw);
          setEmisorNombre(e.nombre || EMISOR_DEFAULT.nombre);
          setEmisorCargo(e.cargo || EMISOR_DEFAULT.cargo);
        } else {
          setEmisorNombre(EMISOR_DEFAULT.nombre);
          setEmisorCargo(EMISOR_DEFAULT.cargo);
        }
        const [resRec, resEmp, resEq] = await Promise.all([
          api.get("/receptores"),
          api.get("/empleados"),
          api.get("/equipos"),
        ]);
        setReceptoresBD(resRec.data);
        setEmpleadosBD(resEmp.data);
        setEquiposBD(resEq.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/actas/pase-salida/${id}`);
        const pase = res.data;
        if (!pase) return;
        const raw = await AsyncStorage.getItem(EMISOR_KEY);
        if (raw) {
          const e = JSON.parse(raw);
          setEmisorNombre(e.nombre || EMISOR_DEFAULT.nombre);
          setEmisorCargo(e.cargo || EMISOR_DEFAULT.cargo);
        }
        setTituloDoc(pase.titulo || "Pase de Salida");
        setMotivoDesc(pase.motivo || "");
        setReceptorSelNombre(pase.receptor?.nombre || "");
        setReceptorEmpresa(pase.receptor?.empresa || "");
        setCorrelativo(pase.correlativo || "");
        if (pase.items?.length > 0)
          setEquiposItems(
            pase.items.map((item, idx) => ({
              ...item,
              _idTemporal: idx.toString(),
            })),
          );
        //CAMPOS EXTRA
        if (pase.campos_extra) {
          const parsed =
            typeof pase.campos_extra === "string"
              ? JSON.parse(pase.campos_extra)
              : pase.campos_extra;
          setValoresCamposExtra(parsed.campos || {});
          setFilasTablas(parsed.tablas || {});
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

  const guardarEmisor = async () => {
    if (!emisorNombre.trim()) {
      mostrarAlerta("Atención", "El nombre no puede estar vacío.");
      return;
    }
    await AsyncStorage.setItem(
      EMISOR_KEY,
      JSON.stringify({ nombre: emisorNombre, cargo: emisorCargo }),
    );
    setEditandoEmisor(false);
  };

  const agregarEquipo = () => {
    if (!equipoSelId) {
      mostrarAlerta("Atención", "Selecciona un equipo.");
      return;
    }
    if (equiposItems.find((i) => String(i.idEquipo) === String(equipoSelId))) {
      mostrarAlerta("Atención", "Ese equipo ya está en la lista.");
      return;
    }
    const eq = equiposBD.find(
      (e) => String(e.idEquipo) === String(equipoSelId),
    );
    if (!eq) return;
    setEquiposItems((prev) => [
      ...prev,
      {
        idEquipo: eq.idEquipo,
        marca: eq.marca || "N/A",
        modelo: eq.modelo || "N/A",
        serie: eq.serie || "N/A",
        _idTemporal: Date.now().toString(),
      },
    ]);
    setEquipoSelId("");
  };

  const cancelar = () =>
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

  const getNombreReceptor = () =>
    isReadOnly
      ? receptorSelNombre
      : tipoReceptor === TIPO_RECEPTOR.EMPLEADO
        ? empleadoSelNombre
        : receptorSelNombre;
  const getEmpresaReceptor = () => {
    if (isReadOnly) return receptorEmpresa;
    if (tipoReceptor === TIPO_RECEPTOR.EMPLEADO) return "CONADEH";
    return receptorEmpresa;
  };

  const guardarPase = async () => {
    if (!emisorNombre.trim()) {
      mostrarAlerta("Error", "Ingresa el nombre del firmante.");
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
    if (!motivoDesc.trim()) {
      mostrarAlerta("Error", "El motivo es obligatorio.");
      return;
    }
    if (equiposItems.length === 0) {
      mostrarAlerta("Error", "Agrega al menos un equipo.");
      return;
    }
    await AsyncStorage.setItem(
      EMISOR_KEY,
      JSON.stringify({ nombre: emisorNombre, cargo: emisorCargo }),
    );
    const payload = {
      idEmpleados: idEmp,
      idReceptores: idRec,
      emp_PSEnc: getEmpresaReceptor(),
      motivo_PSEnc: motivoDesc,
      titulo_PSEnc: tituloDoc,
      campos_extra: JSON.stringify({
        campos: valoresCamposExtra,
        tablas: filasTablas,
      }),
      items: equiposItems.map((i) => ({ idEquipo: i.idEquipo })),
    };
    try {
      const response = await api.post("/actas/pase-salida", payload);
      setCorrelativo(response.data.correlativo || "");
      await generarPDF(response.data.correlativo || "");
      router.replace("/dashboard");
    } catch (error) {
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error || "Error inesperado.",
      );
    }
  };

  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención", "Guarda el pase primero.");
      return;
    }
    if (equiposItems.length === 0) {
      mostrarAlerta("Atención", "No hay equipos para mostrar.");
      return;
    }
    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([
          getLogoURIs(),
          obtenerPlantillaActiva("PASE_SALIDA"),
        ]);
      const nombreRec = getNombreReceptor();
      const empresaRec = getEmpresaReceptor();
      const htmlContent = generarHTMLPaseSalida({
        data: {
          emisorNombre,
          emisorCargo,
          receptorNombre: nombreRec,
          receptorEmpresa: empresaRec,
          motivo: motivoDesc,
          titulo: tituloDoc,
          parrafoIntro: `Por este medio se hace entrega a ${nombreRec || "—"} de ${empresaRec || "—"}, para que ${motivoDesc || "—"}:`,
          correlativoFinal,
          items: equiposItems.map((eq) => ({
            marca: eq.marca || "N/A",
            modelo: eq.modelo || "N/A",
            serie: eq.serie || "N/A",
          })),
          valoresCamposExtra,
          filasTablas,
        },
        config: cPlantilla,
        logos: { uriConadeh, uriInfo },
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
            filename: `Pase_Salida_${correlativoFinal || "temp"}.pdf`,
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
            dialogTitle: "Guardar Pase",
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
        editBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
        editBtnText: { fontSize: 13, fontWeight: "600", color: c.accent },
        emisorNombre: { fontSize: 15, fontWeight: "700", color: c.text },
        emisorCargo: { fontSize: 13, color: c.textMuted, marginTop: 2 },
        hintText: {
          fontSize: 11,
          color: c.textMuted,
          marginTop: 8,
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
        toggleBtnActive: { backgroundColor: c.primary, elevation: 2 },
        toggleBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: c.toggleInactive,
        },
        toggleBtnTextActive: { color: "#fff" },
        receptorInfo: { fontSize: 13, color: c.textMuted, marginTop: 6 },
        label: {
          fontSize: 14,
          fontWeight: "600",
          color: c.textMuted,
          marginBottom: 6,
        },
        readOnlyInput: { backgroundColor: c.surface2, color: c.textMuted },
        tablaRow: {
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderColor: c.border,
          paddingVertical: 8,
        },
        tablaHeader: {
          backgroundColor: c.surface2,
          borderRadius: 6,
          marginTop: 8,
        },
        tablaCell: {
          flex: 1,
          fontSize: 13,
          color: c.text,
          paddingHorizontal: 4,
        },
        tablaCellHeader: {
          fontWeight: "700",
          color: c.textMuted,
          fontSize: 12,
        },
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
          {isReadOnly ? "DETALLE DE PASE DE SALIDA" : "NUEVO PASE DE SALIDA"}
        </Text>
        <View style={styles.formContainer}>
          {/* Firmante */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.sectionTitle}>Firmante (Emisor)</Text>
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
                <TI
                  value={emisorNombre}
                  onChangeText={setEmisorNombre}
                  placeholder="Nombre completo..."
                  colors={c}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.label}>Cargo:</Text>
                <TI
                  value={emisorCargo}
                  onChangeText={setEmisorCargo}
                  placeholder="Cargo..."
                  colors={c}
                />
                <Text style={styles.hintText}>
                  Estos datos se guardan como valores por defecto.
                </Text>
              </>
            ) : emisorNombre ? (
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

          {/* Destinatario */}
          <View style={styles.card}>
            <View style={{ height: 12 }} />
            {isReadOnly ? (
              <TI
                value={`${receptorSelNombre}${receptorEmpresa ? ` — ${receptorEmpresa}` : ""}`}
                editable={false}
                style={styles.readOnlyInput}
                colors={c}
              />
            ) : (
              <>
                <View style={styles.toggleContainer}>
                  {[TIPO_RECEPTOR.EMPLEADO, TIPO_RECEPTOR.RECEPTOR].map(
                    (tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.toggleBtn,
                          tipoReceptor === tipo && styles.toggleBtnActive,
                        ]}
                        onPress={() => {
                          setTipoReceptor(tipo);
                          setReceptorSelId("");
                          setReceptorSelNombre("");
                          setReceptorEmpresa("");
                          setEmpleadoSelId("");
                          setEmpleadoSelNombre("");
                          setEmpleadoCargo("");
                        }}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            tipoReceptor === tipo && styles.toggleBtnTextActive,
                          ]}
                        >
                          {tipo === TIPO_RECEPTOR.EMPLEADO
                            ? "Empleado"
                            : "Receptor externo"}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
                {tipoReceptor === TIPO_RECEPTOR.RECEPTOR ? (
                  <>
                    <Text style={styles.label}>Seleccionar receptor:</Text>
                    <TP
                      selectedValue={String(receptorSelId)}
                      onValueChange={(val) => {
                        setReceptorSelId(val);
                        const r = receptoresBD.find(
                          (r) => String(r.idReceptores) === String(val),
                        );
                        setReceptorSelNombre(r?.nomRec || "");
                        setReceptorEmpresa(r?.emprRec || "");
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
                        .map((r) => (
                          <Picker.Item
                            key={r.idReceptores}
                            label={`${r.nomRec} — ${r.emprRec}`}
                            value={String(r.idReceptores)}
                            color={c.pickerColor}
                          />
                        ))}
                    </TP>
                    {receptorEmpresa && (
                      <Text style={styles.receptorInfo}>
                        <Text style={{ fontWeight: "700" }}>Empresa: </Text>
                        {receptorEmpresa}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Seleccionar empleado:</Text>
                    <TP
                      selectedValue={String(empleadoSelId)}
                      onValueChange={(val) => {
                        setEmpleadoSelId(val);
                        const e = empleadosBD.find(
                          (e) => String(e.idEmpleados) === String(val),
                        );
                        setEmpleadoSelNombre(e?.nomEmp || "");
                        setEmpleadoCargo(e?.cargoEmp || "");
                      }}
                      colors={c}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color={c.textMuted}
                      />
                      {empleadosBD.map((e) => (
                        <Picker.Item
                          key={e.idEmpleados}
                          label={e.nomEmp}
                          value={String(e.idEmpleados)}
                          color={c.pickerColor}
                        />
                      ))}
                    </TP>
                    {empleadoCargo && (
                      <Text style={styles.receptorInfo}>
                        <Text style={{ fontWeight: "700" }}>Cargo: </Text>
                        {empleadoCargo}
                      </Text>
                    )}
                  </>
                )}
              </>
            )}
          </View>

          {/* Título y Motivo */}
          <View style={styles.card}>
            <Text style={styles.label}>Título del documento:</Text>
            <TI
              value={tituloDoc}
              onChangeText={setTituloDoc}
              placeholder="Ej: Pase de Salida Impresora"
              editable={!isReadOnly}
              colors={c}
              style={{ marginBottom: 14 }}
            />
            <Text style={styles.label}>Motivo (acción que realizará):</Text>
            <TI
              value={motivoDesc}
              onChangeText={setMotivoDesc}
              multiline
              style={{ height: 60, textAlignVertical: "top" }}
              placeholder="Ej: repare la impresora"
              editable={!isReadOnly}
              colors={c}
            />
            <Text
              style={{
                fontSize: 11,
                color: c.textMuted,
                marginTop: 8,
                fontStyle: "italic",
              }}
            >
              Se usará en: "...para que [motivo] que a continuación se describe"
            </Text>
          </View>

          {/* Agregar equipo */}
          {!isReadOnly && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AGREGAR EQUIPO</Text>
              <View style={{ height: 12 }} />
              <Text style={styles.label}>Seleccionar equipo:</Text>
              <TP
                selectedValue={String(equipoSelId)}
                onValueChange={setEquipoSelId}
                colors={c}
              >
                <Picker.Item
                  label="Seleccione..."
                  value=""
                  color={c.textMuted}
                />
                {equiposBD.map((eq) => (
                  <Picker.Item
                    key={eq.idEquipo}
                    label={`${eq.tipo ? eq.tipo + " — " : ""}${eq.marca} ${eq.modelo} | S/N: ${eq.serie}`}
                    value={String(eq.idEquipo)}
                    color={c.pickerColor}
                  />
                ))}
              </TP>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: "#0369a1", marginTop: 10 },
                ]}
                onPress={agregarEquipo}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>Agregar Equipo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista equipos */}
          {equiposItems.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>Equipos ({equiposItems.length}):</Text>
              <View style={[styles.tablaRow, styles.tablaHeader]}>
                {["Marca", "Modelo", "S/N"].map((h) => (
                  <Text
                    key={h}
                    style={[styles.tablaCell, styles.tablaCellHeader]}
                  >
                    {h}
                  </Text>
                ))}
                {!isReadOnly && <View style={{ width: 34 }} />}
              </View>
              {equiposItems.map((eq) => (
                <View key={eq._idTemporal} style={styles.tablaRow}>
                  <Text style={styles.tablaCell}>{eq.marca}</Text>
                  <Text style={styles.tablaCell}>{eq.modelo}</Text>
                  <Text style={styles.tablaCell}>{eq.serie}</Text>
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() =>
                        setEquiposItems(
                          equiposItems.filter(
                            (i) => i._idTemporal !== eq._idTemporal,
                          ),
                        )
                      }
                      style={{ width: 34, alignItems: "center" }}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color={c.danger}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

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
              <TouchableOpacity style={styles.saveBtn} onPress={guardarPase}>
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
              onPress={isReadOnly ? () => router.back() : cancelar}
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
