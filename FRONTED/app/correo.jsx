import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";
import { FlatList } from "react-native";
import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";
import { generarHTMLRecepcion } from "../utils/actaRecepcionHTML";

/* ── Configuración de tipos de documentos ── */
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
    color: "#09528e",
  },
  MEMORANDUM: {
    nombre: "Memorándum",
    icono: "email-edit-outline",
    color: "#70e0f4",
  },
  OFICIO: {
    nombre: "Oficio",
    icono: "file-document-outline",
    color: "#334155",
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

export default function CorreoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Colores dinámicos según tema
  const bg = Colors[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors[theme]?.text || (isDark ? "#f1f5f9" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";
  const highlightCol = isDark ? "#60a5fa" : "#09528e";

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

  // Carga inicial y al enfocar
  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, []),
  );

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
    oficio_encabezado: "OFICIO",
    pase_salida_encabezado: "PASE_SALIDA",
    reporte_dano_encabezado: "REPORTE",
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
      const colorLinea = c?.colorLinea || "#1eb9de";

      let detalle = {};
      try {
        const endpoint =
          tipoNorm === "RECEPCION"
            ? `/actas/detalle/RECEPCION/${item.id}`
            : `/actas/procesadas/${tipoNorm}/${item.id}`;
        const res = await api.get(endpoint);
        detalle = (Array.isArray(res.data) ? res.data[0] : res.data) || {};
      } catch (e) {
        console.warn("No se pudo cargar detalle:", e.message);
      }

      const correlativo = detalle?.correlativo || item.correlativo || "";

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

      const asunto = detalle?.asunto || item.asunto || "";
      const descripcion = detalle?.descripcion || "";
      const observacion = detalle?.observacion || "";
      const receptorNombre =
        detalle?.receptor?.nombre || detalle?.receptorNombre || "—";
      const receptorCargo =
        detalle?.receptor?.cargo || detalle?.receptorCargo || "";
      const emisorNombre =
        detalle?.emisor?.nombre || detalle?.usuarioCreador || "—";
      const emisorCargo = detalle?.emisor?.cargo || detalle?.cargoCreador || "";

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

      const orgDestinatario = detalle?.receptor?.unidad
        ? `${receptorCargo} - ${detalle.receptor.unidad}`
        : detalle?.receptor?.oficina
          ? `${receptorCargo} - ${detalle.receptor.oficina}`
          : receptorCargo;

      const columnasTabla =
        c?.columnasTabla ||
        (tipoNorm === "ENTREGA" || tipoNorm === "RETIRO"
          ? ["marca", "modelo", "serie", "asignado"]
          : ["marca", "modelo", "serie"]);
      const colLabels = {
        marca: c?.labelMarca || "Marca",
        modelo: c?.labelModelo || "Modelo",
        serie: c?.labelSerie || "S/N",
        asignado: c?.labelAsignado || "Asignado a",
      };

      const theadHTML = columnasTabla
        .map(
          (col) =>
            `<th style="border:1px solid #555;padding:5px;background:#f0f0f0;font-size:10px;text-align:center">${colLabels[col]}</th>`,
        )
        .join("");

      const itemsEquipos = detalle?.items || [];
      const filasTabla = itemsEquipos
        .map((eq) => {
          const celdas = columnasTabla
            .map((col) => {
              if (col === "marca")
                return `<td style="border:1px solid #555;padding:5px;font-size:10px;text-align:center">${eq.marca || "N/A"}</td>`;
              if (col === "modelo")
                return `<td style="border:1px solid #555;padding:5px;font-size:10px;text-align:center">${eq.modelo || "N/A"}</td>`;
              if (col === "serie") {
                return `<td style="border:1px solid #555;padding:5px;font-size:10px;text-align:center">S/N: ${eq.serie || "N/A"}<br/><span style="font-size:9px;color:#555;">
                ${c?.mostrarNumFicha ? "Ficha: " + (eq.numFicha || "N/A") : ""}
                ${c?.mostrarNumFicha && c?.mostrarNumInv ? " | " : ""}
                ${c?.mostrarNumInv ? "Inv: " + (eq.numInv || "N/A") : ""}
                </span>
                </td> `;
              }
              if (col === "asignado")
                return `<td style="border:1px solid #555;padding:5px;font-size:10px;text-align:center">${eq.asignado_a || "—"}</td>`;
              return `<td style="border:1px solid #555;padding:5px;font-size:10px;text-align:center">—</td>`;
            })
            .join("");
          return `<tr>${celdas}</tr>`;
        })
        .join("");

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding: 20mm 18mm; color: #000; }
</style></head><body>
  <table style="width:100%;border-collapse:collapse;border-bottom:2px solid ${colorLinea};padding-bottom:8px;margin-bottom:18px;">
    <tr>
      <td style="width:110px;text-align:left;vertical-align:middle">
        <img src="${uriConadeh}" style="height:60px;object-fit:contain;" alt="CONADEH"/>
      </td>
      <td style="text-align:center;vertical-align:middle">
        <p style="font-weight:bold;font-size:12px;text-transform:uppercase;margin:0;">Comisionado Nacional de los Derechos Humanos</p>
        <p style="font-size:10px;margin:0;color:#444;">(CONADEH) — Honduras, C.A.</p>
        <p style="font-weight:bold;font-size:13px;text-decoration:underline;margin-top:6px;text-transform:uppercase;">${config.nombre} N° ${correlativo}</p>
      </td>
      <td style="width:110px;text-align:right;vertical-align:middle">
        <img src="${uriInfo}" style="height:60px;object-fit:contain;" alt="InfoTec"/>
      </td>
    </tr>
  </table>
  <table style="width:100%;margin-bottom:18px;border-collapse:collapse;">
    ${receptorNombre !== "—" ? `<tr><td style="font-weight:bold;width:65px;padding:2px 4px;">Para:</td><td style="padding:2px 4px;"><strong>${receptorNombre}</strong><br/><span style="font-size:10px">${orgDestinatario}</span></td></tr>` : ""}
    ${emisorNombre !== "—" ? `<tr><td style="font-weight:bold;width:65px;padding:2px 4px;">De:</td><td style="padding:2px 4px;"><strong>${emisorNombre}</strong><br/><span style="font-size:10px">${emisorCargo}</span></td></tr>` : ""}
    ${asunto ? `<tr><td style="font-weight:bold;width:65px;padding:2px 4px;">Asunto:</td><td style="padding:2px 4px;">${asunto}</td></tr>` : ""}
    ${descripcion ? `<tr><td style="font-weight:bold;width:65px;padding:2px 4px;">Descripción:</td><td style="padding:2px 4px;">${descripcion}</td></tr>` : ""}
    <tr><td style="font-weight:bold;width:65px;padding:2px 4px;">Fecha:</td><td style="padding:2px 4px;">Tegucigalpa M.D.C., ${fecha}</td></tr>
  </table>
  <hr style="border:none;border-top:2px solid ${colorLinea};margin:14px 0;" />
  ${filasTabla ? `<table style="width:100%;border-collapse:collapse;margin-bottom:15px;"><thead><tr>${theadHTML}</tr></thead><tbody>${filasTabla}</tbody></table>` : ""}
  ${observacion ? `<p style="font-size:11px;margin:8px 0 20px 0;"><strong>Pd.</strong> ${observacion}</p>` : ""}
  <table style="width:100%;margin-top:60px;border-collapse:collapse;">
    <tr>
      <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:6px;font-size:11px;">
        <strong>${receptorNombre !== "—" ? receptorNombre : "___________"}</strong><br/>${receptorCargo}
      </td>
      <td style="width:16%;"></td>
      <td style="width:42%;text-align:center;border-top:1px solid #000;padding-top:6px;font-size:11px;">
        <strong>${emisorNombre !== "—" ? emisorNombre : "___________"}</strong><br/>${emisorCargo}
      </td>
    </tr>
  </table>
</body></html>`;

      return {
        html: htmlContent,
        nombre: `${config.nombre}_${correlativo}.pdf`,
      };
    } catch (err) {
      console.error("Error generando HTML:", err);
      return null;
    }
  };

  //ENVIO DEL CORREO
  const enviarCorreo = async () => {
    if (!para.trim()) {
      Alert.alert("Atención", "El campo Para es obligatorio.");
      return;
    }
    if (seleccionados.length === 0) {
      Alert.alert(
        "Atención",
        "Debes seleccionar al menos un documento para adjuntar.",
      );
      return;
    }

    setGenerando(true);
    try {
      // Generar HTMLs para todos los documentos seleccionados
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
        Alert.alert("Error", "No se pudieron generar los adjuntos.");
        setGenerando(false);
        return;
      }

      // Enviar al backend
      await api.post("/correo/enviar", {
        para,
        cc: cc || "",
        asunto: asunto || "(Sin asunto)",
        cuerpo: cuerpo || "",
        adjuntos,
      });

      if (Platform.OS === "web") window.alert("Correo enviado correctamente.");
      else Alert.alert("Éxito", "Correo enviado correctamente.");

      // Limpiar formulario
      setPara("");
      setCc("");
      setAsunto("");
      setCuerpo("");
      setSeleccionados([]);
    } catch (err) {
      const mensaje =
        err.response?.data?.error || "No se pudo enviar el correo.";
      if (Platform.OS === "web") window.alert("Error: " + mensaje);
      else Alert.alert("Error", mensaje);
    } finally {
      setGenerando(false);
    }
  };

  /* ── Render ── */
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
          {[
            {
              label: "Para: *",
              value: para,
              onChange: setPara,
              placeholder: "correo@ejemplo.com",
              keyboard: "email-address",
            },
            {
              label: "CC:",
              value: cc,
              onChange: setCc,
              placeholder: "copia@ejemplo.com",
              keyboard: "email-address",
            },
            {
              label: "Asunto:",
              value: asunto,
              onChange: setAsunto,
              placeholder: "Asunto del correo...",
            },
          ].map(({ label, value, onChange, placeholder, keyboard }) => (
            <View key={label}>
              <Text style={[styles.label, { color: subColor }]}>{label}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={subColor}
                keyboardType={keyboard || "default"}
                autoCapitalize="none"
              />
            </View>
          ))}
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

        {/* Lista de documentos con altura limitada y scroll interno */}
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
            <FlatList
              data={historialFiltrado}
              keyExtractor={(item) => `${item.id}-${item.tipo}`}
              renderItem={({ item }) => {
                const config = TIPOS_CONFIG[item.tipo] || {
                  nombre: item.tipo,
                  icono: "file-document-outline",
                  color: "#64748b",
                };
                const seleccionado = estaSeleccionado(item);
                return (
                  <TouchableOpacity
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
              }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          )}
        </View>

        {/* Botones */}
        <View style={styles.botones}>
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
    maxHeight: 300,
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
