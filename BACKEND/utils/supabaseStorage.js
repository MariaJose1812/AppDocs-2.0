const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, 
  { auth: { persistSession: false } },
);

const subirImagen = async (buffer, fileName, mimeType, carpeta = "general") => {
  // Limpia el nombre del archivo
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const ruta = `${carpeta}/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(ruta, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Error detallado de Supabase:", error);
    throw new Error(`Error subiendo imagen: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(ruta);

  return urlData.publicUrl;
};

module.exports = { subirImagen };
