// GENERADORES HTML PARA PDF
const PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

//Estilos base compartidos
const ESTILOS_CSS = (colorLinea) => `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #fff;
    color: #222;
    font-size: 11.5px;
    line-height: 1.6;
  }
  .doc-body { padding: 18mm 16mm; width: 100%; max-width: 210mm; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  .header-line {
    border-bottom: 3px solid ${colorLinea};
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .correlativo-box {
    color: ${colorLinea}; font-size: 14px; font-weight: bold;
    margin-top: 5px; display: block; text-align: center;
  }
  .tabla-datos th {
    background-color: #f8f9fa; border: 1px solid #dee2e6;
    padding: 6px 8px; font-size: 10px; color: #444; text-align: center;
  }
  .tabla-datos td { border: 1px solid #dee2e6; padding: 6px 8px; font-size: 11px; }
  .firmas { margin-top: 60px; page-break-inside: avoid; width: 100%; border-collapse: collapse; }
  .firma-linea { border-top: 1px solid #000; width: 80%; margin: 0 auto 5px auto; }
  .evidencias-bloque { margin-top: 18px; page-break-inside: avoid; }
  .evidencias-grid { display: grid; gap: 8px; justify-content: center; margin-bottom: 20px; }
  .evidencias-grid img { object-fit: cover; border-radius: 6px; border: 1px solid #ccc; display: block; }
  .parrafo { margin-bottom: 14px; text-align: justify; line-height: 1.8; word-break: break-word; }
  .extras-section {
    border-top: 1px dashed ${colorLinea};
    margin-top: 16px; padding-top: 14px;
  }
  .extras-section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: ${colorLinea}; margin-bottom: 10px;
  }
  .campo-extra { margin-bottom: 10px; }
  .campo-extra strong { font-size: 11px; display: inline-block; min-width: 100px; }
  .campo-extra span { font-size: 11px; }
  .tabla-extra { margin: 12px 0; }
  .tabla-extra p { font-weight: 700; font-size: 11px; margin-bottom: 5px; }
  .tabla-extra table { border-collapse: collapse; width: 100%; }
  .tabla-extra th { border: 1px solid #555; padding: 5px 8px; background: #f0f0f0; font-size: 10px; }
  .tabla-extra td { border: 1px solid #555; padding: 5px 8px; font-size: 10px; }
  @media print { body { background: #fff; } }
`;

const wrapHTML = (titulo, contenido, colorLinea = "#1eb9de") =>
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${titulo}</title>
  <style>${ESTILOS_CSS(colorLinea)}</style>
</head>
<body>
  <div class="doc-body">
    ${contenido}
  </div>
</body>
</html>`;

//Bloques reutilizables
const encabezadoHTML = (
  uriConadeh,
  uriInfo,
  colorLinea,
  titulo,
  correlativo,
) => `
  <div class="header-line">
    <table>
      <tr>
        <td style="width:110px;">
          <img src="${uriConadeh || PIXEL}" style="height:70px;object-fit:contain;"/>
        </td>
        <td style="text-align:center;">
          <p style="font-size:13px;font-weight:800;margin:0;text-transform:uppercase;">
            Comisionado Nacional de los Derechos Humanos
          </p>
          <p style="font-size:11px;margin:2px 0;color:#666;">Honduras, C.A.</p>
          <p style="font-size:16px;font-weight:bold;margin-top:10px;color:#1a1a1a;text-transform:uppercase;">
            ${titulo}
          </p>
          <span class="correlativo-box">No. ${correlativo}</span>
        </td>
        <td style="width:110px;text-align:right;">
          <img src="${uriInfo || PIXEL}" style="height:60px;object-fit:contain;"/>
        </td>
      </tr>
    </table>
  </div>`;

const firmasHTML = (izqNom, izqCar, derNom, derCar) => `
  <table class="firmas">
    <tr>
      <td style="width:45%;text-align:center;vertical-align:top;">
        <div class="firma-linea"></div>
        <strong style="font-size:11px;">${izqNom || "RECEPTOR"}</strong><br/>
        <span style="font-size:10px;color:#555;">${izqCar || ""}</span>
      </td>
      <td style="width:10%;"></td>
      <td style="width:45%;text-align:center;vertical-align:top;">
        <div class="firma-linea"></div>
        <strong style="font-size:11px;">${derNom || "EMISOR"}</strong><br/>
        <span style="font-size:10px;color:#555;">${derCar || ""}</span>
      </td>
    </tr>
  </table>`;

//HTML de imágenes + firmas
const imagenesConFirmasHTML = (
  imagenesBase64,
  izqNom,
  izqCar,
  derNom,
  derCar,
) => {
  if (!imagenesBase64 || imagenesBase64.length === 0)
    return firmasHTML(izqNom, izqCar, derNom, derCar);

  const n = imagenesBase64.length;
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const size = n <= 4 ? 180 : n <= 9 ? 130 : 95;

  const imgs = imagenesBase64
    .map(
      (src) => `<img src="${src}" style="width:${size}px;height:${size}px;"/>`,
    )
    .join("");

  return `
  <div class="evidencias-bloque">
    <p style="font-weight:bold;font-size:11px;margin-bottom:8px;">Evidencias fotográficas:</p>
    <div class="evidencias-grid" style="grid-template-columns:repeat(${cols},${size}px);">
      ${imgs}
    </div>
    ${firmasHTML(izqNom, izqCar, derNom, derCar)}
  </div>`;
};

//Helper: genera HTML para campos y tablas extra de la plantilla 
const generarExtrasHTML = (
  config,
  valoresCamposExtra = {},
  filasTablas = {},
) => {
  const camposExtra = config?.camposExtra || [];
  const tablasExtra = config?.tablasExtra || [];

  if (camposExtra.length === 0 && tablasExtra.length === 0) return "";

  const colorLinea = config?.colorLinea || "#09528e";

  // Campos simples
  const camposHTML = camposExtra
    .map((campo) => {
      const valor = valoresCamposExtra?.[campo.id];
      if (!valor && valor !== 0) return "";
      return `
        <div class="campo-extra">
          <strong>${campo.label}:</strong>
          <span style="margin-left:8px;">${valor}</span>
        </div>`;
    })
    .filter(Boolean)
    .join("");

  // Tablas
  const tablasHTML = tablasExtra
    .map((tabla) => {
      const filas = filasTablas?.[tabla.id] || [];
      if (filas.length === 0) return "";

      const ths = tabla.columnas.map((col) => `<th>${col.label}</th>`).join("");

      const trs = filas
        .map((fila) => {
          const tds = tabla.columnas
            .map((col) => `<td>${fila[col.id] || ""}</td>`)
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");

      return `
        <div class="tabla-extra">
          <p>${tabla.titulo}</p>
          <table>
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>`;
    })
    .filter(Boolean)
    .join("");

  if (!camposHTML && !tablasHTML) return "";

  return `
    <div class="extras-section" style="border-top-color:${colorLinea};">
      ${camposHTML}
      ${tablasHTML}
    </div>`;
};

// ACTA ENTREGA
export const generarHTMLEntrega = ({
  data,
  config,
  logos,
  imagenesBase64 = [],
}) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorCargo = "",
    asunto = "",
    descripcion = "",
    observacion = "",
    fecha = "",
    correlativoFinal = "",
    items = [],
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const columnasTabla = config?.columnasTabla || ["marca", "modelo", "serie"];
  const mostrarNumFicha = config?.mostrarNumFicha || false;
  const mostrarNumInv = config?.mostrarNumInv || false;
  const colLabels = {
    marca: config?.labelMarca || "Marca",
    modelo: config?.labelModelo || "Modelo",
    serie: config?.labelSerie || "S/N - Inventario",
    asignado: config?.labelAsignado || "Asignado a",
  };

  const thead = columnasTabla
    .map(
      (c) =>
        `<th style="border:1px solid #555;padding:5px 8px;background:#f0f0f0;font-size:10px;text-align:center;">${colLabels[c] || c}</th>`,
    )
    .join("");

  const tbody = items
    .map((eq) => {
      const celdas = columnasTabla
        .map((col) => {
          if (col === "marca")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.marca || "N/A"}</td>`;
          if (col === "modelo")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.modelo || "N/A"}</td>`;
          if (col === "serie") {
            let extra = "";
            if (mostrarNumFicha)
              extra += `Ficha: ${eq.numFich || eq.numFicha || "N/A"}`;
            if (mostrarNumFicha && mostrarNumInv) extra += " | ";
            if (mostrarNumInv) extra += `Inv: ${eq.numInv || "N/A"}`;
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">
          S/N: ${eq.serie || "N/A"}
          ${extra ? `<br/><span style="font-size:9px;color:#555;">${extra}</span>` : ""}
        </td>`;
          }
          if (col === "asignado")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.asignado_a || eq.asignado || "—"}</td>`;
          return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;">—</td>`;
        })
        .join("");
      return `<tr>${celdas}</tr>`;
    })
    .join("");

  const tablaHTML = thead
    ? `<table style="width:100%;border-collapse:collapse;margin:14px 0;"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
    : "";

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);
  const bloqueFinal = imagenesConFirmasHTML(
    imagenesBase64,
    receptorNombre,
    receptorCargo,
    emisorNombre,
    emisorCargo,
  );

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Acta de Entrega", correlativoFinal)}
    <table style="width:100%;margin-bottom:18px;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;width:70px;padding:3px 4px;font-size:11px;">Para:</td>
        <td style="padding:3px 4px;font-size:11px;"><strong>${receptorNombre}</strong><br/><span style="font-size:10px;color:#444;">${receptorCargo}</span></td>
      </tr>
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">De:</td>
        <td style="padding:3px 4px;font-size:11px;"><strong>${emisorNombre}</strong><br/><span style="font-size:10px;color:#444;">${emisorCargo}</span></td>
      </tr>
      ${asunto ? `<tr><td style="font-weight:bold;padding:3px 4px;font-size:11px;">Asunto:</td><td style="padding:3px 4px;font-size:11px;">${asunto}</td></tr>` : ""}
      ${config?.mostrarDescripcion && descripcion ? `<tr><td style="font-weight:bold;padding:3px 4px;font-size:11px;">Descripción:</td><td style="padding:3px 4px;font-size:11px;">${descripcion}</td></tr>` : ""}
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">Fecha:</td>
        <td style="padding:3px 4px;font-size:11px;">Tegucigalpa M.D.C., ${fecha}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:2px solid ${colorLinea};margin:14px 0;"/>
    ${config?.mostrarParrafoIntro && config?.textoIntro ? `<p style="font-size:11px;text-align:justify;margin-bottom:14px;">${config.textoIntro}</p>` : ""}
    ${tablaHTML}
    ${config?.mostrarObservacion && observacion ? `<p style="font-size:11px;margin-top:8px;margin-bottom:12px;"><strong>Pd.</strong> ${observacion}</p>` : ""}
    ${extrasHTML}
    ${bloqueFinal}`;

  return wrapHTML("Acta de Entrega", contenido, colorLinea);
};

// ACTA RETIRO
export const generarHTMLRetiro = ({
  data,
  config,
  logos,
  imagenesBase64 = [],
}) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorCargo = "",
    asunto = "",
    descripcion = "",
    observacion = "",
    fecha = "",
    correlativoFinal = "",
    items = [],
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const columnasTabla = config?.columnasTabla || ["marca", "modelo", "serie"];
  const mostrarNumFicha = config?.mostrarNumFicha || false;
  const mostrarNumInv = config?.mostrarNumInv || false;
  const colLabels = {
    marca: config?.labelMarca || "Marca",
    modelo: config?.labelModelo || "Modelo",
    serie: config?.labelSerie || "S/N - Inventario",
    asignado: config?.labelAsignado || "Asignado a",
  };

  const thead = columnasTabla
    .map(
      (c) =>
        `<th style="border:1px solid #555;padding:5px 8px;background:#f0f0f0;font-size:10px;text-align:center;">${colLabels[c] || c}</th>`,
    )
    .join("");

  const tbody = items
    .map((eq) => {
      const celdas = columnasTabla
        .map((col) => {
          if (col === "marca")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.marca || "N/A"}</td>`;
          if (col === "modelo")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.modelo || "N/A"}</td>`;
          if (col === "serie") {
            let extra = "";
            if (mostrarNumFicha)
              extra += `Ficha: ${eq.numFich || eq.numFicha || "N/A"}`;
            if (mostrarNumFicha && mostrarNumInv) extra += " | ";
            if (mostrarNumInv) extra += `Inv: ${eq.numInv || "N/A"}`;
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">
          S/N: ${eq.serie || "N/A"}
          ${extra ? `<br/><span style="font-size:9px;color:#555;">${extra}</span>` : ""}
        </td>`;
          }
          if (col === "asignado")
            return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;text-align:center;">${eq.asignado_a || eq.asignado || "—"}</td>`;
          return `<td style="border:1px solid #555;padding:5px 8px;font-size:10px;">—</td>`;
        })
        .join("");
      return `<tr>${celdas}</tr>`;
    })
    .join("");

  const tablaHTML = thead
    ? `<table style="width:100%;border-collapse:collapse;margin:14px 0;"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
    : "";

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);
  const bloqueFinal = imagenesConFirmasHTML(
    imagenesBase64,
    receptorNombre,
    receptorCargo,
    emisorNombre,
    emisorCargo,
  );

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Acta de Retiro", correlativoFinal)}
    <table style="width:100%;margin-bottom:18px;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;width:70px;padding:3px 4px;font-size:11px;">Para:</td>
        <td style="padding:3px 4px;font-size:11px;"><strong>${receptorNombre}</strong><br/><span style="font-size:10px;color:#444;">${receptorCargo}</span></td>
      </tr>
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">De:</td>
        <td style="padding:3px 4px;font-size:11px;"><strong>${emisorNombre}</strong><br/><span style="font-size:10px;color:#444;">${emisorCargo}</span></td>
      </tr>
      ${asunto ? `<tr><td style="font-weight:bold;padding:3px 4px;font-size:11px;">Asunto:</td><td style="padding:3px 4px;font-size:11px;">${asunto}</td></tr>` : ""}
      ${config?.mostrarDescripcion && descripcion ? `<tr><td style="font-weight:bold;padding:3px 4px;font-size:11px;">Descripción:</td><td style="padding:3px 4px;font-size:11px;">${descripcion}</td></tr>` : ""}
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">Fecha:</td>
        <td style="padding:3px 4px;font-size:11px;">Tegucigalpa M.D.C., ${fecha}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:2px solid ${colorLinea};margin:14px 0;"/>
    ${config?.mostrarParrafoIntro && config?.textoIntro ? `<p style="font-size:11px;text-align:justify;margin-bottom:14px;">${config.textoIntro}</p>` : ""}
    ${tablaHTML}
    ${config?.mostrarObservacion && observacion ? `<p style="font-size:11px;margin-top:8px;margin-bottom:12px;"><strong>Pd.</strong> ${observacion}</p>` : ""}
    ${extrasHTML}
    ${bloqueFinal}`;

  return wrapHTML("Acta de Retiro", contenido, colorLinea);
};

//ACTA RECEPCION
export const generarHTMLRecepcion = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    proveedorNombre = "",
    descripcion = "",
    items = [],
    correlativoFinal = "",
    tituloActa = "ACTA DE RECEPCIÓN",
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";

  const formatearFecha = (f) => {
    if (!f) return "";
    try {
      let str = String(f).trim();
      if (!str) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) str += "T12:00:00";
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const p = str.split("/");
        str = `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}T12:00:00`;
      }
      const d = new Date(str);
      if (!isNaN(d.getTime()))
        return d.toLocaleDateString("es-HN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      return str;
    } catch {
      return String(f);
    }
  };

  const itemsHTML = items
    .map((item) => {
      const precioUSD = item.precio_prod ? parseFloat(item.precio_prod) : null;
      const precioLPS = item.equivalente_lps
        ? parseFloat(item.equivalente_lps)
        : null;

      let linea1 = item.descr_prod || "Producto";
      if (precioUSD && !isNaN(precioUSD)) {
        linea1 += `, precio: $${precioUSD.toFixed(2)}`;
        if (precioLPS && !isNaN(precioLPS))
          linea1 += `, el equivalente de ${precioLPS.toLocaleString("es-HN", { minimumFractionDigits: 2 })} lempiras`;
      }
      if (!linea1.endsWith(".")) linea1 += ".";

      let linea2 = "";
      if (item.num_recibo || item.num_fact) {
        linea2 = "Esto según";
        if (item.num_recibo)
          linea2 += ` # de Recibo: <strong>${item.num_recibo}</strong>`;
        if (item.num_recibo && item.num_fact) linea2 += " y";
        if (item.num_fact)
          linea2 += ` # de Factura # <strong>${item.num_fact}</strong>`;
        const fechaRaw = item.fech_ARCDet || item.fech_ARCEnc || "";
        if (fechaRaw) {
          const fechaStr = formatearFecha(fechaRaw);
          if (fechaStr) linea2 += ` del ${fechaStr}`;
        }
        linea2 += ".";
      }

      return `
      <li style="margin-bottom:16px;line-height:1.6;list-style-type:none;">
        <span style="display:block;">- ${linea1}</span>
        ${linea2 ? `<span style="display:block;margin-left:15px;font-size:11px;">${linea2}</span>` : ""}
      </li>`;
    })
    .join("");

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, tituloActa, correlativoFinal)}
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-weight:bold;font-size:14px;text-transform:uppercase;">Unidad de Infotecnología</div>
    </div>
    <p style="font-size:12px;text-align:justify;margin-bottom:24px;line-height:1.7;">
      Yo, <strong>${emisorNombre}</strong>, ${emisorCargo}, por este medio hago constar
      que hemos recibido por parte de <strong>${proveedorNombre}</strong>${descripcion ? ", " + descripcion : ""},
      a continuación una descripción del producto recibido:
    </p>
    <ul style="margin-bottom:40px;padding-left:0;text-align:left;">
      ${itemsHTML}
    </ul>
    ${extrasHTML}
    <div style="display:flex;justify-content:center;margin-top:80px;">
      <div style="width:350px;text-align:center;">
        <div class="firma-linea" style="border-top:1px solid #000;margin-bottom:8px;"></div>
        <strong style="font-size:12px;">${emisorNombre}</strong><br/>
        <span style="font-size:11px;color:#555;">${emisorCargo}</span>
      </div>
    </div>`;

  return wrapHTML(tituloActa, contenido, colorLinea);
};

// MEMORÁNDUM
export const generarHTMLMemorandum = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorCargo = "",
    asunto = "",
    fecha = "",
    correlativoFinal = "",
    items = [],
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";

  const parrafos = items
    .map(
      (it) =>
        `<p style="margin-bottom:14px;text-align:justify;line-height:1.7;">${it.desc_MMDet || ""}</p>`,
    )
    .join("");

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "MEMORÁNDUM", correlativoFinal)}
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-weight:bold;font-size:14px;text-transform:uppercase;">Unidad de Infotecnología</div>
    </div>
    <div style="width:75%;margin:0 auto 22px auto;">
      <table>
        <tr><td style="font-weight:bold;width:25%;padding:5px;font-size:12px;">PARA:</td>
            <td style="padding:5px;font-size:12px;"><strong>${receptorNombre}</strong><br/><span style="font-size:11px;color:#444;">${receptorCargo}</span></td></tr>
        <tr><td style="font-weight:bold;padding:5px;font-size:12px;">DE:</td>
            <td style="padding:5px;font-size:12px;"><strong>${emisorNombre}</strong><br/><span style="font-size:11px;color:#444;">${emisorCargo}</span></td></tr>
        <tr><td style="font-weight:bold;padding:5px;font-size:12px;">ASUNTO:</td>
            <td style="font-weight:bold;padding:5px;font-size:12px;">${asunto}</td></tr>
        <tr><td style="font-weight:bold;padding:5px;font-size:12px;">FECHA:</td>
            <td style="padding:5px;font-size:12px;">${fecha}</td></tr>
      </table>
    </div>
    <hr style="border:none;border-top:1px solid #ccc;margin-bottom:18px;"/>
    ${parrafos}
    ${config?.mostrarDespedida !== false ? `<p style="margin-top:22px;font-size:12px;">Saludos cordiales,</p>` : ""}
    ${extrasHTML}
    <div style="text-align:center;margin-top:80px;">
      <div style="width:280px;border-top:1px solid #000;margin:0 auto 5px auto;padding-top:5px;">
        <strong>${emisorNombre}</strong><br/><span style="font-size:11px;color:#333;">${emisorCargo}</span>
      </div>
    </div>`;

  return wrapHTML("Memorándum", contenido, colorLinea);
};

// OFICIO
export const generarHTMLOficio = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorCargo = "",
    receptorTratamiento = "Señor(a)",
    asunto = "",
    correlativoFinal = "",
    items = [],
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const apellido = receptorNombre ? receptorNombre.split(" ").slice(-1)[0] : "";

  const parrafos = items
    .map((it) => `<p class="parrafo">${it.desc_OfiDet || ""}</p>`)
    .join("");
  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "OFICIO", correlativoFinal)}
    <div style="text-align:center;padding:7px 0;margin-bottom:32px;font-weight:bold;font-size:12px;text-transform:uppercase;">
      UNIDAD DE INFOTECNOLOGÍA
    </div>
    <div style="margin-bottom:18px;font-size:12px;">
      <span style="display:block;">${receptorTratamiento}</span>
      <span style="display:block;font-weight:bold;">${receptorNombre}</span>
      <span style="display:block;">${receptorCargo}</span>
      <span style="display:block;margin-top:8px;">${receptorTratamiento} ${apellido}:</span>
    </div>
    <div style="margin-bottom:18px;font-size:12px;"><strong>Asunto:</strong> ${asunto}</div>
    ${parrafos}
    ${config?.mostrarDespedida !== false ? `<p style="font-size:12px;margin-top:14px;">Saludos cordiales,</p>` : ""}
    ${extrasHTML}
    <div style="text-align:center;margin-top:80px;">
      <div style="width:300px;border-top:1px solid #000;margin:0 auto 5px auto;padding-top:5px;">
        <strong>${emisorNombre}</strong><br/><span style="font-size:11px;">${emisorCargo}</span>
      </div>
    </div>`;

  return wrapHTML("Oficio", contenido, colorLinea);
};

// PASE SALIDA
export const generarHTMLPaseSalida = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorEmpresa = "",
    motivo = "",
    correlativoFinal = "",
    items = [],
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";

  const filas = items
    .map(
      (eq) => `
    <tr>
      <td style="border:1px solid #555;padding:5px 10px;font-size:11px;">${eq.marca || "N/A"}</td>
      <td style="border:1px solid #555;padding:5px 10px;font-size:11px;">${eq.modelo || "N/A"}</td>
      <td style="border:1px solid #555;padding:5px 10px;font-size:11px;">${eq.serie || "N/A"}</td>
    </tr>`,
    )
    .join("");

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Pase de Salida", correlativoFinal)}
    <p style="font-size:11.5px;text-align:justify;line-height:1.85;margin-bottom:22px;">
      Por este medio se hace entrega a <strong>${receptorNombre}</strong> de
      <strong>${receptorEmpresa}</strong>, para que ${motivo} que a continuación se describe:
    </p>
    <table style="width:70%;border-collapse:collapse;margin:0 auto 40px auto;">
      <thead><tr>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">Marca</th>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">Modelo</th>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">S/N</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>
    ${extrasHTML}
    ${firmasHTML(receptorNombre, receptorEmpresa, emisorNombre, emisorCargo)}`;

  return wrapHTML("Pase de Salida", contenido, colorLinea);
};

//REPORTE DE DAÑO
export const generarHTMLReporte = ({
  data,
  config,
  logos,
  imagenesBase64 = [],
}) => {
  const {
    asignado = "",
    asignadoCargo = "",
    correlativoFinal = "",
    fecha = "",
    oficina = "",
    motivo = "",
    diagnostico = "",
    recomendaciones = "",
    equipo = {},
    valoresCamposExtra = {},
    filasTablas = {},
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";

  const extrasHTML = generarExtrasHTML(config, valoresCamposExtra, filasTablas);

  // Imágenes dentro del diagnóstico
  const imgEnDiag = (() => {
    if (!imagenesBase64.length) return "";
    const n = imagenesBase64.length,
      cols = n <= 4 ? 2 : n <= 9 ? 3 : 4,
      size = n <= 4 ? 130 : n <= 9 ? 100 : 75;
    const imgs = imagenesBase64
      .map(
        (s) =>
          `<img src="${s}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;border:1px solid #ccc;"/>`,
      )
      .join("");
    return `<div style="margin-top:10px;display:grid;grid-template-columns:repeat(${cols},${size}px);gap:6px;justify-content:center;">${imgs}</div>`;
  })();

  const contenido = `
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
      <tr>
        <td style="width:100px;text-align:left;vertical-align:middle;">
          <img src="${uriConadeh || PIXEL}" style="height:60px;object-fit:contain;"/>
        </td>
        <td style="text-align:center;vertical-align:middle;">
          <div style="font-size:16px;font-weight:bold;font-style:italic;text-transform:uppercase;color:${colorLinea};line-height:1.4;">
            Reporte de<br/>Daño de Equipo
          </div>
        </td>
        <td style="width:100px;text-align:right;vertical-align:middle;">
          <img src="${uriInfo || PIXEL}" style="height:55px;object-fit:contain;"/>
        </td>
      </tr>
    </table>
    <div style="border-top:3px solid ${colorLinea};margin:5px 0 8px;"></div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #888;">
      <tr>
        <td style="border:1px solid #888;padding:5px 8px;width:50%;font-size:11px;">${correlativoFinal}</td>
        <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">${fecha}</td>
      </tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;"><strong>Oficina o Departamento:</strong> ${oficina || "—"}</td></tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-weight:bold;text-transform:uppercase;font-size:11px;">Características del Equipo:</td></tr>
      <tr>
        <td style="border:1px solid #888;padding:5px 8px;font-size:11px;"><strong>N/F:</strong> ${equipo.numFicha || equipo.numFich || "N/A"}</td>
        <td style="border:1px solid #888;padding:5px 8px;font-size:11px;"><strong>INV:</strong> ${equipo.numInv || "N/A"}</td>
      </tr>
      <tr>
        <td style="border:1px solid #888;padding:5px 8px;font-size:11px;"><strong>Service Tag / Serie:</strong> ${equipo.serie || "N/A"}</td>
        <td style="border:1px solid #888;padding:5px 8px;font-size:11px;"><strong>Tipo / Marca / Modelo:</strong> ${equipo.tipo || ""} ${equipo.marca || ""} ${equipo.modelo || ""}</td>
      </tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-weight:bold;text-transform:uppercase;font-size:11px;">Descripción del Reporte:</td></tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;">${motivo || "&nbsp;"}</td></tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-weight:bold;text-transform:uppercase;font-size:11px;">Diagnóstico:</td></tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;vertical-align:top;font-size:11px;min-height:${imgEnDiag ? "auto" : "160px"};">
        ${diagnostico || "&nbsp;"}${imgEnDiag}
      </td></tr>
      ${
        recomendaciones
          ? `
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-weight:bold;text-transform:uppercase;font-size:11px;">Recomendaciones:</td></tr>
      <tr><td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;">${recomendaciones}</td></tr>`
          : ""
      }
    </table>
    ${extrasHTML}
    <table style="width:100%;border-collapse:collapse;border:1px solid #888;border-top:none;">
      <tr>
        <td style="border:1px solid #888;padding:6px 10px;width:50%;font-style:italic;font-size:11px;">${asignadoCargo || "Auxiliar Infotecnología"}.</td>
        <td style="border:1px solid #888;padding:6px 10px;font-size:11px;">(Firma) &nbsp; ${asignado}</td>
      </tr>
    </table>`;

  return wrapHTML("Reporte de Daño de Equipo", contenido, colorLinea);
};
