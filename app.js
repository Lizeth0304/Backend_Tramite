const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");
const path = require("path");


const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const app = express();



 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de CORS para permitir solicitudes desde un origen diferente
app.use(cors());

// Configuración de multer para el almacenamiento de archivos adjuntos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "files_emails"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});


// Configuración de multer para el almacenamiento de archivos adjuntos
const upload = multer({
  storage: storage,
  limits: {
    // Permitir hasta 5 archivos adjuntos
    files: 20,
  },
});

app.use((req, res, next) => {
  console.log("Request Body:", req.body);
  console.log("Request Files:", req.files);
  next();
});


// Importar la función getAccessToken desde gmailAuth.js
const { getAccessToken } = require("./gmailAuth"); // Reemplaza la ruta con la correcta hacia gmailAuth.js

// Ruta para verificar la conexión del servidor (opcional)
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running" });
});

// Ruta para enviar correos electrónicos
app.post("/api/send-email", upload.array("fileAdjunto", 20), async (req, res) => {
  const { para, titulo, mensaje } = req.body;
  const filesAdjuntos = req.files;
  console.log(`filesAdjuntos:`, filesAdjuntos);
  let attachments = [];

  if (filesAdjuntos) {
    attachments = filesAdjuntos.map((fileAdjunto) => {
      const filePath = path.join(__dirname, "files_emails", fileAdjunto.filename);
      return {
        filename: fileAdjunto.originalname,
        path: filePath,
      };
    });
  }

  try {
    // Obtener el token de acceso para el envío de correos electrónicos
    const accessToken = await getAccessToken();
    
    // Configurar el transporter de nodemailer con OAuth2
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "estebanjdesaweb@gmail.com",
        accessToken,
      },
    });

    // Aquí agregamos la firma personalizada con HTML y CSS
    const firma = `
    <div style="font-family: Arial, sans-serif; font-size: 12px; color: #555;">
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
          <tr>
            <!-- Primera columna: Logo -->
            <td style="width: 150px; padding: 0;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Escudo_UNE.png" alt="Logo" style="display: block; width: 100px; height: auto;" />
            </td>
            <!-- Segunda columna: Texto con estilo Times -->
            <td style="width: 400px; font-family: Times New Roman, serif; font-size: 14px; color: #000; padding-left: 0px;">
              <p style="font-size: 16px">Universidad Nacional de Educación</p>
              <p style="font-size: 24px; font-weight: bold">Enrique Guzmán y Valle</p>
              <p style="font-style: italic;">Alma Máter del Magisterio Nacional</p>
            </td>
            <!-- Tercera columna: Texto con otro estilo de letra y línea -->
            <td style="width: 400px; font-family: Verdana, Geneva, sans-serif; font-size: 13px; color: #777; border-left: 1px solid #777; padding-left: 20px;">
              <h3>RECTORADO</h3>
              <p>Télefono: 313 3700 Anexo 1010</p>              
              <p>Correo: rectorado@une.edu.pe</p>
            </td>            
          </tr>
        </table>
      </div>
    `;

    // Combinamos la firma con el mensaje
    const mensajeConFirma = mensaje + firma;

    const mailOptions = {
      to: para,
      subject: titulo,
      html: mensajeConFirma, // Utilizamos html en lugar de text para permitir el contenido HTML en el mensaje
      attachments: attachments,
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error al enviar el correo:", error);
        res.status(500).json({ error: "Error al enviar el correo" });
      } else {
        console.log("Correo enviado:", info.response);
        res.json({ message: "Correo enviado correctamente" });
      }
      
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el token de acceso" });
    console.log(error)
  }
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
