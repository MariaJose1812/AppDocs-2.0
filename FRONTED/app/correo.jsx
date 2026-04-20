import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";
import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import CustomScrollView from "../components/ScrollView";
import { useAlert } from "../context/alertContext";
import api from "../services/api";
import {
  generarHTMLEntrega,
  generarHTMLRetiro,
  generarHTMLMemorandum,
  generarHTMLRecepcion,
  generarHTMLOficio,
  generarHTMLPaseSalida,
  generarHTMLReporte,
} from "../utils/documentosHTML";

export default function CorreoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { showAlert } = useAlert();

  // Colores dinámicos según tema
  const bg = Colors[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors[theme]?.text || (isDark ? "#f1f5f9" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const highlightCol = isDark ? "#60a5fa" : "#09528e";

  // CONFIG TIPOS DE DOCS
  const TIPOS_CONFIG = {
    ENTREGA: {
      nombre: "Acta de Entrega",
      icono: "file-arrow-up-down-outline",
      color: "#3ac40d",
    },
    RETIRO: {
      nombre: "Acta de Retiro",
      icono: "file-arrow-left-right-outline",
      color: "#cc7625",
    },
    RECEPCION: {
      nombre: "Acta de Recepción",
      icono: "file-check-outline",
      color: isDark ? "#60a5fa" : "#09528e",
    },
    MEMORANDUM: {
      nombre: "Memorándum",
      icono: "email-edit-outline",
      color: "#70e0f4",
    },
    OFICIO: {
      nombre: "Oficio",
      icono: "file-document-outline",
      color: isDark ? "#94a3b8" : "#333333",
    },
    PASE_SALIDA: {
      nombre: "Pase de Salida",
      icono: "file-export-outline",
      color: "#e63946",
    },
    REPORTE: {
      nombre: "Reporte de Daño",
      icono: "file-alert-outline",
      color: "#2a9d8f",
    },
  };

  const FILTROS = [
    { id: "Todos", nombre: "Todos", icono: "filter-variant", color: "#64748b" },
    ...Object.entries(TIPOS_CONFIG).map(([key, val]) => ({
      id: key,
      nombre: val.nombre.replace("Acta de ", ""),
      icono: val.icono,
      color: val.color,
    })),
  ];

  // Estados del formulario
  const [para, setPara] = useState("");
  const [cc, setCc] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  // Estados de documentos
  const [historial, setHistorial] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // AutoCompletado correos
  const [correosDelSistema, setCorreosDelSistema] = useState([]);
  const [sugPara, setSugPara] = useState([]);
  const [sugCC, setSugCC] = useState([]);
  const blurTimeoutPara = useRef(null);
  const blurTimeoutCC = useRef(null);

  // Carga inicial y al enfocar
  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, []),
  );

  useEffect(() => {
    Promise.all([api.get("/empleados"), api.get("/receptores")])
      .then(([r1, r2]) => {
        const todos = [
          ...r1.data.map((e) => e.corEmp).filter(Boolean),
          ...r2.data.map((r) => r.corRec).filter(Boolean),
        ];
        setCorreosDelSistema([...new Set(todos)]);
      })
      .catch(() => {});
  }, []);

  // Helpers de autocomplete
  const filtrarCorreos = (texto) => {
    const term = texto.split(",").pop().trim().toLowerCase();
    if (!term) return [];
    return correosDelSistema
      .filter((c) => c.toLowerCase().includes(term))
      .slice(0, 6);
  };

  const elegirCorreo = (actual, elegido, setter, setSugs, blurTimeoutRef) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    // Si el campo está vacío, solo asignamos el correo elegido
    if (!actual.trim()) {
      setter(elegido);
      setSugs([]);
      return;
    }

    // Separar por comas, limpiar espacios y filtrar vacíos
    let partes = actual
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    // Reemplazar la última parte por el correo elegido
    if (partes.length > 0) {
      partes[partes.length - 1] = elegido;
    } else {
      partes = [elegido];
    }
    let resultado = partes.join(", ");

    setter(resultado);
    setSugs([]);
  };

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const res = await api.get("/actas/historial");
      setHistorial(res.data);
    } catch {
      console.log("Error cargando historial");
    } finally {
      setCargandoHistorial(false);
    }
  };

  const toggleSeleccion = (item) => {
    const yaEsta = seleccionados.find(
      (s) => s.id === item.id && s.tipo === item.tipo,
    );
    if (yaEsta) {
      setSeleccionados(
        seleccionados.filter(
          (s) => !(s.id === item.id && s.tipo === item.tipo),
        ),
      );
    } else {
      setSeleccionados([...seleccionados, item]);
    }
  };

  const estaSeleccionado = (item) =>
    !!seleccionados.find((s) => s.id === item.id && s.tipo === item.tipo);

  // Filtrado del historial
  const historialFiltrado = historial.filter((item) => {
    const q = busqueda.toLowerCase();
    const tipoNorm = (item.tipo || "").toUpperCase().trim();
    const config = TIPOS_CONFIG[tipoNorm] || {};
    const coincideTipo = filtroTipo === "Todos" || tipoNorm === filtroTipo;
    const coincideTexto =
      !busqueda.trim() ||
      (item.correlativo || "").toLowerCase().includes(q) ||
      (item.asunto || "").toLowerCase().includes(q) ||
      (item.usuario || "").toLowerCase().includes(q) ||
      (config.nombre || "").toLowerCase().includes(q);
    return coincideTipo && coincideTexto;
  });

  const htmlEncabezado = (
    uriConadeh,
    uriInfo,
    colorLinea,
    titulo,
    correlativo,
  ) => `
    <table style="width:100%;border-collapse:collapse;border-bottom:2px solid ${colorLinea};padding-bottom:8px;margin-bottom:18px;">
      <tr>
        <td style="width:110px;text-align:left;vertical-align:middle">
          <img src="${uriConadeh}" style="height:60px;object-fit:contain;" alt="CONADEH"/>
        </td>
        <td style="text-align:center;vertical-align:middle">
          <p style="font-weight:bold;font-size:12px;text-transform:uppercase;margin:0;">Comisionado Nacional de los Derechos Humanos</p>
          <p style="font-size:10px;margin:0;color:#444;">(CONADEH) — Honduras, C.A.</p>
          <p style="font-weight:bold;font-size:13px;text-decoration:underline;margin-top:6px;text-transform:uppercase;">${titulo} N° ${correlativo}</p>
        </td>
        <td style="width:110px;text-align:right;vertical-align:middle">
          <img src="${uriInfo}" style="height:60px;object-fit:contain;" alt="InfoTecnología"/>
        </td>
      </tr>
    </table>`;

  const htmlFirmas = (izqNombre, izqCargo, derNombre, derCargo) => `
    <table style="width:100%;margin-top:60px;border-collapse:collapse;">
      <tr>
        <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:6px;font-size:11px;">
          <strong>${izqNombre || "___________________"}</strong><br/>${izqCargo || ""}
        </td>
        <td style="width:16%;"></td>
        <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:6px;font-size:11px;">
          <strong>${derNombre || "___________________"}</strong><br/>${derCargo || ""}
        </td>
      </tr>
    </table>`;

  const htmlBase = (contenido) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.6; padding: 20mm 18mm; color: #000; }
</style></head><body>${contenido}</body></html>`;

  const TIPO_MAP = {
    acta_entrega_encabezado: "ENTREGA",
    acta_retiro_encabezado: "RETIRO",
    acta_recepcion_encabezado: "RECEPCION",
    memorandum_encabezado: "MEMORANDUM",
    oficios_encabezado: "OFICIO",
    pase_salida_encabezado: "PASE_SALIDA",
    reportes_encabezado: "REPORTE",
  };

  const generarHTMLParaDocumento = async (item) => {
    try {
      const tipoNorm = TIPO_MAP[item.tipo] || item.tipo.toUpperCase().trim();
      const config = TIPOS_CONFIG[tipoNorm] || { nombre: tipoNorm };

      const [{ conadeh: uriConadeh, info: uriInfo }, c] = await Promise.all([
        getLogoURIs(),
        obtenerPlantillaActiva(tipoNorm).catch(() => ({
          colorLinea: "#1eb9de",
        })),
      ]);

      const endpointMap = {
        ENTREGA: `/actas/procesadas/ENTREGA/${item.id}`,
        RETIRO: `/actas/procesadas/RETIRO/${item.id}`,
        RECEPCION: `/actas/detalle/RECEPCION/${item.id}`,
        MEMORANDUM: `/actas/memorandum/${item.id}`,
        OFICIO: `/actas/detalle/OFICIO/${item.id}`,
        PASE_SALIDA: `/actas/pase-salida/${item.id}`,
        REPORTE: `/actas/detalle/REPORTE/${item.id}`,
      };
      const endpoint =
        endpointMap[tipoNorm] || `/actas/detalle/${tipoNorm}/${item.id}`;

      let detalle = {};
      try {
        const res = await api.get(endpoint);
        detalle = (Array.isArray(res.data) ? res.data[0] : res.data) || {};
      } catch (e) {
        console.warn("No se pudo cargar detalle:", e.message);
      }

      const correlativo = detalle?.correlativo || item.correlativo || "";
      const imagenesUrls = detalle?.imagenes || [];
      let imagenesHTML = "";
      if (imagenesUrls.length > 0) {
        imagenesHTML = `
        <div style="margin-top:20px;page-break-inside:avoid;">
          <p style="font-weight:bold;font-size:11px;margin-bottom:8px;">Evidencias fotográficas:</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            ${imagenesUrls
              .map(
                (url) =>
                  `<img src="${url}" style="max-width:200px;max-height:200px;border-radius:4px;border:1px solid #ccc;"/>`,
              )
              .join("")}
          </div>
        </div>`;
      }

      // RECEPCION
      if (tipoNorm === "RECEPCION") {
        const firmante = detalle?.firmante || {};
        const receptorData = detalle?.receptor || {};
        const dataParaHtml = {
          emisorNombre: firmante.nombre || "—",
          emisorCargo: firmante.cargo || "Jefe de la Unidad de Infotecnologia",
          proveedorNombre: receptorData.empresa || receptorData.nombre || "—",
          descripcion: detalle?.descripcion || item.asunto || "",
          items: (detalle?.items || []).map((it) => ({
            descr_prod: it.descr_prod,
            precio_prod: it.precio_prod,
            equivalente_lps: it.equivalente_lps,
            num_recibo: it.num_recibo,
            num_fact: it.num_fact,
            fech_ARCDet:
              it.fech_ARCDet || new Date().toLocaleDateString("es-HN"),
          })),
          tituloActa: "ACTA DE RECEPCIÓN",
          correlativoFinal: correlativo,
        };
        const html = generarHTMLRecepcion({
          data: dataParaHtml,
          config: c,
          logos: { uriConadeh, uriInfo },
        });
        return { html, nombre: `Acta de Recepción_${correlativo}.pdf` };
      }

      // ENTREGA y RETIRO
      if (tipoNorm === "ENTREGA") {
        const itemsEquipos = (detalle?.items || []).map((eq) => ({
          ...eq,
          asignado_a: eq.asignado_a || detalle?.asignado_a || "",
        }));
        const html = generarHTMLEntrega({
          data: {
            emisorNombre: detalle?.emisor?.nombre || "—",
            emisorCargo: detalle?.emisor?.cargo || "",
            receptorNombre: detalle?.receptor?.nombre || "—",
            receptorCargo: detalle?.receptor?.cargo || "",
            asunto: detalle?.asunto || "",
            descripcion: detalle?.descripcion || "",
            observacion: detalle?.observacion || "",
            fecha: detalle?.fecha
              ? new Date(detalle.fecha).toLocaleDateString("es-HN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "",
            correlativoFinal: correlativo,
            items: itemsEquipos,
          },
          config: c,
          logos: { uriConadeh, uriInfo },
          imagenesHTML,
        });
        return { html, nombre: `Acta de Entrega_${correlativo}.pdf` };
      }
      if (tipoNorm === "RETIRO") {
        const itemsEquipos = (detalle?.items || []).map((eq) => ({
          ...eq,
          asignado_a: eq.asignado_a || detalle?.asignado_a || "",
        }));
        const html = generarHTMLRetiro({
          data: {
            emisorNombre: detalle?.emisor?.nombre || "—",
            emisorCargo: detalle?.emisor?.cargo || "",
            receptorNombre: detalle?.receptor?.nombre || "—",
            receptorCargo: detalle?.receptor?.cargo || "",
            asunto: detalle?.asunto || "",
            descripcion: detalle?.descripcion || "",
            observacion: detalle?.observacion || "",
            fecha: detalle?.fecha
              ? new Date(detalle.fecha).toLocaleDateString("es-HN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "",
            correlativoFinal: correlativo,
            items: itemsEquipos,
          },
          config: c,
          logos: { uriConadeh, uriInfo },
          imagenesHTML,
        });
        return { html, nombre: `Acta de Retiro_${correlativo}.pdf` };
      }

      // MEMORANDUM
      if (tipoNorm === "MEMORANDUM") {
        const fecha = detalle?.fecha
          ? new Date(detalle.fecha).toLocaleDateString("es-HN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";
        const html = generarHTMLMemorandum({
          data: {
            emisorNombre: detalle?.emisor?.nombre || "—",
            emisorCargo: detalle?.emisor?.cargo || "",
            receptorNombre: detalle?.receptor?.nombre || "—",
            receptorCargo: detalle?.receptor?.cargo || "",
            asunto: detalle?.asunto || "",
            fecha,
            correlativoFinal: correlativo,
            items: (detalle?.items || []).map((it) => ({
              desc_MMDet: it.desc_MMDet,
            })),
          },
          config: c,
          logos: { uriConadeh, uriInfo },
        });
        return { html, nombre: `Memorándum_${correlativo}.pdf` };
      }

      // OFICIO
      if (tipoNorm === "OFICIO") {
        let emisorNombre = "Ing. Marco Aguilera";
        let emisorCargo = "Jefe de Infotecnología";
        try {
          const raw = await AsyncStorage.getItem("oficio_emisor");
          if (raw) {
            const e = JSON.parse(raw);
            emisorNombre = e.nombre || emisorNombre;
            emisorCargo = e.cargo || emisorCargo;
          }
        } catch (e) {
          console.warn("Error leyendo emisor de oficio:", e);
        }

        const fecha = detalle?.fecha
          ? new Date(detalle.fecha).toLocaleDateString("es-HN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date().toLocaleDateString("es-HN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

        const receptorNombre =
          detalle?.receptor?.nombre || detalle?.receptorNombre || "—";
        const receptorCargo =
          detalle?.receptor?.cargo || detalle?.receptorCargo || "";
        const receptorTratamiento = detalle?.receptorTratamiento || "Señor(a)";
        const apellido =
          receptorNombre !== "—" ? receptorNombre.split(" ").slice(-1)[0] : "";

        const parrafosHTML = (detalle?.items || [])
          .map((item) => `<p class="parrafo">${item.desc_OfiDet}</p>`)
          .join("");

        const colorLinea = c?.colorLinea || "#1eb9de";

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Oficio ${correlativo}</title>
<style>
  * { box-sizing: border-box; max-width: 100%; }
  @page { size: A4 portrait; margin: 0; }
  body {
    font-family: Arial, sans-serif;
    color: #000;
    font-size: 12px;
    line-height: 1.6;
    padding: 25mm 20mm;
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .titulo-oficio {
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    text-decoration: underline;
    text-transform: uppercase;
    margin-bottom: 30px;
    letter-spacing: 0.5px;
  }
  .cuerpo {
    font-size: 12px;
    text-align: justify;
    margin-bottom: 15px;
    line-height: 1.7;
  }
  .destinatario {
    margin-bottom: 20px;
  }
  .destinatario span {
    display: block;
  }
  .dest-nombre {
    font-weight: bold;
  }
  .asunto {
    margin-bottom: 20px;
  }
  .parrafo {
    margin-bottom: 14px;
    text-align: justify;
    line-height: 1.8;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .firma-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 80px;
  }
  .firma-box {
    width: 300px;
    text-align: center;
  }
  .firma-line {
    border-top: 1px solid #000;
    margin-bottom: 5px;
  }
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
  <img src="${uriConadeh}" style="height:75px;object-fit:contain;" alt="CONADEH"/>
  <div style="text-align:center;flex:1;padding:0 15px;">
    <p style="font-weight:bold;font-size:13px;margin:0;text-transform:uppercase;">
      Comisionado Nacional de los Derechos Humanos
    </p>
    <p style="font-size:11px;margin:5px 0 0 0;">(CONADEH) — Honduras, C.A.</p>
  </div>
  <img src="${uriInfo}" style="height:65px;object-fit:contain;" alt="InfoTecnología"/>
</div>

<!-- BARRA -->
<div style="text-align:center;padding:7px 0;
    border-top:2px solid ${colorLinea};
    border-bottom:2px solid ${colorLinea};
    margin-bottom:35px;
    font-weight:bold;
    font-size:12px;
    text-transform:uppercase;">
  UNIDAD DE INFOTECNOLOGÍA
</div>

<!-- TÍTULO -->
<div class="titulo-oficio">
  OFICIO ${correlativo}
</div>

<!-- DESTINATARIO -->
<div class="destinatario">
  <span>${receptorTratamiento}</span>
  <span class="dest-nombre">${receptorNombre}</span>
  <span>${receptorCargo}</span>
  <span style="margin-top:10px;">${receptorTratamiento} ${apellido}:</span>
</div>

<!-- ASUNTO -->
<div class="asunto">
  <strong>Asunto:</strong> ${detalle?.asunto || ""}
</div>

<!-- CUERPO -->
${parrafosHTML}

<!-- DESPEDIDA -->
<p class="cuerpo">Saludos cordiales,</p>

<!-- FIRMA -->
<div class="firma-wrapper">
  <div class="firma-box">
    <div class="firma-line"></div>
    <strong>${emisorNombre}</strong><br/>
    ${emisorCargo}
  </div>
</div>

</body>
</html>`;

        return { html: htmlContent, nombre: `Oficio_${correlativo}.pdf` };
      }
      // PASE DE SALIDA
      if (tipoNorm === "PASE_SALIDA") {
        const html = generarHTMLPaseSalida({
          data: {
            emisorNombre: detalle?.emisor?.nombre || "—",
            emisorCargo: detalle?.emisor?.cargo || "",
            receptorNombre: detalle?.receptor?.nombre || "—",
            receptorEmpresa: detalle?.receptor?.empresa || "",
            motivo: detalle?.motivo || "",
            correlativoFinal: correlativo,
            items: (detalle?.items || []).map((eq) => ({
              marca: eq.marca || "N/A",
              modelo: eq.modelo || "N/A",
              serie: eq.serie || "N/A",
            })),
          },
          config: c,
          logos: { uriConadeh, uriInfo },
        });
        return { html, nombre: `Pase de Salida_${correlativo}.pdf` };
      }

      // REPORTE
      if (tipoNorm === "REPORTE") {
        const fecha = detalle?.fecha
          ? new Date(detalle.fecha).toLocaleDateString("es-HN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";
        const html = generarHTMLReporte({
          data: {
            asignado: detalle?.asignado || "—",
            asignadoCargo: detalle?.asignadoCargo || "Auxiliar Infotecnología",
            correlativoFinal: correlativo,
            fecha,
            oficina: detalle?.oficina || "",
            motivo: detalle?.motivo || "",
            diagnostico: detalle?.diagnostico || "",
            recomendaciones: detalle?.recomendaciones || "",
            equipo: {
              numFicha: detalle?.numFicha || "N/A",
              numInv: detalle?.numInv || "N/A",
              serie: detalle?.equipoSerie || "N/A",
              marca: detalle?.equipoMarca || "N/A",
              modelo: detalle?.equipoModelo || "N/A",
              tipo: detalle?.equipoTipo || "",
            },
          },
          config: c,
          logos: { uriConadeh, uriInfo },
          imagenesHTML,
        });
        return { html, nombre: `Reporte_${correlativo}.pdf` };
      }

      return null;
    } catch (err) {
      console.error("Error generando HTML:", err);
      return null;
    }
  };

  // ENVIO DEL CORREO
  const enviarCorreo = async () => {
    if (!para.trim()) {
      showAlert({
        title: "Atención",
        message: "El campo Para es obligatorio.",
      });
      return;
    }
    if (seleccionados.length === 0) {
      showAlert({
        title: "Atención",
        message: "Debes seleccionar al menos un documento para adjuntar.",
      });
      return;
    }

    setGenerando(true);
    try {
      const adjuntos = [];
      for (const item of seleccionados) {
        const resultado = await generarHTMLParaDocumento(item);
        if (resultado) {
          adjuntos.push({
            nombre: resultado.nombre,
            html: resultado.html,
          });
        } else {
          console.warn(
            `No se pudo generar HTML para ${item.tipo} ID ${item.id}`,
          );
        }
      }

      if (adjuntos.length === 0) {
        showAlert({
          title: "Error",
          message: "No se pudieron generar los adjuntos.",
        });
        setGenerando(false);
        return;
      }

      await api.post("/correo/enviar", {
        para,
        cc: cc || "",
        asunto: asunto || "(Sin asunto)",
        cuerpo: cuerpo || "",
        adjuntos,
      });

      showAlert({
        title: "Éxito",
        message: "Correo enviado correctamente.",
        buttons: [{ text: "Aceptar" }],
      });

      // Limpiar formulario y selección
      setPara("");
      setCc("");
      setAsunto("");
      setCuerpo("");
      setSeleccionados([]);
    } catch (err) {
      const mensaje =
        err.response?.data?.error || "No se pudo enviar el correo.";
      showAlert({
        title: "Error",
        message: mensaje,
        buttons: [{ text: "Aceptar" }],
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>Nuevo Correo</Text>

        {/* Campos del correo */}
        <View
          style={[
            styles.card,
            { backgroundColor: surfaceBg, borderColor: borderCol },
          ]}
        >
          {/* Para */}
          <View style={{ position: "relative", zIndex: 2 }}>
            <Text style={[styles.label, { color: subColor }]}>Para: *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              value={para}
              onChangeText={(v) => {
                setPara(v);
                setSugPara(filtrarCorreos(v));
              }}
              onBlur={() => {
                blurTimeoutPara.current = setTimeout(() => setSugPara([]), 200);
              }}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={subColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {sugPara.length > 0 && (
              <View
                style={[
                  acStyles.dropdown,
                  { backgroundColor: surfaceBg, borderColor: borderCol },
                  Platform.OS === "web" && {
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                  },
                ]}
              >
                {sugPara.map((email) => (
                  <TouchableOpacity
                    key={email}
                    style={[acStyles.item, { borderBottomColor: borderCol }]}
                    onPress={() =>
                      elegirCorreo(
                        para,
                        email,
                        setPara,
                        setSugPara,
                        blurTimeoutPara,
                      )
                    }
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={13}
                      color={subColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[acStyles.itemText, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* CC */}
          <View style={{ position: "relative", zIndex: 1 }}>
            <Text style={[styles.label, { color: subColor }]}>CC:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              value={cc}
              onChangeText={(v) => {
                setCc(v);
                setSugCC(filtrarCorreos(v));
              }}
              onBlur={() => {
                blurTimeoutCC.current = setTimeout(() => setSugCC([]), 200);
              }}
              placeholder="copia@ejemplo.com"
              placeholderTextColor={subColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {sugCC.length > 0 && (
              <View
                style={[
                  acStyles.dropdown,
                  { backgroundColor: surfaceBg, borderColor: borderCol },
                  Platform.OS === "web" && {
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                  },
                ]}
              >
                {sugCC.map((email) => (
                  <TouchableOpacity
                    key={email}
                    style={[acStyles.item, { borderBottomColor: borderCol }]}
                    onPress={() =>
                      elegirCorreo(cc, email, setCc, setSugCC, blurTimeoutCC)
                    }
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={13}
                      color={subColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[acStyles.itemText, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Asunto */}
          <View>
            <Text style={[styles.label, { color: subColor }]}>Asunto:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              value={asunto}
              onChangeText={setAsunto}
              placeholder="Asunto del correo..."
              placeholderTextColor={subColor}
            />
          </View>

          {/* Mensaje */}
          <Text style={[styles.label, { color: subColor }]}>Mensaje:</Text>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: textColor,
              },
            ]}
            value={cuerpo}
            onChangeText={setCuerpo}
            placeholder="Escribe tu mensaje aquí..."
            placeholderTextColor={subColor}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Adjuntos */}
        <View
          style={[
            styles.card,
            { backgroundColor: surfaceBg, borderColor: borderCol },
          ]}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="paperclip"
              size={20}
              color={highlightCol}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Adjuntar documentos ({seleccionados.length} seleccionados)
            </Text>
          </View>
        </View>

        {/* Buscador */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: inputBg, borderColor: inputBorder },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={16} color={subColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Buscar documento..."
            placeholderTextColor={subColor}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={subColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTROS.map((f) => {
            const isActive = filtroTipo === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.chip,
                  {
                    borderColor: f.color,
                    backgroundColor: isActive ? f.color : surfaceBg,
                  },
                ]}
                onPress={() => setFiltroTipo(f.id)}
              >
                <MaterialCommunityIcons
                  name={f.icono}
                  size={13}
                  color={isActive ? "#fff" : f.color}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? "#fff" : f.color },
                  ]}
                >
                  {f.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista de documentos */}
        <View style={[styles.listaContainer, { borderColor: borderCol }]}>
          {cargandoHistorial ? (
            <ActivityIndicator color={highlightCol} style={{ marginTop: 12 }} />
          ) : historialFiltrado.length === 0 ? (
            <View style={[styles.emptyWrap, { borderColor: borderCol }]}>
              <MaterialCommunityIcons
                name="file-search-outline"
                size={36}
                color={subColor}
              />
              <Text style={[styles.emptyText, { color: subColor }]}>
                {busqueda
                  ? `Sin resultados para "${busqueda}"`
                  : "No hay documentos."}
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {historialFiltrado.map((item) => {
                const config = TIPOS_CONFIG[item.tipo] || {
                  nombre: item.tipo,
                  icono: "file-document-outline",
                  color: "#64748b",
                };
                const seleccionado = estaSeleccionado(item);
                return (
                  <TouchableOpacity
                    key={`${item.id}-${item.tipo}`}
                    style={[
                      styles.actaRow,
                      {
                        backgroundColor: seleccionado
                          ? isDark
                            ? "#1e3a5f"
                            : "#eff6ff"
                          : isDark
                            ? "#0f172a"
                            : "#f8fafc",
                        borderColor: seleccionado ? config.color : borderCol,
                      },
                    ]}
                    onPress={() => toggleSeleccion(item)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        seleccionado && {
                          backgroundColor: config.color,
                          borderColor: config.color,
                        },
                      ]}
                    >
                      {seleccionado && (
                        <MaterialCommunityIcons
                          name="check"
                          size={12}
                          color="#fff"
                        />
                      )}
                    </View>
                    <View
                      style={[
                        styles.tipoIconWrap,
                        { backgroundColor: config.color + "22" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={config.icono}
                        size={18}
                        color={config.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actaTipo, { color: config.color }]}>
                        {config.nombre}
                      </Text>
                      <Text
                        style={[styles.actaCorrelativo, { color: textColor }]}
                      >
                        {item.correlativo}
                      </Text>
                      {item.asunto ? (
                        <Text
                          style={[styles.actaAsunto, { color: subColor }]}
                          numberOfLines={1}
                        >
                          {item.asunto}
                        </Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={22}
                      color={seleccionado ? config.color : subColor}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Botones */}
        <View style={styles.botones}>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              { backgroundColor: surfaceBg, borderColor: borderCol },
            ]}
            onPress={() => router.replace("/dashboard")}
          >
            <Text style={[styles.cancelBtnText, { color: subColor }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: generando ? "#93c5fd" : highlightCol },
            ]}
            onPress={enviarCorreo}
            disabled={generando}
          >
            {generando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sendBtnText}>Enviando correo...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.sendBtnText}>Enviar correo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <Footer />
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 20 },

  card: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: { height: 120, textAlignVertical: "top" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },

  listaContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
    backgroundColor: "transparent",
    overflow: "hidden",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 11, fontWeight: "700" },

  actaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  tipoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actaTipo: { fontSize: 11, fontWeight: "700" },
  actaCorrelativo: { fontSize: 13, fontWeight: "600" },
  actaAsunto: { fontSize: 11, marginTop: 1 },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: { fontSize: 13 },

  botones: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700" },
  sendBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

// ESTILOS PARA AUTOCOMPLETAR CORREOS
const acStyles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
    overflow: "hidden",
    zIndex: 999,
    ...(Platform.OS === "web"
      ? { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999 }
      : {}),
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemText: { fontSize: 13, flex: 1 },
});
