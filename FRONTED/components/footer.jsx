import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../hooks/themeContext";

export default function Footer({ extraText = "" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const borderColor = isDark ? "#1e293b" : "#e2e8f0";
  const textPrimary = isDark ? "#64748b" : "#94a3b8";
  const textSecondary = isDark ? "#475569" : "#cbd5e1";
  const dotColor = isDark ? "#334155" : "#cbd5e1";

  const anio = new Date().getFullYear();

  return (
    <View style={[styles.footer, { borderTopColor: borderColor }]}>
      {/* Línea decorativa */}
      <View style={[styles.lineDecor, { backgroundColor: borderColor }]} />

      {/* Contenido */}
      <View style={styles.row}>
        <Text style={[styles.org, { color: textPrimary }]}>CONADEH</Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.dept, { color: textPrimary }]}>
          Unidad de Infotecnología
        </Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.dept, { color: textPrimary }]}>
          Honduras, C.A.
        </Text>
      </View>

      {extraText ? (
        <Text style={[styles.extra, { color: textSecondary }]}>
          {extraText}
        </Text>
      ) : null}

      <Text style={[styles.copy, { color: textSecondary }]}>
        © {anio} Comisionado Nacional de los Derechos Humanos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 40,
    marginBottom: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  lineDecor: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  org: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dept: {
    fontSize: 12,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  extra: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  copy: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
