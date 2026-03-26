import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getLogoURIs } from "../constants/logosURIS";
import { obtenerPlantillaActiva } from "../services/plantillasCache";

import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import api from "../services/api";

export default function ActaRetiroScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();
  const isReadOnly = mode === "view";
  const tipoActa = "RETIRO";

  const [oficinasBD, setOficinasBD] = useState([]);
  const [unidadesList, setUnidadesList] = useState([]);
  const [cargosList, setCargosList] = useState([]);
  const [empleadosBD, setEmpleadosBD] = useState([]);
  const [tiposEquipoBD, setTiposEquipoBD] = useState([]);
  const [marcasBD, setMarcasBD] = useState([]);
  const [modelosBD, setModelosBD] = useState([]);
  const [receptoresBD, setReceptoresBD] = useState([]);

  const [usuarioLogueado, setUsuarioLogueado] = useState("");
  const [cargoLogueado, setCargoLogueado] = useState("");

  const [tipoDestinatario, setTipoDestinatario] = useState("EMPLEADO");
  const [oficinaSel, setOficinaSel] = useState("");
  const [unidadSel, setUnidadSel] = useState("");
  const [cargoSel, setCargoSel] = useState("");
  const [empleadoSelId, setEmpleadoSelId] = useState("");
  const [empleadoSelNombre, setEmpleadoSelNombre] = useState("");
  const [receptorSelId, setReceptorSelId] = useState("");
  const [receptorSelNombre, setReceptorSelNombre] = useState("");
  const [receptorEmpresa, setReceptorEmpresa] = useState("");
  const [receptorCargo, setReceptorCargo] = useState("");

  const [items, setItems] = useState([]);
  const [tempTipo, setTempTipo] = useState("");
  const [tempMarca, setTempMarca] = useState("");
  const [tempModelo, setTempModelo] = useState("");
  const [tempSerie, setTempSerie] = useState("");
  const [tempFicha, setTempFicha] = useState("");
  const [tempInv, setTempInv] = useState("");
  const [tempDesc, setTempDesc] = useState("");
  const [tempDescripcion, setTempDescripcion] = useState("");
  const [tempObs, setTempObs] = useState("");

  const [correlativo, setCorrelativo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  // CARGAR ACTA EN MODO VISTA
  useEffect(() => {
    const cargarDatos = async () => {
      if (id) {
        try {
          const res = await api.get(`/actas/procesadas/${tipoActa}/${id}`);
          const acta = Array.isArray(res.data) ? res.data[0] : res.data;
          if (!acta) return;

          const tipo = acta.tipoDestinatario || "EMPLEADO";
          setTipoDestinatario(tipo);

          if (tipo === "RECEPTOR") {
            setReceptorSelNombre(acta.receptor?.nombre || "");
            setReceptorCargo(acta.receptor?.cargo || "");
            setReceptorEmpresa(acta.receptor?.empresa || "");
          } else {
            setEmpleadoSelNombre(acta.receptor?.nombre || "");
            setCargoSel(
              acta.receptor?.cargo === "S/C" ? "" : acta.receptor?.cargo || "",
            );
            setOficinaSel(acta.receptor?.oficina || "");
            setUnidadSel(acta.receptor?.unidad || "");
          }

          setTempDesc(acta.asunto || "");
          setTempDescripcion(acta.descripcion || "");
          setTempObs(acta.observacion || "");
          setCorrelativo(acta.correlativo || "");

          if (acta.items?.length > 0) {
            setItems(
              acta.items.map((item) => ({
                ...item,
                tipo: item.tipo || "Equipo",
                marca: item.marca || "",
                modelo: item.modelo || "",
                serie: item.serie || "",
                numFicha: item.numFicha || "",
                numInv: item.numInv || "",
                _idTemporal: Math.random().toString(),
              })),
            );
          }
        } catch (error) {
          console.error("Error trayendo acta:", error);
          Alert.alert("Error", "No se pudo cargar el detalle del acta");
        }
      }
    };
    cargarDatos();
  }, [id]);

  // CATÁLOGOS
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const nombre = await AsyncStorage.getItem("nomUsu");
        const cargo = await AsyncStorage.getItem("cargoUsu");
        if (nombre) setUsuarioLogueado(nombre);
        if (cargo) setCargoLogueado(cargo);

        const [resEmp, resOfi, resTipo, resMarca, resMod, resRec] =
          await Promise.all([
            api.get("/catalogos/empleados"),
            api.get("/catalogos/oficinas"),
            api.get("/catalogos/tiposEquipo"),
            api.get("/catalogos/marcas"),
            api.get("/catalogos/modelos"),
            api.get("/receptores"),
          ]);

        setEmpleadosBD(resEmp.data);
        setOficinasBD(resOfi.data);
        setTiposEquipoBD(resTipo.data);
        setMarcasBD(resMarca.data);
        setModelosBD(resMod.data);
        setReceptoresBD(resRec.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    cargarTodo();
  }, []);

  // UNIDADES
  useEffect(() => {
    if (oficinaSel) {
      const filtradas = oficinasBD.filter(
        (item) => String(item.nomOficina).trim() === String(oficinaSel).trim(),
      );
      const unicas = [
        ...new Set(
          filtradas.map((item) =>
            item.unidad ? String(item.unidad).trim() : null,
          ),
        ),
      ].filter(Boolean);
      setUnidadesList(unicas);
    } else {
      setUnidadesList([]);
    }
  }, [oficinaSel, oficinasBD]);

  // CARGOS
  useEffect(() => {
    if (oficinaSel && unidadSel) {
      const filtrados = oficinasBD.filter(
        (item) =>
          String(item.nomOficina).trim() === String(oficinaSel).trim() &&
          String(item.unidad).trim() === String(unidadSel).trim(),
      );
      setCargosList(
        [...new Set(filtrados.map((item) => item.cargoOfi))].filter(Boolean),
      );
    } else {
      setCargosList([]);
    }
  }, [oficinaSel, unidadSel, oficinasBD]);

  const mostrarAlerta = (titulo, mensaje = "", botones = []) => {
    if (Platform.OS === "web") {
      const texto = mensaje ? `${titulo}\n\n${mensaje}` : titulo;
      if (botones.length > 1) {
        const confirmado = window.confirm(texto);
        if (confirmado) botones.find((b) => b.style !== "cancel")?.onPress?.();
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

  const agregarItem = () => {
    if (!tempTipo || !tempMarca || !tempModelo) {
      mostrarAlerta("Atención", "Por favor selecciona Tipo, Marca y Modelo.");
      return;
    }
    if (!tempSerie.trim()) {
      mostrarAlerta("Atención", "El número de serie es obligatorio.");
      return;
    }
    setItems([
      ...items,
      {
        tipo: tempTipo,
        marca: tempMarca,
        modelo: tempModelo,
        serie: tempSerie,
        numFicha: tempFicha,
        numInv: tempInv,
        _idTemporal: Date.now().toString(),
      },
    ]);
    setTempTipo("");
    setTempMarca("");
    setTempModelo("");
    setTempSerie("");
    setTempFicha("");
    setTempInv("");
  };

  const eliminarItem = (idTemp) =>
    setItems(items.filter((item) => item._idTemporal !== idTemp));

  const cancelarActa = () => {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "¿Estás seguro?\n\nSi cancelas, perderás todos los datos.",
        )
      )
        router.replace("/generarDocs");
    } else {
      Alert.alert("¿Estás seguro?", "Si cancelas, perderás todos los datos.", [
        { text: "No, continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => router.replace("/generarDocs"),
        },
      ]);
    }
  };

  // GUARDAR
  const generarActa = async () => {
    if (
      tipoDestinatario === "EMPLEADO" &&
      (!empleadoSelId || !empleadoSelNombre)
    ) {
      mostrarAlerta("Error", "Por favor selecciona un empleado.");
      return;
    }
    if (
      tipoDestinatario === "RECEPTOR" &&
      (!receptorSelId || !receptorSelNombre)
    ) {
      mostrarAlerta("Error", "Por favor selecciona un receptor.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Error", "Agrega al menos un equipo.");
      return;
    }

    const payload = {
      tipo: tipoActa,
      idEmpleados:
        tipoDestinatario === "EMPLEADO" ? parseInt(empleadoSelId) : null,
      idReceptores:
        tipoDestinatario === "RECEPTOR" ? parseInt(receptorSelId) : null,
      asunto: tempDesc,
      descripcion: tempDescripcion,
      observacion: tempObs,
      items: items.map((item) => ({
        idEquipo: null,
        tipo: item.tipo,
        marca: item.marca,
        modelo: item.modelo,
        serie: item.serie,
        numFicha: item.numFicha,
        numInv: item.numInv,
      })),
    };

    try {
      const response = await api.post("/actas/procesadas", payload);
      const actaGuardada = response.data;
      const correlativoNuevo = actaGuardada.correlativo || "";
      setCorrelativo(correlativoNuevo);

      const historialKey = "historialActas";
      const historialExistente = await AsyncStorage.getItem(historialKey);
      const historialArray = historialExistente
        ? JSON.parse(historialExistente)
        : [];
      historialArray.push({
        ...actaGuardada,
        fechaGuardado: new Date().toISOString(),
      });
      await AsyncStorage.setItem(historialKey, JSON.stringify(historialArray));

      await generarPDF(correlativoNuevo);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error al guardar acta:", error.response?.data || error);
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.error || "Ocurrió un error inesperado.",
      );
    }
  };

  // GENERAR PDF
  const generarPDF = async (correlativoParam = "") => {
    if (isPrinting) return;
    if (!correlativoParam && !correlativo && !isReadOnly) {
      mostrarAlerta("Atención", "Guarda el acta para generar el PDF");
      return;
    }

    const nombreDestinatario =
      tipoDestinatario === "EMPLEADO" ? empleadoSelNombre : receptorSelNombre;

    if (!nombreDestinatario) {
      mostrarAlerta("Atención", "Falta el nombre del destinatario.");
      return;
    }
    if (items.length === 0) {
      mostrarAlerta("Atención", "Agrega al menos un equipo.");
      return;
    }

    setIsPrinting(true);
    try {
      const correlativoFinal = correlativoParam || correlativo || "";

      const cargoDestinatario =
        tipoDestinatario === "EMPLEADO" ? cargoSel : receptorCargo;
      const orgDestinatario =
        tipoDestinatario === "EMPLEADO"
          ? unidadSel
            ? `${cargoSel} - ${unidadSel}`
            : `${cargoSel} - ${oficinaSel}`
          : `${receptorCargo} - ${receptorEmpresa}`;

      const fechaActual = new Date().toLocaleDateString("es-HN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const [{ conadeh: uriConadeh, info: uriInfo }, c] = await Promise.all([
        getLogoURIs(),
        obtenerPlantillaActiva("RETIRO"),
      ]);

      const columnasRetiro = c.columnasTabla.filter(
        (col) => col !== "asignado",
      );

      const colLabels = {
        marca: c.labelMarca,
        modelo: c.labelModelo,
        serie: c.labelSerie,
        asignado: c.labelAsignado,
      };

      const theadHTML = columnasRetiro
        .map((col) => `<th>${colLabels[col] || col}</th>`)
        .join("");

      const filasTabla = items
        .map((item) => {
          const celdas = columnasRetiro
            .map((col) => {
              if (col === "marca") return `<td>${item.marca || "N/A"}</td>`;
              if (col === "modelo") return `<td>${item.modelo || "N/A"}</td>`;
              if (col === "serie")
                return `
            <td>S/N: ${item.serie || "N/A"}<br/>
              <span style="font-size:10px;color:#555;">
                ${c.mostrarNumFicha ? "Ficha: " + (item.numFicha || "N/A") : ""}
                ${c.mostrarNumFicha && c.mostrarNumInv ? " | " : ""}
                ${c.mostrarNumInv ? "Inv: " + (item.numInv || "N/A") : ""}
              </span>
            </td>`;
              return "<td>-</td>";
            })
            .join("");
          return `<tr>${celdas}</tr>`;
        })
        .join("");

      const observacionHTML =
        c.mostrarObservacion && tempObs
          ? `<p class="observacion"><strong>Pd.</strong> ${tempObs}</p>`
          : "";

      const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Acta de Retiro</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      body { font-family: Arial, sans-serif; color: #000; font-size: 11px;
             line-height: 1.5; padding: 20mm 18mm; }
      .divider { border: none; border-top: 2px solid ${c.colorLinea}; margin: 14px 0; }
      .header { display: flex; justify-content: space-between; align-items: center;
                border-bottom: 2px solid ${c.colorLinea}; padding-bottom: 8px; margin-bottom: 18px; }
      .logo-conadeh { height: 65px; object-fit: contain; }
      .logo-info    { height: 60px; object-fit: contain; }
      .title-container { text-align: center; flex: 1; padding: 0 12px; }
      .title { font-weight: bold; font-size: 12px; margin: 0 0 2px 0;
               text-transform: uppercase; letter-spacing: 0.3px; }
      .subtitle { font-size: 10px; margin: 0; color: #222; }
      .acta-num { font-weight: bold; font-size: 13px; text-decoration: underline;
                  margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
      .info-table { width: 100%; margin-bottom: 18px; border-collapse: collapse; }
      .info-table td { padding: 2px 4px; vertical-align: top; font-size: 11px; }
      .info-label { font-weight: bold; width: 65px; white-space: nowrap; padding-right: 8px; }
      .info-value { padding-left: 4px; word-break: break-word; overflow-wrap: break-word; }
      .info-name { font-weight: bold; display: block; }
      .info-role { display: block; font-size: 10.5px; color: #222; }
      .paragraph { font-size: 11px; text-align: justify; margin: 0 0 16px 0;
                   line-height: 1.6; word-break: break-word; overflow-wrap: break-word; }
      .equipo-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      .equipo-table th { background-color: #f0f0f0; font-weight: bold;
                         border: 1px solid #555; padding: 5px 6px;
                         text-align: center; font-size: 10px; text-transform: uppercase; }
      .equipo-table td { border: 1px solid #555; padding: 5px 6px;
                         text-align: center; font-size: 10px; }
      .observacion { font-size: 11px; margin: 8px 0 20px 0; }
      .firmas-table { width: 100%; margin-top: 65px; border-collapse: collapse; }
      .firma-cell { width: 42%; text-align: center; border-top: 1px solid #000;
                    padding-top: 6px; font-size: 11px; }
      .firma-spacer { width: 16%; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${uriConadeh}" class="logo-conadeh" alt="CONADEH"/>
      <div class="title-container">
        <p class="title">Comisionado Nacional de los Derechos Humanos</p>
        <p class="subtitle">(CONADEH)</p>
        <p class="subtitle">Honduras, C.A.</p>
        <p class="acta-num">Acta de Retiro N° ${correlativoFinal}</p>
      </div>
      <img src="${uriInfo}" class="logo-info" alt="Infotecnología"/>
    </div>

    <table class="info-table">
      <tr>
        <td class="info-label">Para:</td>
        <td class="info-value">
          <span class="info-name">${nombreDestinatario}</span>
          <span class="info-role">${orgDestinatario}</span>
        </td>
      </tr>
      <tr>
        <td class="info-label">De:</td>
        <td class="info-value">
          <span class="info-name">${usuarioLogueado || "Infotecnología"}</span>
          <span class="info-role">${cargoLogueado || "Soporte Técnico"}</span>
        </td>
      </tr>
      <tr>
        <td class="info-label">Asunto:</td>
        <td class="info-value">${tempDesc || "Retiro de Equipo Tecnológico"}</td>
      </tr>
      ${
        c.mostrarDescripcion && tempDescripcion
          ? `
      <tr>
        <td class="info-label">Descripción:</td>
        <td class="info-value">${tempDescripcion}</td>
      </tr>`
          : ""
      }
      <tr>
        <td class="info-label">Fecha:</td>
        <td class="info-value">Tegucigalpa M.D.C., ${fechaActual}</td>
      </tr>
    </table>

    <hr class="divider"/>

    ${
      c.mostrarParrafoIntro && c.textoIntro
        ? `<p class="paragraph">${c.textoIntro}</p>`
        : ""
    }

    <table class="equipo-table">
      <thead><tr>${theadHTML}</tr></thead>
      <tbody>${filasTabla}</tbody>
    </table>

    ${observacionHTML}

    <table class="firmas-table">
      <tr>
        <td class="firma-cell">
          <strong>${nombreDestinatario}</strong><br/>
          ${cargoDestinatario || "___________________"}
        </td>
        <td class="firma-spacer"></td>
        <td class="firma-cell">
          <strong>${usuarioLogueado || "_____________________"}</strong><br/>
          ${cargoLogueado || "Soporte Técnico"}
        </td>
      </tr>
    </table>
  </body>
</html>`;

      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        } else {
          mostrarAlerta("Ventana bloqueada", "Permite los pop-ups.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        const puedCompartir = await Sharing.isAvailableAsync();
        if (puedCompartir) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Guardar o compartir Acta",
            UTI: "com.adobe.pdf",
          });
        } else {
          mostrarAlerta("PDF generado", `Guardado en: ${uri}`);
        }
      }
    } catch (err) {
      console.error("Error al generar PDF:", err.message);
      mostrarAlerta("Error", "No se pudo generar el documento: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Text style={styles.mainTitle}>
          {isReadOnly ? "DETALLE DE ACTA" : "NUEVA ACTA DE RETIRO"}
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>De:</Text>
            <Text style={styles.value}>
              {usuarioLogueado || "Cargando..."} /{" "}
              {cargoLogueado || "Infotecnología"}
            </Text>
          </View>

          {/* DATOS GENERALES */}
          <View style={styles.card}>
            {/* TOGGLE */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  tipoDestinatario === "EMPLEADO" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setTipoDestinatario("EMPLEADO");
                  setReceptorSelId("");
                  setReceptorSelNombre("");
                  setReceptorEmpresa("");
                  setReceptorCargo("");
                }}
                disabled={isReadOnly}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    tipoDestinatario === "EMPLEADO" &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Empleado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  tipoDestinatario === "RECEPTOR" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setTipoDestinatario("RECEPTOR");
                  setEmpleadoSelId("");
                  setEmpleadoSelNombre("");
                  setOficinaSel("");
                  setUnidadSel("");
                  setCargoSel("");
                }}
                disabled={isReadOnly}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    tipoDestinatario === "RECEPTOR" &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Receptor externo
                </Text>
              </TouchableOpacity>
            </View>

            {/* FORMULARIO EMPLEADO */}
            {tipoDestinatario === "EMPLEADO" && (
              <>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Oficina:</Text>
                    {isReadOnly ? (
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={oficinaSel}
                        editable={false}
                      />
                    ) : (
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={oficinaSel}
                          onValueChange={(val) => {
                            setOficinaSel(val);
                            setUnidadSel("");
                            setCargoSel("");
                          }}
                        >
                          <Picker.Item
                            label="Seleccione..."
                            value=""
                            color="#94a3b8"
                          />
                          {[
                            ...new Set(
                              oficinasBD.map((item) =>
                                String(item.nomOficina).trim(),
                              ),
                            ),
                          ]
                            .filter(Boolean)
                            .map((nomOficina, index) => (
                              <Picker.Item
                                key={`ofi-${index}`}
                                label={nomOficina}
                                value={nomOficina}
                              />
                            ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Unidad:</Text>
                    {isReadOnly ? (
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={unidadSel}
                        editable={false}
                      />
                    ) : (
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={unidadSel}
                          onValueChange={(val) => {
                            setUnidadSel(val);
                            setCargoSel("");
                          }}
                          enabled={unidadesList.length > 0}
                        >
                          <Picker.Item
                            label="Seleccione..."
                            value=""
                            color="#94a3b8"
                          />
                          {unidadesList.map((unidad, index) => (
                            <Picker.Item
                              key={`uni-${index}`}
                              label={unidad}
                              value={unidad}
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Cargo:</Text>
                    {isReadOnly ? (
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={cargoSel}
                        editable={false}
                      />
                    ) : (
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={cargoSel}
                          onValueChange={setCargoSel}
                          enabled={cargosList.length > 0}
                        >
                          <Picker.Item
                            label="Seleccione..."
                            value=""
                            color="#94a3b8"
                          />
                          {cargosList.map((nombreCargo, index) => (
                            <Picker.Item
                              key={`car-${index}`}
                              label={nombreCargo}
                              value={nombreCargo}
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Empleado:</Text>
                    {isReadOnly ? (
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={empleadoSelNombre}
                        editable={false}
                      />
                    ) : (
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={String(empleadoSelId)}
                          onValueChange={(val) => {
                            setEmpleadoSelId(val);
                            const emp = empleadosBD.find(
                              (e) =>
                                String(
                                  e.idEmpleados ||
                                    e.idEmpleado ||
                                    e.id ||
                                    e.id_empleado,
                                ) === String(val),
                            );
                            setEmpleadoSelNombre(emp?.nomEmp || "");
                          }}
                        >
                          <Picker.Item
                            label="Seleccione..."
                            value=""
                            color="#94a3b8"
                          />
                          {empleadosBD.map((item, index) => {
                            const uniqueId = String(
                              item.idEmpleados ||
                                item.idEmpleado ||
                                item.id ||
                                item.id_empleado ||
                                "",
                            );
                            return (
                              <Picker.Item
                                key={`emp-${uniqueId}-${index}`}
                                label={item.nomEmp}
                                value={uniqueId}
                              />
                            );
                          })}
                        </Picker>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* FORMULARIO RECEPTOR */}
            {tipoDestinatario === "RECEPTOR" && (
              <>
                <View style={{ marginBottom: 15 }}>
                  <Text style={styles.label}>Receptor:</Text>
                  {isReadOnly ? (
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={receptorSelNombre}
                      editable={false}
                    />
                  ) : (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={String(receptorSelId)}
                        onValueChange={(val) => {
                          setReceptorSelId(val);
                          const rec = receptoresBD.find(
                            (r) => String(r.idReceptores) === String(val),
                          );
                          setReceptorSelNombre(rec?.nomRec || "");
                          setReceptorEmpresa(rec?.emprRec || "");
                          setReceptorCargo(rec?.cargoRec || "");
                        }}
                      >
                        <Picker.Item
                          label="Seleccione..."
                          value=""
                          color="#94a3b8"
                        />
                        {receptoresBD
                          .filter((r) => r.estRec === "Activo")
                          .map((rec) => (
                            <Picker.Item
                              key={`rec-${rec.idReceptores}`}
                              label={rec.nomRec}
                              value={String(rec.idReceptores)}
                            />
                          ))}
                      </Picker>
                    </View>
                  )}
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Empresa:</Text>
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={receptorEmpresa}
                      editable={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Cargo:</Text>
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={receptorCargo}
                      editable={false}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ASUNTO Y DESCRIPCIÓN */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Asunto:</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: "top" }]}
                multiline
                value={tempDesc}
                onChangeText={setTempDesc}
                editable={!isReadOnly}
                placeholder="Asunto del acta..."
              />
            </View>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Descripción:</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: "top" }]}
                multiline
                maxLength={500}
                value={tempDescripcion}
                onChangeText={setTempDescripcion}
                editable={!isReadOnly}
                placeholder="Descripción del equipo..."
              />
            </View>
          </View>

          {/* AGREGAR EQUIPO */}
          {!isReadOnly && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AGREGAR EQUIPO</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Tipo:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={tempTipo}
                      onValueChange={setTempTipo}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color="#94a3b8"
                      />
                      {tiposEquipoBD.map((item, index) => (
                        <Picker.Item
                          key={`tipo-${index}`}
                          label={item.tipo}
                          value={item.tipo}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Marca:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={tempMarca}
                      onValueChange={setTempMarca}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color="#94a3b8"
                      />
                      {marcasBD.map((item, index) => (
                        <Picker.Item
                          key={`marca-${index}`}
                          label={item.marca}
                          value={item.marca}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Modelo:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={tempModelo}
                      onValueChange={setTempModelo}
                    >
                      <Picker.Item
                        label="Seleccione..."
                        value=""
                        color="#94a3b8"
                      />
                      {modelosBD.map((item, index) => (
                        <Picker.Item
                          key={`modelo-${index}`}
                          label={item.modelo}
                          value={item.modelo}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: "#dc2626" }]}>
                    Serie *:
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={tempSerie}
                    onChangeText={setTempSerie}
                    placeholder="Obligatorio"
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Número de Ficha:</Text>
                  <TextInput
                    style={styles.input}
                    value={tempFicha}
                    onChangeText={setTempFicha}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Número de Inventario:</Text>
                  <TextInput
                    style={styles.input}
                    value={tempInv}
                    onChangeText={setTempInv}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: "#0f172a", marginTop: 5 },
                ]}
                onPress={agregarItem}
              >
                <Text style={styles.saveBtnText}>
                  + Agregar Equipo a la lista
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* LISTA EQUIPOS */}
          {items.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.label}>
                Equipos agregados ({items.length}):
              </Text>
              {items.map((item) => (
                <View
                  key={item._idTemporal}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#1e293b" }}>
                      {item.tipo} — {item.marca} {item.modelo}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>
                      S/N: {item.serie || "N/A"} | Ficha:{" "}
                      {item.numFicha || "N/A"} | Inv: {item.numInv || "N/A"}
                    </Text>
                  </View>
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() => eliminarItem(item._idTemporal)}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={24}
                        color="red"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* OBSERVACIÓN */}
          <View style={styles.card}>
            <Text style={styles.label}>Observación:</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: "top" }]}
              multiline
              value={tempObs}
              onChangeText={setTempObs}
              editable={!isReadOnly}
            />
          </View>

          {/* BOTONES */}
          <View style={styles.buttonsContainer}>
            {!isReadOnly && (
              <TouchableOpacity style={styles.saveBtn} onPress={generarActa}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: isPrinting ? "#93c5fd" : "#2563eb" },
              ]}
              onPress={() => generarPDF(correlativo)}
              disabled={isPrinting}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={20}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.saveBtnText}>
                {isPrinting ? "Generando..." : "Exportar PDF"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={isReadOnly ? () => router.back() : cancelarActa}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },
  formContainer: { width: "100%", maxWidth: 900 },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1e293b",
  },
  readOnlyInput: { backgroundColor: "#e2e8f0", color: "#64748b" },
  value: { fontSize: 15, fontWeight: "500", color: "#1e293b" },
  pickerWrapper: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    justifyContent: "center",
    height: 44,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#09528e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleBtnText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  toggleBtnTextActive: { color: "#fff" },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { color: "#64748b", fontSize: 16, fontWeight: "700" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#3ac40d",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
