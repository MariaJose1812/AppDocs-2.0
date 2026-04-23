
/**
 * build.js — Script de construcción completo para SGD 
 *
 * Ejecutar desde la carpeta ELECTRON/:
 *   node build.js
 *
 * Lo que hace este script:
 *   1. Verifica que existe la carpeta FRONTEND
 *   2. Compila el frontend de Expo para web (genera dist/)
 *   3. Copia dist/ a la carpeta ELECTRON/
 *   4. Genera el .exe con electron-builder
 *
 * Requisitos previos:
 *   - Node.js instalado en la máquina de desarrollo
 *   - npm install ejecutado en FRONTEND/ y ELECTRON/
 *   - FRONTEND/.env con EXPO_PUBLIC_API_URL apuntando al servidor de producción
 */

"use strict";

const { execSync, spawnSync } = require("child_process");
const path  = require("path");
const fs    = require("fs");
const os    = require("os");

// COLORES PARA TERMINAL
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
};

function log(msg, color = C.cyan) {
  console.log(`${color}${C.bold}[BUILD]${C.reset} ${color}${msg}${C.reset}`);
}

function ok(msg)   { console.log(`${C.green}  ✓ ${msg}${C.reset}`); }
function warn(msg) { console.log(`${C.yellow}  ⚠ ${msg}${C.reset}`); }
function err(msg)  { console.error(`${C.red}  ✖ ${msg}${C.reset}`); }

function run(cmd, cwd, label) {
  log(`${label || cmd}`, C.gray);
  const result = spawnSync(cmd, {
    shell: true,
    cwd,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (result.status !== 0) {
    err(`Falló: ${cmd}`);
    process.exit(1);
  }
}

// RUTAS
const ELECTRON_DIR = __dirname;
const FRONTEND_DIR = path.resolve(ELECTRON_DIR, "..", "FRONTEND");
const DIST_SRC     = path.join(FRONTEND_DIR, "dist");
const DIST_DST     = path.join(ELECTRON_DIR, "dist");

console.log();
console.log(`${C.bold}${C.cyan}  Sistema Gestión Documental CONADEH — Build del Ejecutable Windows (.exe) ${C.reset}`);
console.log();

// VERIFICAR FRONTED
log("Paso 1/4 — Verificando directorios");

if (!fs.existsSync(FRONTEND_DIR)) {
  err(`No se encontró la carpeta FRONTEND en: ${FRONTEND_DIR}`);
  process.exit(1);
}
ok(`FRONTEND encontrado: ${FRONTEND_DIR}`);

// Verificar que .env existe y tiene la URL del backend
const envFile = path.join(FRONTEND_DIR, ".env");
if (!fs.existsSync(envFile)) {
  warn("FRONTEND/.env no existe — creando con URL de ejemplo");
  warn("¡IMPORTANTE! Editar EXPO_PUBLIC_API_URL con la URL real del servidor.");
  fs.writeFileSync(envFile, "EXPO_PUBLIC_API_URL=http://localhost:3000/api\n"); //OJO: Cambiar esta URL por la del servidor real antes de compilar el .exe
} else {
  const envContent = fs.readFileSync(envFile, "utf8");
  const apiUrl = envContent.match(/EXPO_PUBLIC_API_URL=(.+)/)?.[1]?.trim();
  if (!apiUrl) {
    warn("EXPO_PUBLIC_API_URL no encontrado en FRONTEND/.env");
    warn("El .exe no podrá conectarse al backend.");
  } else {
    ok(`API URL configurada: ${apiUrl}`);
  }
}

// COMPILAR FRONTED CON EXPO
log("Paso 2/4 — Compilando frontend (npx expo export -p web)");

// Limpiar build anterior si existe
if (fs.existsSync(DIST_SRC)) {
  fs.rmSync(DIST_SRC, { recursive: true, force: true });
  ok("Build anterior eliminado");
}

run(
  "npx expo export -p web --output-dir dist",
  FRONTEND_DIR,
  "Compilando Expo web…"
);

// Verificar que el build fue exitoso
if (!fs.existsSync(path.join(DIST_SRC, "index.html"))) {
  err("El build de Expo no generó index.html. Verifique los errores arriba.");
  process.exit(1);
}
ok("Frontend compilado correctamente");

// COPIAR dist/ A ELECTRON
log("Paso 3/4 — Copiando build al directorio Electron");

if (fs.existsSync(DIST_DST)) {
  fs.rmSync(DIST_DST, { recursive: true, force: true });
}

// Función recursiva de copia compatible con todas las versiones de Node
function copiarDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const dstPath = path.join(dst, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copiarDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

copiarDir(DIST_SRC, DIST_DST);

const archivos = fs.readdirSync(DIST_DST).length;
ok(`${archivos} archivos copiados a ELECTRON/dist/`);

process.env.EMBED_BACKEND = "true";

// GENERAR .EXE CON ELECTRON-BUILDER
log("Paso 4/4 — Generando ejecutable .exe con electron-builder");

// Instalar dependencias de Electron si faltan
if (!fs.existsSync(path.join(ELECTRON_DIR, "node_modules"))) {
  log("Instalando dependencias de Electron…");
  run("npm install", ELECTRON_DIR, "npm install");
}

run(
  "npx electron-builder --win portable",
  ELECTRON_DIR,
  "Empaquetando con electron-builder…"
);

// RESULTADO
const releaseDir  = path.join(ELECTRON_DIR, "release");
let exeEncontrado = null;

if (fs.existsSync(releaseDir)) {
  for (const f of fs.readdirSync(releaseDir)) {
    if (f.endsWith(".exe")) {
      exeEncontrado = path.join(releaseDir, f);
      break;
    }
  }
}

console.log();
console.log(`${C.bold}${C.green}  ✓️ Build completado exitosamente${C.reset}`);

if (exeEncontrado) {
  console.log(`\n  Ejecutable generado:\n  ${C.cyan}${exeEncontrado}${C.reset}\n`);
} else {
  console.log(`\n  Archivos en: ${C.cyan}${releaseDir}${C.reset}\n`);
}

console.log(`  ${C.yellow}Para distribuir:${C.reset}`);
console.log(`  Copie el archivo .exe a la PC del usuario.`);
console.log(`  No requiere instalación — doble clic para abrir.\n`);