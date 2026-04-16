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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { Image } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";
import { useAlert } from "../context/alertContext";
import {
  guardarLogoPersonalizado,
  obtenerLogo,
  eliminarLogoPersonalizado,
} from "../services/logosStorage";
import { invalidarCache, getConfigDefault } from "../services/plantillasCache";
import {
  generarHTMLEntrega,
  generarHTMLRecepcion,
} from "../utils/documentosHTML";
import api from "../services/api";
import Footer from "../components/footer";
import Header from "../components/header";
import Navbar from "../components/navBar";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPOS_SIN_TABLA = ["MEMORANDUM", "OFICIO", "REPORTE", "PASE_SALIDA"];
const TIPOS_SIN_CAMPOS_CLASICOS = ["RECEPCION", "REPORTE", "PASE_SALIDA"];

const COLORES_PRESET = [
  "#1eb9de",
  "#09528e",
  "#3ac40d",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#f59e0b",
];

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

const ThemedInput = ({
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
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

const ThemedPicker = ({
  selectedValue,
  onValueChange,
  enabled,
  children,
  colors,
}) => (
  <View
    style={{
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      overflow: "hidden",
    }}
  >
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      enabled={enabled !== false}
      style={{
        height: 48,
        color: colors.text,
        backgroundColor: colors.inputBg,
      }}
      dropdownIconColor={colors.textMuted}
    >
      {children}
    </Picker>
  </View>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function EditarPlantillaScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { id, tipoActa: tipoActaParam } = useLocalSearchParams();
  const esNueva = !id;

  const [tipoDoc, setTipoDoc] = useState(tipoActaParam || "ENTREGA");
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

  // ── Tema ───────────────────────────────────────────────────────────────────
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = Colors?.[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors?.[theme]?.text || (isDark ? "#f1f5f9" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const accentCol = isDark ? "#60a5fa" : "#09528e";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";
  const dangerCol = isDark ? "#f87171" : "#dc2626";
  const successCol = isDark ? "#4ade80" : "#16a34a";
  const previewBg = isDark ? "#020617" : "#e2e8f0";

  const tc = {
    inputBg,
    text: textColor,
    textMuted: subColor,
    inputBorder: borderCol,
    border2: borderCol,
    pickerBg: inputBg,
    pickerColor: textColor,
    danger: dangerCol,
    accent: accentCol,
    surface: surfaceBg,
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (esNueva) {
      setConfig((prev) => ({
        ...prev,
        columnasTabla: esRecepcion
          ? ["descr_prod", "precio_prod", "num_recibo", "num_fact", "fecha"]
          : ["marca", "modelo", "serie", "asignado"],
        camposExtra: [],
        tablasExtra: [],
      }));
    }
  }, [esNueva, esRecepcion]);

  useEffect(() => {
    if (!esNueva) cargarPlantilla();
  }, [id]);

  useEffect(() => {
    (async () => {
      setLogoConadeh(await obtenerLogo("conadeh", null));
      setLogoInfo(await obtenerLogo("info", null));
    })();
  }, []);

  // ── Carga ──────────────────────────────────────────────────────────────────
  const cargarPlantilla = async () => {
    try {
      const res = await api.get(`/plantillas/${tipoActaParam || tipoDoc}`);
      const p = res.data.find((p) => String(p.idPlantilla) === String(id));
      if (p) {
        setNombre(p.nombrePlantilla);
        setTipoDoc(p.tipoActa);
        const cfg =
          typeof p.config === "string" ? JSON.parse(p.config) : p.config;
        // Asegurar que camposExtra y tablasExtra existan
        setConfig({
          ...cfg,
          camposExtra: cfg.camposExtra || [],
          tablasExtra: cfg.tablasExtra || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  // ── Logos ──────────────────────────────────────────────────────────────────
  const seleccionarLogo = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const ext = result.assets[0].uri.split(".").pop().toLowerCase();
      const b64 = `data:${ext === "png" ? "image/png" : "image/jpeg"};base64,${result.assets[0].base64}`;
      await guardarLogoPersonalizado(tipo, b64);
      tipo === "conadeh" ? setLogoConadeh(b64) : setLogoInfo(b64);
    }
  };
  const eliminarLogo = async (tipo) => {
    await eliminarLogoPersonalizado(tipo);
    tipo === "conadeh" ? setLogoConadeh(null) : setLogoInfo(null);
  };

  // ── Config helpers ─────────────────────────────────────────────────────────
  const set = (k, v) => setConfig((p) => ({ ...p, [k]: v }));

  const toggleColumna = (col) => {
    const cols = (config.columnasTabla || []).includes(col)
      ? config.columnasTabla.filter((c) => c !== col)
      : [...(config.columnasTabla || []), col];
    set("columnasTabla", cols);
  };

  // ── Campos extra simples ───────────────────────────────────────────────────
  const agregarCampoExtra = () =>
    setConfig((prev) => ({
      ...prev,
      camposExtra: [
        ...(prev.camposExtra || []),
        {
          id: `campo_${Date.now()}`,
          label: "",
          tipo: "texto",
          obligatorio: false,
          placeholder: "",
        },
      ],
    }));

  const actualizarCampoExtra = (idx, key, value) =>
    setConfig((prev) => {
      const arr = [...(prev.camposExtra || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, camposExtra: arr };
    });

  const eliminarCampoExtra = (idx) =>
    setConfig((prev) => ({
      ...prev,
      camposExtra: prev.camposExtra.filter((_, i) => i !== idx),
    }));

  // ── Tablas extra ───────────────────────────────────────────────────────────
  const agregarTablaExtra = () =>
    setConfig((prev) => ({
      ...prev,
      tablasExtra: [
        ...(prev.tablasExtra || []),
        {
          id: `tabla_${Date.now()}`,
          titulo: "Nueva tabla",
          columnas: [
            { id: `col_${Date.now()}`, label: "Columna 1", tipo: "texto" },
          ],
        },
      ],
    }));

  const actualizarTabla = (tIdx, key, value) =>
    setConfig((prev) => {
      const arr = [...(prev.tablasExtra || [])];
      arr[tIdx] = { ...arr[tIdx], [key]: value };
      return { ...prev, tablasExtra: arr };
    });

  const eliminarTabla = (tIdx) =>
    setConfig((prev) => ({
      ...prev,
      tablasExtra: (prev.tablasExtra || []).filter((_, i) => i !== tIdx),
    }));

  const agregarColumnaTabla = (tIdx) =>
    setConfig((prev) => {
      const arr = [...(prev.tablasExtra || [])];
      arr[tIdx] = {
        ...arr[tIdx],
        columnas: [
          ...arr[tIdx].columnas,
          { id: `col_${Date.now()}`, label: "", tipo: "texto" },
        ],
      };
      return { ...prev, tablasExtra: arr };
    });

  const actualizarColumnaTabla = (tIdx, cIdx, key, value) =>
    setConfig((prev) => {
      const arr = [...(prev.tablasExtra || [])];
      const cols = [...arr[tIdx].columnas];
      cols[cIdx] = { ...cols[cIdx], [key]: value };
      arr[tIdx] = { ...arr[tIdx], columnas: cols };
      return { ...prev, tablasExtra: arr };
    });

  const eliminarColumnaTabla = (tIdx, cIdx) =>
    setConfig((prev) => {
      const arr = [...(prev.tablasExtra || [])];
      arr[tIdx] = {
        ...arr[tIdx],
        columnas: arr[tIdx].columnas.filter((_, i) => i !== cIdx),
      };
      return { ...prev, tablasExtra: arr };
    });

  // ── Guardar ────────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!nombre.trim()) {
      showAlert({ title: "Error", message: "El nombre es obligatorio." });
      return;
    }
    setGuardando(true);
    try {
      if (esNueva) {
        await api.post("/plantillas", {
          nombrePlantilla: nombre,
          tipoActa: tipoDoc,
          config,
        });
      } else {
        await api.put(`/plantillas/${id}`, { nombrePlantilla: nombre, config });
      }
      await invalidarCache(tipoDoc);
      showAlert({
        title: "Éxito",
        message: "Plantilla guardada correctamente.",
      });
      router.back();
    } catch {
      showAlert({
        title: "Error",
        message: "No se pudo guardar la plantilla.",
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Preview en vivo ────────────────────────────────────────────────────────
  const generarExtrasPreviewHTML = () => {
    const c = config;
    const colorLinea = c.colorLinea || "#09528e";

    // Campos simples extra
    const camposHTML = (c.camposExtra || [])
      .map(
        (campo) =>
          `<div style="margin-bottom:10px;">
        <label style="display:block;font-size:10px;font-weight:700;color:#555;margin-bottom:3px;">
          ${campo.label || "(sin etiqueta)"}${campo.obligatorio ? ' <span style="color:#e63946">*</span>' : ""}
        </label>
        <div style="border:1px dashed #bbb;border-radius:4px;padding:6px 8px;font-size:10px;color:#999;background:#fafafa;">
          [Campo de ${campo.tipo === "parrafo" ? "párrafo" : campo.tipo === "numero" ? "número" : "texto"}]
        </div>
      </div>`,
      )
      .join("");

    // Tablas extra
    const tablasHTML = (c.tablasExtra || [])
      .map((tabla) => {
        if (!tabla.columnas?.length) return "";
        const ths = tabla.columnas
          .map(
            (col) =>
              `<th style="border:1px solid #ddd;padding:5px 8px;background:#f0f0f0;font-size:9px;text-transform:uppercase;">${col.label || "Col"}</th>`,
          )
          .join("");
        const tds = tabla.columnas
          .map(
            () =>
              `<td style="border:1px solid #ddd;padding:5px 8px;font-size:9px;color:#ccc;">—</td>`,
          )
          .join("");
        return `
        <div style="margin:12px 0;">
          <p style="font-weight:700;font-size:10px;margin-bottom:5px;color:#333;">${tabla.titulo}</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>${ths}</tr></thead>
            <tbody>
              <tr>${tds}</tr>
              <tr style="background:#f9f9f9;">${tds}</tr>
            </tbody>
          </table>
        </div>`;
      })
      .join("");

    if (!camposHTML && !tablasHTML) return "";

    return `
      <div style="border-top:1px dashed ${colorLinea};margin-top:14px;padding-top:12px;">
        <p style="font-size:10px;font-weight:700;color:${colorLinea};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
          Campos adicionales de la plantilla
        </p>
        ${camposHTML}
        ${tablasHTML}
      </div>`;
  };

  const generarPreview = () => {
    const c = config;
    const colorLinea = c.colorLinea || "#09528e";
    const extras = generarExtrasPreviewHTML();

    const lb = `<div style="width:65px;height:45px;background:#e2e8f0;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;color:#94a3b8;">LOGO</div>`;
    const hdrBase = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${colorLinea};padding-bottom:8px;margin-bottom:12px;">
        ${lb}
        <div style="text-align:center;flex:1;padding:0 8px;">
          <strong style="font-size:10px;text-transform:uppercase;">Comisionado Nacional de los Derechos Humanos</strong><br/>
          <span style="font-size:8px;">(CONADEH)</span><br/>
          <strong style="font-size:11px;text-decoration:underline;color:${colorLinea};">ACTA DE ${tipoDoc} N° IT-2026-001</strong>
        </div>
        ${lb}
      </div>`;

    const baseStyles = `@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:14px;line-height:1.5}`;

    if (tipoDoc === "MEMORANDUM") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
        <table style="width:100%;border-collapse:collapse;border-bottom:2px solid ${colorLinea};padding-bottom:8px;margin-bottom:12px;">
          <tr><td style="width:80px;">${lb}</td>
          <td style="text-align:center;"><strong style="font-size:11px;text-transform:uppercase;">Comisionado Nacional de los Derechos Humanos</strong><br/><span style="font-size:9px;">(CONADEH)</span></td>
          <td style="width:80px;text-align:right;">${lb}</td></tr>
        </table>
        <div style="text-align:center;margin-bottom:16px;"><strong style="font-size:12px;text-transform:uppercase;">Unidad de Infotecnología</strong><br/><span>Memorándum IT-2026-001</span></div>
        <div style="width:80%;margin:0 auto 14px auto;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="font-weight:bold;width:20%;padding:3px;font-size:10px;">PARA:</td><td style="padding:3px;font-size:10px;"><strong>Sara Sandoval</strong><br/>Jefe</td></tr>
            <tr><td style="font-weight:bold;padding:3px;font-size:10px;">DE:</td><td style="padding:3px;font-size:10px;"><strong>Ing. Marco Aguilera</strong><br/>Jefe de Infotecnología</td></tr>
            <tr><td style="font-weight:bold;padding:3px;font-size:10px;">ASUNTO:</td><td style="font-weight:bold;padding:3px;font-size:10px;">Notificación de Mantenimiento</td></tr>
            <tr><td style="font-weight:bold;padding:3px;font-size:10px;">FECHA:</td><td style="padding:3px;font-size:10px;">3 de abril de 2026</td></tr>
          </table>
        </div>
        <hr style="border:none;border-top:1px solid #ccc;margin-bottom:12px;"/>
        <p style="margin-bottom:10px;text-align:justify;font-size:10px;">Por este medio se le informa del mantenimiento preventivo programado.</p>
        ${c.mostrarDespedida !== false ? `<p style="margin-top:14px;font-size:10px;">Saludos cordiales,</p>` : ""}
        ${extras}
        <div style="text-align:center;margin-top:40px;"><div style="width:220px;border-top:1px solid #000;margin:0 auto 4px;padding-top:4px;font-size:10px;"><strong>Ing. Marco Aguilera</strong><br/>Jefe de Infotecnología</div></div>
      </body></html>`;
    }

    if (tipoDoc === "OFICIO") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">${lb}<div style="text-align:center;flex:1;padding:0 10px;"><strong style="font-size:11px;text-transform:uppercase;">Comisionado Nacional de los Derechos Humanos</strong><br/><span style="font-size:9px;">(CONADEH)</span></div>${lb}</div>
        <div style="text-align:center;padding:5px 0;border-top:2px solid ${colorLinea};border-bottom:2px solid ${colorLinea};margin-bottom:20px;font-weight:bold;font-size:10px;text-transform:uppercase;">UNIDAD DE INFOTECNOLOGÍA</div>
        <div style="text-align:center;font-weight:bold;font-size:12px;text-decoration:underline;text-transform:uppercase;margin-bottom:18px;">OFICIO IT-2026-001</div>
        <div style="margin-bottom:12px;font-size:10px;"><span style="display:block;">Licenciado(a)</span><span style="display:block;font-weight:bold;">Ana González</span><span style="display:block;">Jefa de Recursos Humanos</span></div>
        <div style="margin-bottom:12px;font-size:10px;"><strong>Asunto:</strong> Solicitud de información</div>
        <p style="margin-bottom:10px;text-align:justify;font-size:10px;">Por este medio me permito dirigirme a usted con el fin de solicitar información pertinente.</p>
        ${c.mostrarDespedida !== false ? `<p style="margin-top:12px;font-size:10px;">Saludos cordiales,</p>` : ""}
        ${extras}
        <div style="text-align:center;margin-top:40px;"><div style="width:240px;border-top:1px solid #000;margin:0 auto 4px;padding-top:4px;font-size:10px;"><strong>Ing. Marco Aguilera</strong><br/>Jefe de Infotecnología</div></div>
      </body></html>`;
    }

    if (tipoDoc === "PASE_SALIDA") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
        <table style="width:100%;border-collapse:collapse;"><tr><td style="width:80px;">${lb}</td><td style="text-align:center;"><strong style="font-size:9px;text-transform:uppercase;">Comisionado Nacional de los Derechos Humanos (CONADEH)</strong><br/><span style="font-size:8px;">Honduras, C.A.</span></td><td style="width:80px;text-align:right;">${lb}</td></tr></table>
        <div style="border-top:2px solid ${colorLinea};margin:5px 0 3px;"></div>
        <div style="text-align:right;font-size:9px;color:#555;margin-bottom:14px;">N° IT-2026-001</div>
        <div style="text-align:center;font-weight:bold;font-size:12px;text-decoration:underline;margin-bottom:14px;">Pase de Salida Laptop</div>
        <p style="font-size:10px;text-align:justify;margin-bottom:14px;">Por este medio se hace entrega a <strong>Francisco Vives</strong> de la Empresa <strong>TechService</strong>, para que repare la laptop que a continuación se describe:</p>
        <table style="width:65%;border-collapse:collapse;margin:0 auto 20px auto;">
          <thead><tr><th style="border:1px solid #555;padding:4px 8px;font-size:9px;background:#f5f5f5;">Marca</th><th style="border:1px solid #555;padding:4px 8px;font-size:9px;background:#f5f5f5;">Modelo</th><th style="border:1px solid #555;padding:4px 8px;font-size:9px;background:#f5f5f5;">S/N</th></tr></thead>
          <tbody><tr><td style="border:1px solid #555;padding:4px 8px;font-size:9px;">Lenovo</td><td style="border:1px solid #555;padding:4px 8px;font-size:9px;">ThinkPad E15</td><td style="border:1px solid #555;padding:4px 8px;font-size:9px;">SN12345</td></tr></tbody>
        </table>
        ${extras}
        <table style="width:100%;margin-top:30px;border-collapse:collapse;">
          <tr><td style="width:45%;text-align:center;vertical-align:top;"><div style="border-top:1px solid #000;padding-top:4px;display:inline-block;width:180px;font-size:9px;"><strong>Francisco Vives</strong><br/>TechService</div></td>
          <td style="width:10%;"></td>
          <td style="width:45%;text-align:center;vertical-align:top;"><div style="border-top:1px solid #000;padding-top:4px;display:inline-block;width:180px;font-size:9px;"><strong>Marco Aguilera</strong><br/>Jefe Infotecnología</div></td></tr>
        </table>
      </body></html>`;
    }

    if (tipoDoc === "REPORTE") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles}.dt{width:100%;border-collapse:collapse;border:1px solid #888}.dt td{border:1px solid #888;padding:4px 7px;font-size:10px;vertical-align:top}</style></head><body>
        <table style="width:100%;border-collapse:collapse;"><tr><td style="width:80px;">${lb}</td><td style="text-align:center;"><div style="font-size:14px;font-weight:bold;font-style:italic;text-transform:uppercase;color:${colorLinea};line-height:1.3;">Reporte de<br/>Daño de Equipo</div></td><td style="width:80px;text-align:right;">${lb}</td></tr></table>
        <div style="border-top:3px solid ${colorLinea};margin:5px 0 7px;"></div>
        <table class="dt">
          <tr><td style="width:50%">REP-2026-0022</td><td>10/4/2026</td></tr>
          <tr><td colspan="2"><strong>Oficina o Departamento:</strong> Oficina Central</td></tr>
          <tr><td colspan="2" style="font-weight:bold;text-transform:uppercase;">Características del Equipo:</td></tr>
          <tr><td><strong>N/F:</strong> N/A</td><td><strong>INV:</strong> 7654323</td></tr>
          <tr><td><strong>Service Tag / Serie:</strong> 90007</td><td><strong>Tipo / Marca / Modelo:</strong> DELL Optiplex 2030</td></tr>
          <tr><td colspan="2" style="font-weight:bold;text-transform:uppercase;">Descripción del Reporte:</td></tr>
          <tr><td colspan="2">Descripción del daño reportado.</td></tr>
          <tr><td colspan="2" style="font-weight:bold;text-transform:uppercase;">Diagnóstico:</td></tr>
          <tr><td colspan="2" style="height:80px;vertical-align:top;">Diagnóstico técnico del equipo.</td></tr>
          <tr><td colspan="2" style="font-weight:bold;text-transform:uppercase;">Recomendaciones:</td></tr>
          <tr><td colspan="2">Recomendaciones sugeridas.</td></tr>
        </table>
        ${extras}
        <table style="width:100%;border-collapse:collapse;border:1px solid #888;border-top:none;"><tr><td style="border:1px solid #888;padding:5px 8px;width:50%;font-style:italic;font-size:10px;">Auxiliar Infotecnología.</td><td style="border:1px solid #888;padding:5px 8px;font-size:10px;">(Firma) María José</td></tr></table>
      </body></html>`;
    }

    if (esRecepcion) {
      return generarHTMLRecepcion({
        data: {
          emisorNombre: "María José",
          emisorCargo: "Desarrolladora",
          proveedorNombre: "Proveedor S.A.",
          descripcion: "los siguientes productos",
          items: [
            {
              descr_prod: "Licencia Software",
              precio_prod: "2500.00",
              equivalente_lps: "63750.00",
              num_recibo: "10293",
              num_fact: "000-001-01",
              fech_ARCDet: "22/03/2026",
            },
          ],
          tituloActa: "ACTA DE RECEPCIÓN",
          correlativoFinal: "IT-2026-001",
          valoresCamposExtra: {},
          filasTablas: {},
        },
        config: c,
        logos: { uriConadeh: logoConadeh, uriInfo: logoInfo },
      });
    }

    // ENTREGA / RETIRO
    const sinC = TIPOS_SIN_CAMPOS_CLASICOS.includes(tipoDoc);
    const cl = {
      marca: c.labelMarca || "Marca",
      modelo: c.labelModelo || "Modelo",
      serie: c.labelSerie || "S/N",
      asignado: c.labelAsignado || "Asignado a",
    };
    const cd = {
      marca: "DELL",
      modelo: "Optiplex 7020",
      serie: "S/N: ABC123",
      asignado: "RRHH",
    };

    const th = (c.columnasTabla || [])
      .map(
        (x) =>
          `<th style="border:1px solid #555;padding:4px 5px;background:#f0f0f0;font-size:9px;text-transform:uppercase;">${cl[x] || x}</th>`,
      )
      .join("");
    const td = (c.columnasTabla || [])
      .map(
        (x) =>
          `<td style="border:1px solid #555;padding:4px 5px;text-align:center;font-size:9px;">${cd[x] || "-"}</td>`,
      )
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
      ${hdrBase}
      ${
        !sinC
          ? `<table style="width:100%;margin-bottom:10px;border-collapse:collapse;">
        <tr><td style="font-weight:bold;width:55px;padding:2px 4px;font-size:10px;">Para:</td><td style="padding:2px 4px;font-size:10px;"><strong>Juan Pérez</strong><br/>Secretario</td></tr>
        ${c.mostrarDescripcion ? `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;">Descripción:</td><td style="padding:2px 4px;font-size:10px;">Descripción de ejemplo</td></tr>` : ""}
        <tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;">Fecha:</td><td style="padding:2px 4px;font-size:10px;">22 de marzo de 2026</td></tr>
      </table>`
          : ""
      }
      <hr style="border:none;border-top:2px solid ${colorLinea};margin:8px 0;"/>
      ${c.mostrarParrafoIntro && c.textoIntro ? `<p style="font-size:10px;text-align:justify;margin-bottom:8px;">${c.textoIntro}</p>` : ""}
      ${th ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;"><thead><tr>${th}</tr></thead><tbody><tr>${td}</tr></tbody></table>` : ""}
      ${c.mostrarObservacion ? `<p style="font-size:10px;margin:5px 0 10px;"><strong>Pd.</strong> Observación de ejemplo</p>` : ""}
      ${extras}
      <table style="width:100%;margin-top:30px;border-collapse:collapse;">
        <tr>
          <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:4px;font-size:10px;"><strong>Juan Pérez</strong><br/>Secretario</td>
          <td style="width:16%;"></td>
          <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:4px;font-size:10px;"><strong>María José</strong><br/>Desarrolladora</td>
        </tr>
      </table>
    </body></html>`;
  };

  // ── Estilos ────────────────────────────────────────────────────────────────
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
      <SafeAreaView style={[s.container, { backgroundColor: bg }]}>
        <Header />
        <Navbar />
        <ActivityIndicator
          size="large"
          color={accentCol}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );

  const SectionCard = ({ children, accent }) => (
    <View
      style={[
        s.sectionCard,
        {
          backgroundColor: surfaceBg,
          borderLeftColor: accent || accentCol,
          shadowColor: isDark ? "#000" : "#94a3b8",
        },
      ]}
    >
      {children}
    </View>
  );

  const SectionTitle = ({ children, icon }) => (
    <View style={s.sectionTitleRow}>
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={accentCol}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[s.sectionTitle, { color: textColor }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />
      <View style={s.body}>
        {/* ── Panel Editor ───────────────────────────────────────────────── */}
        <ScrollView
          style={[s.panel, { borderRightColor: borderCol }]}
          contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        >
          <Text style={[s.mainTitle, { color: textColor }]}>
            {esNueva ? "Nueva Plantilla" : "Editar Plantilla"}
          </Text>

          {/* TIPO */}
          {esNueva ? (
            <SectionCard>
              <SectionTitle icon="file-document-edit-outline">
                Tipo de Acta
              </SectionTitle>
              <ThemedPicker
                selectedValue={tipoDoc}
                onValueChange={setTipoDoc}
                colors={tc}
              >
                <Picker.Item label="Entrega" value="ENTREGA" />
                <Picker.Item label="Retiro" value="RETIRO" />
                <Picker.Item label="Recepción" value="RECEPCION" />
                <Picker.Item label="Memorándum" value="MEMORANDUM" />
                <Picker.Item label="Oficio" value="OFICIO" />
                <Picker.Item label="Reporte" value="REPORTE" />
                <Picker.Item label="Pase de Salida" value="PASE_SALIDA" />
              </ThemedPicker>
            </SectionCard>
          ) : (
            <View
              style={[
                s.tipoBadge,
                { backgroundColor: accentCol + "22", borderColor: accentCol },
              ]}
            >
              <MaterialCommunityIcons
                name="tag-outline"
                size={13}
                color={accentCol}
              />
              <Text style={[s.tipoBadgeText, { color: accentCol }]}>
                {tipoDoc}
              </Text>
            </View>
          )}

          {/* NOMBRE */}
          <SectionCard>
            <SectionTitle icon="pencil-outline">
              Nombre de la plantilla
            </SectionTitle>
            <ThemedInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la plantilla..."
              colors={tc}
            />
          </SectionCard>

          {/* COLOR */}
          <SectionCard>
            <SectionTitle icon="palette-outline">Color de líneas</SectionTitle>
            <View style={s.colorRow}>
              {COLORES_PRESET.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    s.colorCircle,
                    { backgroundColor: color },
                    config.colorLinea === color && {
                      borderColor: accentCol,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => set("colorLinea", color)}
                />
              ))}
              {Platform.OS === "web" && (
                <input
                  type="color"
                  value={config.colorLinea}
                  onChange={(e) => set("colorLinea", e.target.value)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    cursor: "pointer",
                    border: `2px solid ${borderCol}`,
                  }}
                />
              )}
            </View>
            <View style={s.colorInputRow}>
              <View
                style={[
                  s.colorMuestra,
                  {
                    backgroundColor: config.colorLinea,
                    borderColor: borderCol,
                  },
                ]}
              />
              <ThemedInput
                value={config.colorLinea}
                onChangeText={(v) => set("colorLinea", v)}
                maxLength={7}
                placeholder="#1eb9de"
                colors={tc}
                style={{ flex: 1 }}
              />
            </View>
          </SectionCard>

          {/* CAMPOS VISIBLES */}
          <SectionCard>
            <SectionTitle icon="toggle-switch-outline">
              Campos visibles
            </SectionTitle>
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
                  style={[s.switchRow, { borderBottomColor: borderCol }]}
                >
                  <Text style={[s.switchLabel, { color: subColor }]}>
                    {label}
                  </Text>
                  <Switch
                    value={!!config[key]}
                    onValueChange={(v) => set(key, v)}
                    trackColor={{ true: accentCol, false: borderCol }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
          </SectionCard>

          {/* TEXTO INTRO */}
          {config.mostrarParrafoIntro && (
            <SectionCard>
              <SectionTitle icon="text-long">Texto introductorio</SectionTitle>
              <ThemedInput
                value={config.textoIntro || ""}
                onChangeText={(v) => set("textoIntro", v)}
                placeholder="Por este medio se hace entrega..."
                multiline
                style={{ height: 70, textAlignVertical: "top" }}
                colors={tc}
              />
            </SectionCard>
          )}

          {/* COLUMNAS */}
          {!sinTabla && (
            <SectionCard>
              <SectionTitle icon="table-column">
                Columnas de la tabla
              </SectionTitle>
              {columnasDisponibles.map(({ key, label }) => (
                <View
                  key={key}
                  style={[s.switchRow, { borderBottomColor: borderCol }]}
                >
                  <Text style={[s.switchLabel, { color: subColor }]}>
                    {label}
                  </Text>
                  <Switch
                    value={(config.columnasTabla || []).includes(key)}
                    onValueChange={() => toggleColumna(key)}
                    trackColor={{ true: accentCol, false: borderCol }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </SectionCard>
          )}

          {/* ETIQUETAS */}
          {!sinTabla && (
            <SectionCard>
              <SectionTitle icon="label-outline">
                Etiquetas de columnas
              </SectionTitle>
              <Text style={[s.hint, { color: subColor }]}>
                Personaliza los encabezados de la tabla en el PDF.
              </Text>
              {etiquetasAEditar.map(({ key, placeholder }) => (
                <ThemedInput
                  key={key}
                  value={config[key] || ""}
                  onChangeText={(v) => set(key, v)}
                  placeholder={placeholder}
                  colors={tc}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </SectionCard>
          )}

          {/* ── CAMPOS ADICIONALES ─────────────────────────────────────────── */}
          <SectionCard accent="#7c3aed">
            <SectionTitle icon="form-textbox">
              Campos adicionales del formulario
            </SectionTitle>
            <Text style={[s.hint, { color: subColor }]}>
              Aparecerán en el formulario al crear un nuevo documento de este
              tipo y se incluirán en el PDF.
            </Text>

            {(config.camposExtra || []).map((campo, idx) => (
              <View
                key={campo.id}
                style={[
                  s.campoCard,
                  {
                    borderColor: borderCol,
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  },
                ]}
              >
                <View style={s.campoCardHeader}>
                  <View
                    style={[s.campoNumBadge, { backgroundColor: "#7c3aed22" }]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: "#7c3aed",
                      }}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => eliminarCampoExtra(idx)}
                    style={s.deleteMini}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={16}
                      color={dangerCol}
                    />
                  </TouchableOpacity>
                </View>
                <ThemedInput
                  value={campo.label}
                  onChangeText={(v) => actualizarCampoExtra(idx, "label", v)}
                  placeholder="Etiqueta del campo"
                  colors={tc}
                  style={{ marginBottom: 8 }}
                />
                <View
                  style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedPicker
                      selectedValue={campo.tipo}
                      onValueChange={(v) =>
                        actualizarCampoExtra(idx, "tipo", v)
                      }
                      colors={tc}
                    >
                      <Picker.Item label="Texto" value="texto" />
                      <Picker.Item label="Número" value="numero" />
                      <Picker.Item label="Párrafo" value="parrafo" />
                    </ThemedPicker>
                  </View>
                  <TouchableOpacity
                    style={[
                      s.obligBtn,
                      campo.obligatorio && { backgroundColor: "#7c3aed" },
                    ]}
                    onPress={() =>
                      actualizarCampoExtra(
                        idx,
                        "obligatorio",
                        !campo.obligatorio,
                      )
                    }
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: campo.obligatorio ? "#fff" : subColor,
                      }}
                    >
                      {campo.obligatorio ? "Obligatorio ✓" : "Opcional"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[s.addBtn, { borderColor: "#7c3aed" }]}
              onPress={agregarCampoExtra}
            >
              <MaterialCommunityIcons name="plus" size={15} color="#7c3aed" />
              <Text style={[s.addBtnText, { color: "#7c3aed" }]}>
                Agregar campo
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* ── TABLAS ADICIONALES ────────────────────────────────────────── */}
          <SectionCard accent="#ea580c">
            <SectionTitle icon="table-plus">
              Tablas adicionales del formulario
            </SectionTitle>
            <Text style={[s.hint, { color: subColor }]}>
              El usuario llenará estas tablas al crear el documento. Los datos
              se incluirán en el PDF.
            </Text>

            {(config.tablasExtra || []).map((tabla, tIdx) => (
              <View
                key={tabla.id}
                style={[
                  s.tablaEditorCard,
                  {
                    borderColor: borderCol,
                    backgroundColor: isDark ? "#0f172a" : "#fff7ed",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <ThemedInput
                    value={tabla.titulo}
                    onChangeText={(v) => actualizarTabla(tIdx, "titulo", v)}
                    placeholder="Título de la tabla"
                    colors={tc}
                    style={{ flex: 1 }}
                  />
                  <TouchableOpacity onPress={() => eliminarTabla(tIdx)}>
                    <MaterialCommunityIcons
                      name="delete"
                      size={20}
                      color={dangerCol}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[s.subLabel, { color: subColor }]}>Columnas:</Text>
                {tabla.columnas.map((col, cIdx) => (
                  <View
                    key={col.id}
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginBottom: 6,
                      alignItems: "center",
                    }}
                  >
                    <ThemedInput
                      value={col.label}
                      onChangeText={(v) =>
                        actualizarColumnaTabla(tIdx, cIdx, "label", v)
                      }
                      placeholder="Nombre columna"
                      colors={tc}
                      style={{ flex: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedPicker
                        selectedValue={col.tipo}
                        onValueChange={(v) =>
                          actualizarColumnaTabla(tIdx, cIdx, "tipo", v)
                        }
                        colors={tc}
                      >
                        <Picker.Item label="Texto" value="texto" />
                        <Picker.Item label="Número" value="numero" />
                      </ThemedPicker>
                    </View>
                    <TouchableOpacity
                      onPress={() => eliminarColumnaTabla(tIdx, cIdx)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={16}
                        color={dangerCol}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[s.addBtn, { borderColor: "#ea580c", marginTop: 4 }]}
                  onPress={() => agregarColumnaTabla(tIdx)}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={13}
                    color="#ea580c"
                  />
                  <Text style={[s.addBtnText, { color: "#ea580c" }]}>
                    Agregar columna
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[s.addBtn, { borderColor: "#ea580c", marginTop: 4 }]}
              onPress={agregarTablaExtra}
            >
              <MaterialCommunityIcons
                name="table-plus"
                size={15}
                color="#ea580c"
              />
              <Text style={[s.addBtnText, { color: "#ea580c" }]}>
                Agregar tabla
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* ── LOGOS ─────────────────────────────────────────────────────── */}
          <SectionCard>
            <SectionTitle icon="image-outline">
              Logos del documento
            </SectionTitle>
            {[
              { key: "conadeh", logo: logoConadeh, label: "Logo CONADEH" },
              { key: "info", logo: logoInfo, label: "Logo Infotecnología" },
            ].map(({ key, logo, label }, ki) => (
              <View
                key={key}
                style={[s.logoRow, ki === 1 && { marginTop: 14 }]}
              >
                <View
                  style={[
                    s.logoPreview,
                    { backgroundColor: inputBg, borderColor: borderCol },
                  ]}
                >
                  {logo ? (
                    <Image
                      source={{ uri: logo }}
                      style={s.logoImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[s.logoPlaceholder, { color: subColor }]}>
                      {label}
                      {"\n"}(actual)
                    </Text>
                  )}
                </View>
                <View style={s.logoBtns}>
                  <TouchableOpacity
                    style={[
                      s.logoBtn,
                      { backgroundColor: surfaceBg, borderColor: borderCol },
                    ]}
                    onPress={() => seleccionarLogo(key)}
                  >
                    <Text style={[s.logoBtnText, { color: accentCol }]}>
                      Cambiar
                    </Text>
                  </TouchableOpacity>
                  {logo && (
                    <TouchableOpacity
                      style={[
                        s.logoBtn,
                        {
                          backgroundColor: isDark ? "#451a1a" : "#fef2f2",
                          borderColor: dangerCol,
                        },
                      ]}
                      onPress={() => eliminarLogo(key)}
                    >
                      <Text style={[s.logoBtnText, { color: dangerCol }]}>
                        Restaurar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </SectionCard>

          {/* BOTONES */}
          <TouchableOpacity
            style={[
              s.saveBtn,
              { backgroundColor: accentCol },
              guardando && { opacity: 0.7 },
            ]}
            onPress={guardar}
            disabled={guardando}
          >
            <MaterialCommunityIcons
              name={guardando ? "loading" : "content-save-outline"}
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={s.saveBtnText}>
              {guardando ? "Guardando..." : "Guardar Plantilla"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.cancelBtn,
              { backgroundColor: surfaceBg, borderColor: borderCol },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[s.cancelBtnText, { color: subColor }]}>Cancelar</Text>
          </TouchableOpacity>

          <Footer />
        </ScrollView>

        {/* ── Panel Preview ───────────────────────────────────────────────── */}
        {Platform.OS === "web" && (
          <View style={[s.previewPanel, { backgroundColor: previewBg }]}>
            <View
              style={[
                s.previewHeader,
                { backgroundColor: surfaceBg, borderBottomColor: borderCol },
              ]}
            >
              <MaterialCommunityIcons
                name="eye-outline"
                size={16}
                color={accentCol}
              />
              <Text style={[s.previewTitle, { color: textColor }]}>
                Vista previa en tiempo real
              </Text>
              <View
                style={[s.previewBadge, { backgroundColor: accentCol + "22" }]}
              >
                <Text
                  style={{ fontSize: 10, color: accentCol, fontWeight: "700" }}
                >
                  LIVE
                </Text>
              </View>
            </View>
            <View style={s.previewDoc}>
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  panel: { width: 440, borderRightWidth: 1 },

  mainTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },

  tipoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  tipoBadgeText: { fontSize: 12, fontWeight: "700" },

  sectionCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 12 },

  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  colorMuestra: { width: 34, height: 34, borderRadius: 8, borderWidth: 1 },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  switchLabel: { fontSize: 14 },

  // Campos extra
  campoCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  campoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  campoNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteMini: { padding: 4 },

  obligBtn: {
    borderWidth: 1.5,
    borderColor: "#7c3aed",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  // Tablas extra
  tablaEditorCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },

  // Botones agregar
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    borderStyle: "dashed",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: "700" },

  // Logos
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
  logoPlaceholder: { fontSize: 9, textAlign: "center" },
  logoBtns: { gap: 8 },
  logoBtn: {
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoBtnText: { fontSize: 12, fontWeight: "600" },

  // Guardar / Cancelar
  saveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700" },

  // Preview
  previewPanel: { flex: 1 },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  previewBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  previewDoc: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
});
