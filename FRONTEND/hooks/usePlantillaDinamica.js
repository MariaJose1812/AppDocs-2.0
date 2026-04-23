import { useState, useEffect } from "react";
import { obtenerPlantillaActiva } from "../services/plantillasCache";

//Hook que devuelve la configuración completa de la plantilla activa del tipo de documento indicado

export function usePlantillaDinamica(tipoDoc) {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!tipoDoc) return;
    setCargando(true);
    obtenerPlantillaActiva(tipoDoc)
      .then((configData) => {
        setConfig(configData || {});
      })
      .catch(() => {
        setConfig({});
      })
      .finally(() => setCargando(false));
  }, [tipoDoc]);

  return { 
    config,
    camposExtra: config?.camposExtra || [], // Para compatibilidad
    tablasExtra: config?.tablasExtra || [], // Para compatibilidad
    colorLinea: config?.colorLinea || "#09528e", // Para compatibilidad
    cargando 
  };
}
