import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../hooks/themeContext";
import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import api from "../services/api";

// ── Paleta ──
const P = {
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    surface2: "#2C2C2C",
    surface3: "#0F172A",
    border: "#333333",
    border2: "#444444",
    text: "#FFFFFF",
    textMuted: "#A0A0A0",
    textSub: "#E0E0E0",
    accent: "#075985",
    pickerBg: "#2C2C2C",
    pickerColor: "#FFFFFF",
    tabInactive: "#A0A0A0",
    cardBlocked: "#2C2C2C",
    avatarBg: "#1E293B",
    avatarBorder: "#334155",
    searchBg: "#1E1E1E",
    modalBg: "#1E1E1E",
    switchTrackOff: "#444444",
    pageBg: "#1a2744",
  },
  light: {
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    surface2: "#F1F5F9",
    surface3: "#EFF6FF",
    border: "#E2E8F0",
    border2: "#CBD5E1",
    text: "#0F172A",
    textMuted: "#64748B",
    textSub: "#334155",
    accent: "#2563EB",
    pickerBg: "#F1F5F9",
    pickerColor: "#0F172A",
    tabInactive: "#64748B",
    cardBlocked: "#F8FAFC",
    avatarBg: "#EFF6FF",
    avatarBorder: "#BFDBFE",
    searchBg: "#FFFFFF",
    modalBg: "#FFFFFF",
    switchTrackOff: "#CBD5E1",
    pageBg: "#dbeafe",
  },
};

const ITEMS_PER_PAGE = 15; // registros por página

const ThemedInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  colors,
}) => (
  <TextInput
    style={{
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    }}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
  />
);

const ThemedPicker = ({ selectedValue, onValueChange, children, colors }) => (
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

//COMPONENTE DE PAGINACIÓN
function Paginacion({
  paginaActual,
  totalPaginas,
  onAnterior,
  onSiguiente,
  onIrA,
  c,
}) {
  if (totalPaginas <= 1) return null;

  // Genera los números de página visibles (máx 5 botones)
  const generarPaginas = () => {
    const paginas = [];
    const rango = 2;
    let inicio = Math.max(1, paginaActual - rango);
    let fin = Math.min(totalPaginas, paginaActual + rango);

    if (paginaActual <= rango + 1) fin = Math.min(totalPaginas, 5);
    if (paginaActual >= totalPaginas - rango)
      inicio = Math.max(1, totalPaginas - 4);

    if (inicio > 1) {
      paginas.push(1);
      if (inicio > 2) paginas.push("...");
    }
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) paginas.push("...");
      paginas.push(totalPaginas);
    }
    return paginas;
  };

  return (
    <View style={pg.container}>
      {/* Botón anterior */}
      <TouchableOpacity
        onPress={onAnterior}
        disabled={paginaActual === 1}
        style={[
          pg.navBtn,
          { backgroundColor: c.surface, borderColor: c.border },
          paginaActual === 1 && { opacity: 0.35 },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={20}
          color={c.textMuted}
        />
      </TouchableOpacity>

      {/* Números */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pg.numerosWrap}
      >
        {generarPaginas().map((p, i) =>
          p === "..." ? (
            <Text key={`dots-${i}`} style={[pg.dots, { color: c.textMuted }]}>
              …
            </Text>
          ) : (
            <TouchableOpacity
              key={p}
              onPress={() => onIrA(p)}
              style={[
                pg.numBtn,
                {
                  backgroundColor: paginaActual === p ? c.accent : c.surface,
                  borderColor: paginaActual === p ? c.accent : c.border,
                },
              ]}
            >
              <Text
                style={[
                  pg.numText,
                  { color: paginaActual === p ? "#fff" : c.textMuted },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      {/* Botón siguiente */}
      <TouchableOpacity
        onPress={onSiguiente}
        disabled={paginaActual === totalPaginas}
        style={[
          pg.navBtn,
          { backgroundColor: c.surface, borderColor: c.border },
          paginaActual === totalPaginas && { opacity: 0.35 },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={c.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const pg = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 8,
    gap: 6,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numerosWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  numBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  numText: { fontSize: 13, fontWeight: "700" },
  dots: { fontSize: 14, paddingHorizontal: 4 },
});

// PÁGINA PRINCIPAL
export default function EmpleadosReceptoresScreen() {
  const { theme } = useTheme();
  const c = P[theme] ?? P.light;
  const { width, height } = useWindowDimensions();
  const isSmall = width < 400;

  //ESTADO
  const [tipoActivo, setTipoActivo] = useState("empleados");
  const [empleados, setEmpleados] = useState([]);
  const [receptores, setReceptores] = useState([]);
  const [oficinasLista, setOficinasLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);

  //PAGINACIÓN
  const [paginaEmp, setPaginaEmp] = useState(1);
  const [paginaRec, setPaginaRec] = useState(1);

  //FORMULARIO EMPLEADO
  const [empNom, setEmpNom] = useState("");
  const [empCorreo, setEmpCorreo] = useState("");
  const [empDni, setEmpDni] = useState("");
  const [empOficinaId, setEmpOficinaId] = useState("");
  const [empUnidad, setEmpUnidad] = useState("");
  const [empCargoId, setEmpCargoId] = useState("");

  //FORMULARIO RECEPTOR
  const [recNom, setRecNom] = useState("");
  const [recCorreo, setRecCorreo] = useState("");
  const [recEmpresa, setRecEmpresa] = useState("");
  const [recCargo, setRecCargo] = useState("");

  //OFICINA/UNIDAD/CARGO NUEVOS
  const [mostrarNuevaOficina, setMostrarNuevaOficina] = useState(false);
  const [nuevaOfNom, setNuevaOfNom] = useState("");
  const [nuevaOfUnidad, setNuevaOfUnidad] = useState("");
  const [nuevaOfCargo, setNuevaOfCargo] = useState("");
  const [mostrarNuevaUnidad, setMostrarNuevaUnidad] = useState(false);
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [nuevaUnidadCargo, setNuevaUnidadCargo] = useState("");
  const [mostrarNuevoCargo, setMostrarNuevoCargo] = useState(false);
  const [nuevoCargo, setNuevoCargo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");

  //DEBOUNCE BÚSQUEDA
  const searchTimer = useRef(null);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  //Editar empleado y receptor
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [receptorEditando, setReceptorEditando] = useState(null);
  const [editandoTipo, setEditandoTipo] = useState(null);

  const onBusquedaChange = (txt) => {
    setBusqueda(txt);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setBusquedaDebounced(txt);
      setPaginaEmp(1);
      setPaginaRec(1);
    }, 300);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!editando) {
      setEmpUnidad("");
      setEmpCargoId("");
    }
  }, [empOficinaId]);

  useEffect(() => {
    if (!editando) {
      setEmpCargoId("");
    }
  }, [empUnidad]);

  // Resetear página al cambiar tab o filtro
  useEffect(() => {
    setPaginaEmp(1);
    setPaginaRec(1);
  }, [tipoActivo, filtroEstado]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEmp, resRec, resOfi] = await Promise.all([
        api.get("/empleados"),
        api.get("/receptores"),
        api.get("/catalogos/oficinas"),
      ]);
      setEmpleados(
        resEmp.data.map((e) => ({
          ...e,
          estado: e.estEmp || e.estado || "Activo",
        })),
      );
      setReceptores(
        resRec.data.map((r) => ({
          ...r,
          estado: r.estRec || r.estado || "Activo",
        })),
      );
      setOficinasLista(resOfi.data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  };

  //FILTRADO Y PAGINACIÓN
  const datosFiltradosTodos = useMemo(() => {
    const lista = tipoActivo === "empleados" ? empleados : receptores;
    const txt = busquedaDebounced.toLowerCase();
    return lista
      .filter((item) => {
        if (!txt) return true;
        return (
          (item.nomEmp || item.nomRec || "").toLowerCase().includes(txt) ||
          (item.corEmp || item.corRec || "").toLowerCase().includes(txt) ||
          (item.cargoEmp || item.cargoRec || "").toLowerCase().includes(txt) ||
          (item.nomOficina || "").toLowerCase().includes(txt)
        );
      })
      .filter((item) => {
        if (filtroEstado === "activos") return item.estado === "Activo";
        if (filtroEstado === "inactivos") return item.estado === "Inactivo";
        return true;
      })
      .sort((a, b) => {
        if (a.estado === "Activo" && b.estado === "Inactivo") return -1;
        if (a.estado === "Inactivo" && b.estado === "Activo") return 1;
        const na = (a.nomEmp || a.nomRec || "").toLowerCase();
        const nb = (b.nomEmp || b.nomRec || "").toLowerCase();
        return na.localeCompare(nb);
      });
  }, [tipoActivo, empleados, receptores, busquedaDebounced, filtroEstado]);

  const paginaActual = tipoActivo === "empleados" ? paginaEmp : paginaRec;
  const setPagina = tipoActivo === "empleados" ? setPaginaEmp : setPaginaRec;
  const totalPaginas = Math.max(
    1,
    Math.ceil(datosFiltradosTodos.length / ITEMS_PER_PAGE),
  );

  const datosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return datosFiltradosTodos.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [datosFiltradosTodos, paginaActual]);

  // HELPERS OFICINAS
  const oficinasUnicas = useMemo(
    () => [...new Map(oficinasLista.map((o) => [o.nomOficina, o])).values()],
    [oficinasLista],
  );

  const unidadesDeLaOficina = useMemo(
    () =>
      empOficinaId
        ? [
            ...new Set(
              oficinasLista
                .filter((o) => o.nomOficina === empOficinaId)
                .map((o) => o.unidad)
                .filter(Boolean),
            ),
          ]
        : [],
    [empOficinaId, oficinasLista],
  );

  const cargosDeLaUnidad = useMemo(
    () =>
      empOficinaId
        ? oficinasLista.filter((o) => {
            if (!empUnidad || empUnidad === "N/A") {
              return o.nomOficina === empOficinaId;
            }
            return o.nomOficina === empOficinaId && o.unidad === empUnidad;
          })
        : [],
    [empOficinaId, empUnidad, oficinasLista],
  );

  // ACCIONES
  const toggleEstado = useCallback(async (id, tipo, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    const endpoint =
      tipo === "empleado"
        ? `/empleados/${id}/estado`
        : `/receptores/${id}/estado`;
    try {
      await api.put(endpoint, { estado: nuevoEstado });
      if (tipo === "empleado")
        setEmpleados((prev) =>
          prev.map((e) =>
            e.idEmpleados === id ? { ...e, estado: nuevoEstado } : e,
          ),
        );
      else
        setReceptores((prev) =>
          prev.map((r) =>
            r.idReceptores === id ? { ...r, estado: nuevoEstado } : r,
          ),
        );
    } catch {
      Alert.alert("Error", "No se pudo cambiar el estado.");
    }
  }, []);

  const limpiarFormularios = () => {
    setEmpNom("");
    setEmpCorreo("");
    setEmpDni("");
    setEmpOficinaId("");
    setEmpUnidad("");
    setEmpCargoId("");
    setRecNom("");
    setRecCorreo("");
    setRecEmpresa("");
    setRecCargo("");
    setMostrarNuevaOficina(false);
    setNuevaOfNom("");
    setNuevaOfUnidad("");
    setNuevaOfCargo("");
    setMostrarNuevaUnidad(false);
    setNuevaUnidad("");
    setNuevaUnidadCargo("");
    setMostrarNuevoCargo(false);
    setNuevoCargo("");
    setErrorCorreo("");
    setReceptorEditando(null);
  };

  const guardarRegistro = async () => {
    try {
      if (tipoActivo === "empleados") {
        // Validaciones comunes
        if (!empNom || !empOficinaId) {
          Alert.alert("Atención", "Nombre y oficina son obligatorios.");
          return;
        }
        const idOficinaFinal = empCargoId
          ? parseInt(empCargoId)
          : (() => {
              const ofi = oficinasLista.find(
                (o) => o.nomOficina === empOficinaId,
              );
              return ofi?.idOficina;
            })();
        if (!idOficinaFinal) {
          Alert.alert("Error", "No se encontró la oficina.");
          return;
        }
        const correoParaEnviar =
          empCorreo && empCorreo.trim() !== "" ? empCorreo.trim() : null;

        if (editando && empleadoEditando) {
          // Actualizar empleado existente
          await api.put(`/empleados/${empleadoEditando.idEmpleados}`, {
            nomEmp: empNom,
            corEmp: correoParaEnviar,
            idOficina: idOficinaFinal,
            dniEmp: empDni || null,
          });
          Alert.alert("Éxito", "Empleado actualizado correctamente.");
        } else {
          // Crear nuevo empleado
          await api.post("/empleados", {
            nomEmp: empNom,
            corEmp: correoParaEnviar,
            idOficina: idOficinaFinal,
            dniEmp: empDni || null,
          });
          Alert.alert("Éxito", "Empleado creado correctamente.");
        }
      } else {
        if (!recNom || !recCorreo || !recEmpresa || !recCargo) {
          Alert.alert("Atención", "Todos los campos son obligatorios.");
          return;
        }

        if (editando && receptorEditando) {
          // EDITAR receptor
          await api.put(`/receptores/${receptorEditando.idReceptores}`, {
            nomRec: recNom,
            corRec: recCorreo,
            emprRec: recEmpresa,
            cargoRec: recCargo,
          });

          Alert.alert("Éxito", "Receptor actualizado correctamente.");
        } else {
          // CREAR receptor
          await api.post("/receptores", {
            nomRec: recNom,
            corRec: recCorreo,
            emprRec: recEmpresa,
            cargoRec: recCargo,
          });

          Alert.alert("Éxito", "Receptor creado correctamente.");
        }
      }
      limpiarFormularios();
      setModalVisible(false);
      setEditando(false);
      setEmpleadoEditando(null);
      setReceptorEditando(null);
      cargarDatos();
    } catch (error) {
      if (error.response?.status === 409) {
        setErrorCorreo("Este correo ya está registrado. Usa otro correo.");
      } else {
        Alert.alert(
          "Error",
          "No se pudo guardar el registro. Intenta de nuevo.",
        );
      }
    }
  };
  const crearNuevaOficina = async () => {
    if (!nuevaOfNom || !nuevaOfCargo) {
      Alert.alert("Atención", "Nombre y cargo son obligatorios.");
      return;
    }
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: nuevaOfNom,
        unidad: nuevaOfUnidad,
        cargoOfi: nuevaOfCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpOficinaId(String(res.data.idOficina));
      setNuevaOfNom("");
      setNuevaOfUnidad("");
      setNuevaOfCargo("");
      setMostrarNuevaOficina(false);
      Alert.alert("Éxito", "Oficina creada.");
    } catch {
      Alert.alert("Error", "No se pudo crear la oficina.");
    }
  };

  const crearNuevaUnidad = async () => {
    if (!nuevaUnidad) {
      Alert.alert("Atención", "El nombre es obligatorio.");
      return;
    }
    const ofi = oficinasLista.find((o) => o.nomOficina === empOficinaId);
    if (!ofi) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: ofi.nomOficina,
        unidad: nuevaUnidad,
        cargoOfi: nuevaUnidadCargo || null,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpUnidad(res.data.unidad);
      setNuevaUnidad("");
      setNuevaUnidadCargo("");
      setMostrarNuevaUnidad(false);
      Alert.alert("Éxito", "Unidad creada.");
    } catch {
      Alert.alert("Error", "No se pudo crear la unidad.");
    }
  };

  const crearNuevoCargo = async () => {
    if (!nuevoCargo) {
      Alert.alert("Atención", "El nombre es obligatorio.");
      return;
    }
    const ofi = oficinasLista.find((o) => o.nomOficina === empOficinaId);
    if (!ofi) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: ofi.nomOficina,
        unidad: empUnidad,
        cargoOfi: nuevoCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpCargoId(String(res.data.idOficina));
      setNuevoCargo("");
      setMostrarNuevoCargo(false);
      Alert.alert("Éxito", "Cargo creado.");
    } catch {
      Alert.alert("Error", "No se pudo crear el cargo.");
    }
  };

  const abrirEdicion = (item) => {
    setEditando(true);
    setErrorCorreo("");

    //EMPLEADO
    if (item.idEmpleados) {
      setEditandoTipo("empleado");
      setTipoActivo("empleados");
      setEmpleadoEditando(item);
      setEmpNom(item.nomEmp || "");
      setEmpCorreo(item.corEmp || "");
      setEmpDni(item.dniEmp || "");
      setEmpOficinaId(item.nomOficina || "");
      setEmpUnidad(item.unidad || "");
      const cargoRow = oficinasLista.find(
        (o) => o.nomOficina === item.nomOficina && o.cargoOfi === item.cargoEmp,
      );
      setEmpCargoId(cargoRow ? String(cargoRow.idOficina) : "");

      setRecNom("");
      setRecCorreo("");
      setRecEmpresa("");
      setRecCargo("");
    } else if (item.idReceptores) {
      setEditandoTipo("receptor");
      setTipoActivo("receptores");
      setReceptorEditando(item);
      setRecNom(item.nomRec || "");
      setRecCorreo(item.corRec || "");
      setRecEmpresa(item.emprRec || "");
      setRecCargo(item.cargoRec || "");

      setEmpNom("");
      setEmpCorreo("");
      setEmpDni("");
      setEmpOficinaId("");
      setEmpUnidad("");
      setEmpCargoId("");
    }
    setModalVisible(true);
  };

  const renderCard = useCallback(
    ({ item }) => {
      const id = item.idEmpleados || item.idReceptores;
      const nombre = item.nomEmp || item.nomRec;
      const correo = item.corEmp || item.corRec;
      const cargo = item.cargoEmp || item.cargoRec || item.cargoOfi;
      const empresa = item.emprRec || "Interno";
      const isActivo = item.estado === "Activo";
      const inicial = nombre ? nombre.charAt(0).toUpperCase() : "?";

      return (
        <View
          key={id}
          style={[
            st.userCard,
            {
              backgroundColor: isActivo ? c.surface : c.cardBlocked,
              borderColor: c.border,
            },
            !isActivo && { opacity: 0.65 },
          ]}
        >
          <View
            style={[
              st.avatarContainer,
              {
                backgroundColor: c.avatarBg,
                borderColor: isActivo ? c.avatarBorder : c.border2,
              },
            ]}
          >
            <Text
              style={[
                st.avatarText,
                { color: c.accent },
                !isActivo && { color: c.textMuted },
              ]}
            >
              {inicial}
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: "center", minWidth: 0 }}>
            <View style={st.nameRow}>
              <Text
                style={[
                  st.userName,
                  { color: c.text },
                  !isActivo && { color: c.textMuted },
                ]}
                numberOfLines={1}
              >
                {nombre}
              </Text>
              {!isActivo && (
                <View style={st.badgeInactivo}>
                  <Text style={st.badgeInactivoText}>Inactivo</Text>
                </View>
              )}
            </View>
            <View style={st.badgeContainer}>
              {cargo ? (
                <View style={[st.roleBadge, { backgroundColor: c.surface2 }]}>
                  <Text
                    style={[st.roleBadgeText, { color: c.textSub }]}
                    numberOfLines={1}
                  >
                    {cargo}
                  </Text>
                </View>
              ) : null}
              {tipoActivo === "receptores" && (
                <View style={[st.roleBadge, { backgroundColor: c.surface3 }]}>
                  <Text
                    style={[st.roleBadgeText, { color: c.accent }]}
                    numberOfLines={1}
                  >
                    {empresa}
                  </Text>
                </View>
              )}
              {tipoActivo === "empleados" && item.nomOficina && (
                <View style={[st.roleBadge, { backgroundColor: "#78350f22" }]}>
                  <Text
                    style={[st.roleBadgeText, { color: "#D97706" }]}
                    numberOfLines={1}
                  >
                    {item.nomOficina}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="email-outline"
                size={13}
                color={c.textMuted}
              />
              <Text
                style={[st.emailText, { color: c.textMuted }]}
                numberOfLines={1}
              >
                {correo}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "center", marginLeft: 8, minWidth: 56 }}>
            <Text style={[st.switchLabel, { color: c.textMuted }]}>
              {isActivo ? "Activo" : "Inactivo"}
            </Text>
            <Switch
              value={isActivo}
              onValueChange={() =>
                toggleEstado(
                  id,
                  tipoActivo === "empleados" ? "empleado" : "receptor",
                  item.estado,
                )
              }
              trackColor={{ false: c.switchTrackOff, true: "#1E3A5F" }}
              thumbColor={isActivo ? "#3b82f6" : c.textMuted}
            />
          </View>
          <TouchableOpacity
            onPress={() => abrirEdicion(item)}
            style={{ marginLeft: 8, padding: 4 }}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={c.accent} />
          </TouchableOpacity>
        </View>
      );
    },
    [c, tipoActivo, toggleEstado],
  );

  const getInicial = (n) => (n ? n.charAt(0).toUpperCase() : "?");

  // TOTAL MOSTRADOS Y ACTIVOS
  const totalMostrados = datosFiltradosTodos.length;
  const totalActivos = (
    tipoActivo === "empleados" ? empleados : receptores
  ).filter((i) => i.estado === "Activo").length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Header />
      <Navbar />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: "center",
          paddingBottom: 80,
        }}
      >
        <View style={{ width: "100%", maxWidth: 900 }}>
          {/* HEADER */}
          <View style={[st.headerRow, isSmall && st.headerRowSmall]}>
            <View style={{ flexShrink: 1 }}>
              <Text
                style={[
                  st.mainTitle,
                  { color: c.text },
                  isSmall && { fontSize: 20 },
                ]}
              >
                Directorio
              </Text>
              <Text style={[st.subTitle, { color: c.textMuted }]}>
                {totalActivos} activos ·{" "}
                {(tipoActivo === "empleados" ? empleados : receptores).length}{" "}
                total
              </Text>
            </View>
            <TouchableOpacity
              style={[st.addBtn, isSmall && st.addBtnSmall]}
              onPress={() => {
                limpiarFormularios();
                setModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={st.addBtnText}>
                {tipoActivo === "empleados"
                  ? "Nuevo Empleado"
                  : "Nuevo Receptor"}
              </Text>
            </TouchableOpacity>
          </View>

          {/*TABS*/}
          <View style={[st.tabContainer, { backgroundColor: c.surface }]}>
            {["empleados", "receptores"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[st.tabButton, tipoActivo === tab && st.tabActive]}
                onPress={() => setTipoActivo(tab)}
              >
                <MaterialCommunityIcons
                  name={
                    tab === "empleados"
                      ? "badge-account-horizontal-outline"
                      : "truck-delivery-outline"
                  }
                  size={isSmall ? 17 : 20}
                  color={tipoActivo === tab ? "#fff" : c.tabInactive}
                />
                <Text
                  style={[
                    st.tabText,
                    { color: tipoActivo === tab ? "#fff" : c.tabInactive },
                    isSmall && { fontSize: 13 },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/*BÚSQUEDA*/}
          <View
            style={[
              st.searchContainer,
              { backgroundColor: c.searchBg, borderColor: c.border },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={c.textMuted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[st.searchInput, { color: c.text }]}
              placeholder={`Buscar ${tipoActivo}...`}
              placeholderTextColor={c.textMuted}
              value={busqueda}
              onChangeText={onBusquedaChange}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setBusqueda("");
                  setBusquedaDebounced("");
                }}
                style={{ padding: 6 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={c.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTRO ESTADO*/}
          <View style={[st.filterContainer, { borderColor: c.border }]}>
            {[
              { key: "todos", label: "Todos" },
              { key: "activos", label: "Activos" },
              { key: "inactivos", label: "Inactivos" },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  st.filterButton,
                  filtroEstado === key && st.filterButtonActive,
                  {
                    backgroundColor:
                      filtroEstado === key ? c.accent : "transparent",
                  },
                ]}
                onPress={() => setFiltroEstado(key)}
              >
                <Text
                  style={[
                    st.filterButtonText,
                    { color: filtroEstado === key ? "#fff" : c.textMuted },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/*PÁGINA INFO*/}
          {!cargando && totalMostrados > 0 && (
            <View style={[st.pageInfo, { backgroundColor: c.pageBg }]}>
              <MaterialCommunityIcons
                name="format-list-numbered"
                size={14}
                color={c.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={[st.pageInfoText, { color: c.accent }]}>
                Mostrando{" "}
                {Math.min(
                  (paginaActual - 1) * ITEMS_PER_PAGE + 1,
                  totalMostrados,
                )}
                –{Math.min(paginaActual * ITEMS_PER_PAGE, totalMostrados)} de{" "}
                {totalMostrados} resultados
              </Text>
            </View>
          )}

          {/* LISTA */}
          {cargando ? (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#09528e" />
              <Text style={[st.loadingText, { color: c.textMuted }]}>
                Cargando directorio...
              </Text>
            </View>
          ) : totalMostrados === 0 ? (
            <View
              style={[
                st.emptyState,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <MaterialCommunityIcons
                name="card-search-outline"
                size={48}
                color={c.textMuted}
              />
              <Text style={[st.emptyStateTitle, { color: c.text }]}>
                Sin resultados
              </Text>
              {busqueda.length > 0 && (
                <Text
                  style={[{ color: c.textMuted, fontSize: 13, marginTop: 4 }]}
                >
                  No hay coincidencias para "{busqueda}"
                </Text>
              )}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {datosPagina.map((item) => renderCard({ item }))}
            </View>
          )}

          {/*PAGINACIÓN*/}
          {!cargando && totalMostrados > 0 && (
            <Paginacion
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
              onSiguiente={() =>
                setPagina((p) => Math.min(totalPaginas, p + 1))
              }
              onIrA={setPagina}
              c={c}
            />
          )}

          {/* Info total al final */}
          {!cargando && totalMostrados > ITEMS_PER_PAGE && (
            <Text style={[st.footerInfo, { color: c.textMuted }]}>
              Página {paginaActual} de {totalPaginas} · {ITEMS_PER_PAGE}{" "}
              registros por página
            </Text>
          )}
        </View>
        <Footer />
      </ScrollView>

      {/*MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={st.modalOverlay}>
          <View
            style={[
              st.modalContent,
              {
                backgroundColor: c.modalBg,
                width: Math.min(width - 32, 500),
                height: height * 0.88,
              },
            ]}
          >
            <View style={st.modalHeader}>
              <View
                style={[st.modalIconContainer, { backgroundColor: c.avatarBg }]}
              >
                <MaterialCommunityIcons
                  name={
                    tipoActivo === "empleados"
                      ? "badge-account"
                      : "truck-delivery"
                  }
                  size={24}
                  color={c.accent}
                />
              </View>
              <Text style={[st.modalTitle, { color: c.text }]}>
                {editando
                  ? editandoTipo === "empleado"
                    ? "Editar Empleado"
                    : "Editar Receptor"
                  : tipoActivo === "empleados"
                    ? "Nuevo Empleado"
                    : "Nuevo Receptor"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditandoTipo(null);
                  setEditando(false);
                  setEmpleadoEditando(null);
                  limpiarFormularios();
                }}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={c.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
              style={{ flex: 1, width: "100%" }}
            >
              {tipoActivo === "empleados" ? (
                <>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Nombre Completo
                    </Text>
                    <ThemedInput
                      value={empNom}
                      onChangeText={setEmpNom}
                      placeholder="Ej. Pablo Díaz"
                      colors={c}
                    />
                  </View>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>DNI</Text>
                    <ThemedInput
                      value={empDni}
                      onChangeText={setEmpDni}
                      placeholder="0000-0000-00000"
                      keyboardType="numeric"
                      colors={c}
                    />
                  </View>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Correo Electrónico
                    </Text>
                    <ThemedInput
                      value={empCorreo}
                      onChangeText={(v) => {
                        setEmpCorreo(v);
                        setErrorCorreo("");
                      }}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      colors={c}
                    />
                    {errorCorreo ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                          gap: 5,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={14}
                          color="#ef4444"
                        />
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 12,
                            fontWeight: "600",
                            flex: 1,
                          }}
                        >
                          {errorCorreo}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Oficina */}
                  <View style={st.inputGroup}>
                    <View style={st.labelRow}>
                      <Text style={[st.label, { color: c.textMuted }]}>
                        Oficina
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setMostrarNuevaOficina(!mostrarNuevaOficina);
                          setMostrarNuevaUnidad(false);
                          setMostrarNuevoCargo(false);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            mostrarNuevaOficina
                              ? "close-circle-outline"
                              : "plus-circle-outline"
                          }
                          size={20}
                          color={c.accent}
                        />
                      </TouchableOpacity>
                    </View>
                    <ThemedPicker
                      selectedValue={empOficinaId}
                      onValueChange={setEmpOficinaId}
                      colors={c}
                    >
                      <Picker.Item
                        label="Seleccione una oficina..."
                        value=""
                        color={c.textMuted}
                      />
                      {oficinasUnicas.map((ofi) => (
                        <Picker.Item
                          key={ofi.nomOficina}
                          label={ofi.nomOficina}
                          value={ofi.nomOficina}
                          color={c.pickerColor}
                        />
                      ))}
                    </ThemedPicker>
                  </View>
                  {mostrarNuevaOficina && (
                    <View
                      style={[
                        st.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text style={[st.inlineFormTitle, { color: c.accent }]}>
                        Nueva Oficina
                      </Text>
                      <ThemedInput
                        value={nuevaOfNom}
                        onChangeText={setNuevaOfNom}
                        placeholder="Nombre de la oficina"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaOfUnidad}
                        onChangeText={setNuevaOfUnidad}
                        placeholder="Unidad (opcional)"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaOfCargo}
                        onChangeText={setNuevaOfCargo}
                        placeholder="Cargo"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={st.inlineBtn}
                        onPress={crearNuevaOficina}
                      >
                        <Text style={st.inlineBtnText}>Guardar Oficina</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Unidad */}
                  {empOficinaId !== "" && (
                    <View style={st.inputGroup}>
                      <View style={st.labelRow}>
                        <Text style={[st.label, { color: c.textMuted }]}>
                          Unidad
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMostrarNuevaUnidad(!mostrarNuevaUnidad);
                            setMostrarNuevaOficina(false);
                            setMostrarNuevoCargo(false);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              mostrarNuevaUnidad
                                ? "close-circle-outline"
                                : "plus-circle-outline"
                            }
                            size={20}
                            color={c.accent}
                          />
                        </TouchableOpacity>
                      </View>
                      <ThemedPicker
                        selectedValue={empUnidad}
                        onValueChange={setEmpUnidad}
                        colors={c}
                      >
                        <Picker.Item
                          label="Seleccione una unidad..."
                          value=""
                          color={c.textMuted}
                        />
                        {unidadesDeLaOficina.map((u) => (
                          <Picker.Item
                            key={u}
                            label={u}
                            value={u}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    </View>
                  )}
                  {mostrarNuevaUnidad && empOficinaId !== "" && (
                    <View
                      style={[
                        st.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text style={[st.inlineFormTitle, { color: c.accent }]}>
                        Nueva Unidad
                      </Text>
                      <ThemedInput
                        value={nuevaUnidad}
                        onChangeText={setNuevaUnidad}
                        placeholder="Nombre de la unidad"
                        colors={c}
                      />
                      <View style={{ height: 8 }} />
                      <ThemedInput
                        value={nuevaUnidadCargo}
                        onChangeText={setNuevaUnidadCargo}
                        placeholder="Cargo (opcional)"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={st.inlineBtn}
                        onPress={crearNuevaUnidad}
                      >
                        <Text style={st.inlineBtnText}>Guardar Unidad</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Cargo */}
                  {empUnidad !== "" && (
                    <View style={st.inputGroup}>
                      <View style={st.labelRow}>
                        <Text style={[st.label, { color: c.textMuted }]}>
                          Cargo
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMostrarNuevoCargo(!mostrarNuevoCargo);
                            setMostrarNuevaOficina(false);
                            setMostrarNuevaUnidad(false);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={
                              mostrarNuevoCargo
                                ? "close-circle-outline"
                                : "plus-circle-outline"
                            }
                            size={20}
                            color={c.accent}
                          />
                        </TouchableOpacity>
                      </View>
                      <ThemedPicker
                        selectedValue={empCargoId}
                        onValueChange={setEmpCargoId}
                        colors={c}
                      >
                        <Picker.Item
                          label="Seleccione un cargo..."
                          value=""
                          color={c.textMuted}
                        />
                        {cargosDeLaUnidad.map((fila) => (
                          <Picker.Item
                            key={fila.idOficina}
                            label={fila.cargoOfi}
                            value={String(fila.idOficina)}
                            color={c.pickerColor}
                          />
                        ))}
                      </ThemedPicker>
                    </View>
                  )}
                  {mostrarNuevoCargo && empUnidad !== "" && (
                    <View
                      style={[
                        st.inlineForm,
                        {
                          backgroundColor: c.surface3,
                          borderColor: c.avatarBorder,
                        },
                      ]}
                    >
                      <Text style={[st.inlineFormTitle, { color: c.accent }]}>
                        Nuevo Cargo
                      </Text>
                      <ThemedInput
                        value={nuevoCargo}
                        onChangeText={setNuevoCargo}
                        placeholder="Nombre del cargo"
                        colors={c}
                      />
                      <TouchableOpacity
                        style={st.inlineBtn}
                        onPress={crearNuevoCargo}
                      >
                        <Text style={st.inlineBtnText}>Guardar Cargo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Nombre Completo
                    </Text>
                    <ThemedInput
                      value={recNom}
                      onChangeText={setRecNom}
                      placeholder="Ej. Carlos Mendoza"
                      colors={c}
                    />
                  </View>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Correo Electrónico
                    </Text>
                    <ThemedInput
                      value={recCorreo}
                      onChangeText={(v) => {
                        setRecCorreo(v);
                        setErrorCorreo("");
                      }}
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      colors={c}
                    />
                    {errorCorreo ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                          gap: 5,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={14}
                          color="#ef4444"
                        />
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 12,
                            fontWeight: "600",
                            flex: 1,
                          }}
                        >
                          {errorCorreo}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Empresa
                    </Text>
                    <ThemedInput
                      value={recEmpresa}
                      onChangeText={setRecEmpresa}
                      placeholder="Ej. Tech Solutions S.A."
                      colors={c}
                    />
                  </View>
                  <View style={st.inputGroup}>
                    <Text style={[st.label, { color: c.textMuted }]}>
                      Cargo
                    </Text>
                    <ThemedInput
                      value={recCargo}
                      onChangeText={setRecCargo}
                      placeholder="Ej. Técnico de Soporte"
                      colors={c}
                    />
                  </View>
                </>
              )}

              <View style={st.modalButtons}>
                <TouchableOpacity
                  style={[
                    st.cancelBtn,
                    { backgroundColor: c.surface2, borderColor: c.border2 },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[st.cancelBtnText, { color: c.textSub }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={guardarRegistro}>
                  <Text style={st.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    flexWrap: "wrap",
    gap: 12,
  },
  headerRowSmall: { flexDirection: "column", alignItems: "flex-start" },
  mainTitle: { fontSize: 24, fontWeight: "800" },
  subTitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#09528e",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnSmall: { alignSelf: "stretch", justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 14 },

  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: "#09528e", elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: { fontWeight: "600", fontSize: 13 },

  pageInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  pageInfoText: { fontSize: 12, fontWeight: "600" },

  userCard: {
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  userName: { fontSize: 15, fontWeight: "700", flexShrink: 1 },
  badgeInactivo: {
    backgroundColor: "#450a0a",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactivoText: { fontSize: 9, color: "#ef4444", fontWeight: "bold" },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 5,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "600" },
  emailText: { fontSize: 13, marginLeft: 5, flex: 1 },
  switchLabel: { fontSize: 10, marginBottom: 3, fontWeight: "600" },

  loadingText: { marginTop: 12, fontSize: 14 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
  },
  emptyStateTitle: { fontSize: 17, fontWeight: "700", marginTop: 10 },
  footerInfo: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", flex: 1 },

  inputGroup: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    marginBottom: 4,
    gap: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#09528e",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    elevation: 3,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  inlineForm: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginTop: -6,
  },
  inlineFormTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inlineBtn: {
    backgroundColor: "#0369a1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  inlineBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
