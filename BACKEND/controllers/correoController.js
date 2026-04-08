const nodemailer = require("nodemailer");
const htmlPdf = require("html-pdf-node");

exports.enviarCorreo = async (req, res) => {
  const { para, cc, asunto, cuerpo, adjuntos } = req.body;

  if (!para)
    return res.status(400).json({ error: "El campo 'para' es obligatorio." });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // adjuntos = [{ nombre: "Acta.pdf", html: "<!DOCTYPE html>..." }]
    const attachments = await Promise.all(
      (adjuntos || []).map(async (a) => {
        if (a.html) {
          // Generar PDF desde HTML en el backend
          const file = { content: a.html };
          const options = { format: "A4" };
          const buffer = await htmlPdf.generatePdf(file, options);
          return {
            filename: a.nombre,
            content: buffer,
            contentType: "application/pdf",
          };
        }
        // Fallback: base64 enviado desde frontend
        return {
          filename: a.nombre,
          content: Buffer.from(a.base64, "base64"),
          contentType: "application/pdf",
        };
      }),
    );

    await transporter.sendMail({
      from: `"Unidad de Infotecnología" <${process.env.MAIL_USER}>`,
      to: para,
      cc: cc || undefined,
      subject: asunto || "(Sin asunto)",
      text: cuerpo || "",
      attachments,
    });

    res.json({ mensaje: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res
      .status(500)
      .json({ error: "No se pudo enviar el correo: " + error.message });
  }
};
