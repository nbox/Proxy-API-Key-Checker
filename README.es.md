<p align="center">
  <img src="assets/logo.png" width="220" alt="Logo de API Key Health Checker" />
</p>

# API Key Health Checker

GitHub: https://github.com/nbox/API-Key-Health-Checker

🌐 Leer en: [English](README.md) | [Русский](README.ru.md) | [Español](README.es.md)

Aplicación de escritorio para validar claves API de servicios populares y ejecutar comprobaciones por lotes con límites de tasa y reportes. Compatible con OpenAI (ChatGPT), Google Gemini, YouTube Data API y endpoints personalizados.

## Descargar
Lanzamientos: https://github.com/nbox/API-Key-Health-Checker/releases

## Funciones
- Adaptadores de servicio: OpenAI, Gemini, YouTube, Custom
- Comprobaciones por lotes con concurrencia, retraso aleatorio (jitter), reintentos y limitador global de RPS
- Varias ejecuciones en paralelo con registros en tiempo real, estadísticas y resumen
- Importación de claves desde TXT/CSV/JSON, selección de codificación, deduplicación, advertencias de formato
- Exportar informes a CSV/JSON (enmascarado o completo)
- Idiomas de la UI: Inglés (por defecto), Ruso, Español

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

## Captura de pantalla

![Espacio para la captura](assets/screenshot.png)

## Compilación
```bash
git clone https://github.com/nbox/API-Key-Health-Checker.git
cd API-Key-Health-Checker
npm install
npm run build
npm run dist
```
La salida de compilación se guarda en `dist/`.
DMG: `release/API Key Health Checker-1.0.0-{arch}.dmg`.
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
