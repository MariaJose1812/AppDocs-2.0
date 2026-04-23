import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_LOGO_CONADEH = "logo_conadeh_custom";
const KEY_LOGO_INFO    = "logo_info_custom";

// Guardar logo personalizado
export const guardarLogoPersonalizado = async (tipo, base64) => {
  const key = tipo === "conadeh" ? KEY_LOGO_CONADEH : KEY_LOGO_INFO;
  await AsyncStorage.setItem(key, base64);
};

// Obtener logo (si hay personalizado lo usa, si no usa el default)
export const obtenerLogo = async (tipo, logoDefault) => {
  const key = tipo === "conadeh" ? KEY_LOGO_CONADEH : KEY_LOGO_INFO;
  try {
    const custom = await AsyncStorage.getItem(key);
    return custom || logoDefault;
  } catch {
    return logoDefault;
  }
};

// Eliminar logo personalizado (vuelve al default)
export const eliminarLogoPersonalizado = async (tipo) => {
  const key = tipo === "conadeh" ? KEY_LOGO_CONADEH : KEY_LOGO_INFO;
  await AsyncStorage.removeItem(key);
};