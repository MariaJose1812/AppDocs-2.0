import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import {
  guardarLogoPersonalizado,
  obtenerLogo,
  eliminarLogoPersonalizado,
} from "../services/logosStorage";
import { invalidarCache, getConfigDefault } from "../services/plantillasCache";
import api from "../services/api";
import Header from "../components/header";
import Navbar from "../components/navBar";

const COLORES_PRESET = [
  "#1eb9de",
  "#09528e",
  "#3ac40d",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#000000",
];

const COLUMNAS_DISPONIBLES = [
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "serie", label: "S/N - Inventario" },
  { key: "asignado", label: "Asignado a" },
];

export default function EditarPlantillaScreen() {
  const router = useRouter();
  const { id, tipoActa } = useLocalSearchParams();
  const esNueva = !id;

  const [nombre, setNombre] = useState("Nueva Plantilla");
  const [config, setConfig] = useState(getConfigDefault());
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!esNueva);

  const [logoConadeh, setLogoConadeh] = useState(null);
  const [logoInfo, setLogoInfo] = useState(null);

  useEffect(() => {
    if (!esNueva) cargarPlantilla();
  }, [id]);

  useEffect(() => {
    const cargarLogos = async () => {
      const c = await obtenerLogo("conadeh", null);
      const i = await obtenerLogo("info", null);
      setLogoConadeh(c);
      setLogoInfo(i);
    };
    cargarLogos();
  }, []);

  const cargarPlantilla = async () => {
    try {
      const res = await api.get(`/plantillas/${tipoActa}`);
      const plantilla = res.data.find(
        (p) => String(p.idPlantilla) === String(id),
      );
      if (plantilla) {
        setNombre(plantilla.nombrePlantilla);
        setConfig(
          typeof plantilla.config === "string"
            ? JSON.parse(plantilla.config)
            : plantilla.config,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarLogo = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS === "web")
        window.alert("Se necesita permiso para acceder a las imágenes.");
      else Alert.alert("Permiso requerido", "Se necesita acceso a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const ext = result.assets[0].uri.split(".").pop().toLowerCase();
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const base64Final = `data:${mime};base64,${result.assets[0].base64}`;

      await guardarLogoPersonalizado(tipo, base64Final);

      if (tipo === "conadeh") setLogoConadeh(base64Final);
      else setLogoInfo(base64Final);
    }
  };

  const eliminarLogo = async (tipo) => {
    await eliminarLogoPersonalizado(tipo);
    if (tipo === "conadeh") setLogoConadeh(null);
    else setLogoInfo(null);
  };

  const set = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const toggleColumna = (col) => {
    const cols = config.columnasTabla.includes(col)
      ? config.columnasTabla.filter((c) => c !== col)
      : [...config.columnasTabla, col];
    set("columnasTabla", cols);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      if (Platform.OS === "web") window.alert("El nombre es obligatorio.");
      else Alert.alert("Error", "El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (esNueva) {
        await api.post("/plantillas", {
          nombrePlantilla: nombre,
          tipoActa: tipoActa || "ENTREGA",
          config,
        });
      } else {
        await api.put(`/plantillas/${id}`, { nombrePlantilla: nombre, config });
      }
      // Invalida cache para que el próximo PDF use la config nueva
      await invalidarCache(tipoActa || "ENTREGA");

      if (Platform.OS === "web")
        window.alert("Plantilla guardada correctamente.");
      else Alert.alert("Éxito", "Plantilla guardada correctamente.");
      router.back();
    } catch (e) {
      if (Platform.OS === "web")
        window.alert("No se pudo guardar la plantilla.");
      else Alert.alert("Error", "No se pudo guardar la plantilla.");
    } finally {
      setGuardando(false);
    }
  };

  //PREVIEW HTML
  const generarPreview = () => {
    const c = config;

    const colLabels = {
      marca: c.labelMarca,
      modelo: c.labelModelo,
      serie: c.labelSerie,
      asignado: c.labelAsignado,
    };
    const colData = {
      marca: "DELL",
      modelo: "Optiplex 7020",
      serie: `S/N: ABC123<br/><span style="font-size:9px;color:#555;">Ficha: 001 | Inv: 002</span>`,
      asignado: "Recursos Humanos",
    };

    const theadHTML = c.columnasTabla
      .map((col) => `<th>${colLabels[col] || col}</th>`)
      .join("");
    const tbodyHTML = c.columnasTabla
      .map((col) => `<td>${colData[col] || "-"}</td>`)
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px;
           color: #000; padding: 16px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between;
              align-items: center; border-bottom: 2px solid ${c.colorLinea};
              padding-bottom: 8px; margin-bottom: 14px; }
    .logo-box { width: 55px; height: 40px; background: #e2e8f0;
                border-radius: 4px; display: flex; align-items: center;
                justify-content: center; font-size: 9px; color: #94a3b8; }
    .title-box { text-align: center; flex: 1; padding: 0 8px; }
    .title { font-weight: bold; font-size: 11px; text-transform: uppercase; }
    .subtitle { font-size: 9px; color: #444; }
    .acta-num { font-weight: bold; font-size: 12px;
                text-decoration: underline; margin-top: 4px; }
    .info-table { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
    .info-table td { padding: 2px 4px; font-size: 10px; vertical-align: top; }
    .info-label { font-weight: bold; width: 65px; white-space: nowrap; }
    .info-name { font-weight: bold; display: block; }
    .info-role { font-size: 9.5px; color: #444; }
    .divider { border: none; border-top: 2px solid ${c.colorLinea}; margin: 10px 0; }
    .paragraph { font-size: 10px; text-align: justify;
                 margin-bottom: 10px; line-height: 1.5; }
    .eq-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .eq-table th { background: #f0f0f0; font-weight: bold;
                   border: 1px solid #555; padding: 4px 5px;
                   text-align: center; font-size: 9px; text-transform: uppercase; }
    .eq-table td { border: 1px solid #555; padding: 4px 5px;
                   text-align: center; font-size: 9px; }
    .observacion { font-size: 10px; margin: 6px 0 14px 0; }
    .firmas { width: 100%; margin-top: 40px; border-collapse: collapse; }
    .firma-cell { width: 42%; text-align: center;
                  border-top: 1px solid #000; padding-top: 5px; font-size: 10px; }
    .firma-spacer { width: 16%; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo-box">Logo</div>
    <div class="title-box">
      <div class="title">Comisionado Nacional de los Derechos Humanos</div>
      <div class="subtitle">(CONADEH)</div>
      <div class="subtitle">Honduras, C.A.</div>
      <div class="acta-num">ACTA DE ${tipoActa || "ENTREGA"} N° IT-2026-001</div>
    </div>
    <div class="logo-box">Logo</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="info-label">Para:</td>
      <td>
        <span class="info-name">Juan Pérez</span>
        <span class="info-role">Secretario - Recursos Humanos</span>
      </td>
    </tr>
    <tr>
      <td class="info-label">De:</td>
      <td>
        <span class="info-name">María José</span>
        <span class="info-role">Desarrolladora</span>
      </td>
    </tr>
    <tr>
      <td class="info-label">Asunto:</td>
      <td>Entrega de equipo tecnológico</td>
    </tr>
    ${
      c.mostrarDescripcion
        ? `
    <tr>
      <td class="info-label">Descripción:</td>
      <td>Descripción del equipo asignado</td>
    </tr>`
        : ""
    }
    <tr>
      <td class="info-label">Fecha:</td>
      <td>Tegucigalpa M.D.C., 22 de marzo de 2026</td>
    </tr>
  </table>

  <hr class="divider"/>

  ${
    c.mostrarParrafoIntro && c.textoIntro
      ? `<p class="paragraph">${c.textoIntro}</p>`
      : ""
  }

  <table class="eq-table">
    <thead><tr>${theadHTML}</tr></thead>
    <tbody><tr>${tbodyHTML}</tr></tbody>
  </table>

  ${
    c.mostrarObservacion
      ? `<p class="observacion"><strong>Pd.</strong> Observación de ejemplo</p>`
      : ""
  }

  <table class="firmas">
    <tr>
      <td class="firma-cell">
        <strong>Juan Pérez</strong><br/>Secretario
      </td>
      <td class="firma-spacer"></td>
      <td class="firma-cell">
        <strong>María José</strong><br/>Desarrolladora
      </td>
    </tr>
  </table>

</body>
</html>`;
  };

  if (cargando)
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Navbar />
        <ActivityIndicator
          size="large"
          color="#09528e"
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Navbar />
      <View style={styles.body}>
        {/*PANEL IZQUIERDO — CONTROLES*/}
        <ScrollView
          style={styles.panel}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <Text style={styles.mainTitle}>
            {esNueva ? "Nueva Plantilla" : "Editar Plantilla"}
          </Text>

          {/* NOMBRE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la plantilla..."
            />
          </View>

          {/* COLOR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color de líneas</Text>

            {/* CÍRCULOS PRESET */}
            <View style={styles.colorRow}>
              {COLORES_PRESET.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    config.colorLinea === color && styles.colorCircleActive,
                  ]}
                  onPress={() => set("colorLinea", color)}
                />
              ))}

              {/* CÍRCULO PERSONALIZADO */}
              {Platform.OS === "web" && (
                <View style={styles.colorPickerWrapper}>
                  <input
                    type="color"
                    value={config.colorLinea}
                    onChange={(e) => set("colorLinea", e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "2px solid #cbd5e1",
                      padding: 0,
                      cursor: "pointer",
                      backgroundColor: "transparent",
                    }}
                    title="Color personalizado"
                  />
                </View>
              )}
            </View>

            {/* INPUT TEXTO — para pegar hex manualmente */}
            <View style={styles.colorInputRow}>
              <View
                style={[
                  styles.colorMuestra,
                  { backgroundColor: config.colorLinea },
                ]}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={config.colorLinea}
                onChangeText={(v) => set("colorLinea", v)}
                placeholder="#1eb9de"
                maxLength={7}
              />
            </View>
          </View>

          {/* CAMPOS VISIBLES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campos visibles</Text>
            {[
              { key: "mostrarDescripcion", label: "Descripción" },
              { key: "mostrarObservacion", label: "Observación (Pd.)" },
              { key: "mostrarNumFicha", label: "Número de Ficha" },
              { key: "mostrarNumInv", label: "Número de Inventario" },
              { key: "mostrarParrafoIntro", label: "Párrafo introductorio" },
            ].map(({ key, label }) => (
              <View key={key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{label}</Text>
                <Switch
                  value={!!config[key]}
                  onValueChange={(v) => set(key, v)}
                  trackColor={{ true: "#09528e" }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>

          {/* TEXTO INTRO */}
          {config.mostrarParrafoIntro && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Texto introductorio</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                multiline
                value={config.textoIntro}
                onChangeText={(v) => set("textoIntro", v)}
                placeholder="Por este medio se hace entrega al Sr(a)..."
              />
            </View>
          )}

          {/* COLUMNAS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Columnas de la tabla</Text>
            {COLUMNAS_DISPONIBLES.map(({ key, label }) => (
              <View key={key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{label}</Text>
                <Switch
                  value={config.columnasTabla.includes(key)}
                  onValueChange={() => toggleColumna(key)}
                  trackColor={{ true: "#09528e" }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>

          {/* ETIQUETAS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etiquetas de columnas</Text>
            {[
              { key: "labelMarca", placeholder: "Marca" },
              { key: "labelModelo", placeholder: "Modelo" },
              { key: "labelSerie", placeholder: "S/N - Inventario" },
              { key: "labelAsignado", placeholder: "Asignado a" },
            ].map(({ key, placeholder }) => (
              <TextInput
                key={key}
                style={[styles.input, { marginBottom: 8 }]}
                value={config[key]}
                onChangeText={(v) => set(key, v)}
                placeholder={placeholder}
              />
            ))}
          </View>

          {/* LOGOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logos del documento</Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              Si no cambias un logo, se usará el que ya está configurado por
              defecto.
            </Text>

            {/* Logo CONADEH */}
            <View style={styles.logoRow}>
              <View style={styles.logoPreview}>
                {logoConadeh ? (
                  <Image
                    source={{ uri: logoConadeh }}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.logoPlaceholder}>
                    Logo CONADEH{"\n"}(actual)
                  </Text>
                )}
              </View>
              <View style={styles.logoBtns}>
                <TouchableOpacity
                  style={styles.logoBtn}
                  onPress={() => seleccionarLogo("conadeh")}
                >
                  <Text style={styles.logoBtnText}>Cambiar</Text>
                </TouchableOpacity>
                {logoConadeh && (
                  <TouchableOpacity
                    style={[styles.logoBtn, styles.logoBtnReset]}
                    onPress={() => eliminarLogo("conadeh")}
                  >
                    <Text style={[styles.logoBtnText, { color: "#dc2626" }]}>
                      Restaurar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Logo InfoTecnología */}
            <View style={[styles.logoRow, { marginTop: 14 }]}>
              <View style={styles.logoPreview}>
                {logoInfo ? (
                  <Image
                    source={{ uri: logoInfo }}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.logoPlaceholder}>
                    Logo InfoTec{"\n"}(actual)
                  </Text>
                )}
              </View>
              <View style={styles.logoBtns}>
                <TouchableOpacity
                  style={styles.logoBtn}
                  onPress={() => seleccionarLogo("info")}
                >
                  <Text style={styles.logoBtnText}>Cambiar</Text>
                </TouchableOpacity>
                {logoInfo && (
                  <TouchableOpacity
                    style={[styles.logoBtn, styles.logoBtnReset]}
                    onPress={() => eliminarLogo("info")}
                  >
                    <Text style={[styles.logoBtnText, { color: "#dc2626" }]}>
                      Restaurar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* BOTONES */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              guardando && { backgroundColor: "#93c5fd" },
            ]}
            onPress={guardar}
            disabled={guardando}
          >
            <Text style={styles.saveBtnText}>
              {guardando ? "Guardando..." : "Guardar Plantilla"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>

        {/*PANEL DERECHO — PREVIEW (solo web) */}
        {Platform.OS === "web" && (
          <View style={styles.previewPanel}>
            <Text style={styles.previewTitle}>Vista previa en tiempo real</Text>
            <View style={styles.previewDoc}>
              <iframe
                srcDoc={generarPreview()}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="preview"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  body: { flex: 1, flexDirection: "row" },
  panel: { width: 400, borderRightWidth: 1, borderRightColor: "#e2e8f0" },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorCircleActive: {
    borderColor: "#1e293b",
    transform: [{ scale: 1.2 }],
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  switchLabel: { fontSize: 14, color: "#475569" },
  saveBtn: {
    backgroundColor: "#09528e",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "#64748b", fontSize: 15, fontWeight: "700" },
  previewPanel: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    padding: 20,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  previewDoc: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoPreview: {
    width: 90,
    height: 60,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoPlaceholder: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 14,
  },
  logoBtns: { gap: 8 },
  logoBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoBtnReset: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  logoBtnText: { fontSize: 13, fontWeight: "600", color: "#09528e" },
});
