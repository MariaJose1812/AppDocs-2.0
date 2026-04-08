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

  const colorLinea = config?.colorLinea || "#1eb9de";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Acta de Recepción</title>
<style>
  * { box-sizing: border-box; max-width: 100%; }
  @page { size: A4 portrait; margin: 0; }
  body { font-family: Arial, sans-serif; color: #000; font-size: 12px;
         line-height: 1.6; padding: 25mm 20mm; margin: 0; width: 100%; }
  .acta-titulo { text-align: center; font-weight: bold; font-size: 14px;
                 text-decoration: underline; text-transform: uppercase;
                 margin-bottom: 30px; letter-spacing: 0.5px; }
  .cuerpo { font-size: 12px; text-align: justify; margin-bottom: 20px;
            line-height: 1.6; word-break: break-word; overflow-wrap: break-word; }
  .lista-items { margin-bottom: 30px; padding-left: 0; text-align: left; }
  .firmas-wrapper { display: flex; justify-content: center; margin-top: 100px; }
  .firma-box { width: 350px; text-align: center; font-size: 12px; }
  .firma-line { border-top: 1px solid #000; margin-bottom: 5px; }
</style>
</head>
<body>
 
  <!-- ENCABEZADO -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
    <img src="${logoConadehSafe}" style="height:75px;object-fit:contain;" alt="CONADEH"/>
    <div style="text-align:center;flex:1;padding:0 15px;">
      <p style="font-weight:bold;font-size:13px;margin:0;text-transform:uppercase;">Comisionado Nacional de los Derechos Humanos</p>
      <p style="font-size:11px;margin:5px 0 0 0;">(CONADEH) — Honduras, C.A.</p>
    </div>
    <img src="${logoInfoSafe}" style="height:65px;object-fit:contain;" alt="Infotecnología"/>
  </div>
 
  <div style="text-align:center;padding:7px 0;border-top:2px solid ${colorLinea};border-bottom:2px solid ${colorLinea};margin-bottom:35px;font-weight:bold;font-size:12px;text-transform:uppercase;">
    UNIDAD DE INFOTECNOLOGÍA
  </div>
 
  <div class="acta-titulo">${tituloMostrar}</div>
 
  <p class="cuerpo">
    Yo, <strong>${emisorNombre}</strong>, ${emisorCargo}, por este medio hago constar
    que hemos recibido por parte de <strong>${proveedorNombre}</strong>${descripcion ? ", " + descripcion : ""},
    a continuación una descripción del producto recibido:
  </p>
 
  <ul class="lista-items">
    ${itemsHTML}
  </ul>
 
  <div class="firmas-wrapper">
    <div class="firma-box">
      <div class="firma-line"></div>
      <strong>${emisorNombre}</strong><br/>
      ${emisorCargo}
    </div>
  </div>
 
</body>
</html>`;
};
