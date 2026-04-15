// documentosHTML.js — Generadores de HTML para todos los tipos

const PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

const ESTILOS_CSS = (colorLinea) => `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { 
    background-color: #f0f2f5;
    font-family: 'Segoe UI', Arial, sans-serif; 
    margin: 0; padding: 20px; 
    display: flex; justify-content: center;
  }
  .page-container {
    background: white;
    width: 210mm;
    min-height: 297mm;
    padding: 25mm 20mm;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    position: relative;
    color: #222;
  }
  table { width: 100%; border-collapse: collapse; }
  .text-upper { text-transform: uppercase; }
  .text-bold { font-weight: bold; }
  .text-center { text-align: center; }
  .text-justify { text-align: justify; }
  
  .header-line { border-bottom: 3px solid ${colorLinea}; padding-bottom: 10px; margin-bottom: 20px; }
  .correlativo-box { 
    color: ${colorLinea}; font-size: 14px; font-weight: bold; 
    margin-top: 5px; display: block; 
  }
  
  .tabla-datos th { 
    background-color: #f8f9fa; 
    border: 1px solid #dee2e6; 
    padding: 8px; font-size: 10px; color: #444; 
  }
  .tabla-datos td { 
    border: 1px solid #dee2e6; 
    padding: 8px; font-size: 11px; 
  }
  
  /* ── Estilos para las evidencias (imágenes) ── */
  .evidencias {
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .evidencias .galeria {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }
  .evidencias img {
    max-width: 180px;
    max-height: 150px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  @media (max-width: 600px) {
    .evidencias img { max-width: 140px; }
  }
  
  /* ── Estilos para las firmas ── */
  .firmas {
    margin-top: 60px;
    page-break-before: avoid;
  }
  .firma-linea {
    border-top: 1px solid #000;
    width: 80%;
    margin: 0 auto 5px auto;
  }

  @media print {
    body { background: none; padding: 0; }
    .page-container { box-shadow: none; width: 100%; margin: 0; }
  }
`;

/* ── Helper: Encabezado ── */
const encabezadoHTML = (
  uriConadeh,
  uriInfo,
  colorLinea,
  titulo,
  correlativo,
) => {
  return `
  <div class="header-line">
    <table>
      <tr>
        <td style="width:110px;"><img src="${uriConadeh || PIXEL}" style="height:70px;object-fit:contain;"/></td>
        <td class="text-center">
          <p style="font-size:13px; font-weight:800; margin:0;" class="text-upper">Comisionado Nacional de los Derechos Humanos</p>
          <p style="font-size:11px; margin:2px 0; color:#666;">Honduras, C.A.</p>
          <p style="font-size:16px; font-weight:bold; margin-top:10px; color:#1a1a1a;" class="text-upper">${titulo}</p>
          <span class="correlativo-box">No. ${correlativo}</span>
        </td>
        <td style="width:110px; text-align:right;"><img src="${uriInfo || PIXEL}" style="height:60px;object-fit:contain;"/></td>
      </tr>
    </table>
  </div>`;
};

//FIRMAS
const firmasHTML = (izqNom, izqCar, derNom, derCar) => `
  <table class="firmas">
    <tr>
      <td class="text-center" style="width:45%; vertical-align:top;">
        <div class="firma-linea"></div>
        <strong style="font-size:11px;">${izqNom || "RECEPTOR"}</strong><br/>
        <span style="font-size:10px; color:#555;">${izqCar || ""}</span>
      </td>
      <td style="width:10%;"></td>
      <td class="text-center" style="width:45%; vertical-align:top;">
        <div class="firma-linea"></div>
        <strong style="font-size:11px;">${derNom || "EMISOR"}</strong><br/>
        <span style="font-size:10px; color:#555;">${derCar || ""}</span>
      </td>
    </tr>
  </table>`;

const wrapHTML = (titulo, contenido, colorLinea = "#1eb9de") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${titulo}</title>
  <style>${ESTILOS_CSS(colorLinea)}</style>
</head>
<body>
  <div class="page-container">
    ${contenido}
  </div>
</body>
</html>`;

// ACTA DE ENTREGA
export const generarHTMLEntrega = ({
  data,
  config,
  logos,
  imagenesHTML = "",
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
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const columnasTabla = config?.columnasTabla || ["marca", "modelo", "serie"];
  const colLabels = {
    marca: config?.labelMarca || "Marca",
    modelo: config?.labelModelo || "Modelo",
    serie: config?.labelSerie || "S/N - Inventario",
    asignado: config?.labelAsignado || "Asignado a",
  };
  const mostrarNumFicha = config?.mostrarNumFicha || false;
  const mostrarNumInv = config?.mostrarNumInv || false;

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
    ? `
    <table style="width:100%;border-collapse:collapse;margin:14px 0;">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>`
    : "";

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Acta de Entrega", correlativoFinal)}
    <table style="width:100%;margin-bottom:18px;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;width:70px;padding:3px 4px;font-size:11px;">Para:</td>
        <td style="padding:3px 4px;font-size:11px;">
          <strong>${receptorNombre}</strong><br/>
          <span style="font-size:10px;color:#444;">${receptorCargo}</span>
        </td>
      </tr>
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">De:</td>
        <td style="padding:3px 4px;font-size:11px;">
          <strong>${emisorNombre}</strong><br/>
          <span style="font-size:10px;color:#444;">${emisorCargo}</span>
        </td>
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
    ${config?.mostrarObservacion && observacion ? `<p style="font-size:11px;margin-top:8px;"><strong>Pd.</strong> ${observacion}</p>` : ""}
    ${imagenesHTML}
    ${firmasHTML(receptorNombre, receptorCargo, emisorNombre, emisorCargo)}`;

  return wrapHTML("Acta de Entrega", contenido);
};

// ACTA DE RETIRO
export const generarHTMLRetiro = ({
  data,
  config,
  logos,
  imagenesHTML = "",
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
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const columnasTabla = config?.columnasTabla || ["marca", "modelo", "serie"];
  const colLabels = {
    marca: config?.labelMarca || "Marca",
    modelo: config?.labelModelo || "Modelo",
    serie: config?.labelSerie || "S/N - Inventario",
    asignado: config?.labelAsignado || "Asignado a",
  };
  const mostrarNumFicha = config?.mostrarNumFicha || false;
  const mostrarNumInv = config?.mostrarNumInv || false;

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
    ? `
    <table style="width:100%;border-collapse:collapse;margin:14px 0;">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>`
    : "";

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Acta de Retiro", correlativoFinal)}
    <table style="width:100%;margin-bottom:18px;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;width:70px;padding:3px 4px;font-size:11px;">Para:</td>
        <td style="padding:3px 4px;font-size:11px;">
          <strong>${receptorNombre}</strong><br/>
          <span style="font-size:10px;color:#444;">${receptorCargo}</span>
        </td>
      </tr>
      <tr>
        <td style="font-weight:bold;padding:3px 4px;font-size:11px;">De:</td>
        <td style="padding:3px 4px;font-size:11px;">
          <strong>${emisorNombre}</strong><br/>
          <span style="font-size:10px;color:#444;">${emisorCargo}</span>
        </td>
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
    ${config?.mostrarObservacion && observacion ? `<p style="font-size:11px;margin-top:8px;"><strong>Pd.</strong> ${observacion}</p>` : ""}
    ${imagenesHTML}
    ${firmasHTML(receptorNombre, receptorCargo, emisorNombre, emisorCargo)}`;

  return wrapHTML("Acta de Retiro", contenido);
};

//RECEPCION
export const generarHTMLRecepcion = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    proveedorNombre = "",
    descripcion = "",
    items = [],
    correlativoFinal = "",
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";

  const pixelTransparente =
    "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
  const logoConadehSafe = uriConadeh || pixelTransparente;
  const logoInfoSafe = uriInfo || pixelTransparente;

  const tituloMostrar =
    "ACTA DE RECEPCIÓN" + (correlativoFinal ? ` ${correlativoFinal}` : "");

  const formatearFecha = (f) => {
    if (!f) return "";
    try {
      if (f instanceof Date) {
        return f.toLocaleDateString("es-HN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
      let str = String(f).trim();
      if (!str) return "";

      // Evita que YYYY-MM-DD salte un día hacia atrás agregando mediodía
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        str += "T12:00:00";
      }

      // DD/MM/YYYY o D/M/YYYY — formato es-HN estándar
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const parts = str.split("/");
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        str = `${year}-${month}-${day}T12:00:00`;
      }

      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("es-HN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

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

      /* Renglón 1: descripción, precio y equivalente */
      let renglon1 = item.descr_prod || "Producto";
      if (precioUSD && !isNaN(precioUSD)) {
        renglon1 += `, precio: $${precioUSD.toFixed(2)}`;
        if (precioLPS && !isNaN(precioLPS)) {
          renglon1 += `, el equivalente de ${precioLPS.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} lempiras`;
        }
      }
      if (!renglon1.endsWith(".")) renglon1 += ".";

      /* Renglón 2: recibo, factura y fecha */
      const partes = [];
      if (item.num_recibo) partes.push(`<strong>${item.num_recibo}</strong>`);
      const facturaStr = item.num_fact
        ? `# de Factura # <strong>${item.num_fact}</strong>`
        : "";
      const fechaRaw = item.fech_ARCDet || item.fech_ARCEnc || item.fecha || "";
      const fechaStr = formatearFecha(fechaRaw);

      let renglon2 = "";
      if (item.num_recibo || item.num_fact) {
        renglon2 = "Esto según";
        if (item.num_recibo)
          renglon2 += ` # de Recibo: <strong>${item.num_recibo}</strong>`;
        if (item.num_recibo && item.num_fact) renglon2 += " y";
        if (item.num_fact)
          renglon2 += ` # de Factura # <strong>${item.num_fact}</strong>`;
        if (fechaStr) renglon2 += ` del ${fechaStr}`;
        renglon2 += ".";
      }

      return `
        <li style="margin-bottom:14px;line-height:1.7;word-wrap:break-word;overflow-wrap:break-word;list-style:none;">
          <span style="display:block;">- ${renglon1}</span>
          ${renglon2 ? `<span style="display:block;margin-left:10px;">${renglon2}</span>` : ""}
        </li>`;
    })
    .join("");

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "ACTA DE RECEPCIÓN", correlativoFinal)}
    <!-- BARRA UNIDAD DE INFOTECNOLOGÍA -->
    <div style="text-align:center;padding:7px 0;border-top:2px solid ${colorLinea};
         border-bottom:2px solid ${colorLinea};margin-bottom:35px;
         font-weight:bold;font-size:12px;text-transform:uppercase;">
      UNIDAD DE INFOTECNOLOGÍA
    </div>
    <p style="font-size:12px; text-align:justify; margin-bottom:20px; line-height:1.7;">
      Yo, <strong>${emisorNombre}</strong>, ${emisorCargo}, por este medio hago constar
      que hemos recibido por parte de <strong>${proveedorNombre}</strong>${descripcion ? ", " + descripcion : ""},
      a continuación una descripción del producto recibido:
    </p>
    <ul style="margin-bottom:30px; padding-left:0; text-align:left;">
      ${itemsHTML}
    </ul>
    <div class="firmas-wrapper" style="display:flex; justify-content:center; margin-top:100px;">
      <div class="firma-box" style="width:350px; text-align:center;">
        <div class="firma-line" style="border-top:1px solid #000; margin-bottom:5px;"></div>
        <strong>${emisorNombre}</strong><br/>
        ${emisorCargo}
      </div>
    </div>
  `;
  return wrapHTML("Acta de Recepción", contenido);
};

// MEMORANDUM
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
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const logoC = uriConadeh || PIXEL;
  const logoI = uriInfo || PIXEL;

  const parrafos = items
    .map(
      (it) =>
        `<p style="margin-bottom:14px;text-align:justify;line-height:1.7;">${it.desc_MMDet || ""}</p>`,
    )
    .join("");

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "MEMORÁNDUM", correlativoFinal)}
    <!-- SUBTÍTULO con barra  -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-weight:bold;font-size:14px;text-transform:uppercase;">Unidad de Infotecnología</div>
    </div>
    <!-- METADATOS centrados -->
    <div style="width:75%;margin:0 auto 22px auto;">
      <table style="width:100%;border-collapse:collapse;">
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
    <p style="margin-top:22px;font-size:12px;">Saludos cordiales,</p>
    <div style="text-align:center;margin-top:80px;">
      <div style="width:280px;border-top:1px solid #000;margin:0 auto 5px auto;padding-top:5px;">
        <strong>${emisorNombre}</strong><br/>
        <span style="font-size:11px;color:#333;">${emisorCargo}</span>
      </div>
    </div>
  `;
  return wrapHTML("Memorándum", contenido);
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
    fecha = "",
    correlativoFinal = "",
    items = [],
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const logoC = uriConadeh || PIXEL;
  const logoI = uriInfo || PIXEL;
  const apellido = receptorNombre ? receptorNombre.split(" ").slice(-1)[0] : "";

  const parrafos = items
    .map((it) => `<p class="parrafo">${it.desc_OfiDet || ""}</p>`)
    .join("");

  const contenido = `
    ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "OFICIO", correlativoFinal)}
    <!-- BARRA UNIDAD DE INFOTECNOLOGÍA -->
     <div style="text-align:center; padding:7px 0; 
              margin-bottom:32px; 
              font-weight:bold; font-size:12px; text-transform:uppercase;">
    UNIDAD DE INFOTECNOLOGÍA
  </div>

  <div style="margin-bottom:18px; font-size:12px;">
    <span style="display:block;">${receptorTratamiento}</span>
    <span style="display:block; font-weight:bold;">${receptorNombre}</span>
    <span style="display:block;">${receptorCargo}</span>
    <span style="display:block; margin-top:8px;">${receptorTratamiento} ${apellido}:</span>
  </div>
    <div style="margin-bottom:18px; font-size:12px;">
      <strong>Asunto:</strong> ${asunto}
    </div>
    ${parrafos}
    <p style="font-size:12px; margin-top:14px;">Saludos cordiales,</p>
    <div style="text-align:center; margin-top:80px;">
      <div style="width:300px; border-top:1px solid #000; margin:0 auto 5px auto; padding-top:5px;">
        <strong>${emisorNombre}</strong><br/>
        <span style="font-size:11px;">${emisorCargo}</span>
      </div>
    </div>
  `;
  return wrapHTML("Oficio", contenido);
};

// PASE DE SALIDA
export const generarHTMLPaseSalida = ({ data, config, logos }) => {
  const {
    emisorNombre = "",
    emisorCargo = "",
    receptorNombre = "",
    receptorEmpresa = "",
    motivo = "",
    correlativoFinal = "",
    items = [],
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

  const contenido = `
  ${encabezadoHTML(uriConadeh, uriInfo, colorLinea, "Pase de Salida", correlativoFinal)}

  <p style="font-size:11.5px;text-align:justify;line-height:1.85;margin-bottom:22px;">
    Por este medio se hace entrega a <strong>${receptorNombre}</strong> de la Empresa
    <strong>${receptorEmpresa}</strong>, para que ${motivo} que a continuación se describe:
  </p>

  <table style="width:70%;border-collapse:collapse;margin:0 auto 40px auto;">
    <thead>
      <tr>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">Marca</th>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">Modelo</th>
        <th style="border:1px solid #555;padding:5px 10px;text-align:left;font-size:11px;background:#f5f5f5;">S/N</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  ${firmasHTML(receptorNombre, receptorEmpresa, emisorNombre, emisorCargo)}`;

  return wrapHTML("Pase de Salida", contenido);
};

// REPORTE DE DAÑO DE EQUIPO
export const generarHTMLReporte = ({
  data,
  config,
  logos,
  imagenesHTML = "",
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
  } = data || {};

  const { uriConadeh = "", uriInfo = "" } = logos || {};
  const colorLinea = config?.colorLinea || "#1eb9de";
  const logoC = uriConadeh || PIXEL;
  const logoI = uriInfo || PIXEL;

  const contenido = `
  <!-- ENCABEZADO -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="width:100px;text-align:left;vertical-align:middle">
        <img src="${logoC}" style="height:60px;object-fit:contain;" alt="CONADEH"/>
      </td>
      <td style="text-align:center;vertical-align:middle">
        <div style="font-size:16px;font-weight:bold;font-style:italic;
             text-transform:uppercase;color:${colorLinea};line-height:1.4;">
          Reporte de<br/>Daño de Equipo
        </div>
      </td>
      <td style="width:100px;text-align:right;vertical-align:middle">
        <img src="${logoI}" style="height:55px;object-fit:contain;" alt="InfoTecnología"/>
      </td>
    </tr>
  </table>
  <div style="border-top:3px solid ${colorLinea};margin:5px 0 8px 0;"></div>

  <!-- TABLA PRINCIPAL -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #888;">

    <tr>
      <td style="border:1px solid #888;padding:5px 8px;width:50%;font-size:11px;">${correlativoFinal}</td>
      <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">${fecha}</td>
    </tr>

    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        <strong>Oficina o Departamento:</strong> ${oficina || "—"}
      </td>
    </tr>

    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;
           font-weight:bold;text-transform:uppercase;font-size:11px;">
        Características del Equipo:
      </td>
    </tr>
    <tr>
      <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        <strong>N/F:</strong> ${equipo.numFicha || equipo.numFich || "N/A"}
      </td>
      <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        <strong>INV:</strong> ${equipo.numInv || "N/A"}
      </td>
    </tr>
    <tr>
      <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        <strong>Service Tag / Serie:</strong> ${equipo.serie || "N/A"}
      </td>
      <td style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        <strong>Tipo / Marca / Modelo:</strong> ${equipo.tipo || ""} ${equipo.marca || ""} ${equipo.modelo || ""}
      </td>
    </tr>

    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;
           font-weight:bold;text-transform:uppercase;font-size:11px;">
        Descripción del Reporte:
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;min-height:28px;">
        ${motivo || "&nbsp;"}
      </td>
    </tr>

    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;
           font-weight:bold;text-transform:uppercase;font-size:11px;">
        Diagnóstico:
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;height:200px;
           vertical-align:top;font-size:11px;word-break:break-word;">
        ${diagnostico || "&nbsp;"}${imagenesHTML}
      </td>
    </tr>

    ${
      recomendaciones
        ? `
    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;
           font-weight:bold;text-transform:uppercase;font-size:11px;">
        Recomendaciones:
      </td>
    </tr>
    <tr>
      <td colspan="2" style="border:1px solid #888;padding:5px 8px;font-size:11px;">
        ${recomendaciones}
      </td>
    </tr>`
        : ""
    }

  </table>

  <!-- FIRMA -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #888;border-top:none;">
    <tr>
      <td style="border:1px solid #888;padding:6px 10px;width:50%;font-style:italic;font-size:11px;">
        ${asignadoCargo || "Auxiliar Infotecnología"}.
      </td>
      <td style="border:1px solid #888;padding:6px 10px;font-size:11px;">
        (Firma) &nbsp; ${asignado}
      </td>
    </tr>
  </table>`;

  return wrapHTML("Reporte de Daño de Equipo", contenido);
};
