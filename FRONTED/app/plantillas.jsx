import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

import { invalidarCache } from "../services/plantillasCache";
import api from "../services/api";
import Header from "../components/header";
import Navbar from "../components/navBar";
import Footer from "../components/footer";
import CustomScrollView from "../components/ScrollView";

const TIPOS = [
  { key: "ENTREGA", label: "Acta de Entrega" },
  { key: "RETIRO", label: "Acta de Retiro" },
  { key: "RECEPCION", label: "Acta de Recepción" },
  { key: "MEMORANDUM", label: "Memorándum" },
  { key: "OFICIO", label: "Oficio" },
  { key: "PASE_SALIDA", label: "Pase de Salida" },
  { key: "REPORTE", label: "Reporte" },
];

export default function PlantillasScreen() {
  const router = useRouter();
  const [tipoSel, setTipoSel] = useState("ENTREGA");
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Variables de tema dinámico
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Colores dinámicos adaptables
  const bg = Colors?.[theme]?.background || (isDark ? "#0f172a" : "#f8fafc");
  const textColor = Colors?.[theme]?.text || (isDark ? "#f8fafc" : "#1e293b");
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const borderCol = isDark ? "#334155" : "#e2e8f0";
  const highlightCol = isDark ? "#60a5fa" : "#09528e";
  const badgeBgActive = isDark ? "#064e3b" : "#dcfce7";
  const badgeTextActive = isDark ? "#4ade80" : "#16a34a";
  const dangerCol = isDark ? "#f87171" : "#dc2626";

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
          Platform.OS === "web"
            ? window.alert("No se puede eliminar la plantilla activa.")
            : Alert.alert("Error", "No se puede eliminar la plantilla activa.");
        });

    Platform.OS === "web"
      ? window.confirm("¿Eliminar esta plantilla?") && ejecutar()
      : Alert.alert("Confirmar", "¿Eliminar esta plantilla?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: ejecutar },
        ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Header />
      <Navbar />
      <CustomScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentWidth}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: textColor }]}>
            Plantillas de Documentos
          </Text>
          <TouchableOpacity
            style={[styles.nuevaBtn, { backgroundColor: highlightCol }]}
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

        {/* TABS — scroll horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {TIPOS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tab,
                { backgroundColor: surfaceBg, borderColor: borderCol },
                tipoSel === key && {
                  backgroundColor: highlightCol,
                  borderColor: highlightCol,
                },
              ]}
              onPress={() => setTipoSel(key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: subColor },
                  tipoSel === key && { color: "#fff" },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color={highlightCol}
            style={{ marginTop: 40 }}
          />
        ) : plantillas.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color={subColor}
            />
            <Text style={[styles.emptyText, { color: subColor }]}>
              No hay plantillas para este tipo.
            </Text>
          </View>
        ) : (
          plantillas.map((p) => (
            <View
              key={p.idPlantilla}
              style={[
                styles.card,
                {
                  backgroundColor: surfaceBg,
                  borderLeftColor: borderCol,
                  shadowColor: isDark ? "#000" : "#94a3b8",
                },
                p.activa && { borderLeftColor: highlightCol },
              ]}
            >
              <View style={styles.cardLeft}>
                {p.activa && (
                  <View
                    style={[styles.badge, { backgroundColor: badgeBgActive }]}
                  >
                    <Text
                      style={[styles.badgeText, { color: badgeTextActive }]}
                    >
                      ACTIVA
                    </Text>
                  </View>
                )}
                <Text style={[styles.cardNombre, { color: textColor }]}>
                  {p.nombrePlantilla}
                </Text>
                <Text style={[styles.cardFecha, { color: subColor }]}>
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
                      color={badgeTextActive}
                    />
                    <Text
                      style={[styles.accionText, { color: badgeTextActive }]}
                    >
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
                    color={highlightCol}
                  />
                  <Text style={[styles.accionText, { color: highlightCol }]}>
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
                      color={dangerCol}
                    />
                    <Text style={[styles.accionText, { color: dangerCol }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        </View>
        <Footer />
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 80,
  },
  contentWidth: {
    width: "100%",
    maxWidth: 1000,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "800" },
  nuevaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nuevaBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  tabsScroll: { marginBottom: 20 },
  tabsContent: { gap: 6, paddingBottom: 4 },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabText: { fontSize: 13, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  cardLeft: { flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardNombre: { fontSize: 16, fontWeight: "700" },
  cardFecha: { fontSize: 12, marginTop: 4 },
  acciones: { flexDirection: "row", gap: 12 },
  accionBtn: { alignItems: "center", gap: 2 },
  accionText: { fontSize: 11, fontWeight: "600" },
});
