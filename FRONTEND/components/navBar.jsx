import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "../hooks/themeContext";
import { Colors } from "../constants/theme";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navLinks = [
    { titulo: "Documentos", ruta: "/generarDocs" },
    { titulo: "Historial", ruta: "/dashboard" },
    { titulo: "Usuarios", ruta: "/usuarios" },
    { titulo: "Directorio", ruta: "/empleados" },
    { titulo: "Equipos", ruta: "/equipos" },
    { titulo: "Plantillas", ruta: "/plantillas" },
  ];

  const isCorreoActive = pathname === "/correo";
  const notificacionesNoLeidas = 0; 

  return (
    <View
      style={[
        styles.navbarContainer,
        {
          backgroundColor: Colors[theme].background,
          borderBottomColor: isDarkMode ? "#1e293b" : "#e2e8f0",
        },
      ]}
    >
      <View style={styles.navbarContent}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navScrollContent}
          style={styles.navScrollView}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.ruta;
            return (
              <TouchableOpacity
                key={link.ruta}
                style={[
                  styles.navItem,
                  isActive && { borderBottomColor: Colors[theme].tint },
                ]}
                onPress={() => router.push(link.ruta)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.navText,
                    { color: isDarkMode ? "#94a3b8" : "#64748b" },
                    isActive && {
                      color: Colors[theme].text,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {link.titulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Icono de correo fijo a la derecha */}
        <TouchableOpacity
          style={[
            styles.emailButton,
            isCorreoActive && styles.emailButtonActive,
            Platform.OS === "web" && styles.emailButtonWeb,
          ]}
          onPress={() => router.push("/correo")}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={24}
            color={
              isCorreoActive
                ? Colors[theme].tint
                : isDarkMode
                  ? "#94a3b8"
                  : "#64748b"
            }
          />
          {notificacionesNoLeidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  navbarContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navScrollView: {
    flex: 1,
  },
  navScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
    flexGrow: 1, 
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    borderRadius: 0,
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  navText: {
    fontWeight: "500",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  emailButton: {
    padding: 10,
    borderRadius: 40,
    marginLeft: 12,
    position: "relative",
    backgroundColor: "transparent",
    transition: "background-color 0.2s ease",
  },
  emailButtonActive: {
    backgroundColor: "rgba(100, 108, 255, 0.1)",
  },
  emailButtonWeb: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: "rgba(0,0,0,0.05)",
    },
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
