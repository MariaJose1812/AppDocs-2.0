import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getLogoURIs = async () => {
  try {
    // Verificar si hay logos personalizados en AsyncStorage
    const customConadeh = await AsyncStorage.getItem("logo_conadeh_custom");
    const customInfo = await AsyncStorage.getItem("logo_info_custom");

    // Si ambos son personalizados, devolverlos directo
    if (customConadeh && customInfo) {
      return { conadeh: customConadeh, info: customInfo };
    }

    // Cargar defaults para los que no tienen personalizado
    const [assetConadeh, assetInfo] = await Asset.loadAsync([
      require("../assets/images/logoCompleto.png"),
      require("../assets/images/logoInfo.jpeg"),
    ]);

    let uriConadeh = customConadeh;
    let uriInfo = customInfo;

    if (!uriConadeh) {
      if (Platform.OS === "web") {
        uriConadeh = assetConadeh.localUri || assetConadeh.uri;
      } else {
        const b64 = await FileSystem.readAsStringAsync(assetConadeh.localUri, {
          encoding: "base64",
        });
        uriConadeh = `data:image/png;base64,${b64}`;
      }
    }

    if (!uriInfo) {
      if (Platform.OS === "web") {
        uriInfo = assetInfo.localUri || assetInfo.uri;
      } else {
        const b64 = await FileSystem.readAsStringAsync(assetInfo.localUri, {
          encoding: "base64",
        });
        uriInfo = `data:image/jpeg;base64,${b64}`;
      }
    }

    return { conadeh: uriConadeh, info: uriInfo };
  } catch (err) {
    console.error("Error cargando logos:", err);
    return { conadeh: "", info: "" };
  }
};
