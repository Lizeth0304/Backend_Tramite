const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const accountTransport = require("./env/account_transport.json");

// Configura las credenciales de OAuth2 para Gmail
const oauth2Client = new OAuth2(
  accountTransport.auth.clientId,
  accountTransport.auth.clientSecret,
  "https://developers.google.com/oauthplayground"
);

// Función para obtener el token de acceso
const getAccessToken = async () => {
  try {
    const { tokens } = await oauth2Client.refreshToken(accountTransport.auth.refreshToken);
    const accessToken = tokens.access_token;
    return accessToken;
  } catch (error) {
    console.error("Error al obtener el token de acceso:", error.message);
    throw error;
  }
};

module.exports = {
  getAccessToken, // Exportamos la función getAccessToken en lugar de un token estático.
};
