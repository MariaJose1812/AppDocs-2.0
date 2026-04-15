/**
 * preload.js — Bridge seguro entre Electron y la aplicación web
 *
 * Este archivo se ejecuta en el contexto del renderer ANTES de que cargue
 * la página web. Expone de forma segura solo las funciones nativas necesarias,
 * sin dar acceso directo a Node.js desde la web (contextIsolation: true).
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expone funciones nativas seguras bajo window.electronAPI
contextBridge.exposeInMainWorld("electronAPI", {
  // Obtener la versión de la app
  getVersion: () => ipcRenderer.invoke("get-app-version"),

  // Diálogo para guardar archivos
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),

  // Abrir URL en el navegador del sistema
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Indica que la app está corriendo dentro de Electron
  isElectron: true,

  // Plataforma del sistema operativo
  platform: process.platform,
});