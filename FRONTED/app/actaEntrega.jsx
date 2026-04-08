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
import { Colors } from "../constants/theme";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

// ── Paleta de colores por tema (igual que en EmpleadosReceptoresScreen) ──
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

// ── Componentes reutilizables con tema ─────────────────────────────
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

export default function ActaEntregaScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const tipoActa = "ENTREGA";

  const { theme } = useTheme();
  const c = P[theme] ?? P.light;

  // Estados (sin cambios)
  const [oficinasBD, setOficinasBD] = useState([]);
  const [unidadesList, setUnidadesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [empleadosBD, setEmpleadosBD] = useState([]);
  const [tiposEquipoBD, setTiposEquipoBD] = useState([]);
  const [marcasBD, setMarcasBD] = useState([]);
  const [modelosBD, setModelosBD] = useState([]);
  const [usuarioLogueado, setUsuarioLogueado] = useState("");
  const [cargoLogueado, setCargoLogueado] = useState("");
  const [oficinaSel, setOficinaSel] = useState("");
  const [unidadSel, setUnidadSel] = useState("");
  const [cargoSel, setCargoSel] = useState("");
  const [empleadoSelId, setEmpleadoSelId] = useState("");
  const [empleadoSelNombre, setEmpleadoSelNombre] = useState("");
  const [tempDescripcion, setTempDescripcion] = useState("");
  const [tipoDestinatario, setTipoDestinatario] = useState("EMPLEADO");
  const [receptoresBD, setReceptoresBD] = useState([]);
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
  const [tempObs, setTempObs] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);
  const [cargandoModelos, setCargandoModelos] = useState(false);

  // Carga de datos
  useEffect(() => {
    const cargarDatos = async () => {
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
          if (acta.items && acta.items.length > 0) {
            const itemsMapeados = acta.items.map((item) => ({
              ...item,
              tipo: item.tipo || "Equipo",
              marca: item.marca || "",
              modelo: item.modelo || "",
              serie: item.serie || "",
              numFicha: item.numFicha || "",
              numInv: item.numInv || "",
              _idTemporal: Math.random().toString(),
            }));
            setItems(itemsMapeados);
          }
        } catch (error) {
          console.error("Error trayendo acta:", error);
          Alert.alert("Error", "No se pudo cargar el detalle del acta");
        }
      }
    };
    cargarDatos();
  }, [id]);

  useEffect(() => {
    const cargarTodo = async () => {
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
    cargarTodo();
  }, []);

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

  // EMPLEADOS — filtrar por oficina
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

  //MARCAS — filtrar por tipo de equipo
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

  //MODELOS — filtrar por tipo de equipo y marca
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

  // Funciones auxiliares
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
      _idTemporal: Date.now().toString(),
    };
    setItems([...items, nuevoItem]);
    setTempTipo("");
    setTempMarca("");
    setTempModelo("");
    setTempSerie("");
    setTempFicha("");
    setTempInv("");
  };

  const mostrarAlerta = (titulo, mensaje = "", botones = []) => {
    if (Platform.OS === "web") {
      const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
      if (botones.length > 1) {
        const confirmado = window.confirm(texto);
        if (confirmado) {
          botones.find((b) => b.style !== "cancel")?.onPress?.();
        }
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

  const eliminarItem = (idTemp) => {
    setItems(items.filter((item) => item._idTemporal !== idTemp));
  };

  const cancelarActa = () => {
    if (Platform.OS === "web") {
      const confirmado = window.confirm(
        "¿Estás seguro?\n\nSi cancelas, perderás todos los datos ingresados.",
      );
      if (confirmado) router.replace("/generarDocs");
    } else {
      Alert.alert(
        "¿Estás seguro?",
        "Si cancelas, perderás todos los datos ingresados.",
        [
          { text: "No, continuar", style: "cancel" },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: () => router.replace("/generarDocs"),
          },
        ],
      );
    }
  };

  const generarActa = async () => {
    let asignadoA = "";
    if (tipoDestinatario === "EMPLEADO") {
      asignadoA = unidadSel || oficinaSel || "-";
    } else {
      asignadoA = receptorEmpresa || "-";
    }
    const payload = {
      tipo: tipoActa,
      idEmpleados:
        tipoDestinatario === "EMPLEADO" ? parseInt(empleadoSelId) : null,
      idReceptores:
        tipoDestinatario === "RECEPTOR" ? parseInt(receptorSelId) : null,
      asunto: tempDesc,
      descripcion: tempDescripcion,
      observacion: tempObs,
      items: items.map((item) => ({
        idEquipo: null,
        tipo: item.tipo,
        marca: item.marca,
        modelo: item.modelo,
        serie: item.serie,
        numFicha: item.numFicha,
        numInv: item.numInv,
        asignado_a: asignadoA,
      })),
    };
    try {
      const response = await api.post("/actas/procesadas", payload);
      const actaGuardada = response.data;
      const correlativoNuevo = actaGuardada.correlativo || "";
      setCorrelativo(correlativoNuevo);
      const historialKey = "historialActas";
      const historialExistente = await AsyncStorage.getItem(historialKey);
      const historialArray = historialExistente
        ? JSON.parse(historialExistente)
        : [];
      historialArray.push({
        ...actaGuardada,
        fechaGuardado: new Date().toISOString(),
      });
      await AsyncStorage.setItem(historialKey, JSON.stringify(historialArray));
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

  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención:", "Guarda el acta para generar el PDF");
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
      const fechaActual = new Date().toLocaleDateString("es-HN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const [{ conadeh: uriConadeh, info: uriInfo }, cPlantilla] =
        await Promise.all([getLogoURIs(), obtenerPlantillaActiva("ENTREGA")]);
      const nombreDestinatarioFinal =
        tipoDestinatario === "EMPLEADO" ? empleadoSelNombre : receptorSelNombre;
      const cargoDestinatario =
        tipoDestinatario === "EMPLEADO" ? cargoSel : receptorCargo;
      const orgDestinatario =
        tipoDestinatario === "EMPLEADO"
          ? unidadSel
            ? `${cargoSel} - ${unidadSel}`
            : `${cargoSel} - ${oficinaSel}`
          : `${receptorCargo} - ${receptorEmpresa}`;
      const colLabels = {
        marca: cPlantilla.labelMarca,
        modelo: cPlantilla.labelModelo,
        serie: cPlantilla.labelSerie,
        asignado: cPlantilla.labelAsignado,
      };
      const theadHTML = cPlantilla.columnasTabla
        .map((col) => `<th>${colLabels[col] || col}</th>`)
        .join("");
      const asignadoA =
        tipoDestinatario === "EMPLEADO"
          ? unidadSel || oficinaSel || "-"
          : receptorEmpresa || "-";
      const filasTabla = items
        .map((item) => {
          const celdas = cPlantilla.columnasTabla
            .map((col) => {
              if (col === "marca") return `<td>${item.marca || "N/A"}</td>`;
              if (col === "modelo") return `<td>${item.modelo || "N/A"}</td>`;
              if (col === "serie")
                return `
      <td>S/N: ${item.serie || "N/A"}<br/>
        <span style="font-size:10px;color:#555;">
          ${cPlantilla.mostrarNumFicha ? "Ficha: " + (item.numFicha || "N/A") : ""}
          ${cPlantilla.mostrarNumFicha && cPlantilla.mostrarNumInv ? " | " : ""}
          ${cPlantilla.mostrarNumInv ? "Inv: " + (item.numInv || "N/A") : ""}
        </span>
      </td>`;
              if (col === "asignado") return `<td>${asignadoA}</td>`;
              return "<td>-</td>";
            })
            .join("");
          return `<tr>${celdas}</tr>`;
        })
        .join("");
      const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Acta de Entrega</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      body { font-family: Arial, sans-serif; color: #000; font-size: 11px; line-height: 1.5; padding: 20mm 18mm; }
      .divider { border: none; border-top: 2px solid ${cPlantilla.colorLinea}; margin: 14px 0; }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid ${cPlantilla.colorLinea};
        padding-bottom: 8px;
        margin-bottom: 18px;
      }
      .logo-conadeh { height: 65px; object-fit: contain; }
      .logo-info    { height: 60px; object-fit: contain; }
      .title-container { text-align: center; flex: 1; padding: 0 12px; }
      .title {
        font-weight: bold; font-size: 12px; margin: 0 0 2px 0;
        text-transform: uppercase; letter-spacing: 0.3px;
      }
      .subtitle { font-size: 10px; margin: 0; color: #222; }
      .acta-num {
        font-weight: bold; font-size: 13px; text-decoration: underline;
        margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;
      }
      .info-table { width: 100%; margin-bottom: 18px; border-collapse: collapse; }
      .info-table td { padding: 2px 4px; vertical-align: top; font-size: 11px; }
      .info-label {
        font-weight: bold; width: 65px; white-space: nowrap; padding-right: 8px;
      }
      .info-value {
        padding-left: 4px; word-break: break-word; overflow-wrap: break-word;
      }
      .info-name { font-weight: bold; display: block; }
      .info-role { display: block; font-size: 10.5px; color: #222; }
      .paragraph {
        font-size: 11px; text-align: justify; margin: 0 0 16px 0;
        line-height: 1.6; word-break: break-word; overflow-wrap: break-word;
      }
      .equipo-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      .equipo-table th {
        background-color: #f0f0f0; font-weight: bold; border: 1px solid #555;
        padding: 5px 6px; text-align: center; font-size: 10px; text-transform: uppercase;
      }
      .equipo-table td {
        border: 1px solid #555; padding: 5px 6px;
        text-align: center; font-size: 10px;
      }
      .observacion { font-size: 11px; margin: 8px 0 20px 0; }
      .firmas-table { width: 100%; margin-top: 65px; border-collapse: collapse; }
      .firma-cell {
        width: 42%; text-align: center; border-top: 1px solid #000;
        padding-top: 6px; font-size: 11px;
      }
      .firma-spacer { width: 16%; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${uriConadeh}" class="logo-conadeh" alt="CONADEH"/>
      <div class="title-container">
        <p class="title">Comisionado Nacional de los Derechos Humanos</p>
        <p class="subtitle">(CONADEH)</p>
        <p class="subtitle">Honduras, C.A.</p>
        <p class="acta-num">Acta de Entrega N° ${correlativoFinal}</p>
      </div>
      <img src="${uriInfo}" class="logo-info" alt="Infotecnología"/>
    </div>
    <table class="info-table">
      <tr>
        <td class="info-label">Para:</td>
        <td class="info-value">
          <span class="info-name">${nombreDestinatarioFinal}</span>
          <span class="info-role">${orgDestinatario}</span>
        </td>
      </tr>
      <tr>
        <td class="info-label">De:</td>
        <td class="info-value">
          <span class="info-name">${usuarioLogueado || "Infotecnología"}</span>
          <span class="info-role">${cargoLogueado || "Soporte Técnico"}</span>
        </td>
      </tr>
      <tr>
        <td class="info-label">Asunto:</td>
        <td class="info-value">${tempDesc || "Entrega de Equipo Tecnológico"}</td>
      </tr>
      <tr>
        <td class="info-label">Fecha:</td>
        <td class="info-value">Tegucigalpa M.D.C., ${fechaActual}</td>
      </tr>
      ${cPlantilla.mostrarDescripcion && tempDescripcion ? `<tr><td class="info-label">Descripción:</td><td class="info-value">${tempDescripcion}</td></tr>` : ""}
    </table>
    <hr class="divider" />
    ${cPlantilla.mostrarParrafoIntro && cPlantilla.textoIntro ? `<p class="paragraph">${cPlantilla.textoIntro}</p>` : ""}
    <table class="equipo-table">
      <thead><tr>${theadHTML}<tr></thead>
      <tbody>${filasTabla}</tbody>
    </table>
    ${cPlantilla.mostrarObservacion && tempObs ? `<p class="observacion"><strong>Pd.</strong> ${tempObs}</p>` : ""}
    <table class="firmas-table">
      <tr>
        <td class="firma-cell">
          <strong>${nombreDestinatarioFinal}</strong><br/>
          ${cargoDestinatario || "___________________"}
        </td>
        <td class="firma-spacer"></td>
        <td class="firma-cell">
          <strong>${usuarioLogueado || "_____________________"}</strong><br/>
          ${cargoLogueado || "Soporte Técnico"}
        </td>
      </tr>
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
      console.error("Error al generar PDF:", err.message);
      mostrarAlerta("Error", "No se pudo generar el documento: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Estilos estáticos (solo layout, colores van por tema) ──────────
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
          backgroundColor: "#3ac40d",
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

  // Renderizado usando componentes temáticos
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.mainTitle}>
          {isReadOnly ? "DETALLE DE ACTA" : "NUEVA ACTA DE ENTREGA"}
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
                        onValueChange={setCargoSel}
                        enabled={cargosList.length > 0}
                        colors={c}
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
                {/* TIPO */}
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

                {/* MARCA — deshabilitada hasta elegir tipo */}
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

                {/* MODELO — deshabilitado hasta elegir marca */}
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
