import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import api from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

import Navbar from "../components/navBar";
import Header from "../components/header";
import CustomScrollView from "../components/ScrollView";

export default function DashboardScreen() {
  const router = useRouter();

  const [historialDocs, setHistorialDocs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState(""); 

  // PIDE LOS DATOS
  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [])
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

  // TRADUCE EL TIPO DE ACTA
  const obtenerNombreTipo = (tipo) => {
    const tipos = {
      acta_entrega_encabezado: "Acta de Entrega",
      acta_recepcion_encabezado: "Acta de Recepción",
    };
    return tipos[tipo] || tipo;
  };

  // ABRIR ACTA
  const abrirActa = (item) => {
    let ruta = "";
    if (item.tipo === "acta_entrega_encabezado") ruta = "/actaEntrega";
    if (item.tipo === "acta_retiro_encabezado") ruta = "/actaRetiro";
    if (item.tipo === "acta_recepcion_encabezado") ruta = "/actaRecepcion";

    router.push({
      pathname: ruta,
      params: {
        id: item.id,
        tipo: item.tipo,
        mode: "view",
      },
    });
  };

  // BUSCADOR ACTAS 
  const actasFiltradas = historialDocs.filter((acta) => {
    const textoBuscado = busqueda.toLowerCase();
    const asunto = acta.asunto ? acta.asunto.toLowerCase() : "";
    const tipoTraducido = obtenerNombreTipo(acta.tipo).toLowerCase();
    const correlativo = acta.correlativo ? acta.correlativo.toString() : "";
    const creador = acta.usuario ? acta.usuario.toLowerCase() : "";

    return (
      asunto.includes(textoBuscado) ||
      tipoTraducido.includes(textoBuscado) ||
      correlativo.includes(textoBuscado) ||
      creador.includes(textoBuscado)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Historial de Documentos</Text>

          {/* BARRA DE BÚSQUEDA */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color="#94a3b8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por acta, asunto o N°..."
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

          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#09528e"
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.listContainer}>
              {actasFiltradas.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name={
                      busqueda
                        ? "file-search-outline"
                        : "file-document-multiple-outline"
                    }
                    size={48}
                    color="#94a3b8"
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={styles.emptyStateTitle}>
                    {busqueda ? "No hay resultados" : "Sin documentos"}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {busqueda
                      ? `No encontramos ningún acta que coincida con "${busqueda}".`
                      : "Aún no hay actas registradas en el historial."}
                  </Text>
                </View>
              ) : (
                // LISTA DE ACTAS FILTRADAS
                actasFiltradas.map((item) => (
                  <TouchableOpacity
                    key={`${item.id}-${item.tipo}`}
                    style={styles.card}
                    onPress={() => abrirActa(item)}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardType}>
                        {obtenerNombreTipo(item.tipo)}
                      </Text>
                      <Text style={styles.cardDate}>{item.fecha}</Text>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardBodyVertical}>
                      <Text style={styles.cardDetail}>
                        <Text style={styles.bold}>Asunto:</Text> {item.asunto}
                      </Text>

                      <View style={styles.cardFooter}>
                        <Text style={styles.cardDetail}>
                          <Text style={styles.bold}>Creado por:</Text>{" "}
                          {item.usuario}
                        </Text>
                        <Text style={styles.cardDetail}>
                          <Text style={styles.bold}>N°:</Text> {item.correlativo}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    padding: 20,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
  },

  // ESTILOS DEL BUSCADOR
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
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

  listContainer: {
    gap: 12, 
  },

  // ESTILOS DE LA TARJETA
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: "#09528e",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardDate: {
    fontSize: 13,
    color: "#64748b",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 10,
  },
  cardBodyVertical: {
    flexDirection: "column",
  },
  cardDetail: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bold: {
    fontWeight: "700",
    color: "#334155",
  },

  // ESTILOS 
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});