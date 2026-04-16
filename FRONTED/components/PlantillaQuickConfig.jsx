import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const CAMPOS_CONFIG = {
  ENTREGA: {
    campos: [
      { key: "mostrarDescripcion", label: "Descripción", icon: "text-long" },
      {
        key: "mostrarObservacion",
        label: "Observación (Pd.)",
        icon: "note-text-outline",
      },
      {
        key: "mostrarParrafoIntro",
        label: "Párrafo intro",
        icon: "format-paragraph",
      },
      { key: "mostrarNumFicha", label: "Nº Ficha", icon: "identifier" },
      { key: "mostrarNumInv", label: "Nº Inventario", icon: "archive-outline" },
    ],
    columnas: [
      { key: "marca", label: "Marca" },
      { key: "modelo", label: "Modelo" },
      { key: "serie", label: "S/N" },
      { key: "asignado", label: "Asignado a" },
    ],
  },
  RETIRO: {
    campos: [
      { key: "mostrarDescripcion", label: "Descripción", icon: "text-long" },
      {
        key: "mostrarObservacion",
        label: "Observación (Pd.)",
        icon: "note-text-outline",
      },
      {
        key: "mostrarParrafoIntro",
        label: "Párrafo intro",
        icon: "format-paragraph",
      },
      { key: "mostrarNumFicha", label: "Nº Ficha", icon: "identifier" },
      { key: "mostrarNumInv", label: "Nº Inventario", icon: "archive-outline" },
    ],
    columnas: [
      { key: "marca", label: "Marca" },
      { key: "modelo", label: "Modelo" },
      { key: "serie", label: "S/N" },
      { key: "asignado", label: "Asignado a" },
    ],
  },
  MEMORANDUM: {
    campos: [
      {
        key: "mostrarDespedida",
        label: "Saludos cordiales",
        icon: "handshake-outline",
      },
    ],
    columnas: [],
  },
  OFICIO: {
    campos: [
      {
        key: "mostrarDespedida",
        label: "Saludos cordiales",
        icon: "handshake-outline",
      },
    ],
    columnas: [],
  },
  RECEPCION: { campos: [], columnas: [] },
  PASE_SALIDA: { campos: [], columnas: [] },
  REPORTE: { campos: [], columnas: [] },
};

export default function PlantillaQuickConfig({
  tipoDoc,
  configBase,
  configOverride,
  onChange,
  colors: c,
}) {
  const [expandido, setExpandido] = useState(false);

  const cfg = CAMPOS_CONFIG[tipoDoc] || { campos: [], columnas: [] };
  const total = cfg.campos.length + cfg.columnas.length;

  // Si no hay nada configurable, no mostrar el componente
  if (total === 0) return null;

  // Combina base + overrides para saber estado actual
  const cfgActual = { ...(configBase || {}), ...(configOverride || {}) };

  const toggle = (key, valorActual) => {
    onChange((prev) => ({ ...(prev || {}), [key]: !valorActual }));
  };

  const toggleColumna = (colKey) => {
    const colsBase = cfgActual.columnasTabla || ["marca", "modelo", "serie"];
    const colsActuales = colsBase.includes(colKey)
      ? colsBase.filter((k) => k !== colKey)
      : [...colsBase, colKey];
    onChange((prev) => ({ ...(prev || {}), columnasTabla: colsActuales }));
  };

  // Cuenta cuántas overrides hay activas
  const numOverrides = Object.keys(configOverride || {}).length;

  return (
    <View
      style={[
        st.container,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      {/* Header colapsable */}
      <TouchableOpacity
        onPress={() => setExpandido(!expandido)}
        style={[
          st.header,
          {
            borderBottomColor: expandido ? c.border : "transparent",
            borderBottomWidth: expandido ? 1 : 0,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="tune-variant"
          size={16}
          color={c.accent}
          style={{ marginRight: 8 }}
        />
        <Text style={[st.headerTitle, { color: c.text }]}>
          Configuración del documento
        </Text>
        {numOverrides > 0 && (
          <View style={[st.badge, { backgroundColor: c.accent }]}>
            <Text style={st.badgeText}>{numOverrides}</Text>
          </View>
        )}
        <MaterialCommunityIcons
          name={expandido ? "chevron-up" : "chevron-down"}
          size={18}
          color={c.sub}
          style={{ marginLeft: "auto" }}
        />
      </TouchableOpacity>

      {/* Contenido */}
      {expandido && (
        <View style={st.body}>
          {cfg.campos.length > 0 && (
            <>
              <Text style={[st.groupLabel, { color: c.sub }]}>CAMPOS</Text>
              <View style={st.pillsWrap}>
                {cfg.campos.map(({ key, label, icon }) => {
                  const activo = !!cfgActual[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggle(key, activo)}
                      style={[
                        st.pill,
                        {
                          backgroundColor: activo ? c.accent : c.surface2,
                          borderColor: activo ? c.accent : c.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={13}
                        color={activo ? "#fff" : c.sub}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          st.pillLabel,
                          { color: activo ? "#fff" : c.sub },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {cfg.columnas.length > 0 && (
            <>
              <Text
                style={[
                  st.groupLabel,
                  { color: c.sub, marginTop: cfg.campos.length ? 10 : 0 },
                ]}
              >
                COLUMNAS DE TABLA
              </Text>
              <View style={st.pillsWrap}>
                {cfg.columnas.map(({ key, label }) => {
                  const colsActuales = cfgActual.columnasTabla || [
                    "marca",
                    "modelo",
                    "serie",
                  ];
                  const activo = colsActuales.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleColumna(key)}
                      style={[
                        st.pill,
                        {
                          backgroundColor: activo ? c.accentLt : c.surface2,
                          borderColor: activo ? c.accentLt : c.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          st.pillLabel,
                          { color: activo ? "#fff" : c.sub },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Reset */}
          {numOverrides > 0 && (
            <TouchableOpacity
              style={[st.resetBtn, { borderColor: c.border }]}
              onPress={() => onChange(null)}
            >
              <MaterialCommunityIcons
                name="restore"
                size={13}
                color={c.sub}
                style={{ marginRight: 5 }}
              />
              <Text style={[st.resetText, { color: c.sub }]}>
                Usar configuración de la plantilla
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[st.note, { color: c.sub }]}>
            Los cambios aplican solo a este documento. Para guardar
            permanentemente ve a Plantillas.
          </Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 13, fontWeight: "600" },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  body: { padding: 14 },
  groupLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  pillLabel: { fontSize: 12, fontWeight: "600" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  resetText: { fontSize: 12, fontWeight: "600" },
  note: { fontSize: 10, marginTop: 10, lineHeight: 14 },
});
