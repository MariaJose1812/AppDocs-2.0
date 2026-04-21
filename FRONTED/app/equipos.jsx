import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";
import { useAlert } from "../context/alertContext";
import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

const ITEMS_POR_PAGINA = 12;

const TI = ({ value, onChangeText, placeholder, colors, style }) => (
  <TextInput
    style={[
      {
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: colors.text,
      },
      style,
    ]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    autoFocus
  />
);

const TP = ({ selectedValue, onValueChange, enabled, children, colors }) => (
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

function CatalogoModal({
  visible,
  titulo,
  onClose,
  onSave,
  guardando,
  children,
  labelNombre,
  placeholderNombre,
  colors,
}) {
  const [nombre, setNombre] = useState("");

  const handleClose = () => {
    setNombre("");
    onClose();
  };
  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave(nombre.trim(), () => setNombre(""));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 24,
            width: "90%",
            maxWidth: 420,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            {titulo}
          </Text>

          {/* Campos extra */}
          {children}

          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.textMuted,
              marginBottom: 6,
              marginTop: 10,
              textTransform: "uppercase",
            }}
          >
            {labelNombre || "Nombre"}
          </Text>
          <TI
            value={nombre}
            onChangeText={setNombre}
            placeholder={placeholderNombre || "Nombre..."}
            colors={colors}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 11,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={handleClose}
            >
              <Text style={{ color: colors.textMuted, fontWeight: "700" }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  backgroundColor: "#09528e",
                  paddingVertical: 11,
                  borderRadius: 8,
                  alignItems: "center",
                },
                guardando && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={guardando}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {guardando ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, sub, color, colors }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: (color || "#09528e") + "18",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: (color || "#09528e") + "40",
        flexShrink: 1,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: color || "#09528e",
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
      {sub && (
        <Text style={{ fontSize: 10, color: colors.textMuted }}>· {sub}</Text>
      )}
    </View>
  );
}

// PANTALLA PRINCIPAL
export default function GestionEquiposScreen() {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const isDark = theme === "dark";

  const bg = Colors?.[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors?.[theme]?.text || (isDark ? "#f8fafc" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const accentCol = isDark ? "#60a5fa" : "#09528e";
  const altRowBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";

  const colors = useMemo(
    () => ({
      text: textColor,
      textMuted: subColor,
      surface: surfaceBg,
      border: borderCol,
      accent: accentCol,
      inputBg,
      inputBorder: borderCol,
    }),
    [textColor, subColor, surfaceBg, borderCol, accentCol, inputBg],
  );

  // DATOS CATÁLOGOS
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);

  // EQUIPOS
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState("Todos");

  // MODALES
  const [modalTipo, setModalTipo] = useState(false);
  const [modalMarca, setModalMarca] = useState(false);
  const [modalModelo, setModalModelo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos en cascada para los modales
  const [selTipoParaMarca, setSelTipoParaMarca] = useState(""); 
  const [selTipoParaModelo, setSelTipoParaModelo] = useState(""); 
  const [selMarcaParaModelo, setSelMarcaParaModelo] = useState(""); 

  // Carga
  const cargarCatalogos = useCallback(async () => {
    try {
      const [rT, rM, rMo] = await Promise.all([
        api.get("/catalogos/tiposEquipo"),
        api.get("/catalogos/marcas"),
        api.get("/catalogos/modelos"),
      ]);
      setTipos(rT.data);
      setMarcas(rM.data);
      setModelos(rMo.data);
    } catch (e) {
      console.error("Error cargando catálogos:", e);
    }
  }, []);

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/equipos");
      setEquipos(res.data);
      setPagina(1);
    } catch (e) {
      console.error("Error cargando equipos:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
    cargarEquipos();
  }, []);
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtro]);

  // MARCAS FILTRADAS PR TIPO
  const marcasDeTipo = useMemo(
    () => marcas.filter((m) => String(m.idTipo) === String(selTipoParaModelo)),
    [marcas, selTipoParaModelo],
  );

  // AGREGAR TIPO
  const guardarTipo = async (nombre, resetNombre) => {
    setGuardando(true);
    try {
      const res = await api.post("/catalogos/tiposEquipo", { tipo: nombre });
      setTipos((prev) => [...prev, res.data]);
      resetNombre();
      setModalTipo(false);
    } catch (e) {
      showAlert({
        title: "Error",
        message: e.response?.data?.error || "No se pudo agregar el tipo.",
      });
    } finally {
      setGuardando(false);
    }
  };

  //AGREGAR MARCA
  const guardarMarca = async (nombre, resetNombre) => {
    if (!selTipoParaMarca) {
      showAlert({
        title: "Atención",
        message: "Selecciona el tipo de equipo al que pertenece la marca.",
      });
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post("/catalogos/marcas", {
        marca: nombre,
        idTipo: parseInt(selTipoParaMarca),
      });
      setMarcas((prev) => [...prev, res.data]);
      resetNombre();
      setSelTipoParaMarca("");
      setModalMarca(false);
    } catch (e) {
      showAlert({
        title: "Error",
        message: e.response?.data?.error || "No se pudo agregar la marca.",
      });
    } finally {
      setGuardando(false);
    }
  };

  //AGREGAR MODELO
  const guardarModelo = async (nombre, resetNombre) => {
    if (!selTipoParaModelo) {
      showAlert({
        title: "Atención",
        message: "Selecciona el tipo de equipo.",
      });
      return;
    }
    if (!selMarcaParaModelo) {
      showAlert({ title: "Atención", message: "Selecciona la marca." });
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post("/catalogos/modelos", {
        modelo: nombre,
        idMarca: parseInt(selMarcaParaModelo),
      });
      setModelos((prev) => [...prev, res.data]);
      resetNombre();
      setSelTipoParaModelo("");
      setSelMarcaParaModelo("");
      setModalModelo(false);
    } catch (e) {
      showAlert({
        title: "Error",
        message: e.response?.data?.error || "No se pudo agregar el modelo.",
      });
    } finally {
      setGuardando(false);
    }
  };

  // PAGINACIÓN
  const equiposFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return equipos.filter((eq) => {
      const textoOk =
        !q ||
        (eq.tipo || "").toLowerCase().includes(q) ||
        (eq.marca || "").toLowerCase().includes(q) ||
        (eq.modelo || "").toLowerCase().includes(q) ||
        (eq.serie || "").toLowerCase().includes(q) ||
        (eq.numFicha || "").toLowerCase().includes(q) ||
        (eq.numInv || "").toLowerCase().includes(q);
      const filtroOk = filtro === "Todos" || eq.origen === filtro;
      return textoOk && filtroOk;
    });
  }, [equipos, busqueda, filtro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(equiposFiltrados.length / ITEMS_POR_PAGINA),
  );
  const equiposPagina = equiposFiltrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA,
  );

  const renderEquipo = ({ item, index }) => (
    <View
      style={[
        st.equipoRow,
        { backgroundColor: index % 2 === 0 ? altRowBg : "transparent" },
      ]}
    >
      <View style={[st.equipoIcon, { backgroundColor: accentCol + "22" }]}>
        <MaterialCommunityIcons name="laptop" size={18} color={accentCol} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.equipoTitulo, { color: textColor }]}>
          {item.tipo} · {item.marca} {item.modelo}
        </Text>
        <Text style={[st.equipoSub, { color: subColor }]}>
          S/N: {item.serie || "N/A"}
          {"  "}Ficha: {item.numFicha || "N/A"}
          {"  "}Inv: {item.numInv || "N/A"}
        </Text>
      </View>
      <View
        style={[
          st.origenBadge,
          {
            backgroundColor:
              item.origen === "Entrega"
                ? "#dcfce7"
                : item.origen === "Retiro"
                  ? "#fef3c7"
                  : "#f1f5f9",
          },
        ]}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color:
              item.origen === "Entrega"
                ? "#15803d"
                : item.origen === "Retiro"
                  ? "#92400e"
                  : "#64748b",
          }}
        >
          {item.origen}
        </Text>
      </View>
    </View>
  );

  //PAGINADOR
  const Paginador = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: borderCol,
        flexWrap: "wrap",
      }}
    >
      <TouchableOpacity
        disabled={pagina === 1}
        onPress={() => setPagina((p) => Math.max(1, p - 1))}
        style={[
          st.pageBtn,
          {
            backgroundColor: surfaceBg,
            borderColor: borderCol,
            opacity: pagina === 1 ? 0.4 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={18}
          color={subColor}
        />
      </TouchableOpacity>
      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
        .filter(
          (n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1,
        )
        .reduce((acc, n, i, arr) => {
          if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
          acc.push(n);
          return acc;
        }, [])
        .map((item, i) =>
          item === "..." ? (
            <Text key={`d-${i}`} style={{ color: subColor }}>
              …
            </Text>
          ) : (
            <TouchableOpacity
              key={item}
              onPress={() => setPagina(item)}
              style={[
                st.pageBtn,
                {
                  backgroundColor: pagina === item ? accentCol : surfaceBg,
                  borderColor: pagina === item ? accentCol : borderCol,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: pagina === item ? "#fff" : subColor,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ),
        )}
      <TouchableOpacity
        disabled={pagina === totalPaginas}
        onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        style={[
          st.pageBtn,
          {
            backgroundColor: surfaceBg,
            borderColor: borderCol,
            opacity: pagina === totalPaginas ? 0.4 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={subColor}
        />
      </TouchableOpacity>
      <Text style={{ fontSize: 11, color: subColor, marginLeft: 6 }}>
        {(pagina - 1) * ITEMS_POR_PAGINA + 1}–
        {Math.min(pagina * ITEMS_POR_PAGINA, equiposFiltrados.length)} de{" "}
        {equiposFiltrados.length}
      </Text>
    </View>
  );

  // VISTA DE CATÁLOGOS
  const renderCatalogos = () => (
    <View>
      {tipos.map((tipo) => {
        const marcasDelTipo = marcas.filter(
          (m) => String(m.idTipo) === String(tipo.idTipo),
        );
        return (
          <View
            key={tipo.idTipo}
            style={[
              st.tipoBloque,
              { borderColor: borderCol, backgroundColor: altRowBg },
            ]}
          >
            {/* Encabezado tipo */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <View style={[st.tipoDot, { backgroundColor: accentCol }]} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: textColor,
                  flex: 1,
                }}
              >
                {tipo.tipo}
              </Text>
              <Text style={{ fontSize: 11, color: subColor }}>
                {marcasDelTipo.length} marca
                {marcasDelTipo.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {marcasDelTipo.length === 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  color: subColor,
                  fontStyle: "italic",
                  marginLeft: 16,
                }}
              >
                Sin marcas aún — agrega una marcando este tipo
              </Text>
            ) : (
              marcasDelTipo.map((marca) => {
                const modelosDeLaMarca = modelos.filter(
                  (mo) => String(mo.idMarca) === String(marca.idMarca),
                );
                return (
                  <View
                    key={marca.idMarca}
                    style={[st.marcaBloque, { borderColor: borderCol + "80" }]}
                  >
                    {/* Nombre de marca */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="tag-outline"
                        size={13}
                        color={accentCol}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: textColor,
                        }}
                      >
                        {marca.marca}
                      </Text>
                      <Text style={{ fontSize: 11, color: subColor }}>
                        ({modelosDeLaMarca.length} modelo
                        {modelosDeLaMarca.length !== 1 ? "s" : ""})
                      </Text>
                    </View>
                    {/* Modelos en chips */}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        paddingLeft: 20,
                      }}
                    >
                      {modelosDeLaMarca.length === 0 ? (
                        <Text
                          style={{
                            fontSize: 11,
                            color: subColor,
                            fontStyle: "italic",
                          }}
                        >
                          Sin modelos
                        </Text>
                      ) : (
                        modelosDeLaMarca.map((mo) => (
                          <View
                            key={mo.idModelo}
                            style={[
                              st.modeloChip,
                              {
                                backgroundColor: isDark ? "#334155" : "#e0f2fe",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: isDark ? "#93c5fd" : "#0369a1",
                              }}
                            >
                              {mo.modelo}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );
      })}
      {tipos.length === 0 && (
        <Text
          style={{
            color: subColor,
            fontSize: 13,
            fontStyle: "italic",
            textAlign: "center",
            paddingVertical: 12,
          }}
        >
          No hay tipos de equipo registrados aún.
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[st.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />

      <CustomScrollView
        contentContainerStyle={st.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 900 }}>
          {/* Título */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginBottom: 22,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: textColor,
                letterSpacing: 1,
              }}
            >
              Catálogos de Equipos
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: borderCol,
                opacity: 0.6,
              }}
            />
          </View>

          {/*CARD CATÁLOGOS*/}
          <View style={[st.card, { backgroundColor: surfaceBg }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <MaterialCommunityIcons
                name="tag-multiple-outline"
                size={17}
                color={accentCol}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: textColor,
                  flex: 1,
                }}
              >
                Tipos · Marcas · Modelos
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: subColor, marginBottom: 18 }}>
              Al agregar una marca debes indicar a qué tipo pertenece. Al
              agregar un modelo, debes indicar marca y tipo.
            </Text>

            {/* Botones de agregar */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <TouchableOpacity
                style={[st.addBtn, { backgroundColor: accentCol }]}
                onPress={() => setModalTipo(true)}
              >
                <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                <Text style={st.addBtnTxt}>Tipo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.addBtn, { backgroundColor: "#7c3aed" }]}
                onPress={() => {
                  setSelTipoParaMarca("");
                  setModalMarca(true);
                }}
              >
                <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                <Text style={st.addBtnTxt}>Marca</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.addBtn, { backgroundColor: "#0369a1" }]}
                onPress={() => {
                  setSelTipoParaModelo("");
                  setSelMarcaParaModelo("");
                  setModalModelo(true);
                }}
              >
                <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                <Text style={st.addBtnTxt}>Modelo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  st.addBtn,
                  { backgroundColor: isDark ? "#334155" : "#e2e8f0" },
                ]}
                onPress={() => {
                  cargarCatalogos();
                  cargarEquipos();
                }}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={14}
                  color={accentCol}
                />
                <Text style={[st.addBtnTxt, { color: accentCol }]}>
                  Actualizar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vista jerárquica */}
            {renderCatalogos()}
          </View>

          {/* CARD EQUIOOS REGISTRADOS*/}
          <View style={[st.card, { backgroundColor: surfaceBg }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <MaterialCommunityIcons
                name="monitor-multiple"
                size={17}
                color={accentCol}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: textColor,
                  flex: 1,
                }}
              >
                Equipos en actas
              </Text>
              <View
                style={{
                  backgroundColor: accentCol + "22",
                  borderRadius: 20,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: accentCol }}
                >
                  {equiposFiltrados.length}
                </Text>
              </View>
            </View>

            {/* Búsqueda */}
            <View
              style={[
                st.searchBox,
                { backgroundColor: altRowBg, borderColor: borderCol },
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={16}
                color={subColor}
              />
              <TextInput
                style={[st.searchInput, { color: textColor }]}
                placeholder="Buscar por tipo, marca, modelo, serie..."
                placeholderTextColor={subColor}
                value={busqueda}
                onChangeText={setBusqueda}
                {...(Platform.OS === "web" ? { outlineStyle: "none" } : {})}
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

            {/* Filtros */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["Todos", "Entrega", "Retiro"].map((op) => (
                <TouchableOpacity
                  key={op}
                  style={[
                    st.filtroBtn,
                    {
                      backgroundColor: filtro === op ? accentCol : altRowBg,
                      borderColor: filtro === op ? accentCol : borderCol,
                    },
                  ]}
                  onPress={() => {
                    setFiltro(op);
                    setPagina(1);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: filtro === op ? "#fff" : subColor,
                    }}
                  >
                    {op}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lista */}
            {cargando ? (
              <ActivityIndicator
                size="large"
                color={accentCol}
                style={{ paddingVertical: 30 }}
              />
            ) : equiposFiltrados.length === 0 ? (
              <View
                style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}
              >
                <MaterialCommunityIcons
                  name="laptop-off"
                  size={36}
                  color={subColor}
                />
                <Text style={{ fontSize: 13, color: subColor }}>
                  {busqueda ? "Sin resultados." : "No hay equipos registrados."}
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={equiposPagina}
                  keyExtractor={(item, i) => String(item.idEquipo || i)}
                  renderItem={renderEquipo}
                  scrollEnabled={false}
                />
                {totalPaginas > 1 && <Paginador />}
              </>
            )}
          </View>
        </View>
        <Footer />
      </CustomScrollView>

      {/* NUEVO TIPO */}
      <CatalogoModal
        visible={modalTipo}
        titulo="➕ Nuevo tipo de equipo"
        labelNombre="Nombre del tipo"
        placeholderNombre="Ej: Laptop, Impresora, Teclado..."
        onClose={() => setModalTipo(false)}
        onSave={guardarTipo}
        guardando={guardando}
        colors={colors}
      />

      {/* NUEVA MARCA*/}
      <CatalogoModal
        visible={modalMarca}
        titulo="➕ Nueva marca"
        labelNombre="Nombre de la marca"
        placeholderNombre="Ej: Dell, HP, Lenovo..."
        onClose={() => {
          setSelTipoParaMarca("");
          setModalMarca(false);
        }}
        onSave={guardarMarca}
        guardando={guardando}
        colors={colors}
      >
        {/* Selector de tipo (paso previo) */}
        <View style={{ marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: subColor,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Tipo de equipo al que pertenece *
          </Text>
          <TP
            selectedValue={String(selTipoParaMarca)}
            onValueChange={setSelTipoParaMarca}
            colors={colors}
          >
            <Picker.Item
              label="Selecciona el tipo..."
              value=""
              color={subColor}
            />
            {tipos.map((t) => (
              <Picker.Item
                key={t.idTipo}
                label={t.tipo}
                value={String(t.idTipo)}
                color={colors.text}
              />
            ))}
          </TP>
          {!selTipoParaMarca && (
            <Text style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
              ⚠ Debes seleccionar el tipo para poder agregar la marca
            </Text>
          )}
        </View>
      </CatalogoModal>

      {/* NUEVO MODELO*/}
      <CatalogoModal
        visible={modalModelo}
        titulo="➕ Nuevo modelo"
        labelNombre="Nombre del modelo"
        placeholderNombre="Ej: Optiplex 7020, EliteBook 840..."
        onClose={() => {
          setSelTipoParaModelo("");
          setSelMarcaParaModelo("");
          setModalModelo(false);
        }}
        onSave={guardarModelo}
        guardando={guardando}
        colors={colors}
      >
        {/* ELEGIR TIPO */}
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: subColor,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            1. Tipo de equipo *
          </Text>
          <TP
            selectedValue={String(selTipoParaModelo)}
            onValueChange={(val) => {
              setSelTipoParaModelo(val);
              setSelMarcaParaModelo("");
            }}
            colors={colors}
          >
            <Picker.Item
              label="Selecciona el tipo..."
              value=""
              color={subColor}
            />
            {tipos.map((t) => (
              <Picker.Item
                key={t.idTipo}
                label={t.tipo}
                value={String(t.idTipo)}
                color={colors.text}
              />
            ))}
          </TP>
        </View>

        {/* ELEGIR MARCA */}
        <View style={{ marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: subColor,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            2. Marca *
          </Text>
          <TP
            selectedValue={String(selMarcaParaModelo)}
            onValueChange={setSelMarcaParaModelo}
            enabled={!!selTipoParaModelo && marcasDeTipo.length > 0}
            colors={colors}
          >
            <Picker.Item
              label={
                !selTipoParaModelo
                  ? "Elige tipo primero"
                  : marcasDeTipo.length === 0
                    ? "Sin marcas para ese tipo"
                    : "Selecciona la marca..."
              }
              value=""
              color={subColor}
            />
            {marcasDeTipo.map((m) => (
              <Picker.Item
                key={m.idMarca}
                label={m.marca}
                value={String(m.idMarca)}
                color={colors.text}
              />
            ))}
          </TP>
          {selTipoParaModelo && marcasDeTipo.length === 0 && (
            <Text style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
              ⚠ Agrega primero una marca para ese tipo
            </Text>
          )}
        </View>
      </CatalogoModal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    maxWidth: 900,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tipoBloque: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  tipoDot: { width: 8, height: 8, borderRadius: 4 },
  marcaBloque: {
    borderLeftWidth: 2,
    marginLeft: 16,
    paddingLeft: 12,
    marginBottom: 10,
    paddingVertical: 4,
  },
  modeloChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13 },
  filtroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  equipoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 6,
    gap: 10,
    borderRadius: 6,
  },
  equipoIcon: {
    borderRadius: 8,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  equipoTitulo: { fontSize: 13, fontWeight: "700" },
  equipoSub: { fontSize: 11, marginTop: 1 },
  origenBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pageBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
});
