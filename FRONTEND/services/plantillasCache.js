import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const CACHE_KEY_PREFIX = "plantilla_activa_";
const CACHE_EXPIRY_MS = 1000 * 60 * 30; // 30 minutos

/*Obtiene la plantilla activa para un tipo de acta.
 1. Revisa AsyncStorage — si existe y no expiró, la devuelve
 2. Si expiró o no existe, consulta la BD
 3. Si la BD tiene una versión más nueva, actualiza el cache
 4. Siempre devuelve algo (fallback a config por defecto si todo falla)*/

export const obtenerPlantillaActiva = async (tipoActa) => {
  const cacheKey = `${CACHE_KEY_PREFIX}${tipoActa}`;

  try {
    //LEE CACHE LOCAL
    const cacheRaw = await AsyncStorage.getItem(cacheKey);
    const cache = cacheRaw ? JSON.parse(cacheRaw) : null;

    const ahora = Date.now();
    const cacheVigente = cache && ahora - cache.timestamp < CACHE_EXPIRY_MS;

    if (cacheVigente) {
      //Verificar si la BD tiene algo más nuevo
      try {
        const res = await api.get(`/plantillas/${tipoActa}/activa`);
        const bdFecha = new Date(res.data.fechaModificacion).getTime();
        const cacheFecha = cache.fechaModificacion || 0;

        if (bdFecha > cacheFecha) {
          //Actualizar cache y devolver nueva
          const nuevaPlantilla = res.data;
          await guardarCache(cacheKey, nuevaPlantilla);
          return nuevaPlantilla.config;
        }
      } catch {
        // Sin internet — usar cache igual
      }
      return cache.config;
    }

    // Cache expirado o no existe
    const res = await api.get(`/plantillas/${tipoActa}/activa`);
    await guardarCache(cacheKey, res.data);
    return res.data.config;
  } catch (error) {
    console.log("Usando config por defecto para plantilla:", tipoActa);
    return getConfigDefault();
  }
};

/*Llama esto después de guardar/activar una plantilla
 para forzar la actualización del cache en el próximo uso.*/

export const invalidarCache = async (tipoActa) => {
  const cacheKey = `${CACHE_KEY_PREFIX}${tipoActa}`;
  await AsyncStorage.removeItem(cacheKey);
};

const guardarCache = async (cacheKey, plantilla) => {
  await AsyncStorage.setItem(
    cacheKey,
    JSON.stringify({
      config: plantilla.config,
      fechaModificacion: new Date(plantilla.fechaModificacion).getTime(),
      timestamp: Date.now(),
    }),
  );
};

export const getConfigDefault = () => ({
  colorLinea: "#1eb9de",
  mostrarDescripcion: true,
  mostrarObservacion: true,
  mostrarNumFicha: true,
  mostrarNumInv: true,
  mostrarParrafoIntro: false,
  textoIntro: "",
  columnasTabla: ["marca", "modelo", "serie", "asignado"],
  labelMarca: "Marca",
  labelModelo: "Modelo",
  labelSerie: "S/N - Inventario",
  labelAsignado: "Asignado a",
  labelDesc: "Descripción",
  labelPrecio: "Precio",
  labelRecibo: "# Recibo",
  labelFactura: "# Factura",
  labelFecha: "Fecha",
});
