/**
 * preload.js — Puente seguro entre Electron y la aplicación React/Expo
 *
 * Se ejecuta en el contexto del renderer ANTES de que cargue la página.
 * Expone de forma controlada solo las funciones necesarias al frontend.
 * contextIsolation: true garantiza que el código web no accede a Node.js.
 */

"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Versión de la aplicación 
  getVersion: () => ipcRenderer.invoke("get-app-version"),

  // Diálogo nativo del sistema operativo para guardar archivos 
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),

  // Abre una URL en el navegador predeterminado del sistema 
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // URL del backend 
  getBackendUrl: () => ipcRenderer.invoke("get-backend-url"),

  // Flag para saber desde el frontend que se está dentro de Electron
  isElectron: true,

  // Plataforma del SO: 'win32', 'darwin', 'linux'
  platform: process.platform,
});
