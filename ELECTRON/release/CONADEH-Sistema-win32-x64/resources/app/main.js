/**
 * Este archivo es el punto de entrada de la aplicación de escritorio.
 * Crea la ventana principal, carga la app de Expo Web compilada
 * y gestiona el ciclo de vida de la aplicación.
 */

const {
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");

// Variables de entorno
// En producción: carga la app compilada (dist/)
// En desarrollo: apunta al servidor de Expo
//const isDev = process.env.NODE_ENV === "development";
const isDev = true;
//const EXPO_URL = "https://www.google.com";
const EXPO_URL = process.env.EXPO_URL || "http://localhost:8081";

let mainWindow = null;
let splashWindow = null;

// SPLASH
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

// VENTANA PRINCIPAL
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false, 
    center: true,
    title: "CONADEH — Sistema de Gestión Documental",
    icon: path.join(__dirname, "../assets/icon.png"),
    backgroundColor: "#0f172a", 

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  //Cargar la aplicación
  if (isDev) {
    // Modo desarrollo: conecta al servidor de Expo
    console.log(`[Electron] Modo desarrollo → ${EXPO_URL}`);
    mainWindow.loadURL(EXPO_URL);
    mainWindow.webContents.openDevTools(); // abre DevTools en desarrollo
  } else {
    // Modo producción: carga el build estático de Expo
    const indexPath = path.join(__dirname, "../dist/index.html");
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      // Fallback: si no existe dist/, intenta la carpeta web-build
      const webBuildPath = path.join(__dirname, "../web-build/index.html");
      mainWindow.loadFile(webBuildPath);
    }
  }

  //Eventos de la ventana
  mainWindow.webContents.on("did-finish-load", () => {
    // Cuando termina de cargar: cierra el splash y muestra la ventana principal
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDesc) => {
    console.error(`[Electron] Error al cargar: ${errorDesc} (${errorCode})`);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    // Muestra un diálogo de error amigable
    dialog.showErrorBox(
      "Error al iniciar",
      `No se pudo cargar la aplicación.\n\nVerifica que el servidor backend esté ejecutándose.\n\nDetalle: ${errorDesc}`,
    );
  });

  // Abre links externos en el navegador del sistema, no en Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

//Menú de la aplicación 
function buildMenu() {
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Recargar",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        {
          label: "Salir",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Ver",
      submenu: [
        {
          label: "Pantalla completa",
          accelerator: "F11",
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          },
        },
        {
          label: "Zoom +",
          accelerator: "CmdOrCtrl+Plus",
          click: () => {
            if (mainWindow) {
              const zoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(zoom + 0.5);
            }
          },
        },
        {
          label: "Zoom −",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            if (mainWindow) {
              const zoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(zoom - 0.5);
            }
          },
        },
        {
          label: "Restablecer zoom",
          accelerator: "CmdOrCtrl+0",
          click: () => mainWindow?.webContents.setZoomLevel(0),
        },
        ...(isDev
          ? [
              { type: "separator" },
              {
                label: "Herramientas de desarrollo",
                accelerator: "F12",
                click: () => mainWindow?.webContents.toggleDevTools(),
              },
            ]
          : []),
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Acerca de",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Acerca de",
              message: "Sistema de Gestión Documental",
              detail:
                "CONADEH — Unidad de Infotecnología\n" +
                `Versión: ${app.getVersion()}\n` +
                "Desarrollado con Electron + React Native (Expo)\n\n" +
                "Comisionado Nacional de los Derechos Humanos\nHonduras, C.A.",
              buttons: ["Cerrar"],
              icon: path.join(__dirname, "../assets/icon.png"),
            });
          },
        },
      ],
    },
  ];

  // En macOS se agrega el menú de aplicación estándar
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

//IPC: comunicación entre renderer y main process
// Permite que la app web haga acciones nativas si se necesitan en el futuro

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle("open-external", (event, url) => {
  shell.openExternal(url);
});

//Ciclo de vida de la app
app.whenReady().then(() => {
  buildMenu();
  createSplashWindow();

  // Pequeña pausa para que el splash se vea antes de cargar la app principal
  setTimeout(() => {
    createMainWindow();
  }, 800);

  // macOS: re-crea la ventana si se hace click en el dock sin ventanas abiertas
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Cierra la app cuando se cierran todas las ventanas (excepto macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Seguridad: previene la creación de ventanas nuevas no autorizadas
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
