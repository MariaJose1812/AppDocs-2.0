import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import api from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

import Navbar from "../components/navBar";
import Header from "../components/header";
import CustomScrollView from "../components/ScrollView";

import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "—";
  try {
    return new Date(fechaISO).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fechaISO;
  }
};

const ITEMS_POR_PAGINA = 10;

export default function DashboardScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Colores derivados del tema
  const bg = Colors[theme].background;
  const textColor = Colors[theme].text;
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const mutedCol = isDark ? "#475569" : "#cbd5e1";

  // ── Config de tipos (depende de isDark para colores adaptativos) ──────────
  const TIPOS_CONFIG = {
    ENTREGA: {
      nombre: "Acta de Entrega",
      color: "#3ac40d",
      icono: "file-arrow-up-down-outline",
      ruta: "/actaEntrega",
    },
    RETIRO: {
      nombre: "Acta de Retiro",
      color: "#cc7625",
      icono: "file-arrow-left-right-outline",
      ruta: "/actaRetiro",
    },
    RECEPCION: {
      nombre: "Acta de Recepción",
      color: isDark ? "#60a5fa" : "#09528e",
      icono: "file-check-outline",
      ruta: "/actaRecepcion",
    },
    MEMORANDUM: {
      nombre: "Memorándum",
      color: "#70e0f4",
      icono: "email-edit-outline",
      ruta: "/memorandum",
    },
    OFICIO: {
      nombre: "Oficio",
      color: isDark ? "#94a3b8" : "#333333",
      icono: "file-document-outline",
      ruta: "/oficios",
    },
    PASE_SALIDA: {
      nombre: "Pase de Salida",
      color: "#e63946",
      icono: "file-export-outline",
      ruta: "/paseSalida",
    },
    REPORTE: {
      nombre: "Reporte de Daño",
      color: "#2a9d8f",
      icono: "file-alert-outline",
      ruta: "/reportes",
    },
  };

  const OPCIONES_FILTRO = [
    { id: "Todos", nombre: "Todos", color: subColor, icono: "filter-variant" },
    {
      id: "ENTREGA",
      nombre: "Entrega",
      color: TIPOS_CONFIG.ENTREGA.color,
      icono: TIPOS_CONFIG.ENTREGA.icono,
    },
    {
      id: "RETIRO",
      nombre: "Retiro",
      color: TIPOS_CONFIG.RETIRO.color,
      icono: TIPOS_CONFIG.RETIRO.icono,
    },
    {
      id: "RECEPCION",
      nombre: "Recepción",
      color: TIPOS_CONFIG.RECEPCION.color,
      icono: TIPOS_CONFIG.RECEPCION.icono,
    },
    {
      id: "MEMORANDUM",
      nombre: "Memorándum",
      color: TIPOS_CONFIG.MEMORANDUM.color,
      icono: TIPOS_CONFIG.MEMORANDUM.icono,
    },
    {
      id: "OFICIO",
      nombre: "Oficio",
      color: TIPOS_CONFIG.OFICIO.color,
      icono: TIPOS_CONFIG.OFICIO.icono,
    },
    {
      id: "PASE_SALIDA",
      nombre: "Pase Salida",
      color: TIPOS_CONFIG.PASE_SALIDA.color,
      icono: TIPOS_CONFIG.PASE_SALIDA.icono,
    },
    {
      id: "REPORTE",
      nombre: "Reporte",
      color: TIPOS_CONFIG.REPORTE.color,
      icono: TIPOS_CONFIG.REPORTE.icono,
    },
  ];

  const [historialDocs, setHistorialDocs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  const actasFiltradas = historialDocs.filter((acta) => {
    const q = busqueda.toLowerCase();
    return (
      (!busqueda.trim() ||
        (acta.asunto || "").toLowerCase().includes(q) ||
        (acta.tipo_nombre || "").toLowerCase().includes(q) ||
        (acta.correlativo?.toString() || "").includes(q) ||
        (acta.usuario || "").toLowerCase().includes(q)) &&
      (filtroTipo === "Todos" || acta.tipo === filtroTipo)
    );
  });
  const totalPaginas = Math.max(
    1,
    Math.ceil(actasFiltradas.length / ITEMS_POR_PAGINA),
  );

  // Función para cambiar de página y subir el scroll
  const cambiarPagina = (nuevaPagina) => {
    setPagina(nuevaPagina);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const obtenerRangoPaginas = () => {
    const delta = 1; // Cuántas páginas mostrar a los lados de la actual
    const rango = [];
    const rangoConPuntos = [];
    let l;

    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 ||
        i === totalPaginas ||
        (i >= pagina - delta && i <= pagina + delta)
      ) {
        rango.push(i);
      }
    }

    for (let i of rango) {
      if (l) {
        if (i - l === 2) rangoConPuntos.push(l + 1);
        else if (i - l !== 1) rangoConPuntos.push("...");
      }
      rangoConPuntos.push(i);
      l = i;
    }
    return rangoConPuntos;
  };

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, []),
  );

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const response = await api.get("/actas/historial");
      setHistorialDocs(response.data);
    } catch (error) {
      console.log("Error trayendo el historial:", error);
    } finally {
      setCargando(false);
    }
  };

  const abrirActa = (item) => {
    const config = TIPOS_CONFIG[item.tipo];
    if (!config?.ruta) return;
    router.push({
      pathname: config.ruta,
      params: { id: item.id, tipo: item.tipo, mode: "view" },
    });
  };

  const actasPaginadas = actasFiltradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA,
  );

  const renderCard = (item) => {
    const config = TIPOS_CONFIG[item.tipo] || {
      nombre: item.tipo_nombre || item.tipo,
      color: isDark ? "#60a5fa" : "#09528e",
      icono: "file-document-outline",
    };
    return (
      <TouchableOpacity
        key={`${item.id}-${item.tipo}`}
        style={[
          styles.card,
          { borderLeftColor: config.color, backgroundColor: surfaceBg },
        ]}
        onPress={() => abrirActa(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTipoWrap}>
            <MaterialCommunityIcons
              name={config.icono}
              size={16}
              color={config.color}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.cardType, { color: config.color }]}>
              {config.nombre}
            </Text>
          </View>
          <Text style={[styles.cardDate, { color: subColor }]}>
            {formatearFecha(item.fecha)}
          </Text>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: borderCol }]} />

        <View style={styles.cardBodyVertical}>
          {item.asunto ? (
            <Text
              style={[
                styles.cardDetail,
                { color: isDark ? "#cbd5e1" : "#475569" },
              ]}
            >
              <Text style={[styles.bold, { color: textColor }]}>Asunto: </Text>
              {item.asunto}
            </Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text
              style={[
                styles.cardDetail,
                { color: isDark ? "#cbd5e1" : "#475569" },
              ]}
            >
              <Text style={[styles.bold, { color: textColor }]}>
                Creado por:{" "}
              </Text>
              {item.usuario || "—"}
            </Text>
            <Text
              style={[
                styles.cardDetail,
                { color: isDark ? "#cbd5e1" : "#475569" },
              ]}
            >
              <Text style={[styles.bold, { color: textColor }]}>N°: </Text>
              {item.correlativo}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Header />
      <Navbar />

      <CustomScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Historial de Documentos
          </Text>

          {/* Buscador */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: surfaceBg, borderColor: borderCol },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={subColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Buscar por acta, asunto, N°, usuario..."
              placeholderTextColor={subColor}
              value={busqueda}
              onChangeText={(txt) => {
                setBusqueda(txt);
                setPagina(1);
              }}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                style={styles.clearIcon}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={mutedCol}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros */}
          <View style={styles.filtrosWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosScroll}
            >
              {OPCIONES_FILTRO.map((opcion) => {
                const isActive = filtroTipo === opcion.id;
                const chipTextColor = isActive
                  ? isDark
                    ? "#0f172a"
                    : "#fff"
                  : opcion.color;
                return (
                  <TouchableOpacity
                    key={opcion.id}
                    style={[
                      styles.chip,
                      { borderColor: opcion.color },
                      isActive
                        ? { backgroundColor: opcion.color }
                        : { backgroundColor: surfaceBg },
                    ]}
                    onPress={() => {
                      setFiltroTipo(opcion.id);
                      setPagina(1);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={opcion.icono}
                      size={16}
                      color={chipTextColor}
                      style={styles.chipIcon}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: chipTextColor },
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {opcion.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={isDark ? "#60a5fa" : "#09528e"}
              style={{ marginTop: 30 }}
            />
          ) : (
            <View style={styles.listContainer}>
              {actasFiltradas.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    { backgroundColor: surfaceBg, borderColor: borderCol },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      busqueda
                        ? "file-search-outline"
                        : "file-document-multiple-outline"
                    }
                    size={48}
                    color={subColor}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                    {busqueda ? "No hay resultados" : "Sin documentos"}
                  </Text>
                  <Text style={[styles.emptyStateText, { color: subColor }]}>
                    {busqueda
                      ? `No encontramos ningún acta que coincida con "${busqueda}".`
                      : "Aún no hay actas registradas en el historial."}
                  </Text>
                </View>
              ) : (
                <>
                  {actasPaginadas.map(renderCard)}

                  {/* NUEVA SECCIÓN DE PAGINACIÓN */}
                  {totalPaginas > 1 && (
                    <View style={styles.paginationWrapper}>
                      <View style={styles.paginacionContainer}>
                        {/* Botón Anterior */}
                        <TouchableOpacity
                          style={[
                            styles.btnPaso,
                            pagina === 1 && styles.btnDisabled,
                          ]}
                          onPress={() => cambiarPagina(pagina - 1)}
                          disabled={pagina === 1}
                        >
                          <MaterialCommunityIcons
                            name="chevron-left"
                            size={20}
                            color={
                              pagina === 1
                                ? mutedCol
                                : isDark
                                  ? "#60a5fa"
                                  : "#09528e"
                            }
                          />
                        </TouchableOpacity>

                        {/* Números de Página */}
                        <View style={styles.numerosContainer}>
                          {obtenerRangoPaginas().map((p, index) => (
                            <TouchableOpacity
                              key={index}
                              disabled={p === "..."}
                              onPress={() => cambiarPagina(p)}
                              style={[
                                styles.btnNumero,
                                p === pagina && {
                                  backgroundColor: isDark
                                    ? "#60a5fa"
                                    : "#09528e",
                                },
                                p === "..." && { borderWidth: 0 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.txtNumero,
                                  { color: p === pagina ? "#fff" : textColor },
                                  p === "..." && { color: subColor },
                                ]}
                              >
                                {p}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Botón Siguiente */}
                        <TouchableOpacity
                          style={[
                            styles.btnPaso,
                            pagina === totalPaginas && styles.btnDisabled,
                          ]}
                          onPress={() => cambiarPagina(pagina + 1)}
                          disabled={pagina === totalPaginas}
                        >
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={
                              pagina === totalPaginas
                                ? mutedCol
                                : isDark
                                  ? "#60a5fa"
                                  : "#09528e"
                            }
                          />
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={[styles.txtTotalPaginas, { color: subColor }]}
                      >
                        Mostrando {(pagina - 1) * ITEMS_POR_PAGINA + 1} -{" "}
                        {Math.min(
                          pagina * ITEMS_POR_PAGINA,
                          actasFiltradas.length,
                        )}{" "}
                        de {actasFiltradas.length} documentos
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  content: { flex: 1, padding: 20, width: "100%" },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 20 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 15, outlineStyle: "none" },
  clearIcon: { padding: 5 },

  filtrosWrapper: { marginBottom: 20, height: 36 },
  filtrosScroll: { gap: 10, paddingRight: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipIcon: { marginRight: 6 },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { fontWeight: "700" },

  listContainer: { gap: 12 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTipoWrap: { flexDirection: "row", alignItems: "center" },
  cardType: { fontSize: 15, fontWeight: "700" },
  cardDate: { fontSize: 12 },
  cardDivider: { height: 1, marginBottom: 10 },
  cardBodyVertical: { flexDirection: "column" },
  cardDetail: { fontSize: 14, marginBottom: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bold: { fontWeight: "700" },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyStateText: { fontSize: 14, textAlign: "center", paddingHorizontal: 20 },

  paginationWrapper: {
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },
  paginacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  numerosContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  btnNumero: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  txtNumero: {
    fontSize: 14,
    fontWeight: "700",
  },
  btnPaso: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  btnDisabled: {
    opacity: 0.4,
    borderColor: "transparent",
  },
  txtTotalPaginas: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 5,
  },
});
