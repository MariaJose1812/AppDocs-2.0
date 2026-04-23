/**
 * main.js — Proceso principal de Electron
 * Sistema de Gestión Documental — CONADEH
 */

"use strict";

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  utilityProcess,
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

//CONFIGURACIÓN GLOBAL
const IS_PACKAGED = app.isPackaged; // true cuando es .exe
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const STATIC_PORT = 4173; // Puerto para servir el frontend

// Rutas de recursos 
const DIST_PATH = IS_PACKAGED
  ? path.join(process.resourcesPath, "dist")
  : path.join(__dirname, "dist");

const BACKEND_PATH = IS_PACKAGED
  ? path.join(process.resourcesPath, "BACKEND")
  : path.join(__dirname, "..", "BACKEND");

// VARIABLES GLOBALES
let mainWindow = null;
let splashWindow = null;
let backendProcess = null;
let staticServer = null;

//SERVIDOR HTTP PARA SERVIR EL FRONTEND EN PRODUCCIÓN
function startStaticServer() {
  return new Promise((resolve, reject) => {
    const MIME = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    };

    staticServer = http.createServer((req, res) => {
      let filePath = path.join(
        DIST_PATH,
        req.url === "/" ? "index.html" : req.url.split("?")[0],
      );
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_PATH, "index.html");
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME[ext] || "application/octet-stream";

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Archivo no encontrado");
          return;
        }
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      });
    });

    staticServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        staticServer.listen(STATIC_PORT + 1, "127.0.0.1");
      } else {
        reject(err);
      }
    });

    staticServer.listen(STATIC_PORT, "127.0.0.1", () => {
      const addr = staticServer.address();
      console.log(
        `[SGD] Servidor estático activo http://127.0.0.1:${addr.port}`,
      );
      resolve(addr.port);
    });
  });
}

// BACKEND EMBEBIDO (MODO PRODUCCIÓN)
function esperarBackend(port, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/login",
          method: "GET",
          timeout: 1000,
        },
        () => resolve(),
      );
      req.on("error", () => {
        if (Date.now() - start >= timeout)
          reject(new Error(`Timeout esperando backend en puerto ${port}`));
        else setTimeout(tryConnect, 500);
      });
      req.on("timeout", () => {
        req.destroy();
        setTimeout(tryConnect, 500);
      });
      req.end();
    };
    tryConnect();
  });
}

function iniciarBackendEmbebido() {
  const entryPoint = path.join(BACKEND_PATH, "index.js");
  if (!fs.existsSync(entryPoint)) {
    console.warn(`[SGD] No se encontró backend embebido en: ${entryPoint}`);
    return null;
  }

  console.log(`[SGD] Iniciando backend embebido desde: ${entryPoint}`);
  const proceso = utilityProcess.fork(entryPoint, [], {
    serviceName: "SGD-Backend",
    cwd: BACKEND_PATH,
    stdio: "inherit", 
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(BACKEND_PORT),
      ELECTRON_APP: "true",
    },
  });

  proceso.stdout?.on("data", (d) =>
    console.log(`[BACKEND] ${d.toString().trim()}`),
  );
  proceso.stderr?.on("data", (d) =>
    console.error(`[BACKEND ERR] ${d.toString().trim()}`),
  );
  proceso.on("exit", (code) => {
    console.log(`[SGD] Backend terminó (código: ${code})`);
    backendProcess = null;
  });
  return proceso;
}

// VENTANAS
function crearSplash() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 300,
    frame: false,
    resizable: false,
    center: true,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { contextIsolation: true },
  });
  const splashFile = path.join(__dirname, "splash.html");
  if (fs.existsSync(splashFile)) splashWindow.loadFile(splashFile);
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function cerrarSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  splashWindow = null;
}

function crearVentanaPrincipal(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    center: true,
    title: "CONADEH — Sistema de Gestión Documental",
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      devTools: !IS_PACKAGED,
    },
  });

  console.log(`[SGD] Cargando frontend desde: ${url}`);
  mainWindow.loadURL(url).catch((err) => {
    console.error("[SGD] Error al cargar frontend:", err.message);
    mostrarErrorFatal(
      "No se pudo cargar la aplicación",
      `URL: ${url}\nError: ${err.message}`,
    );
  });

  if (!IS_PACKAGED) mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.once("ready-to-show", () => {
    cerrarSplash();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// MANEJO DE ERRORES FATALES
function mostrarErrorFatal(titulo, detalle) {
  cerrarSplash();
  dialog.showErrorBox(
    `SGD CONADEH — ${titulo}`,
    `${detalle}\n\nContacte a la Unidad de Infotecnología.`,
  );
  app.quit();
}

//VERFICAR DISTRIBUCIÓN EN PRODUCCIÓN
function verificarDistribucion() {
  if (!IS_PACKAGED) return;
  const indexPath = path.join(DIST_PATH, "index.html");
  if (!fs.existsSync(indexPath)) {
    mostrarErrorFatal(
      "Instalación incompleta",
      `No se encontró el frontend en:\n${DIST_PATH}`,
    );
  }
}

// CICLO DE VIDA DE LA APLICACIÓN
app.on("ready", async () => {
  verificarDistribucion();
  crearSplash();

  if (!IS_PACKAGED) {
    // Modo desarrollo: conectar a servidor de Expo
    crearVentanaPrincipal("http://localhost:8081");
    return;
  }

  //MODO PRODUCCIÓN
  try {
    //Iniciar backend embebido si existe la carpeta
    if (fs.existsSync(BACKEND_PATH)) {
      backendProcess = iniciarBackendEmbebido();
      if (backendProcess) {
        console.log("[SGD] Esperando que el backend embebido esté listo...");
        await esperarBackend(BACKEND_PORT).catch((err) =>
          console.warn(`[SGD] Backend no responde: ${err.message}`),
        );
      }
    }

    //Levantar servidor estático del frontend
    const puerto = await startStaticServer();
    crearVentanaPrincipal(`http://127.0.0.1:${puerto}`);
  } catch (err) {
    mostrarErrorFatal(
      "Error al iniciar la aplicación",
      `No se pudo levantar el servidor local.\n${err.message}`,
    );
  }
});

app.on("before-quit", () => {
  if (staticServer) staticServer.close();
  if (backendProcess) backendProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (
    BrowserWindow.getAllWindows().length === 0 &&
    mainWindow === null &&
    staticServer
  ) {
    const addr = staticServer.address();
    if (addr) crearVentanaPrincipal(`http://127.0.0.1:${addr.port}`);
  }
});

//COMUNICACIÓN SEGURA CON EL FRONTEND
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("show-save-dialog", async (_, options) =>
  dialog.showSaveDialog(mainWindow, options),
);
ipcMain.handle("open-external", (_, url) => shell.openExternal(url));
ipcMain.handle("get-backend-url", () => `http://localhost:${BACKEND_PORT}`);
