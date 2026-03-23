import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { invalidarCache } from "../services/plantillasCache";
import api from "../services/api";
import Header from "../components/header";
import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";

const TIPOS = ["ENTREGA", "RETIRO"];

export default function PlantillasScreen() {
  const router = useRouter();
  const [tipoSel, setTipoSel] = useState("ENTREGA");
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [tipoSel]),
  );

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/plantillas/${tipoSel}`);
      setPlantillas(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const activar = async (id) => {
    try {
      await api.put(`/plantillas/${id}/activar`);
      await invalidarCache(tipoSel); 
      cargar();
    } catch (e) {
      Alert.alert("Error", "No se pudo activar la plantilla.");
    }
  };

  const confirmarEliminar = (id) => {
    const ejecutar = () =>
      api
        .delete(`/plantillas/${id}`)
        .then(cargar)
        .catch(() => {
          if (Platform.OS === "web") {
            window.alert("No se puede eliminar la plantilla activa.");
          } else {
            Alert.alert("Error", "No se puede eliminar la plantilla activa.");
          }
        });

    if (Platform.OS === "web") {
      if (window.confirm("¿Eliminar esta plantilla?")) ejecutar();
    } else {
      Alert.alert("Confirmar", "¿Eliminar esta plantilla?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: ejecutar },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Plantillas de Documentos</Text>
          <TouchableOpacity
            style={styles.nuevaBtn}
            onPress={() =>
              router.push({
                pathname: "/editarPlantilla",
                params: { tipoActa: tipoSel },
              })
            }
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.nuevaBtnText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {TIPOS.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[styles.tab, tipoSel === tipo && styles.tabActivo]}
              onPress={() => setTipoSel(tipo)}
            >
              <Text
                style={[
                  styles.tabText,
                  tipoSel === tipo && styles.tabTextActivo,
                ]}
              >
                Acta de {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#09528e"
            style={{ marginTop: 40 }}
          />
        ) : plantillas.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color="#94a3b8"
            />
            <Text style={styles.emptyText}>
              No hay plantillas para este tipo.
            </Text>
          </View>
        ) : (
          plantillas.map((p) => (
            <View
              key={p.idPlantilla}
              style={[styles.card, p.activa && styles.cardActiva]}
            >
              <View style={styles.cardLeft}>
                {p.activa && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>ACTIVA</Text>
                  </View>
                )}
                <Text style={styles.cardNombre}>{p.nombrePlantilla}</Text>
                <Text style={styles.cardFecha}>
                  Modificada:{" "}
                  {new Date(p.fechaModificacion).toLocaleDateString("es-HN")}
                </Text>
              </View>

              <View style={styles.acciones}>
                {!p.activa && (
                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => activar(p.idPlantilla)}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={22}
                      color="#16a34a"
                    />
                    <Text style={[styles.accionText, { color: "#16a34a" }]}>
                      Activar
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.accionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/editarPlantilla",
                      params: { id: p.idPlantilla, tipoActa: tipoSel },
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={22}
                    color="#09528e"
                  />
                  <Text style={[styles.accionText, { color: "#09528e" }]}>
                    Editar
                  </Text>
                </TouchableOpacity>
                {!p.activa && (
                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => confirmarEliminar(p.idPlantilla)}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={22}
                      color="#dc2626"
                    />
                    <Text style={[styles.accionText, { color: "#dc2626" }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: 20, paddingBottom: 60 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  nuevaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#09528e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nuevaBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActivo: { borderBottomWidth: 3, borderBottomColor: "#09528e" },
  tabText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  tabTextActivo: { color: "#09528e" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  cardActiva: { borderLeftColor: "#09528e" },
  cardLeft: { flex: 1 },
  badge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  cardNombre: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardFecha: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  acciones: { flexDirection: "row", gap: 12 },
  accionBtn: { alignItems: "center", gap: 2 },
  accionText: { fontSize: 11, fontWeight: "600" },
});
