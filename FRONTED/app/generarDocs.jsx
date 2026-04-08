import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import Navbar from "../components/navBar";
import CustomScrollView from "../components/ScrollView";
import Header from "../components/header";

import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

export default function GenerarDocsScreen() {
  const router = useRouter();
  const { theme } = useTheme(); 
  const isDark = theme === "dark";

  const modulos = [
    {
      id: "1",
      titulo: "Acta de Entrega",
      ruta: "/actaEntrega",
      color: "#3ac40d",
      icon: "file-document-check-outline",
      desc: "Gestión y control de actas de entrega de equipo.",
    },
    {
      id: "2",
      titulo: "Acta de Retiro",
      ruta: "/actaRetiro",
      color: "#cc7625",
      icon: "file-document-arrow-right-outline",
      desc: "Gestión y control de actas de retiro de equipo.",
    },
    {
      id: "3",
      titulo: "Acta de Recepción",
      ruta: "/actaRecepcion",
      color: isDark ? "#60a5fa" : "#09528e",
      icon: "folder-download-outline",
      desc: "Registro formal de recepción física de equipo.",
    },
    {
      id: "4",
      titulo: "Memorándums",
      ruta: "/memorandum",
      color: "#70e0f4",
      icon: "file-sign",
      desc: "Redacción de memorándums corporativos internos.",
    },
    {
      id: "5",
      titulo: "Oficios",
      ruta: "/oficios",
      color: isDark ? "#94a3b8" : "#333333",
      icon: "file-document-multiple-outline",
      desc: "Gestión de oficios y comunicados oficiales externos.",
    },
    {
      id: "6",
      titulo: "Pase de Salida",
      ruta: "/paseSalida",
      color: "#e63946",
      icon: "exit-to-app",
      desc: "Autorización y control de salidas de personal o equipos.",
    },
    {
      id: "7",
      titulo: "Reportes",
      ruta: "/reportes",
      color: "#2a9d8f",
      icon: "file-chart-outline",
      desc: "Generación de reportes de equipo.",
    },
  ];

  const bg = Colors[theme].background;
  const textColor = Colors[theme].text;
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#ffffff";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Header />
      <Navbar />

      <CustomScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWidth}>
          <View style={styles.titleContainer}>
            <Text style={[styles.mainTitle, { color: textColor }]}>
              Generación de Documentos
            </Text>
            <Text style={[styles.subTitle, { color: subColor }]}>
              Seleccione el tipo de documento que desea procesar hoy
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {modulos.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.executiveCard, { backgroundColor: cardBg }]}
                onPress={() => router.push(item.ruta)}
              >
                <View
                  style={[styles.cardAccent, { backgroundColor: item.color }]}
                />
                <View style={styles.cardContent}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={36}
                    color={item.color}
                    style={styles.iconStyle}
                  />
                  <Text style={[styles.cardTitle, { color: textColor }]}>
                    {item.titulo}
                  </Text>
                  <Text style={[styles.cardDesc, { color: subColor }]}>
                    {item.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </CustomScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 80,
  },
  contentWidth: { width: "100%", maxWidth: 1000, alignItems: "center" },
  titleContainer: {
    alignItems: "center",
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subTitle: { fontSize: 16, textAlign: "center" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 25,
  },
  executiveCard: {
    width: 280,
    minHeight: 180,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: "hidden",
    marginHorizontal: 10,
    marginBottom: 20,
  },
  cardAccent: { height: 6, width: "100%" },
  cardContent: { padding: 24, flex: 1, justifyContent: "center" },
  iconStyle: { marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  cardDesc: { fontSize: 14, lineHeight: 20 },
});
