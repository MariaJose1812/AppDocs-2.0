import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/**
 * Renderiza campos simples y tablas extra definidas en la plantilla activa.
 *
 * Props:
 *  - camposExtra  : array de definición de campos
 *  - tablasExtra  : array de definición de tablas
 *  - valores      : { [id]: valor } para campos simples
 *  - onChangeValor: (id, valor) => void
 *  - filasTablas  : { [tablaId]: [{ col1, col2, ... }] }
 *  - onAgregarFila: (tablaId, filaVacia) => void
 *  - onEliminarFila: (tablaId, index) => void
 *  - onCambiarFila: (tablaId, index, colId, valor) => void
 *  - c            : paleta de colores del tema
 *  - isReadOnly   : boolean
 */
export default function CamposDinamicos({
  camposExtra = [],
  tablasExtra = [],
  valores = {},
  onChangeValor,
  filasTablas = {},
  onAgregarFila,
  onEliminarFila,
  onCambiarFila,
  c,
  isReadOnly = false,
}) {
  if (camposExtra.length === 0 && tablasExtra.length === 0) return null;

  const inputStyle = {
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
    marginBottom: 10,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: "600",
    color: c.textMuted,
    marginBottom: 4,
  };

  return (
    <View>
      {/*CAMPOS SIMPLES EXTRA */}
      {camposExtra.length > 0 && (
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Información adicional
          </Text>
          {camposExtra.map((campo) => (
            <View key={campo.id}>
              <Text style={labelStyle}>
                {campo.label}
                {campo.obligatorio ? (
                  <Text style={{ color: c.danger }}> *</Text>
                ) : null}
              </Text>
              <TextInput
                style={inputStyle}
                value={valores[campo.id] || ""}
                onChangeText={(val) => onChangeValor?.(campo.id, val)}
                placeholder={campo.placeholder || ""}
                placeholderTextColor={c.textMuted}
                keyboardType={campo.tipo === "numero" ? "numeric" : "default"}
                editable={!isReadOnly}
                multiline={campo.tipo === "parrafo"}
              />
            </View>
          ))}
        </View>
      )}

      {/*TABLAS EXTRA*/}
      {tablasExtra.map((tabla) => {
        const filas = filasTablas[tabla.id] || [];

        const filaVacia = tabla.columnas.reduce((acc, col) => {
          acc[col.id] = "";
          return acc;
        }, {});

        return (
          <View
            key={tabla.id}
            style={[styles.card, { backgroundColor: c.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              {tabla.titulo}
            </Text>

            {/* Encabezado de la tabla */}
            <View style={[styles.tablaHeader, { backgroundColor: c.surface2 }]}>
              {tabla.columnas.map((col) => (
                <Text
                  key={col.id}
                  style={[styles.tablaHeaderCell, { color: c.textMuted }]}
                >
                  {col.label}
                </Text>
              ))}
              {!isReadOnly && <View style={{ width: 32 }} />}
            </View>

            {/* Filas */}
            {filas.map((fila, rowIndex) => (
              <View
                key={rowIndex}
                style={[styles.tablaFila, { borderBottomColor: c.border }]}
              >
                {tabla.columnas.map((col) => (
                  <TextInput
                    key={col.id}
                    style={[
                      styles.tablaCelda,
                      { color: c.text, borderColor: c.border2 },
                    ]}
                    value={fila[col.id] || ""}
                    onChangeText={(val) =>
                      onCambiarFila?.(tabla.id, rowIndex, col.id, val)
                    }
                    placeholderTextColor={c.textMuted}
                    placeholder="—"
                    keyboardType={col.tipo === "numero" ? "numeric" : "default"}
                    editable={!isReadOnly}
                  />
                ))}
                {!isReadOnly && (
                  <TouchableOpacity
                    onPress={() => onEliminarFila?.(tabla.id, rowIndex)}
                    style={styles.deleteBtn}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={c.danger}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Botón agregar fila */}
            {!isReadOnly && (
              <TouchableOpacity
                style={[styles.agregarBtn, { borderColor: c.accent }]}
                onPress={() => onAgregarFila?.(tabla.id, filaVacia)}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={16}
                  color={c.accent}
                />
                <Text style={[styles.agregarBtnText, { color: c.accent }]}>
                  Agregar fila
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  tablaHeader: {
    flexDirection: "row",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tablaHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  tablaFila: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  tablaCelda: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    marginHorizontal: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  agregarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  agregarBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
