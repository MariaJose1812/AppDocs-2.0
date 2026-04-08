import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { Image } from "react-native";

import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

import {
  guardarLogoPersonalizado,
  obtenerLogo,
  eliminarLogoPersonalizado,
} from "../services/logosStorage";
import { invalidarCache, getConfigDefault } from "../services/plantillasCache";
import { generarHTMLRecepcion } from "../utils/actaRecepcionHTML";
import api from "../services/api";
import Header from "../components/header";
import Navbar from "../components/navBar";

const COLORES_PRESET = [
  "#1eb9de",
  "#09528e",
  "#3ac40d",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#ffffff",
];

/* ── Columnas por tipo de acta ── */
const COLUMNAS_ENTREGA_RETIRO = [
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "serie", label: "S/N - Inventario" },
  { key: "asignado", label: "Asignado a" },
];

const COLUMNAS_RECEPCION = [
  { key: "descr_prod", label: "Descripción" },
  { key: "precio_prod", label: "Precio" },
  { key: "num_recibo", label: "# Recibo" },
  { key: "num_fact", label: "# Factura" },
  { key: "fecha", label: "Fecha" },
];

const TIPOS_SIN_TABLA = ["MEMORANDUM", "OFICIO", "REPORTE", "PASE_SALIDA"];
const TIPOS_SIN_CAMPOS_CLASICOS = ["RECEPCION", "REPORTE", "PASE_SALIDA"];

export default function EditarPlantillaScreen() {
  const router = useRouter();
  const { id, tipoActa: tipoActaParam } = useLocalSearchParams();
  const [tipoDoc, setTipoDoc] = useState(tipoActaParam || "ENTREGA");
  const esNueva = !id;
  const esRecepcion = tipoDoc === "RECEPCION";
  const sinTabla = TIPOS_SIN_TABLA.includes(tipoDoc);

  const columnasDisponibles = esRecepcion
    ? COLUMNAS_RECEPCION
    : COLUMNAS_ENTREGA_RETIRO;

  const [nombre, setNombre] = useState("Nueva Plantilla");
  const [config, setConfig] = useState(getConfigDefault());
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!esNueva);

  const [logoConadeh, setLogoConadeh] = useState(null);
  const [logoInfo, setLogoInfo] = useState(null);

  // --- VARIABLES DINÁMICAS DE TEMA ---
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = Colors?.[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors?.[theme]?.text || (isDark ? "#ffffff" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const highlightCol = isDark ? "#60a5fa" : "#09528e";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";
  const previewBg = isDark ? "#020617" : "#e2e8f0";

  useEffect(() => {
    if (esNueva) {
      setConfig((prev) => ({
        ...prev,
        columnasTabla: esRecepcion
          ? ["descr_prod", "precio_prod", "num_recibo", "num_fact", "fecha"]
          : ["marca", "modelo", "serie", "asignado"],
      }));
    }
  }, [esNueva, esRecepcion]);

  useEffect(() => {
    if (!esNueva) cargarPlantilla();
  }, [id]);

  useEffect(() => {
    const cargarLogos = async () => {
      const c = await obtenerLogo("conadeh", null);
      const i = await obtenerLogo("info", null);
      setLogoConadeh(c);
      setLogoInfo(i);
    };
    cargarLogos();
  }, []);

  const cargarPlantilla = async () => {
    try {
      const res = await api.get(`/plantillas/${tipoActaParam || tipoDoc}`);
      const plantilla = res.data.find(
        (p) => String(p.idPlantilla) === String(id),
      );
      if (plantilla) {
        setNombre(plantilla.nombrePlantilla);
        setTipoDoc(plantilla.tipoActa);
        setConfig(
          typeof plantilla.config === "string"
            ? JSON.parse(plantilla.config)
            : plantilla.config,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarLogo = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Platform.OS === "web"
        ? window.alert("Se necesita permiso para acceder a las imágenes.")
        : Alert.alert("Permiso requerido", "Se necesita acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const ext = result.assets[0].uri.split(".").pop().toLowerCase();
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const base64Final = `data:${mime};base64,${result.assets[0].base64}`;
      await guardarLogoPersonalizado(tipo, base64Final);
      tipo === "conadeh"
        ? setLogoConadeh(base64Final)
        : setLogoInfo(base64Final);
    }
  };

  const eliminarLogo = async (tipo) => {
    await eliminarLogoPersonalizado(tipo);
    tipo === "conadeh" ? setLogoConadeh(null) : setLogoInfo(null);
  };

  const set = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const toggleColumna = (col) => {
    const cols = config.columnasTabla.includes(col)
      ? config.columnasTabla.filter((c) => c !== col)
      : [...config.columnasTabla, col];
    set("columnasTabla", cols);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      Platform.OS === "web"
        ? window.alert("El nombre es obligatorio.")
        : Alert.alert("Error", "El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (esNueva) {
        await api.post("/plantillas", {
          nombrePlantilla: nombre,
          tipoActa: tipoDoc || "ENTREGA",
          config,
        });
      } else {
        await api.put(`/plantillas/${id}`, { nombrePlantilla: nombre, config });
      }
      await invalidarCache(tipoDoc || "ENTREGA");
      Platform.OS === "web"
        ? window.alert("Plantilla guardada correctamente.")
        : Alert.alert("Éxito", "Plantilla guardada correctamente.");
      router.back();
    } catch (e) {
      Platform.OS === "web"
        ? window.alert("No se pudo guardar la plantilla.")
        : Alert.alert("Error", "No se pudo guardar la plantilla.");
    } finally {
      setGuardando(false);
    }
  };

  const generarPreview = () => {
    const c = config;

    if (tipoDoc === "MEMORANDUM") {
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Preview Memorándum</title>
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
    border-bottom: 2px solid ${c.colorLinea};
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .header-logo-left  { width: 120px; text-align: left; }
  .header-logo-right { width: 120px; text-align: right; }
  .header-center { text-align: center; }
  .header-inst { font-weight: bold; font-size: 13px; text-transform: uppercase; }
  .header-sub  { font-size: 11px; color: #333; margin-top: 3px; }
  .logo-box {
    width: 80px; height: 55px;
    background: #e2e8f0; border-radius: 6px;
    display: inline-flex; align-items: center;
    justify-content: center; font-size: 9px; color: #94a3b8;
  }
  .subheader { text-align: center; margin-bottom: 30px; }
  .subheader-unidad { font-weight: bold; font-size: 14px; text-transform: uppercase; }
  .subheader-memo   { font-size: 12px; color: #222; margin-top: 5px; }
  .meta-container { width: 75%; margin: 0 auto 25px auto; }
  .campos-table { width: 100%; border-collapse: collapse; }
  .campos-table td { padding: 6px; vertical-align: top; }
  .campo-label { font-weight: bold; width: 25%; }
  .campo-content { width: 75%; }
  .campo-nombre { font-weight: bold; display: block; }
  .campo-cargo  { font-size: 11px; color: #444; display: block; }
  .body-content { width: 90%; margin: 0 auto; text-align: justify; }
  .parrafo { margin-bottom: 15px; line-height: 1.6; }
  .saludo  { margin-top: 25px; }
  .firma-container { width: 100%; text-align: center; margin-top: 80px; }
  .firma-linea {
    width: 250px; border-top: 1px solid #000;
    margin: 0 auto 5px auto; padding-top: 5px;
  }
  .firma-nombre { font-weight: bold; font-size: 12px; display: block; }
  .firma-cargo  { font-size: 11px; color: #333; display: block; }
</style>
</head>
<body>
 
  <table class="header-table">
    <tr>
      <td class="header-logo-left">
        <div class="logo-box">CONADEH</div>
      </td>
      <td class="header-center">
        <div class="header-inst">Comisionado Nacional de los Derechos Humanos</div>
        <div class="header-sub">(CONADEH) — Honduras, C.A.</div>
      </td>
      <td class="header-logo-right">
        <div class="logo-box">InfoTec</div>
      </td>
    </tr>
  </table>
 
  <div class="subheader">
    <div class="subheader-unidad">Unidad de Infotecnología</div>
    <div class="subheader-memo">Memorándum &nbsp;IT-2026-001</div>
  </div>
 
  <div class="meta-container">
    <table class="campos-table">
      <tr>
        <td class="campo-label">PARA:</td>
        <td class="campo-content">
          <span class="campo-nombre">Sara Sandoval</span>
          <span class="campo-cargo">Jefe</span>
        </td>
      </tr>
      <tr>
        <td class="campo-label">DE:</td>
        <td class="campo-content">
          <span class="campo-nombre">Ing. Marco Aguilera</span>
          <span class="campo-cargo">Jefe de Infotecnología</span>
        </td>
      </tr>
      <tr>
        <td class="campo-label">ASUNTO:</td>
        <td class="campo-content" style="font-weight:bold;">
          Notificación de Mantenimiento a Servidores
        </td>
      </tr>
      <tr>
        <td class="campo-label">FECHA:</td>
        <td class="campo-content">3 de abril de 2026</td>
      </tr>
    </table>
  </div>
 
  <div class="body-content">
    <hr style="border:0; border-top: 1px solid #ccc; margin-bottom: 20px;" />
    <p class="parrafo">
      Por este medio se le informa que el día sábado 07 de marzo se realizará
      un mantenimiento preventivo a los servidores principales.
    </p>
    <p class="parrafo">
      Los sistemas internos y la intranet experimentarán interrupciones
      intermitentes entre las 08:00 AM y las 12:00 PM.
    </p>
    ${
      c.mostrarDespedida !== false
        ? `<p class="saludo">Saludos cordiales,</p>`
        : ""
    }
  </div>
 
  <div class="firma-container">
    <div class="firma-linea"></div>
    <span class="firma-nombre">Ing. Marco Aguilera</span>
    <span class="firma-cargo">Jefe de Infotecnología</span>
  </div>
 
</body>
</html>`;
    }

    //OFICIOS
    if (tipoDoc === "OFICIO") {
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Preview Oficio</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    color: #000;
    font-size: 12px;
    line-height: 1.6;
    padding: 25mm 20mm;
  }
 
  /* ── ENCABEZADO ── */
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .logo-box {
    width: 80px; height: 55px;
    background: #e2e8f0; border-radius: 6px;
    display: inline-flex; align-items: center;
    justify-content: center; font-size: 9px; color: #94a3b8;
  }
  .header-center { text-align: center; flex: 1; padding: 0 15px; }
  .header-inst {
    font-weight: bold; font-size: 13px;
    text-transform: uppercase; margin: 0;
  }
  .header-sub { font-size: 11px; margin: 5px 0 0 0; }
 
  /* ── BARRA ── */
  .barra {
    text-align: center;
    padding: 7px 0;
    border-top: 2px solid ${c.colorLinea};
    border-bottom: 2px solid ${c.colorLinea};
    margin-bottom: 35px;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
  }
 
  /* ── TÍTULO ── */
  .titulo-oficio {
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    text-decoration: underline;
    text-transform: uppercase;
    margin-bottom: 30px;
    letter-spacing: 0.5px;
  }
 
  /* ── DESTINATARIO ── */
  .destinatario { margin-bottom: 20px; }
  .destinatario span { display: block; }
  .dest-nombre { font-weight: bold; }
 
  /* ── ASUNTO ── */
  .asunto { margin-bottom: 20px; }
 
  /* ── PÁRRAFOS ── */
  .parrafo {
    margin-bottom: 14px;
    text-align: justify;
    line-height: 1.8;
  }
 
  /* ── FIRMA ── */
  .firma-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 80px;
  }
  .firma-box { width: 300px; text-align: center; }
  .firma-line {
    border-top: 1px solid #000;
    margin-bottom: 5px;
  }
</style>
</head>
<body>
 
  <!-- ENCABEZADO -->
  <div class="header-row">
    <div class="logo-box">CONADEH</div>
    <div class="header-center">
      <p class="header-inst">Comisionado Nacional de los Derechos Humanos</p>
      <p class="header-sub">(CONADEH) — Honduras, C.A.</p>
    </div>
    <div class="logo-box">InfoTec</div>
  </div>
 
  <!-- BARRA -->
  <div class="barra">Unidad de Infotecnología</div>
 
  <!-- TÍTULO -->
  <div class="titulo-oficio">OFICIO IT-2026-001</div>
 
  <!-- DESTINATARIO -->
  <div class="destinatario">
    <span>Licenciado(a)</span>
    <span class="dest-nombre">Ana González</span>
    <span>Jefa de Recursos Humanos</span>
    <span style="margin-top:10px;">Licenciado(a) González:</span>
  </div>
 
  <!-- ASUNTO -->
  <div class="asunto">
    <strong>Asunto:</strong> Solicitud de información sobre personal activo
  </div>
 
  <!-- PÁRRAFOS EJEMPLO -->
  <p class="parrafo">
    Por este medio me permito dirigirme a usted con el fin de solicitar
    respetuosamente la lista actualizada del personal activo asignado a la
    unidad de sistemas, con el propósito de actualizar los registros de
    acceso a los equipos tecnológicos institucionales.
  </p>
  <p class="parrafo">
    Se agradece la atención prestada a la presente y quedo a su disposición
    para cualquier información adicional que requiera.
  </p>
 
  ${
    c.mostrarDespedida !== false
      ? `<p class="parrafo">Saludos cordiales,</p>`
      : ""
  }
 
  <!-- FIRMA -->
  <div class="firma-wrapper">
    <div class="firma-box">
      <div class="firma-line"></div>
      <strong>Ing. Marco Aguilera</strong><br/>
      Jefe de Infotecnología
    </div>
  </div>
 
</body>
</html>`;
    }

    // ── RECEPCIÓN ──
    if (esRecepcion) {
      return generarHTMLRecepcion({
        data: {
          emisorNombre: "María José",
          emisorCargo: "Desarrolladora",
          proveedorNombre: "Nombre del Proveedor (Empresa S.A.)",
          descripcion: "los siguientes productos",
          items: [
            {
              descr_prod: "Licencia de Software",
              precio_prod: "2500.00",
              equivalente_lps: "63750.00",
              num_recibo: "10293",
              num_fact: "000-001-01",
              fech_ARCDet: "22/03/2026",
            },
          ],
          tituloActa: "ACTA DE RECEPCIÓN N° IT-2026-001",
          correlativoFinal: "IT-2026-001",
        },
        config: c,
        logos: { uriConadeh: logoConadeh, uriInfo: logoInfo },
      });
    }

    // ── RESTO DE TIPOS (ENTREGA, RETIRO, OFICIO, etc.) ──
    const colLabels = {
      marca: c.labelMarca || "Marca",
      modelo: c.labelModelo || "Modelo",
      serie: c.labelSerie || "S/N - Inventario",
      asignado: c.labelAsignado || "Asignado a",
    };
    const colData = {
      marca: "DELL",
      modelo: "Optiplex 7020",
      serie: `S/N: ABC123<br/><span style="font-size:9px;color:#555;">Ficha: 001 | Inv: 002</span>`,
      asignado: "Recursos Humanos",
    };
    const sinCamposClasicos = TIPOS_SIN_CAMPOS_CLASICOS.includes(tipoDoc);
    const theadHTML = (c.columnasTabla || [])
      .map((col) => `<th>${colLabels[col] || col}</th>`)
      .join("");
    const tbodyHTML = (c.columnasTabla || [])
      .map((col) => `<td>${colData[col] || "-"}</td>`)
      .join("");

    const infoCamposHTML = !sinCamposClasicos
      ? `<tr>
         <td class="info-label">Para:</td>
         <td><span class="info-name">Juan Pérez</span><span class="info-role">Secretario - RRHH</span></td>
       </tr>
       <tr>
         <td class="info-label">De:</td>
         <td><span class="info-name">María José</span><span class="info-role">Desarrolladora</span></td>
       </tr>
       <tr>
         <td class="info-label">Asunto:</td>
         <td>${tipoDoc === "RETIRO" ? "Retiro" : "Entrega"} de equipo tecnológico</td>
       </tr>`
      : "";

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 16px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${c.colorLinea}; padding-bottom: 8px; margin-bottom: 14px; }
  .logo-box { width: 55px; height: 40px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; }
  .title-box { text-align: center; flex: 1; padding: 0 8px; }
  .title { font-weight: bold; font-size: 11px; text-transform: uppercase; }
  .subtitle { font-size: 9px; color: #444; }
  .acta-num { font-weight: bold; font-size: 12px; text-decoration: underline; margin-top: 4px; }
  .info-table { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
  .info-table td { padding: 2px 4px; font-size: 10px; vertical-align: top; }
  .info-label { font-weight: bold; width: 65px; white-space: nowrap; }
  .info-name  { font-weight: bold; display: block; }
  .info-role  { font-size: 9.5px; color: #444; }
  .divider { border: none; border-top: 2px solid ${c.colorLinea}; margin: 10px 0; }
  .paragraph { font-size: 10px; text-align: justify; margin-bottom: 10px; line-height: 1.5; }
  .eq-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .eq-table th { background: #f0f0f0; font-weight: bold; border: 1px solid #555; padding: 4px 5px; text-align: center; font-size: 9px; text-transform: uppercase; }
  .eq-table td { border: 1px solid #555; padding: 4px 5px; text-align: center; font-size: 9px; }
  .observacion { font-size: 10px; margin: 6px 0 14px 0; }
  .firmas { width: 100%; margin-top: 40px; border-collapse: collapse; }
  .firma-cell { width: 42%; text-align: center; border-top: 1px solid #000; padding-top: 5px; font-size: 10px; }
  .firma-spacer { width: 16%; }
  </style></head><body>
  <div class="header">
    <div class="logo-box">Logo</div>
    <div class="title-box">
      <div class="title">Comisionado Nacional de los Derechos Humanos</div>
      <div class="subtitle">(CONADEH) — Honduras, C.A.</div>
      <div class="acta-num">ACTA DE ${tipoDoc} N° IT-2026-001</div>
    </div>
    <div class="logo-box">Logo</div>
  </div>
  <table class="info-table">
    ${infoCamposHTML}
    ${c.mostrarDescripcion ? `<tr><td class="info-label">Descripción:</td><td>Descripción de ejemplo</td></tr>` : ""}
    <tr><td class="info-label">Fecha:</td><td>Tegucigalpa M.D.C., 22 de marzo de 2026</td></tr>
  </table>
  <hr class="divider"/>
  ${c.mostrarParrafoIntro && c.textoIntro ? `<p class="paragraph">${c.textoIntro}</p>` : ""}
  ${!sinTabla && theadHTML ? `<table class="eq-table"><thead><tr>${theadHTML}</tr></thead><tbody><tr>${tbodyHTML}</tr></tbody></table>` : ""}
  ${c.mostrarObservacion ? `<p class="observacion"><strong>Pd.</strong> Observación de ejemplo</p>` : ""}
  <table class="firmas"><tr>
    <td class="firma-cell"><strong>María José</strong><br/>Desarrolladora</td>
    <td class="firma-spacer"></td>
    <td class="firma-cell"><strong>Juan Pérez</strong><br/>Secretario</td>
  </tr></table>
  </body></html>`;
  };

  const etiquetasAEditar = esRecepcion
    ? [
        { key: "labelDesc", placeholder: "Descripción" },
        { key: "labelPrecio", placeholder: "Precio" },
        { key: "labelRecibo", placeholder: "# Recibo" },
        { key: "labelFactura", placeholder: "# Factura" },
        { key: "labelFecha", placeholder: "Fecha" },
      ]
    : [
        { key: "labelMarca", placeholder: "Marca" },
        { key: "labelModelo", placeholder: "Modelo" },
        { key: "labelSerie", placeholder: "S/N - Inventario" },
        { key: "labelAsignado", placeholder: "Asignado a" },
      ];

  if (cargando)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <Header />
        <Navbar />
        <ActivityIndicator
          size="large"
          color={highlightCol}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />
      <View style={styles.body}>
        {/* PANEL IZQUIERDO */}
        <ScrollView
          style={[styles.panel, { borderRightColor: borderCol }]}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <Text style={[styles.mainTitle, { color: textColor }]}>
            {esNueva ? "Nueva Plantilla" : "Editar Plantilla"}
          </Text>

          {esNueva ? (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: surfaceBg,
                  shadowColor: isDark ? "#000" : "#94a3b8",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Tipo de Acta a Crear
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                <Picker
                  selectedValue={tipoDoc}
                  onValueChange={(itemValue) => setTipoDoc(itemValue)}
                  style={[styles.picker, { color: textColor }]}
                  dropdownIconColor={subColor}
                >
                  <Picker.Item label="Entrega" value="ENTREGA" />
                  <Picker.Item label="Retiro" value="RETIRO" />
                  <Picker.Item label="Recepción" value="RECEPCION" />
                  <Picker.Item label="Memorándum" value="MEMORANDUM" />
                  <Picker.Item label="Oficio" value="OFICIO" />
                  <Picker.Item label="Reporte" value="REPORTE" />
                  <Picker.Item label="Pase de Salida" value="PASE_SALIDA" />
                </Picker>
              </View>
            </View>
          ) : (
            <Text
              style={[
                styles.tipoTag,
                {
                  backgroundColor: surfaceBg,
                  color: highlightCol,
                  borderColor: borderCol,
                  borderWidth: 1,
                },
              ]}
            >
              {tipoDoc}
            </Text>
          )}

          <View
            style={[
              styles.section,
              {
                backgroundColor: surfaceBg,
                shadowColor: isDark ? "#000" : "#94a3b8",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Nombre
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: borderCol,
                  color: textColor,
                },
              ]}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la plantilla..."
              placeholderTextColor={subColor}
            />
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: surfaceBg,
                shadowColor: isDark ? "#000" : "#94a3b8",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Color de líneas
            </Text>
            <View style={styles.colorRow}>
              {COLORES_PRESET.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    config.colorLinea === color && {
                      borderColor: highlightCol,
                      transform: [{ scale: 1.1 }],
                    },
                  ]}
                  onPress={() => set("colorLinea", color)}
                />
              ))}
              {Platform.OS === "web" && (
                <View style={styles.colorPickerWrapper}>
                  <input
                    type="color"
                    value={config.colorLinea}
                    onChange={(e) => set("colorLinea", e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: `2px solid ${borderCol}`,
                    }}
                  />
                </View>
              )}
            </View>
            <View style={styles.colorInputRow}>
              <View
                style={[
                  styles.colorMuestra,
                  {
                    backgroundColor: config.colorLinea,
                    borderColor: borderCol,
                  },
                ]}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: inputBg,
                    borderColor: borderCol,
                    color: textColor,
                  },
                ]}
                value={config.colorLinea}
                onChangeText={(v) => set("colorLinea", v)}
                placeholder="#1eb9de"
                placeholderTextColor={subColor}
                maxLength={7}
              />
            </View>
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: surfaceBg,
                shadowColor: isDark ? "#000" : "#94a3b8",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Campos visibles
            </Text>
            {[
              {
                key: "mostrarDescripcion",
                label: "Descripción",
                hide: TIPOS_SIN_CAMPOS_CLASICOS.includes(tipoDoc),
              },
              {
                key: "mostrarObservacion",
                label: "Observación (Pd.)",
                hide: TIPOS_SIN_TABLA.includes(tipoDoc),
              },
              {
                key: "mostrarNumFicha",
                label: "Número de Ficha",
                hide: sinTabla,
              },
              {
                key: "mostrarNumInv",
                label: "Número de Inventario",
                hide: sinTabla,
              },
              {
                key: "mostrarParrafoIntro",
                label: "Párrafo introductorio",
                hide: false,
              },
              {
                key: "mostrarDespedida",
                label: "Despedida (Saludos)",
                hide: !["MEMORANDUM", "OFICIO"].includes(tipoDoc),
              },
            ]
              .filter((i) => !i.hide)
              .map(({ key, label }) => (
                <View
                  key={key}
                  style={[styles.switchRow, { borderBottomColor: borderCol }]}
                >
                  <Text style={[styles.switchLabel, { color: subColor }]}>
                    {label}
                  </Text>
                  <Switch
                    value={!!config[key]}
                    onValueChange={(v) => set(key, v)}
                    trackColor={{ true: highlightCol, false: borderCol }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
          </View>

          {config.mostrarParrafoIntro && (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: surfaceBg,
                  shadowColor: isDark ? "#000" : "#94a3b8",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Texto introductorio
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 80,
                    textAlignVertical: "top",
                    backgroundColor: inputBg,
                    borderColor: borderCol,
                    color: textColor,
                  },
                ]}
                multiline
                value={config.textoIntro}
                onChangeText={(v) => set("textoIntro", v)}
                placeholder="Por este medio se hace entrega..."
                placeholderTextColor={subColor}
              />
            </View>
          )}

          {!sinTabla && (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: surfaceBg,
                  shadowColor: isDark ? "#000" : "#94a3b8",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Columnas de la tabla
              </Text>
              {columnasDisponibles.map(({ key, label }) => (
                <View
                  key={key}
                  style={[styles.switchRow, { borderBottomColor: borderCol }]}
                >
                  <Text style={[styles.switchLabel, { color: subColor }]}>
                    {label}
                  </Text>
                  <Switch
                    value={config.columnasTabla.includes(key)}
                    onValueChange={() => toggleColumna(key)}
                    trackColor={{ true: highlightCol, false: borderCol }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          )}

          {!sinTabla && (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: surfaceBg,
                  shadowColor: isDark ? "#000" : "#94a3b8",
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Etiquetas de columnas
              </Text>
              {etiquetasAEditar.map(({ key, placeholder }) => (
                <TextInput
                  key={key}
                  style={[
                    styles.input,
                    {
                      marginBottom: 8,
                      backgroundColor: inputBg,
                      borderColor: borderCol,
                      color: textColor,
                    },
                  ]}
                  value={config[key] || ""}
                  onChangeText={(v) => set(key, v)}
                  placeholder={placeholder}
                  placeholderTextColor={subColor}
                />
              ))}
            </View>
          )}

          <View
            style={[
              styles.section,
              {
                backgroundColor: surfaceBg,
                shadowColor: isDark ? "#000" : "#94a3b8",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Logos del documento
            </Text>
            <Text style={[styles.logoInfoText, { color: subColor }]}>
              Si no cambias un logo, se usará el configurado por defecto.
            </Text>

            <View style={styles.logoRow}>
              <View
                style={[
                  styles.logoPreview,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                {logoConadeh ? (
                  <Image
                    source={{ uri: logoConadeh }}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.logoPlaceholder, { color: subColor }]}>
                    Logo CONADEH{"\n"}(actual)
                  </Text>
                )}
              </View>
              <View style={styles.logoBtns}>
                <TouchableOpacity
                  style={[
                    styles.logoBtn,
                    { backgroundColor: surfaceBg, borderColor: borderCol },
                  ]}
                  onPress={() => seleccionarLogo("conadeh")}
                >
                  <Text style={[styles.logoBtnText, { color: highlightCol }]}>
                    Cambiar
                  </Text>
                </TouchableOpacity>
                {logoConadeh && (
                  <TouchableOpacity
                    style={[
                      styles.logoBtnReset,
                      {
                        backgroundColor: isDark ? "#451a1a" : "#fef2f2",
                        borderColor: isDark ? "#7f1d1d" : "#fca5a5",
                      },
                    ]}
                    onPress={() => eliminarLogo("conadeh")}
                  >
                    <Text
                      style={[
                        styles.logoBtnResetText,
                        { color: isDark ? "#f87171" : "#dc2626" },
                      ]}
                    >
                      Restaurar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.logoRow, { marginTop: 14 }]}>
              <View
                style={[
                  styles.logoPreview,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                {logoInfo ? (
                  <Image
                    source={{ uri: logoInfo }}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.logoPlaceholder, { color: subColor }]}>
                    Logo InfoTec{"\n"}(actual)
                  </Text>
                )}
              </View>
              <View style={styles.logoBtns}>
                <TouchableOpacity
                  style={[
                    styles.logoBtn,
                    { backgroundColor: surfaceBg, borderColor: borderCol },
                  ]}
                  onPress={() => seleccionarLogo("info")}
                >
                  <Text style={[styles.logoBtnText, { color: highlightCol }]}>
                    Cambiar
                  </Text>
                </TouchableOpacity>
                {logoInfo && (
                  <TouchableOpacity
                    style={[
                      styles.logoBtnReset,
                      {
                        backgroundColor: isDark ? "#451a1a" : "#fef2f2",
                        borderColor: isDark ? "#7f1d1d" : "#fca5a5",
                      },
                    ]}
                    onPress={() => eliminarLogo("info")}
                  >
                    <Text
                      style={[
                        styles.logoBtnResetText,
                        { color: isDark ? "#f87171" : "#dc2626" },
                      ]}
                    >
                      Restaurar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: highlightCol },
              guardando && { opacity: 0.7 },
            ]}
            onPress={guardar}
            disabled={guardando}
          >
            <Text style={styles.saveBtnText}>
              {guardando ? "Guardando..." : "Guardar Plantilla"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              { backgroundColor: surfaceBg, borderColor: borderCol },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelBtnText, { color: subColor }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* PANEL DERECHO (Preview) */}
        {Platform.OS === "web" && (
          <View style={[styles.previewPanel, { backgroundColor: previewBg }]}>
            <Text style={[styles.previewTitle, { color: textColor }]}>
              Vista previa en tiempo real
            </Text>
            <View style={styles.previewDoc}>
              <iframe
                key={
                  JSON.stringify(config) +
                  (logoConadeh || "") +
                  (logoInfo || "")
                }
                srcDoc={generarPreview()}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="preview"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Estilos limpios sin colores fijos
const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  panel: { width: 400, borderRightWidth: 1 },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  tipoTag: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 18,
  },
  section: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerWrapper: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  picker: { backgroundColor: "transparent", padding: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorPickerWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  colorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  colorMuestra: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  switchLabel: { fontSize: 14 },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700" },
  previewPanel: { flex: 1, padding: 20 },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  previewDoc: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  logoInfoText: { fontSize: 12, marginBottom: 14 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  logoPreview: {
    width: 90,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoPlaceholder: { fontSize: 10, textAlign: "center" },
  logoBtns: { gap: 8 },
  logoBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoBtnText: { fontSize: 13, fontWeight: "600" },
  logoBtnReset: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoBtnResetText: { fontSize: 13, fontWeight: "600" },
});
