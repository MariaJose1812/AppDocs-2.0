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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

export default function EmpleadosReceptoresScreen() {
  const [tipoActivo, setTipoActivo] = useState("empleados");

  //Datos
  const [empleados, setEmpleados] = useState([]);
  const [receptores, setReceptores] = useState([]);
  const [oficinasLista, setOficinasLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  //Campos Empleados
  const [empNom, setEmpNom] = useState("");
  const [empCorreo, setEmpCorreo] = useState("");
  const [empDni, setEmpDni] = useState("");
  const [empOficinaId, setEmpOficinaId] = useState("");
  const [empUnidad, setEmpUnidad] = useState("");
  const [empCargoId, setEmpCargoId] = useState("");
  const [empCargo, setEmpCargo] = useState("");

  //Campos Receptores
  const [recNom, setRecNom] = useState("");
  const [recCorreo, setRecCorreo] = useState("");
  const [recEmpresa, setRecEmpresa] = useState("");
  const [recCargo, setRecCargo] = useState("");

  //Estados formularios
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

  // Al cambiar oficina, limpiar unidad y cargo
  useEffect(() => {
    setEmpUnidad("");
    setEmpCargoId("");
    setEmpCargo("");
  }, [empOficinaId]);

  // Al cambiar unidad, limpiar cargo
  useEffect(() => {
    setEmpCargoId("");
    setEmpCargo("");
  }, [empUnidad]);

  //Carga de datos
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

  //Guardar empleado / receptor
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
        const payload = {
          nomEmp: empNom,
          corEmp: empCorreo,
          idOficina: idOficinaFinal,
          dniEmp: empDni || null,
        };
        await api.post("/empleados", payload);
        Alert.alert("Éxito", "Empleado creado correctamente.");
      } else {
        if (!recNom || !recCorreo || !recEmpresa || !recCargo) {
          Alert.alert(
            "Atención",
            "Todos los campos del receptor son obligatorios.",
          );
          return;
        }
        const payload = {
          nomRec: recNom,
          corRec: recCorreo,
          emprRec: recEmpresa,
          cargoRec: recCargo,
        };
        await api.post("/receptores", payload);
        Alert.alert("Éxito", "Receptor creado correctamente.");
      }
      limpiarFormularios();
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al crear:", error);
      if (error.response?.status === 409) {
        Alert.alert("Error", "Este correo ya está registrado.");
      } else {
        Alert.alert("Error", "No se pudo crear el registro.");
      }
    }
  };

  //Limpiar formularios
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

  //ESTADO: ACTIVO - INACTIVO
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
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado en la base de datos.");
    }
  };

  //Crear nueva oficina
  const crearNuevaOficina = async () => {
    if (!nuevaOfNom || !nuevaOfUnidad || !nuevaOfCargo) {
      Alert.alert(
        "Atención",
        "Todos los campos de la nueva oficina son obligatorios.",
      );
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
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la oficina.");
    }
  };

  //Crear nueva unidad
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
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la unidad.");
    }
  };

  //Crear nuevo cargo
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
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el cargo.");
    }
  };

  const getInicial = (nombre) =>
    nombre ? nombre.charAt(0).toUpperCase() : "?";

  //Oficinas únicas
  const oficinasUnicas = [
    ...new Map(oficinasLista.map((o) => [o.nomOficina, o])).values(),
  ];

  //Unidades únicas filtradas por oficina seleccionada
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

  //Filas de cargo filtradas por oficina + unidad
  const cargosDeLaUnidad =
    empOficinaId && empUnidad
      ? oficinasLista.filter(
          (o) => o.nomOficina === empOficinaId && o.unidad === empUnidad,
        )
      : [];

  //Lista filtrada para la pantalla principal
  const datosFiltrados = (
    tipoActivo === "empleados" ? empleados : receptores
  ).filter((item) => {
    const texto = busqueda.toLowerCase();
    const nombre = (item.nomEmp || item.nomRec || "").toLowerCase();
    const correo = (item.corEmp || item.corRec || "").toLowerCase();
    const cargo = (item.cargoEmp || item.cargoRec || "").toLowerCase();
    const oficina = (item.nomOficina || "").toLowerCase();
    return (
      nombre.includes(texto) ||
      correo.includes(texto) ||
      cargo.includes(texto) ||
      oficina.includes(texto)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>
          {/* ENCABEZADO */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.mainTitle}>Directorio</Text>
              <Text style={styles.subTitle}>
                Administra empleados y receptores
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
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
            <TouchableOpacity
              style={[
                styles.tabButton,
                tipoActivo === "empleados" && styles.tabActive,
              ]}
              onPress={() => setTipoActivo("empleados")}
            >
              <MaterialCommunityIcons
                name="badge-account-horizontal-outline"
                size={20}
                color={tipoActivo === "empleados" ? "#fff" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabText,
                  tipoActivo === "empleados" && styles.tabTextActive,
                ]}
              >
                Empleados
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                tipoActivo === "receptores" && styles.tabActive,
              ]}
              onPress={() => setTipoActivo("receptores")}
            >
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={20}
                color={tipoActivo === "receptores" ? "#fff" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabText,
                  tipoActivo === "receptores" && styles.tabTextActive,
                ]}
              >
                Receptores
              </Text>
            </TouchableOpacity>
          </View>

          {/* BÚSQUEDA */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
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
                  const empresa = item.emprRec || "Interno (Empleado)";
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
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={[
                              styles.userName,
                              !isActivo && { color: "#64748b" },
                            ]}
                            numberOfLines={1}
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
                          <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>{cargo}</Text>
                          </View>
                          {tipoActivo === "receptores" && (
                            <View
                              style={[
                                styles.roleBadge,
                                { backgroundColor: "#e0e7ff", marginLeft: 6 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: "#4338ca" },
                                ]}
                              >
                                {empresa}
                              </Text>
                            </View>
                          )}
                          {tipoActivo === "empleados" && oficinaTag && (
                            <View
                              style={[
                                styles.roleBadge,
                                { backgroundColor: "#fef3c7", marginLeft: 6 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  { color: "#d97706" },
                                ]}
                              >
                                {oficinaTag}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.emailRow}>
                          <MaterialCommunityIcons
                            name="email-outline"
                            size={16}
                            color="#64748b"
                          />
                          <Text style={styles.emailText}>{correo}</Text>
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

      {/*MODAL CREAR*/}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

            {/*FORMULARIO EMPLEADO*/}
            {tipoActivo === "empleados" ? (
              <>
                {/* Nombre */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Completo</Text>
                  <TextInput
                    style={styles.input}
                    value={empNom}
                    onChangeText={setEmpNom}
                    placeholder="Ej. Pablo Díaz"
                  />
                </View>

                {/* DNI */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DNI</Text>
                  <TextInput
                    style={styles.input}
                    value={empDni}
                    onChangeText={setEmpDni}
                    placeholder="0000-0000-00000"
                    keyboardType="numeric"
                  />
                </View>

                {/* Correo */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo Electrónico</Text>
                  <TextInput
                    style={styles.input}
                    value={empCorreo}
                    onChangeText={setEmpCorreo}
                    keyboardType="email-address"
                    placeholder="correo@ejemplo.com"
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
                    />
                    <View style={{ height: 8 }} />
                    <TextInput
                      style={styles.input}
                      value={nuevaOfUnidad}
                      onChangeText={setNuevaOfUnidad}
                      placeholder="Unidad"
                    />
                    <View style={{ height: 8 }} />
                    <TextInput
                      style={styles.input}
                      value={nuevaOfCargo}
                      onChangeText={setNuevaOfCargo}
                      placeholder="Cargo"
                    />
                    <TouchableOpacity
                      style={styles.inlineBtn}
                      onPress={crearNuevaOficina}
                    >
                      <Text style={styles.inlineBtnText}>Guardar Oficina</Text>
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
                    />
                    <View style={{ height: 8 }} />
                    <TextInput
                      style={styles.input}
                      value={nuevaUnidadCargo}
                      onChangeText={setNuevaUnidadCargo}
                      placeholder="Cargo de esta unidad"
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
              /*  FORMULARIO RECEPTOR */
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Completo</Text>
                  <TextInput
                    style={styles.input}
                    value={recNom}
                    onChangeText={setRecNom}
                    placeholder="Ej. Carlos Mendoza"
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
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Empresa</Text>
                  <TextInput
                    style={styles.input}
                    value={recEmpresa}
                    onChangeText={setRecEmpresa}
                    placeholder="Ej. Tech Solutions S.A."
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cargo</Text>
                  <TextInput
                    style={styles.input}
                    value={recCargo}
                    onChangeText={setRecCargo}
                    placeholder="Ej. Técnico de Soporte"
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },
  contentWidth: { width: "100%", maxWidth: 900 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  mainTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  subTitle: { fontSize: 14, color: "#64748b", marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 15 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#1e293b",
    outlineStyle: "none",
  },
  clearIcon: { padding: 5 },

  listContainer: { gap: 16 },
  userCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardBloqueada: { opacity: 0.6, backgroundColor: "#f8fafc" },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  userInfo: { flex: 1, justifyContent: "center" },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  badgeInactivo: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactivoText: { fontSize: 10, color: "#ef4444", fontWeight: "bold" },
  badgeContainer: { flexDirection: "row", marginBottom: 6 },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  emailRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  emailText: { fontSize: 14, color: "#64748b", marginLeft: 6 },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  switchLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  inputGroup: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  inputDisabled: { backgroundColor: "#e2e8f0", color: "#64748b" },

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
    borderWidth: 0,
    outlineStyle: "none",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelBtnText: { color: "#475569", fontSize: 15, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  inlineForm: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    marginTop: -8,
  },
  inlineFormTitle: {
    fontSize: 13,
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
