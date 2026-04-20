import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Caché en memoria para evitar leer los archivos múltiples veces
let cachedURIs = null;

export const getLogoURIs = async () => {
  if (cachedURIs) return cachedURIs;

  try {
    //Verificar logos personalizados en AsyncStorage
    const customConadeh = await AsyncStorage.getItem("logo_conadeh_custom");
    const customInfo = await AsyncStorage.getItem("logo_info_custom");

    // Si ambos son personalizados, devolverlos directo
    if (customConadeh && customInfo) {
      cachedURIs = { conadeh: customConadeh, info: customInfo };
      return cachedURIs;
    }

    //Cargar assets por defecto
    const [assetConadeh, assetInfo] = await Asset.loadAsync([
      require("../assets/images/logoCompleto.png"),
      require("../assets/images/logoInfo.jpeg"),
    ]);

    //Función auxiliar para obtener data URI (base64) de un Asset
    const assetToBase64 = async (asset, mimeType) => {
      if (Platform.OS === "web") {
        // En web: fetch la URL del asset y convertir a base64
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else {
        // En móvil: leer archivo local y convertir a base64
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
        });
        return `data:${mimeType};base64,${base64}`;
      }
    };

    //Obtener URIs 
    let uriConadeh = customConadeh;
    let uriInfo = customInfo;

    if (!uriConadeh) {
      uriConadeh = await assetToBase64(assetConadeh, "image/png");
    }
    if (!uriInfo) {
      uriInfo = await assetToBase64(assetInfo, "image/jpeg");
    }

    cachedURIs = { conadeh: uriConadeh, info: uriInfo };
    return cachedURIs;
  } catch (err) {
    console.error("Error cargando logos:", err);
    return { conadeh: "", info: "" };
  }
};

//función para limpiar caché 
export const clearLogosCache = () => {
  cachedURIs = null;
};
