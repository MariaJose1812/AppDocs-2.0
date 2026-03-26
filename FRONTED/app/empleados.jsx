import React, { useState, useEffect } from "react";
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
  useWindowDimensions, // Responsividad real
  Platform,
  ScrollView, //Para hacer el modal scrolleable en pantallas pequeñas
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

export default function EmpleadosReceptoresScreen() {
  const { width, height } = useWindowDimensions(); 
  const isSmall = width < 400; 

  const [tipoActivo, setTipoActivo] = useState("empleados");

  const [empleados, setEmpleados] = useState([]);
  const [receptores, setReceptores] = useState([]);
  const [oficinasLista, setOficinasLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [empNom, setEmpNom] = useState("");
  const [empCorreo, setEmpCorreo] = useState("");
  const [empDni, setEmpDni] = useState("");
  const [empOficinaId, setEmpOficinaId] = useState("");
  const [empUnidad, setEmpUnidad] = useState("");
  const [empCargoId, setEmpCargoId] = useState("");
  const [empCargo, setEmpCargo] = useState("");

  const [recNom, setRecNom] = useState("");
  const [recCorreo, setRecCorreo] = useState("");
  const [recEmpresa, setRecEmpresa] = useState("");
  const [recCargo, setRecCargo] = useState("");

  const [mostrarNuevaOficina, setMostrarNuevaOficina] = useState(false);
  const [nuevaOfNom, setNuevaOfNom] = useState("");
  const [nuevaOfUnidad, setNuevaOfUnidad] = useState("");
  const [nuevaOfCargo, setNuevaOfCargo] = useState("");

  const [mostrarNuevaUnidad, setMostrarNuevaUnidad] = useState(false);
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [nuevaUnidadCargo, setNuevaUnidadCargo] = useState("");

  const [mostrarNuevoCargo, setMostrarNuevoCargo] = useState(false);
  const [nuevoCargo, setNuevoCargo] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setEmpUnidad("");
    setEmpCargoId("");
    setEmpCargo("");
  }, [empOficinaId]);

  useEffect(() => {
    setEmpCargoId("");
    setEmpCargo("");
  }, [empUnidad]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEmpleados, resReceptores, resOficinas] = await Promise.all([
        api.get("/empleados"),
        api.get("/receptores"),
        api.get("/catalogos/oficinas"),
      ]);
      const empData = resEmpleados.data.map((e) => ({
        ...e,
        estado: e.estEmp || e.estado || "Activo",
      }));
      const recData = resReceptores.data.map((r) => ({
        ...r,
        estado: r.estRec || r.estado || "Activo",
      }));
      setEmpleados(empData);
      setReceptores(recData);
      setOficinasLista(resOficinas.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  };

  const guardarRegistro = async () => {
    try {
      if (tipoActivo === "empleados") {
        if (!empNom || !empCorreo || !empOficinaId) {
          Alert.alert("Atención", "Nombre, correo y oficina son obligatorios.");
          return;
        }
        let idOficinaFinal;
        if (empCargoId) {
          idOficinaFinal = parseInt(empCargoId);
        } else {
          const oficinaSeleccionada = oficinasLista.find(
            (o) => o.nomOficina === empOficinaId,
          );
          if (!oficinaSeleccionada) {
            Alert.alert("Error", "No se encontró la oficina seleccionada.");
            return;
          }
          idOficinaFinal = oficinaSeleccionada.idOficina;
        }
        await api.post("/empleados", {
          nomEmp: empNom,
          corEmp: empCorreo,
          idOficina: idOficinaFinal,
          dniEmp: empDni || null,
        });
        Alert.alert("Éxito", "Empleado creado correctamente.");
      } else {
        if (!recNom || !recCorreo || !recEmpresa || !recCargo) {
          Alert.alert(
            "Atención",
            "Todos los campos del receptor son obligatorios.",
          );
          return;
        }
        await api.post("/receptores", {
          nomRec: recNom,
          corRec: recCorreo,
          emprRec: recEmpresa,
          cargoRec: recCargo,
        });
        Alert.alert("Éxito", "Receptor creado correctamente.");
      }
      limpiarFormularios();
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al crear:", error);
      if (error.response?.status === 409)
        Alert.alert("Error", "Este correo ya está registrado.");
      else Alert.alert("Error", "No se pudo crear el registro.");
    }
  };

  const limpiarFormularios = () => {
    setEmpNom("");
    setEmpCorreo("");
    setEmpDni("");
    setEmpOficinaId("");
    setEmpUnidad("");
    setEmpCargoId("");
    setEmpCargo("");
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
  };

  const toggleEstado = async (id, tipo, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    const endpoint =
      tipo === "empleado"
        ? `/empleados/${id}/estado`
        : `/receptores/${id}/estado`;
    try {
      await api.put(endpoint, { estado: nuevoEstado });
      if (tipo === "empleado") {
        setEmpleados(
          empleados.map((e) =>
            e.idEmpleados === id ? { ...e, estado: nuevoEstado } : e,
          ),
        );
      } else {
        setReceptores(
          receptores.map((r) =>
            r.idReceptores === id ? { ...r, estado: nuevoEstado } : r,
          ),
        );
      }
    } catch {
      Alert.alert("Error", "No se pudo cambiar el estado en la base de datos.");
    }
  };

  const crearNuevaOficina = async () => {
    if (!nuevaOfNom || !nuevaOfUnidad || !nuevaOfCargo) {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
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
      Alert.alert("Éxito", "Oficina creada correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo crear la oficina.");
    }
  };

  const crearNuevaUnidad = async () => {
    if (!nuevaUnidad || !nuevaUnidadCargo) {
      Alert.alert("Atención", "Unidad y cargo son obligatorios.");
      return;
    }
    const oficinaActual = oficinasLista.find(
      (o) => o.nomOficina === empOficinaId,
    );
    if (!oficinaActual) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: oficinaActual.nomOficina,
        unidad: nuevaUnidad,
        cargoOfi: nuevaUnidadCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpUnidad(res.data.unidad);
      setNuevaUnidad("");
      setNuevaUnidadCargo("");
      setMostrarNuevaUnidad(false);
      Alert.alert("Éxito", "Unidad creada correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo crear la unidad.");
    }
  };

  const crearNuevoCargo = async () => {
    if (!nuevoCargo) {
      Alert.alert("Atención", "El nombre del cargo es obligatorio.");
      return;
    }
    const oficinaActual = oficinasLista.find(
      (o) => o.nomOficina === empOficinaId,
    );
    if (!oficinaActual) return;
    try {
      const res = await api.post("/catalogos/oficinas", {
        nomOficina: oficinaActual.nomOficina,
        unidad: empUnidad,
        cargoOfi: nuevoCargo,
      });
      setOficinasLista((prev) => [...prev, res.data]);
      setEmpCargoId(String(res.data.idOficina));
      setNuevoCargo("");
      setMostrarNuevoCargo(false);
      Alert.alert("Éxito", "Cargo creado correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo crear el cargo.");
    }
  };

  const getInicial = (nombre) =>
    nombre ? nombre.charAt(0).toUpperCase() : "?";

  const oficinasUnicas = [
    ...new Map(oficinasLista.map((o) => [o.nomOficina, o])).values(),
  ];
  const unidadesDeLaOficina = empOficinaId
    ? [
        ...new Set(
          oficinasLista
            .filter((o) => o.nomOficina === empOficinaId)
            .map((o) => o.unidad)
            .filter(Boolean),
        ),
      ]
    : [];
  const cargosDeLaUnidad =
    empOficinaId && empUnidad
      ? oficinasLista.filter(
          (o) => o.nomOficina === empOficinaId && o.unidad === empUnidad,
        )
      : [];

  const datosFiltrados = (
    tipoActivo === "empleados" ? empleados : receptores
  ).filter((item) => {
    const texto = busqueda.toLowerCase();
    return (
      (item.nomEmp || item.nomRec || "").toLowerCase().includes(texto) ||
      (item.corEmp || item.corRec || "").toLowerCase().includes(texto) ||
      (item.cargoEmp || item.cargoRec || "").toLowerCase().includes(texto) ||
      (item.nomOficina || "").toLowerCase().includes(texto)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>
          {/* ENCABEZADO: se apila en pantallas pequeñas */}
          <View style={[styles.headerRow, isSmall && styles.headerRowSmall]}>
            <View style={styles.headerTextBlock}>
              <Text
                style={[styles.mainTitle, isSmall && styles.mainTitleSmall]}
              >
                Directorio
              </Text>
              <Text style={styles.subTitle}>
                Administra empleados y receptores
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, isSmall && styles.addBtnSmall]}
              onPress={() => {
                limpiarFormularios();
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>
                {tipoActivo === "empleados"
                  ? "Nuevo Empleado"
                  : "Nuevo Receptor"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={styles.tabContainer}>
            {["empleados", "receptores"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  tipoActivo === tab && styles.tabActive,
                ]}
                onPress={() => setTipoActivo(tab)}
              >
                <MaterialCommunityIcons
                  name={
                    tab === "empleados"
                      ? "badge-account-horizontal-outline"
                      : "truck-delivery-outline"
                  }
                  size={isSmall ? 17 : 20} 
                  color={tipoActivo === tab ? "#fff" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabText,
                    tipoActivo === tab && styles.tabTextActive,
                    isSmall && styles.tabTextSmall,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BÚSQUEDA */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color="#94a3b8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar ${tipoActivo}...`}
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                style={styles.clearIcon}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* LISTA */}
          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#2563eb"
              style={{ marginTop: 50 }}
            />
          ) : (
            <View style={styles.listContainer}>
              {datosFiltrados.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="card-search-outline"
                    size={48}
                    color="#94a3b8"
                  />
                  <Text style={styles.emptyStateTitle}>Sin resultados</Text>
                </View>
              ) : (
                datosFiltrados.map((item) => {
                  const id = item.idEmpleados || item.idReceptores;
                  const nombre = item.nomEmp || item.nomRec;
                  const correo = item.corEmp || item.corRec;
                  const cargo = item.cargoEmp || item.cargoRec;
                  const empresa = item.emprRec || "Interno";
                  const isActivo = item.estado === "Activo";
                  const oficinaTag = item.nomOficina;

                  return (
                    <View
                      key={id}
                      style={[
                        styles.userCard,
                        !isActivo && styles.cardBloqueada,
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarContainer,
                          !isActivo && {
                            borderColor: "#cbd5e1",
                            backgroundColor: "#f1f5f9",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            !isActivo && { color: "#94a3b8" },
                          ]}
                        >
                          {getInicial(nombre)}
                        </Text>
                      </View>

                      <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[
                              styles.userName,
                              !isActivo && { color: "#64748b" },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {nombre}
                          </Text>
                          {!isActivo && (
                            <View style={styles.badgeInactivo}>
                              <Text style={styles.badgeInactivoText}>
                                Bloqueado
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.badgeContainer}>
                          {cargo ? (
                            <View style={styles.roleBadge}>
                              <Text
                                style={styles.roleBadgeText}
                                numberOfLines={1}
                              >
                                {cargo}
                              </Text>
                            </View>
                          ) : null}
                          {tipoActivo === "receptores" && (
                            <View
                              style={[
                                styles.roleBadge,
                                { backgroundColor: "#e0e7ff" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: "#4338ca" },
                                ]}
                                numberOfLines={1}
                              >
                                {empresa}
                              </Text>
                            </View>
                          )}
                          {tipoActivo === "empleados" && oficinaTag && (
                            <View
                              style={[
                                styles.roleBadge,
                                { backgroundColor: "#fef3c7" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: "#d97706" },
                                ]}
                                numberOfLines={1}
                              >
                                {oficinaTag}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.emailRow}>
                          <MaterialCommunityIcons
                            name="email-outline"
                            size={13}
                            color="#64748b"
                          />
                          <Text
                            style={styles.emailText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {correo}
                          </Text>
                        </View>
                      </View>


                      <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </Text>
                        <Switch
                          value={isActivo}
                          onValueChange={() =>
                            toggleEstado(
                              id,
                              tipoActivo === "empleados"
                                ? "empleado"
                                : "receptor",
                              item.estado,
                            )
                          }
                          trackColor={{ false: "#cbd5e1", true: "#bfdbfe" }}
                          thumbColor={isActivo ? "#2563eb" : "#f8fafc"}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </CustomScrollView>

      {/*MODAL CON SCROLLVIEW INTERNO para formularios largos */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                width: Math.min(width - 32, 500),
                maxHeight: height * 0.88,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons
                  name={
                    tipoActivo === "empleados"
                      ? "badge-account"
                      : "truck-delivery"
                  }
                  size={24}
                  color="#2563eb"
                />
              </View>
              <Text style={styles.modalTitle}>
                Crear {tipoActivo === "empleados" ? "Empleado" : "Receptor"}
              </Text>
            </View>

            {/* Contenido del formulario scrolleable */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled" 
            >
              {tipoActivo === "empleados" ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <TextInput
                      style={styles.input}
                      value={empNom}
                      onChangeText={setEmpNom}
                      placeholder="Ej. Pablo Díaz"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>DNI</Text>
                    <TextInput
                      style={styles.input}
                      value={empDni}
                      onChangeText={setEmpDni}
                      placeholder="0000-0000-00000"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput
                      style={styles.input}
                      value={empCorreo}
                      onChangeText={setEmpCorreo}
                      keyboardType="email-address"
                      placeholder="correo@ejemplo.com"
                      autoCapitalize="none"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  {/* OFICINA */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Oficina</Text>
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
                          color="#2563eb"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={empOficinaId}
                        onValueChange={(v) => setEmpOficinaId(v)}
                        style={styles.picker}
                      >
                        <Picker.Item
                          label="Seleccione una oficina..."
                          value=""
                          color="#94a3b8"
                        />
                        {oficinasUnicas.map((ofi) => (
                          <Picker.Item
                            key={ofi.nomOficina}
                            label={ofi.nomOficina}
                            value={ofi.nomOficina}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  {mostrarNuevaOficina && (
                    <View style={styles.inlineForm}>
                      <Text style={styles.inlineFormTitle}>Nueva Oficina</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevaOfNom}
                        onChangeText={setNuevaOfNom}
                        placeholder="Nombre de la oficina"
                        placeholderTextColor="#94a3b8"
                      />
                      <View style={{ height: 8 }} />
                      <TextInput
                        style={styles.input}
                        value={nuevaOfUnidad}
                        onChangeText={setNuevaOfUnidad}
                        placeholder="Unidad"
                        placeholderTextColor="#94a3b8"
                      />
                      <View style={{ height: 8 }} />
                      <TextInput
                        style={styles.input}
                        value={nuevaOfCargo}
                        onChangeText={setNuevaOfCargo}
                        placeholder="Cargo"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevaOficina}
                      >
                        <Text style={styles.inlineBtnText}>
                          Guardar Oficina
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* UNIDAD */}
                  {empOficinaId !== "" && (
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Unidad</Text>
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
                            color="#2563eb"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={empUnidad}
                          onValueChange={(v) => setEmpUnidad(v)}
                          style={styles.picker}
                        >
                          <Picker.Item
                            label="Seleccione una unidad..."
                            value=""
                            color="#94a3b8"
                          />
                          {unidadesDeLaOficina.map((unidad) => (
                            <Picker.Item
                              key={unidad}
                              label={unidad}
                              value={unidad}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}

                  {mostrarNuevaUnidad && empOficinaId !== "" && (
                    <View style={styles.inlineForm}>
                      <Text style={styles.inlineFormTitle}>Nueva Unidad</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevaUnidad}
                        onChangeText={setNuevaUnidad}
                        placeholder="Nombre de la unidad"
                        placeholderTextColor="#94a3b8"
                      />
                      <View style={{ height: 8 }} />
                      <TextInput
                        style={styles.input}
                        value={nuevaUnidadCargo}
                        onChangeText={setNuevaUnidadCargo}
                        placeholder="Cargo de esta unidad"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevaUnidad}
                      >
                        <Text style={styles.inlineBtnText}>Guardar Unidad</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* CARGO */}
                  {empUnidad !== "" && (
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Cargo</Text>
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
                            color="#2563eb"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={empCargoId}
                          onValueChange={(v) => setEmpCargoId(v)}
                          style={styles.picker}
                        >
                          <Picker.Item
                            label="Seleccione un cargo..."
                            value=""
                            color="#94a3b8"
                          />
                          {cargosDeLaUnidad.map((fila) => (
                            <Picker.Item
                              key={fila.idOficina}
                              label={fila.cargoOfi}
                              value={String(fila.idOficina)}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}

                  {mostrarNuevoCargo && empUnidad !== "" && (
                    <View style={styles.inlineForm}>
                      <Text style={styles.inlineFormTitle}>Nuevo Cargo</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevoCargo}
                        onChangeText={setNuevoCargo}
                        placeholder="Nuevo cargo"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity
                        style={styles.inlineBtn}
                        onPress={crearNuevoCargo}
                      >
                        <Text style={styles.inlineBtnText}>Guardar Cargo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <TextInput
                      style={styles.input}
                      value={recNom}
                      onChangeText={setRecNom}
                      placeholder="Ej. Carlos Mendoza"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput
                      style={styles.input}
                      value={recCorreo}
                      onChangeText={setRecCorreo}
                      keyboardType="email-address"
                      placeholder="correo@ejemplo.com"
                      autoCapitalize="none"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Empresa</Text>
                    <TextInput
                      style={styles.input}
                      value={recEmpresa}
                      onChangeText={setRecEmpresa}
                      placeholder="Ej. Tech Solutions S.A."
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cargo</Text>
                    <TextInput
                      style={styles.input}
                      value={recCargo}
                      onChangeText={setRecCargo}
                      placeholder="Ej. Técnico de Soporte"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={guardarRegistro}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scrollContent: { padding: 16, alignItems: "center", paddingBottom: 80 },
  contentWidth: { width: "100%", maxWidth: 900 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    flexWrap: "wrap",
    gap: 12,
  },
  headerRowSmall: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headerTextBlock: { flexShrink: 1 },
  mainTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  mainTitleSmall: { fontSize: 20 },
  subTitle: { fontSize: 13, color: "#64748b", marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
  },
  addBtnSmall: {
    alignSelf: "stretch",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 14 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
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
  tabActive: {
    backgroundColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  tabTextSmall: { fontSize: 13 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#1e293b",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}), // ✅ Solo en web
  },
  clearIcon: { padding: 6 },

  listContainer: { gap: 12 },

  // Tarjeta con layout que no desborda
  userCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardBloqueada: { opacity: 0.6, backgroundColor: "#f8fafc" },

  avatarContainer: {
    width: 44,
    height: 44,
    minWidth: 44, 
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  avatarText: { fontSize: 17, fontWeight: "700", color: "#2563eb" },

  userInfo: { flex: 1, justifyContent: "center", minWidth: 0 }, 

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    flexShrink: 1, // Se comprime antes de empujar el badge
  },
  badgeInactivo: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactivoText: { fontSize: 9, color: "#ef4444", fontWeight: "bold" },

  // Badges con flexWrap para bajar si no caben
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 5,
  },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140, 
  },
  roleBadgeText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  emailRow: { flexDirection: "row", alignItems: "center" },
  emailText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 5,
    flex: 1, 
  },

  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 56,
  },
  switchLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 3,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", flex: 1 }, 

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
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
  },

  pickerContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#1e293b",
    backgroundColor: "transparent",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}), // Solo en web
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    marginBottom: 4,
    gap: 10,
  },
  cancelBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelBtnText: { color: "#475569", fontSize: 14, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  saveBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },

  inlineForm: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginTop: -6,
  },
  inlineFormTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
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
