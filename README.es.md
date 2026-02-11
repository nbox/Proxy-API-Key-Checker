<p align="center">
  <img src="assets/logo.png" width="220" alt="Logo de Proxy & API Key Checker" />
</p>

# Proxy & API Key Checker

GitHub: https://github.com/nbox/Proxy-API-Key-Checker

🌐 Leer en: [English](README.md) | [Русский](README.ru.md) | [Español](README.es.md)

Aplicación de escritorio para validar claves API de servicios populares y ejecutar comprobaciones por lotes con límites de tasa y reportes. Compatible con OpenAI (ChatGPT), Google Gemini, YouTube Data API y endpoints personalizados.

![Screenshot](assets/screenshot.png)

## 🍺 Homebrew (macOS)

Instalar:

```bash
brew install --cask nbox/tap/proxy-api-key-checker
```

Desinstalar:

```bash
brew uninstall --cask --zap proxy-api-key-checker
```

## Descargar

Lanzamientos: https://github.com/nbox/Proxy-API-Key-Checker/releases

## macOS Gatekeeper

⚠️ macOS puede bloquear compilaciones sin firma descargadas desde GitHub. Si ves una advertencia de que la app no está firmada y macOS ofrece moverla a la Papelera, usa una de las opciones siguientes:

Opción 1: Permitir en System Settings -> Privacy & Security

- Intenta abrir la app de forma normal (doble clic).
- Abre System Settings -> Privacy & Security.
- En la advertencia sobre Proxy & API Key Checker, haz clic en Open Anyway.
- Confirma pulsando Open.

Opción 2: Eliminar el atributo de cuarentena

```bash
xattr -dr com.apple.quarantine "/Applications/Proxy & API Key Checker.app"
```

## Funciones

- Adaptadores de servicio: OpenAI, Gemini, YouTube, Custom
- Comprobaciones por lotes con concurrencia, retraso aleatorio (jitter), reintentos y limitador global de RPS
- Varias ejecuciones en paralelo con registros en tiempo real, estadísticas y resumen
- Importación de claves desde TXT/CSV/JSON, selección de codificación, deduplicación, advertencias de formato
- Exportar informes a CSV/JSON (enmascarado o completo)
- Idiomas de la UI: Inglés (por defecto), Ruso, Español

## Proxy Checker

- Tipos: HTTP, HTTPS, SOCKS4, SOCKS5; el esquema en la línea (`http://`, `https://`, `socks4://`, `socks5://`) fija el tipo.
- Fuentes: lista manual, importación de archivo y URLs de agregadores (una por línea; se permiten comentarios con `#`).
- Formatos: `ip:port` o `user:pass@ip:port`; normalización y deduplicación.
- Modos: validez o acceso a URL con URL objetivo configurable.
- Búsqueda HTML: uno o varios textos (OR). Sin headless lee solo los primeros N KB.
- Navegador headless: carga completa con JS; capturas opcionales (carpeta, máx. archivos, autoeliminar, incluir fallidas).
- Headless y capturas están disponibles solo en modo URL con búsqueda HTML activada.
- Controles: el límite de velocidad es un umbral suave; el timeout es un corte duro por solicitud. Además reintentos, concurrencia, RPS máx, retraso aleatorio + jitter, máx. proxies por ejecución.
- Resultados: cada proxy se comprueba por cada tipo seleccionado; logs/exportes incluyen tipo, modo y URL; resumen con listas por tipo y copiar/mover a la lista.
- Resumen: separación por tipo y botón "Mover a la lista de proxies" para filtrar rápido y luego revalidar en modo más estricto (primero validez, luego URL objetivo).
- Agregadores preinstalados en `src/renderer/lib/proxyAggregators` (son ejemplos; algunos pueden estar caídos o bloqueados por región).

## Seguridad y privacidad

- Las claves se envían solo al endpoint API seleccionado
- Sin telemetría
- Usa solo claves que te pertenezcan o tengas permiso para probar
- La exportación completa guarda las claves en texto plano (sin cifrado). Úsalo con cuidado.

## Requisitos

- Node.js 20+
- npm

## Inicio rápido

```bash
npm install
npm run dev
```

## Compilación

```bash
git clone https://github.com/nbox/Proxy-API-Key-Checker.git
cd Proxy-API-Key-Checker
npm install
npm run build
npm run dist
```

La salida de compilación se guarda en `dist/`.
DMG: `release/Proxy & API Key Checker-1.0.0-{arch}.dmg`.
macOS: ejecuta `npm run dist` en macOS para generar un `.dmg` en `release/`.
Windows: ejecuta `npm run dist` en Windows para generar un instalador `.exe` en `release/`.

## GitHub Actions release

- En push a `main` o tags `v*`
- Compila para macOS, Windows y Linux
- Crea un GitHub Release con artefactos

## Servicio personalizado

Usa el adaptador Custom para definir base URL, path, tipo de autenticación (bearer/header/query) y códigos de éxito.

## Estructura del proyecto

- `src/main`: proceso principal de Electron y motor de comprobaciones
- `src/renderer`: UI (React + Tailwind)
- `src/shared`: tipos y utilidades compartidas
