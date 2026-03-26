import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

const ITEMS_POR_PAGINA = 10;

const mostrarAlerta = (titulo, mensaje = "", botones = []) => {
  if (Platform.OS === "web") {
    const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
    if (botones.length > 1) {
      const ok = window.confirm(texto);
      if (ok) botones.find((b) => b.style !== "cancel")?.onPress?.();
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

//AGREGAR CATÁLOGO
function CatalogoModal({ visible, titulo, placeholder, onClose, onSave }) {
  const [valor, setValor] = useState("");

  const handleSave = () => {
    if (!valor.trim()) {
      mostrarAlerta("Atención", "El campo no puede estar vacío.");
      return;
    }
    onSave(valor.trim());
    setValor("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={mStyles.overlay}>
        <View style={mStyles.box}>
          <Text style={mStyles.titulo}>{titulo}</Text>
          <TextInput
            style={mStyles.input}
            placeholder={placeholder}
            value={valor}
            onChangeText={setValor}
            autoFocus
          />
          <View style={mStyles.row}>
            <TouchableOpacity
              style={mStyles.btnCancelar}
              onPress={() => {
                setValor("");
                onClose();
              }}
            >
              <Text style={mStyles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mStyles.btnGuardar} onPress={handleSave}>
              <Text style={mStyles.btnGuardarTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 18,
  },
  row: { flexDirection: "row", gap: 10 },
  btnCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },
  btnCancelarTxt: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  btnGuardar: {
    flex: 1,
    backgroundColor: "#09528e",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },
  btnGuardarTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

function Badge({ label }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// LABEL + BOTON AGREGAR
function CatalogoSeccion({ titulo, items, campoLabel, onAgregar }) {
  return (
    <View style={styles.catalogoCol}>
      <View style={styles.catalogoHeader}>
        <Text style={styles.catalogoLabel}>{titulo}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAgregar}>
          <MaterialCommunityIcons name="plus" size={13} color="#fff" />
          <Text style={styles.addBtnTxt}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.badgesWrap}>
        {items.length === 0 ? (
          <Text style={styles.emptyHint}>Sin registros</Text>
        ) : (
          items.map((item, i) => <Badge key={i} label={item[campoLabel]} />)
        )}
      </View>
    </View>
  );
}

//PANTALLA PRINCIPAL
export default function GestionEquiposScreen() {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);

  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [filtroOrigen, setFiltroOrigen] = useState("Todos");

  const [modalTipo, setModalTipo] = useState(false);
  const [modalMarca, setModalMarca] = useState(false);
  const [modalModelo, setModalModelo] = useState(false);

  //CARGA
  const cargarCatalogos = useCallback(async () => {
    try {
      const [rTipo, rMarca, rModelo] = await Promise.all([
        api.get("/catalogos/tiposEquipo"),
        api.get("/catalogos/marcas"),
        api.get("/catalogos/modelos"),
      ]);
      setTiposEquipo(rTipo.data);
      setMarcas(rMarca.data);
      setModelos(rModelo.data);
    } catch (e) {
      console.error("Error cargando catálogos:", e);
    }
  }, []);

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/equipos");
      console.log("Datos de un equipo:", res.data[0]);
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

  // Reset página al buscar
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroOrigen]);

  //CATÁLOGOS POST
  const agregarTipo = async (valor) => {
    try {
      await api.post("/catalogos/tiposEquipo", { tipo: valor });
      setModalTipo(false);
      await cargarCatalogos();
    } catch (e) {
      mostrarAlerta(
        "Error",
        e.response?.data?.error || "No se pudo agregar el tipo.",
      );
    }
  };

  const agregarMarca = async (valor) => {
    try {
      await api.post("/catalogos/marcas", { marca: valor });
      setModalMarca(false);
      await cargarCatalogos();
    } catch (e) {
      mostrarAlerta(
        "Error",
        e.response?.data?.error || "No se pudo agregar la marca.",
      );
    }
  };

  const agregarModelo = async (valor) => {
    try {
      await api.post("/catalogos/modelos", { modelo: valor });
      setModalModelo(false);
      await cargarCatalogos();
    } catch (e) {
      mostrarAlerta(
        "Error",
        e.response?.data?.error || "No se pudo agregar el modelo.",
      );
    }
  };

  //PAGINACIÓN
  const equiposFiltrados = equipos.filter((eq) => {
    // 1. Filtro de búsqueda por texto
    const q = busqueda.toLowerCase();
    const coincideTexto = !busqueda.trim() || (
      (eq.tipo || "").toLowerCase().includes(q) ||
      (eq.marca || "").toLowerCase().includes(q) ||
      (eq.modelo || "").toLowerCase().includes(q) ||
      (eq.serie || "").toLowerCase().includes(q) ||
      (eq.numFicha || "").toLowerCase().includes(q) ||
      (eq.numInv || "").toLowerCase().includes(q)
    );

    // 2. Filtro por origen (Botones)
    const coincideOrigen = 
      filtroOrigen === "Todos" || 
      eq.origen === filtroOrigen;

    return coincideTexto && coincideOrigen;
  });

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
        styles.equipoRow,
        index % 2 === 0 && { backgroundColor: "#f8fafc" },
      ]}
    >
      <View style={styles.equipoIconWrap}>
        <MaterialCommunityIcons name="laptop" size={18} color="#09528e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.equipoTitulo}>
          {item.tipo} · {item.marca} {item.modelo}
        </Text>
        <Text style={styles.equipoSub}>
          S/N: {item.serie || "N/A"}
          {"   "}Ficha: {item.numFicha || "N/A"}
          {"   "}Inv: {item.numInv || "N/A"}
        </Text>
      </View>
    </View>
  );

  const Paginacion = () => (
    <View style={styles.paginacion}>
      <TouchableOpacity
        style={[styles.pageBtn, pagina === 1 && styles.pageBtnDisabled]}
        onPress={() => setPagina((p) => Math.max(1, p - 1))}
        disabled={pagina === 1}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={18}
          color={pagina === 1 ? "#cbd5e1" : "#09528e"}
        />
      </TouchableOpacity>

      {/* Números de página */}
      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
        .filter(
          (n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1,
        )
        .reduce((acc, n, idx, arr) => {
          if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
          acc.push(n);
          return acc;
        }, [])
        .map((item, idx) =>
          item === "..." ? (
            <Text key={`dots-${idx}`} style={styles.pageDots}>
              …
            </Text>
          ) : (
            <TouchableOpacity
              key={item}
              style={[styles.pageBtn, pagina === item && styles.pageBtnActive]}
              onPress={() => setPagina(item)}
            >
              <Text
                style={[
                  styles.pageBtnTxt,
                  pagina === item && styles.pageBtnTxtActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ),
        )}

      {/* Botón siguiente */}
      <TouchableOpacity
        style={[
          styles.pageBtn,
          pagina === totalPaginas && styles.pageBtnDisabled,
        ]}
        onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        disabled={pagina === totalPaginas}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={pagina === totalPaginas ? "#cbd5e1" : "#09528e"}
        />
      </TouchableOpacity>

      <Text style={styles.pageInfo}>
        {(pagina - 1) * ITEMS_POR_PAGINA + 1}–
        {Math.min(pagina * ITEMS_POR_PAGINA, equiposFiltrados.length)} de{" "}
        {equiposFiltrados.length}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />

      <CustomScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.mainTitle}>EQUIPOS</Text>

        {/*CATÁLOGOS*/}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="tag-multiple-outline"
              size={17}
              color="#09528e"
            />
            <Text style={styles.cardTitle}>Catálogos</Text>
          </View>
          <Text style={styles.hint}>
            Estas opciones aparecen en los selectores al crear un acta de
            entrega.
          </Text>

          {/* Tres columnas principales */}
          <View style={styles.catalogoGrid}>
            <CatalogoSeccion
              titulo="Tipo de equipo"
              items={tiposEquipo}
              campoLabel="tipo"
              onAgregar={() => setModalTipo(true)}
            />
            <View style={styles.catalogoDivider} />
            <CatalogoSeccion
              titulo="Marca"
              items={marcas}
              campoLabel="marca"
              onAgregar={() => setModalMarca(true)}
            />
            <View style={styles.catalogoDivider} />
            <CatalogoSeccion
              titulo="Modelo"
              items={modelos}
              campoLabel="modelo"
              onAgregar={() => setModalModelo(true)}
            />
          </View>
        </View>

        {/*EQUIPOS REGISTRADOS EN ACTAS*/}
        <View style={styles.card}>
          {/* Header con contador y refresh */}
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="monitor-multiple"
              size={17}
              color="#09528e"
            />
            <Text style={styles.cardTitle}>Equipos registrados en actas</Text>
            <View style={styles.contadorBadge}>
              <Text style={styles.contadorTxt}>{equiposFiltrados.length}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={cargarEquipos}>
              <MaterialCommunityIcons
                name="refresh"
                size={17}
                color="#09528e"
              />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por tipo, marca, modelo, serie..."
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            )}
          </View>

          {/*BOTONES DEL FILTRO */}
          <View style={styles.filtrosWrap}>
            {["Todos", "Entrega", "Retiro"].map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[
                  styles.filtroBtn,
                  filtroOrigen === opcion && styles.filtroBtnActive,
                ]}
                onPress={() => {
                  setFiltroOrigen(opcion); 
                  setPagina(1); 
                }}
              >
                <Text
                  style={[
                    styles.filtroTxt,
                    filtroOrigen === opcion && styles.filtroTxtActive,
                  ]}
                >
                  {opcion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lista paginada */}
          {cargando ? (
            <View style={styles.centrado}>
              <Text style={styles.emptyHint}>Cargando equipos...</Text>
            </View>
          ) : equiposFiltrados.length === 0 ? (
            <View style={styles.centrado}>
              <MaterialCommunityIcons
                name="laptop-off"
                size={34}
                color="#cbd5e1"
              />
              <Text style={styles.emptyHint}>
                {busqueda
                  ? "Sin resultados para esa búsqueda."
                  : "Aún no hay equipos registrados."}
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
              {totalPaginas > 1 && <Paginacion />}
            </>
          )}
        </View>
      </CustomScrollView>

      {/* Modales */}
      <CatalogoModal
        visible={modalTipo}
        titulo="Agregar Tipo de Equipo"
        onClose={() => setModalTipo(false)}
        onSave={agregarTipo}
      />
      <CatalogoModal
        visible={modalMarca}
        titulo="Agregar Marca"
        onClose={() => setModalMarca(false)}
        onSave={agregarMarca}
      />
      <CatalogoModal
        visible={modalModelo}
        titulo="Agregar Modelo"
        onClose={() => setModalModelo(false)}
        onSave={agregarModelo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },

  mainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 20,
    alignSelf: "flex-start",
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    maxWidth: 900,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", flex: 1 },
  hint: { fontSize: 12, color: "#94a3b8", marginBottom: 16 },

  /* Catálogos */
  catalogoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  catalogoCol: {
    flex: 1,
    minWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  catalogoDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  catalogoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  catalogoLabel: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09528e",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  addBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  badgesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: "#0369a1", fontWeight: "600" },

  /* Equipos */
  contadorBadge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  contadorTxt: { fontSize: 12, color: "#0369a1", fontWeight: "700" },
  refreshBtn: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#1e293b" },
  filtrosWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filtroBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filtroBtnActive: {
    backgroundColor: "#09528e",
    borderColor: "#09528e",
  },
  filtroTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  filtroTxtActive: {
    color: "#ffffff",
  },

  equipoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 6,
    gap: 10,
    borderRadius: 6,
  },
  equipoIconWrap: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  equipoTitulo: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  equipoSub: { fontSize: 11, color: "#64748b", marginTop: 1 },

  /* Paginación */
  paginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexWrap: "wrap",
  },
  pageBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
  },
  pageBtnActive: { backgroundColor: "#09528e" },
  pageBtnDisabled: { backgroundColor: "#f8fafc" },
  pageBtnTxt: { fontSize: 13, fontWeight: "600", color: "#475569" },
  pageBtnTxtActive: { color: "#fff" },
  pageDots: { fontSize: 13, color: "#94a3b8", paddingHorizontal: 4 },
  pageInfo: { fontSize: 11, color: "#94a3b8", marginLeft: 8 },

  centrado: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyHint: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
});
