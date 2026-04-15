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
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";
import {
  guardarLogoPersonalizado,
  obtenerLogo,
  eliminarLogoPersonalizado,
} from "../services/logosStorage";
import { invalidarCache, getConfigDefault } from "../services/plantillasCache";
import {
  generarHTMLEntrega,
  generarHTMLRetiro,
  generarHTMLMemorandum,
  generarHTMLRecepcion,
  generarHTMLOficio,
  generarHTMLPaseSalida,
  generarHTMLReporte,
} from "../utils/documentosHTML";
import api from "../services/api";
import Footer from "../components/footer";
import Header from "../components/header";
import Navbar from "../components/navBar";

const TIPOS_SIN_TABLA = ["MEMORANDUM", "OFICIO", "REPORTE", "PASE_SALIDA"];
const TIPOS_SIN_CAMPOS_CLASICOS = ["RECEPCION", "REPORTE", "PASE_SALIDA"];
const COLORES_PRESET = [
  "#1eb9de",
  "#09528e",
  "#3ac40d",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#ffffff",
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
const TB = {
  TEXTO: "texto",
  TABLA: "tabla",
  LINEA: "linea",
  FIRMA1: "firma1",
  FIRMA2: "firma2",
};

export default function EditarPlantillaScreen() {
  const router = useRouter();
  const { id, tipoActa: tipoActaParam } = useLocalSearchParams();
  const [tipoDoc, setTipoDoc] = useState(tipoActaParam || "ENTREGA");
  const esNueva = !id,
    esRecepcion = tipoDoc === "RECEPCION",
    sinTabla = TIPOS_SIN_TABLA.includes(tipoDoc);
  const columnasDisponibles = esRecepcion
    ? COLUMNAS_RECEPCION
    : COLUMNAS_ENTREGA_RETIRO;
  const [nombre, setNombre] = useState("Nueva Plantilla");
  const [config, setConfig] = useState(getConfigDefault());
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!esNueva);
  const [bloquesExtra, setBloquesExtra] = useState([]);
  const [logoConadeh, setLogoConadeh] = useState(null);
  const [logoInfo, setLogoInfo] = useState(null);
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
  const dangerCol = isDark ? "#f87171" : "#dc2626";

  useEffect(() => {
    if (esNueva)
      setConfig((p) => ({
        ...p,
        columnasTabla: esRecepcion
          ? ["descr_prod", "precio_prod", "num_recibo", "num_fact", "fecha"]
          : ["marca", "modelo", "serie", "asignado"],
      }));
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

  const cargarPlantilla = async () => {
    try {
      const res = await api.get(`/plantillas/${tipoActaParam || tipoDoc}`);
      const p = res.data.find((p) => String(p.idPlantilla) === String(id));
      if (p) {
        setNombre(p.nombrePlantilla);
        setTipoDoc(p.tipoActa);
        const cfg =
          typeof p.config === "string" ? JSON.parse(p.config) : p.config;
        setConfig(cfg);
        if (cfg.bloquesExtra) setBloquesExtra(cfg.bloquesExtra);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

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
  const set = (k, v) => setConfig((p) => ({ ...p, [k]: v }));
  const toggleColumna = (col) => {
    const cols = config.columnasTabla.includes(col)
      ? config.columnasTabla.filter((c) => c !== col)
      : [...config.columnasTabla, col];
    set("columnasTabla", cols);
  };

  // BLOQUES
  const agregarBloque = (tipo) => {
    const nid = Date.now().toString();
    let b = { id: nid, tipo, contenido: "" };
    if (tipo === TB.TABLA) {
      b.columnas = [
        { id: nid + "c1", label: "Columna 1" },
        { id: nid + "c2", label: "Columna 2" },
      ];
      b.filas = [
        {
          id: nid + "f1",
          celdas: { [nid + "c1"]: "Dato 1", [nid + "c2"]: "Dato 2" },
        },
      ];
    }
    setBloquesExtra((p) => [...p, b]);
  };
  const eliminarBloque = (bid) =>
    setBloquesExtra((p) => p.filter((b) => b.id !== bid));
  const moverBloque = (bid, dir) =>
    setBloquesExtra((p) => {
      const a = [...p],
        i = a.findIndex((b) => b.id === bid),
        ni = i + dir;
      if (ni < 0 || ni >= a.length) return a;
      [a[i], a[ni]] = [a[ni], a[i]];
      return a;
    });
  const actualizarBloque = (bid, cambios) =>
    setBloquesExtra((p) =>
      p.map((b) => (b.id === bid ? { ...b, ...cambios } : b)),
    );
  const agregarColumnaTabla = (bid) =>
    setBloquesExtra((p) =>
      p.map((b) => {
        if (b.id !== bid) return b;
        const cid = Date.now().toString();
        return {
          ...b,
          columnas: [...b.columnas, { id: cid, label: "Nueva Col" }],
          filas: b.filas.map((f) => ({
            ...f,
            celdas: { ...f.celdas, [cid]: "" },
          })),
        };
      }),
    );
  const eliminarColumnaTabla = (bid, cid) =>
    setBloquesExtra((p) =>
      p.map((b) => {
        if (b.id !== bid) return b;
        const { [cid]: _, ...resto } = {};
        return {
          ...b,
          columnas: b.columnas.filter((c) => c.id !== cid),
          filas: b.filas.map((f) => {
            const { [cid]: __, ...r } = f.celdas;
            return { ...f, celdas: r };
          }),
        };
      }),
    );
  const renombrarColumna = (bid, cid, v) =>
    setBloquesExtra((p) =>
      p.map((b) =>
        b.id !== bid
          ? b
          : {
              ...b,
              columnas: b.columnas.map((c) =>
                c.id === cid ? { ...c, label: v } : c,
              ),
            },
      ),
    );
  const agregarFilaTabla = (bid) =>
    setBloquesExtra((p) =>
      p.map((b) => {
        if (b.id !== bid) return b;
        const fid = Date.now().toString();
        const celdas = Object.fromEntries(b.columnas.map((c) => [c.id, ""]));
        return { ...b, filas: [...b.filas, { id: fid, celdas }] };
      }),
    );
  const eliminarFilaTabla = (bid, fid) =>
    setBloquesExtra((p) =>
      p.map((b) =>
        b.id !== bid ? b : { ...b, filas: b.filas.filter((f) => f.id !== fid) },
      ),
    );
  const actualizarCelda = (bid, fid, cid, v) =>
    setBloquesExtra((p) =>
      p.map((b) =>
        b.id !== bid
          ? b
          : {
              ...b,
              filas: b.filas.map((f) =>
                f.id !== fid ? f : { ...f, celdas: { ...f.celdas, [cid]: v } },
              ),
            },
      ),
    );

  const guardar = async () => {
    if (!nombre.trim()) {
      Platform.OS === "web"
        ? window.alert("Nombre obligatorio.")
        : Alert.alert("Error", "Nombre obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      const configFinal = { ...config, bloquesExtra };
      if (esNueva)
        await api.post("/plantillas", {
          nombrePlantilla: nombre,
          tipoActa: tipoDoc || "ENTREGA",
          config: configFinal,
        });
      else
        await api.put(`/plantillas/${id}`, {
          nombrePlantilla: nombre,
          config: configFinal,
        });
      await invalidarCache(tipoDoc || "ENTREGA");
      Platform.OS === "web"
        ? window.alert("Plantilla guardada.")
        : Alert.alert("Éxito", "Plantilla guardada.");
      router.back();
    } catch {
      Platform.OS === "web"
        ? window.alert("Error al guardar.")
        : Alert.alert("Error", "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const bloquesExtraHTML = (bloquesExtra || [])
    .map((b) => {
      if (b.tipo === TB.TEXTO)
        return `<p style="font-size:11px;margin:10px 0;line-height:1.6;">${b.contenido || "&nbsp;"}</p>`;
      if (b.tipo === TB.LINEA)
        return `<hr style="border:none;border-top:1px solid #ccc;margin:12px 0;"/>`;
      if (b.tipo === TB.FIRMA1)
        return `<div style="text-align:center;margin-top:50px;"><div style="width:260px;border-top:1px solid #000;margin:0 auto 4px;padding-top:5px;font-size:11px;">${b.contenido || "Firmante"}</div></div>`;
      if (b.tipo === TB.FIRMA2) {
        const pts = (b.contenido || "|").split("|");
        return `<table style="width:100%;margin-top:50px;border-collapse:collapse;"><tr><td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:5px;font-size:11px;"><strong>${pts[0] || "Firmante 1"}</strong></td><td style="width:16%;"></td><td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:5px;font-size:11px;"><strong>${pts[1] || "Firmante 2"}</strong></td></tr></table>`;
      }
      if (b.tipo === TB.TABLA && b.columnas?.length > 0) {
        const thead = b.columnas
          .map(
            (c) =>
              `<th style="border:1px solid #555;padding:4px 8px;background:#f0f0f0;font-size:10px;">${c.label}</th>`,
          )
          .join("");
        const tbody = (b.filas || [])
          .map(
            (f) =>
              `<tr>${b.columnas.map((c) => `<td style="border:1px solid #555;padding:4px 8px;font-size:10px;">${f.celdas[c.id] || ""}</td>`).join("")}</tr>`,
          )
          .join("");
        return `<table style="width:100%;border-collapse:collapse;margin:10px 0;"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
      }
      return "";
    })
    .join("");

  const generarPreview = () => {
    const c = config;
    const logoC = logoConadeh ? "" : "";
    if (tipoDoc === "MEMORANDUM")
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#000;font-size:12px;line-height:1.6;padding:20mm}.hdr{width:100%;border-collapse:collapse;border-bottom:2px solid ${c.colorLinea};padding-bottom:10px;margin-bottom:20px}.lb{width:80px;height:55px;background:#e2e8f0;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8}</style></head><body><table class="hdr"><tr><td style="width:120px"><div class="lb">CONADEH</div></td><td style="text-align:center"><strong style="font-size:13px;text-transform:uppercase">Comisionado Nacional de los Derechos Humanos</strong><br/><span style="font-size:11px">(CONADEH) — Honduras, C.A.</span></td><td style="width:120px;text-align:right"><div class="lb">InfoTec</div></td></tr></table><div style="text-align:center;margin-bottom:28px"><strong style="font-size:14px;text-transform:uppercase">Unidad de Infotecnología</strong><br/><span style="font-size:12px">Memorándum IT-2026-001</span></div><div style="width:75%;margin:0 auto 22px auto"><table style="width:100%;border-collapse:collapse"><tr><td style="font-weight:bold;width:25%;padding:5px">PARA:</td><td style="padding:5px"><strong>Sara Sandoval</strong><span style="display:block;font-size:11px;color:#444">Jefe</span></td></tr><tr><td style="font-weight:bold;padding:5px">DE:</td><td style="padding:5px"><strong>Ing. Marco Aguilera</strong><span style="display:block;font-size:11px;color:#444">Jefe de Infotecnología</span></td></tr><tr><td style="font-weight:bold;padding:5px">ASUNTO:</td><td style="font-weight:bold;padding:5px">Notificación de Mantenimiento</td></tr><tr><td style="font-weight:bold;padding:5px">FECHA:</td><td style="padding:5px">3 de abril de 2026</td></tr></table></div><div style="width:90%;margin:0 auto"><hr style="border:0;border-top:1px solid #ccc;margin-bottom:16px"/><p style="margin-bottom:14px;text-align:justify">Por este medio se le informa del mantenimiento preventivo programado.</p>${c.mostrarDespedida !== false ? `<p style="margin-top:20px">Saludos cordiales,</p>` : ""}</div>${bloquesExtraHTML}<div style="text-align:center;margin-top:60px"><div style="width:250px;border-top:1px solid #000;margin:0 auto 5px auto;padding-top:5px"><strong>Ing. Marco Aguilera</strong><br/><span style="font-size:11px">Jefe de Infotecnología</span></div></div></body></html>`;
    if (tipoDoc === "OFICIO")
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#000;font-size:12px;line-height:1.6;padding:25mm 20mm}.lb{width:80px;height:55px;background:#e2e8f0;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px"><div class="lb">CONADEH</div><div style="text-align:center;flex:1;padding:0 15px"><strong style="font-size:13px;text-transform:uppercase">Comisionado Nacional de los Derechos Humanos</strong><br/><span style="font-size:11px">(CONADEH) — Honduras, C.A.</span></div><div class="lb">InfoTec</div></div><div style="text-align:center;padding:7px 0;border-top:2px solid ${c.colorLinea};border-bottom:2px solid ${c.colorLinea};margin-bottom:30px;font-weight:bold;font-size:12px;text-transform:uppercase">UNIDAD DE INFOTECNOLOGÍA</div><div style="text-align:center;font-weight:bold;font-size:14px;text-decoration:underline;text-transform:uppercase;margin-bottom:28px">OFICIO IT-2026-001</div><div style="margin-bottom:18px;font-size:12px"><span style="display:block">Licenciado(a)</span><span style="display:block;font-weight:bold">Ana González</span><span style="display:block">Jefa de Recursos Humanos</span><span style="display:block;margin-top:8px">Licenciado(a) González:</span></div><div style="margin-bottom:18px;font-size:12px"><strong>Asunto:</strong> Solicitud de información sobre personal activo</div><p style="margin-bottom:14px;text-align:justify;line-height:1.8">Por este medio me permito dirigirme a usted con el fin de solicitar información.</p>${c.mostrarDespedida !== false ? `<p style="margin-top:14px">Saludos cordiales,</p>` : ""} ${bloquesExtraHTML}<div style="text-align:center;margin-top:80px"><div style="width:300px;border-top:1px solid #000;margin:0 auto 5px auto;padding-top:5px"><strong>Ing. Marco Aguilera</strong><br/><span style="font-size:11px">Jefe de Infotecnología</span></div></div></body></html>`;
    if (tipoDoc === "PASE_SALIDA")
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11.5px;line-height:1.6;padding:15mm 20mm 20mm}.lb{width:75px;height:50px;background:#e2e8f0;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8}</style></head><body><table style="width:100%;border-collapse:collapse"><tr><td style="width:120px"><div class="lb">CONADEH</div></td><td style="text-align:center"><strong style="font-size:10px;text-transform:uppercase">Comisionado Nacional de los Derechos Humanos (CONADEH)</strong><br/><span style="font-size:9px">Honduras, C.A.</span></td><td style="width:120px;text-align:right"><div class="lb">InfoTec</div></td></tr></table><div style="border-top:2px solid ${c.colorLinea};margin:6px 0 3px"></div><div style="text-align:right;font-size:10px;color:#555;margin-bottom:22px">N° IT-2026-001</div><div style="text-align:center;font-weight:bold;font-size:14px;text-decoration:underline;margin-bottom:22px">Pase de Salida Laptop</div><p style="font-size:11.5px;text-align:justify;line-height:1.85;margin-bottom:22px">Por este medio se hace entrega al <strong>Francisco Vives</strong> de la Empresa <strong>Recepcionista</strong>, para que repare la laptop que a continuación se describe:</p><table style="width:70%;border-collapse:collapse;margin:0 auto 40px auto"><thead><tr><th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5">Marca</th><th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5">Modelo</th><th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5">S/N</th></tr></thead><tbody><tr><td style="border:1px solid #555;padding:5px 10px;font-size:11px">Lenovo</td><td style="border:1px solid #555;padding:5px 10px;font-size:11px">83ER00BQGJ</td><td style="border:1px solid #555;padding:5px 10px;font-size:11px">67897815</td></tr></tbody></table>${bloquesExtraHTML}<table style="width:100%;margin-top:60px;border-collapse:collapse"><tr><td style="width:45%;text-align:center;vertical-align:top"><div style="border-top:1px solid #000;padding-top:6px;display:inline-block;width:200px"><strong style="font-size:11.5px">Francisco Vives</strong><br/><span style="font-size:10.5px">Recepcionista</span></div></td><td style="width:10%"></td><td style="width:45%;text-align:center;vertical-align:top"><div style="border-top:1px solid #000;padding-top:6px;display:inline-block;width:200px"><strong style="font-size:11.5px">Marco Antonio Aguilera</strong><br/><span style="font-size:10.5px">Jefe Infotecnología</span></div></td></tr></table></body></html>`;
    if (tipoDoc === "REPORTE")
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;padding:10mm 14mm 14mm}.lb{width:75px;height:50px;background:#e2e8f0;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8}.dt{width:100%;border-collapse:collapse;border:1px solid #888}.dt td{border:1px solid #888;padding:5px 8px;font-size:11px;vertical-align:top}</style></head><body><table style="width:100%;border-collapse:collapse"><tr><td style="width:100px"><div class="lb">CONADEH</div></td><td style="text-align:center"><div style="font-size:16px;font-weight:bold;font-style:italic;text-transform:uppercase;color:${c.colorLinea};line-height:1.4">Reporte de<br/>Daño de Equipo</div></td><td style="width:100px;text-align:right"><div class="lb">InfoTec</div></td></tr></table><div style="border-top:3px solid ${c.colorLinea};margin:5px 0 8px"></div><table class="dt"><tr><td style="width:50%">REP-2026-0022</td><td>10/4/2026</td></tr><tr><td colspan="2"><strong>Oficina o Departamento:</strong> —</td></tr><tr><td colspan="2" style="font-weight:bold;text-transform:uppercase">Características del Equipo:</td></tr><tr><td><strong>N/F:</strong> N/A</td><td><strong>INV:</strong> 7654323</td></tr><tr><td><strong>Service Tag / Serie:</strong> 90007</td><td><strong>Tipo / Marca / Modelo:</strong> DELL Optiplex 2030</td></tr><tr><td colspan="2" style="font-weight:bold;text-transform:uppercase">Descripción del Reporte:</td></tr><tr><td colspan="2">Descripción del daño reportado.</td></tr><tr><td colspan="2" style="font-weight:bold;text-transform:uppercase">Diagnóstico:</td></tr><tr><td colspan="2" style="height:160px;vertical-align:top">Diagnóstico técnico del equipo.</td></tr><tr><td colspan="2" style="font-weight:bold;text-transform:uppercase">Recomendaciones:</td></tr><tr><td colspan="2">Recomendaciones sugeridas.</td></tr></table>${bloquesExtraHTML}<table style="width:100%;border-collapse:collapse;border:1px solid #888;border-top:none"><tr><td style="border:1px solid #888;padding:6px 10px;width:50%;font-style:italic">Auxiliar Infotecnología.</td><td style="border:1px solid #888;padding:6px 10px">(Firma) María José</td></tr></table></body></html>`;
    if (esRecepcion)
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
          tituloActa: "ACTA DE RECEPCIÓN N° IT-2026-001",
          correlativoFinal: "IT-2026-001",
        },
        config: c,
        logos: { uriConadeh: logoConadeh, uriInfo: logoInfo },
      });
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
          `<th style="border:1px solid #555;padding:4px 5px;background:#f0f0f0;font-size:9px;text-transform:uppercase">${cl[x] || x}</th>`,
      )
      .join("");
    const td = (c.columnasTabla || [])
      .map(
        (x) =>
          `<td style="border:1px solid #555;padding:4px 5px;text-align:center;font-size:9px">${cd[x] || "-"}</td>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:16px;line-height:1.5}.lb{width:55px;height:40px;background:#e2e8f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${c.colorLinea};padding-bottom:8px;margin-bottom:14px"><div class="lb">Logo</div><div style="text-align:center;flex:1;padding:0 8px"><strong style="font-size:11px;text-transform:uppercase">Comisionado Nacional de los Derechos Humanos</strong><br/><span style="font-size:9px">(CONADEH)</span><br/><strong style="font-size:12px;text-decoration:underline">ACTA DE ${tipoDoc} N° IT-2026-001</strong></div><div class="lb">Logo</div></div>${!sinC ? `<table style="width:100%;margin-bottom:12px;border-collapse:collapse"><tr><td style="font-weight:bold;width:65px;padding:2px 4px;font-size:10px">Para:</td><td style="padding:2px 4px;font-size:10px"><strong>Juan Pérez</strong><br/>Secretario</td></tr>${c.mostrarDescripcion ? `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px">Descripción:</td><td style="padding:2px 4px;font-size:10px">Descripción de ejemplo</td></tr>` : ""}<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px">Fecha:</td><td style="padding:2px 4px;font-size:10px">22 de marzo de 2026</td></tr></table>` : ""}<hr style="border:none;border-top:2px solid ${c.colorLinea};margin:10px 0"/>${c.mostrarParrafoIntro && c.textoIntro ? `<p style="font-size:10px;text-align:justify;margin-bottom:10px">${c.textoIntro}</p>` : ""}${th ? `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><thead><tr>${th}</tr></thead><tbody><tr>${td}</tr></tbody></table>` : ""}${c.mostrarObservacion ? `<p style="font-size:10px;margin:6px 0 14px"><strong>Pd.</strong> Observación de ejemplo</p>` : ""} ${bloquesExtraHTML}<table style="width:100%;margin-top:40px;border-collapse:collapse"><tr><td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:5px;font-size:10px"><strong>Juan Pérez</strong><br/>Secretario</td><td style="width:16%"></td><td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:5px;font-size:10px"><strong>María José</strong><br/>Desarrolladora</td></tr></table></body></html>`;
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
  const ss = {
    backgroundColor: surfaceBg,
    shadowColor: isDark ? "#000" : "#94a3b8",
  };

  const renderBloque = (b, idx) => (
    <View
      key={b.id}
      style={[
        styles.bloqueCard,
        {
          backgroundColor: isDark ? "#0f172a" : "#f0f9ff",
          borderColor: highlightCol,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
          gap: 6,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "700",
            color: highlightCol,
          }}
        >
          {b.tipo === TB.TEXTO
            ? "📝 Párrafo de texto"
            : b.tipo === TB.TABLA
              ? "📊 Tabla personalizada"
              : b.tipo === TB.LINEA
                ? "— Línea separadora"
                : b.tipo === TB.FIRMA1
                  ? "✍️ Firma simple"
                  : "✍️✍️ Dos firmas"}
        </Text>
        <TouchableOpacity
          onPress={() => moverBloque(b.id, -1)}
          disabled={idx === 0}
        >
          <MaterialCommunityIcons
            name="arrow-up"
            size={18}
            color={idx === 0 ? "#94a3b8" : highlightCol}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moverBloque(b.id, 1)}
          disabled={idx === bloquesExtra.length - 1}
        >
          <MaterialCommunityIcons
            name="arrow-down"
            size={18}
            color={idx === bloquesExtra.length - 1 ? "#94a3b8" : highlightCol}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => eliminarBloque(b.id)}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={18}
            color={dangerCol}
          />
        </TouchableOpacity>
      </View>
      {b.tipo === TB.TEXTO && (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor: borderCol,
              color: textColor,
              height: 70,
              textAlignVertical: "top",
            },
          ]}
          multiline
          value={b.contenido}
          onChangeText={(v) => actualizarBloque(b.id, { contenido: v })}
          placeholder="Escribe el párrafo..."
          placeholderTextColor={subColor}
        />
      )}
      {b.tipo === TB.FIRMA1 && (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor: borderCol,
              color: textColor,
            },
          ]}
          value={b.contenido}
          onChangeText={(v) => actualizarBloque(b.id, { contenido: v })}
          placeholder="Nombre del firmante..."
          placeholderTextColor={subColor}
        />
      )}
      {b.tipo === TB.FIRMA2 && (
        <>
          <Text style={{ fontSize: 11, color: subColor, marginBottom: 4 }}>
            Firmante izq. | Firmante der. (separar con |)
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
            value={b.contenido}
            onChangeText={(v) => actualizarBloque(b.id, { contenido: v })}
            placeholder="Juan Pérez|María José"
            placeholderTextColor={subColor}
          />
        </>
      )}
      {b.tipo === TB.TABLA && b.columnas && (
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: subColor,
              marginBottom: 6,
            }}
          >
            Columnas:
          </Text>
          {b.columnas.map((col) => (
            <View
              key={col.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
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
                value={col.label}
                onChangeText={(v) => renombrarColumna(b.id, col.id, v)}
                placeholder="Nombre columna"
                placeholderTextColor={subColor}
              />
              <TouchableOpacity
                onPress={() => eliminarColumnaTabla(b.id, col.id)}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={dangerCol}
                />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.miniBtn, { borderColor: highlightCol }]}
            onPress={() => agregarColumnaTabla(b.id)}
          >
            <Text style={{ fontSize: 12, color: highlightCol }}>+ Columna</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: subColor,
              marginTop: 10,
              marginBottom: 6,
            }}
          >
            Filas de ejemplo:
          </Text>
          {(b.filas || []).map((f) => (
            <View
              key={f.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
              }}
            >
              {b.columnas.map((col) => (
                <TextInput
                  key={col.id}
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: inputBg,
                      borderColor: borderCol,
                      color: textColor,
                      fontSize: 12,
                    },
                  ]}
                  value={f.celdas[col.id] || ""}
                  onChangeText={(v) => actualizarCelda(b.id, f.id, col.id, v)}
                  placeholder={col.label}
                  placeholderTextColor={subColor}
                />
              ))}
              <TouchableOpacity onPress={() => eliminarFilaTabla(b.id, f.id)}>
                <MaterialCommunityIcons
                  name="minus-circle"
                  size={18}
                  color={dangerCol}
                />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.miniBtn, { borderColor: highlightCol }]}
            onPress={() => agregarFilaTabla(b.id)}
          >
            <Text style={{ fontSize: 12, color: highlightCol }}>+ Fila</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        <ScrollView
          style={[styles.panel, { borderRightColor: borderCol }]}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <Text style={[styles.mainTitle, { color: textColor }]}>
            {esNueva ? "Nueva Plantilla" : "Editar Plantilla"}
          </Text>
          {esNueva ? (
            <View style={[styles.section, ss]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Tipo de Acta
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                <Picker
                  selectedValue={tipoDoc}
                  onValueChange={setTipoDoc}
                  style={{ color: textColor }}
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
          <View style={[styles.section, ss]}>
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
          <View style={[styles.section, ss]}>
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
                maxLength={7}
                placeholder="#1eb9de"
                placeholderTextColor={subColor}
              />
            </View>
          </View>
          <View style={[styles.section, ss]}>
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
            <View style={[styles.section, ss]}>
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
            <View style={[styles.section, ss]}>
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
            <View style={[styles.section, ss]}>
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
          <View style={[styles.section, ss]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Bloques adicionales
            </Text>
            <Text style={{ fontSize: 11, color: subColor, marginBottom: 12 }}>
              Agrega párrafos, tablas, líneas o firmas en cualquier posición del
              documento.
            </Text>
            {bloquesExtra.map((b, i) => renderBloque(b, i))}
            <View style={{ gap: 8, marginTop: 4 }}>
              {[
                { tipo: TB.TEXTO, label: "+ Párrafo de texto", icon: "text" },
                {
                  tipo: TB.TABLA,
                  label: "+ Tabla personalizada",
                  icon: "table",
                },
                { tipo: TB.LINEA, label: "+ Línea separadora", icon: "minus" },
                { tipo: TB.FIRMA1, label: "+ Firma simple", icon: "draw-pen" },
                {
                  tipo: TB.FIRMA2,
                  label: "+ Dos firmas",
                  icon: "account-multiple",
                },
              ].map(({ tipo, label, icon }) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.addBloqueBtn,
                    {
                      borderColor: highlightCol,
                      backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
                    },
                  ]}
                  onPress={() => agregarBloque(tipo)}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={16}
                    color={highlightCol}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: highlightCol,
                      fontWeight: "600",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.section, ss]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Logos del documento
            </Text>
            {[
              { key: "conadeh", logo: logoConadeh, label: "Logo CONADEH" },
              { key: "info", logo: logoInfo, label: "Logo InfoTec" },
            ].map(({ key, logo, label }, ki) => (
              <View
                key={key}
                style={[styles.logoRow, ki === 1 && { marginTop: 14 }]}
              >
                <View
                  style={[
                    styles.logoPreview,
                    { backgroundColor: inputBg, borderColor: borderCol },
                  ]}
                >
                  {logo ? (
                    <Image
                      source={{ uri: logo }}
                      style={styles.logoImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[styles.logoPlaceholder, { color: subColor }]}>
                      {label}
                      {"\n"}(actual)
                    </Text>
                  )}
                </View>
                <View style={styles.logoBtns}>
                  <TouchableOpacity
                    style={[
                      styles.logoBtn,
                      { backgroundColor: surfaceBg, borderColor: borderCol },
                    ]}
                    onPress={() => seleccionarLogo(key)}
                  >
                    <Text style={[styles.logoBtnText, { color: highlightCol }]}>
                      Cambiar
                    </Text>
                  </TouchableOpacity>
                  {logo && (
                    <TouchableOpacity
                      style={[
                        styles.logoBtnReset,
                        {
                          backgroundColor: isDark ? "#451a1a" : "#fef2f2",
                          borderColor: isDark ? "#7f1d1d" : "#fca5a5",
                        },
                      ]}
                      onPress={() => eliminarLogo(key)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: dangerCol,
                        }}
                      >
                        Restaurar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
          <Footer />
        </ScrollView>
        {Platform.OS === "web" && (
          <View style={[styles.previewPanel, { backgroundColor: previewBg }]}>
            <Text style={[styles.previewTitle, { color: textColor }]}>
              Vista previa en tiempo real
            </Text>
            <View style={styles.previewDoc}>
              <iframe
                key={
                  JSON.stringify(config) +
                  JSON.stringify(bloquesExtra) +
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  panel: { width: 420, borderRightWidth: 1 },
  mainTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
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
  sectionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  pickerWrapper: { borderRadius: 6, borderWidth: 1, overflow: "hidden" },
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
  colorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  colorMuestra: { width: 32, height: 32, borderRadius: 6, borderWidth: 1 },
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
  previewTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
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
  bloqueCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  addBloqueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  miniBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
});
