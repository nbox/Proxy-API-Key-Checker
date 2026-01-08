export type Locale = "ru" | "en" | "es";

type CopyKey =
  | "appTitle"
  | "serviceLabel"
  | "networkOnline"
  | "networkOffline"
  | "theme"
  | "language"
  | "keysInputTitle"
  | "keysInputHint"
  | "importFile"
  | "encoding"
  | "dedupe"
  | "serviceSettings"
  | "checkMethod"
  | "randomDelay"
  | "randomDelayHint"
  | "jitter"
  | "concurrency"
  | "timeout"
  | "retries"
  | "maxKeys"
  | "maxRps"
  | "customSettings"
  | "startCheck"
  | "disclaimerTitle"
  | "disclaimerBody"
  | "disclaimerAccept"
  | "processesTitle"
  | "processLimit"
  | "clearProcesses"
  | "clearProcessesTitle"
  | "clearProcessesPrompt"
  | "clearProcessesStop"
  | "clearProcessesKeep"
  | "logs"
  | "stats"
  | "summary"
  | "pause"
  | "resume"
  | "stop"
  | "exportMasked"
  | "exportFull"
  | "confirmExport"
  | "cancel"
  | "confirm"
  | "searchKey"
  | "filterAll"
  | "filterSuccess"
  | "filterFailed"
  | "filterWarning"
  | "keysCount"
  | "formatWarning"
  | "limitWarning"
  | "customBaseUrl"
  | "customPath"
  | "customMethod"
  | "customAuthType"
  | "customHeader"
  | "customQuery"
  | "customSuccess"
  | "customDescription"
  | "customExampleTitle"
  | "customExampleBody"
  | "exportPlainHint"
  | "noProcesses"
  | "failedReadFile"
  | "failedStart"
  | "customBaseRequired"
  | "copyFullList"
  | "validKeys"
  | "statusCompleted"
  | "statusCancelled"
  | "statusRunning"
  | "formatLabel"
  | "totalLabel"
  | "latencyLabel"
  | "avgLabel"
  | "medianLabel"
  | "topReasonsLabel"
  | "recommendationsLabel"
  | "successLabel"
  | "invalidLabel"
  | "quotaLabel"
  | "rateLimitedLabel"
  | "networkLabel"
  | "unknownLabel"
  | "exportAcknowledge"
  | "openAiOrgLabel"
  | "hideFullKeys"
  | "methodAuthOnlyOption"
  | "methodQuotaOption"
  | "methodSampleOption"
  | "methodAuthOnlyHint"
  | "methodQuotaHint"
  | "methodSampleHint";

export const copy: Record<Locale, Record<CopyKey, string>> = {
  en: {
    appTitle: "API Key Health Checker",
    serviceLabel: "Service",
    networkOnline: "Online",
    networkOffline: "Offline",
    theme: "Theme",
    language: "Language",
    keysInputTitle: "Keys input",
    keysInputHint: "Paste one key per line. Empty lines are removed automatically.",
    importFile: "Import file",
    encoding: "Encoding",
    dedupe: "Remove duplicates",
    serviceSettings: "Service settings",
    checkMethod: "Check method",
    methodAuthOnlyOption: "Auth-only — lightweight request",
    methodQuotaOption: "Quota — billing/usage check",
    methodSampleOption: "Sample — minimal real request",
    methodAuthOnlyHint: "Auth-only: lightweight request to validate access.",
    methodQuotaHint: "Quota: billing/usage check (OpenAI; may not work for some keys).",
    methodSampleHint: "Sample: real minimal request, may consume quota.",
    randomDelay: "Random delay",
    randomDelayHint: "Min/Max in ms",
    jitter: "Jitter",
    concurrency: "Concurrency",
    timeout: "Timeout (ms)",
    retries: "Retries",
    maxKeys: "Max keys per run",
    maxRps: "Max requests/sec (per-process)",
    customSettings: "Custom service",
    startCheck: "Start new check",
    disclaimerTitle: "Before you start",
    disclaimerBody:
      "Use this tool only with keys you own or have explicit permission to test. Keys are stored in memory by default.",
    disclaimerAccept: "I understand",
    processesTitle: "Active checks",
    processLimit: "Process limit",
    clearProcesses: "Clear list",
    clearProcessesTitle: "Clear list",
    clearProcessesPrompt: "There are active checks. Stop them before clearing the list?",
    clearProcessesStop: "Stop and clear",
    clearProcessesKeep: "Clear finished only",
    logs: "Logs",
    stats: "Stats",
    summary: "Summary",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    exportMasked: "Export masked report",
    exportFull: "Export full keys",
    confirmExport: "Export",
    cancel: "Cancel",
    confirm: "Confirm",
    searchKey: "Search by key",
    filterAll: "All",
    filterSuccess: "Success",
    filterFailed: "Failed",
    filterWarning: "Warning",
    keysCount: "Keys",
    formatWarning: "Some keys do not match expected format (warning only)",
    limitWarning: "Limit reached, extra keys will be skipped",
    customBaseUrl: "Base URL",
    customPath: "Path",
    customMethod: "Method",
    customAuthType: "Auth type",
    customHeader: "Header name",
    customQuery: "Query param",
    customSuccess: "Success codes",
    customDescription: "Use the Custom adapter to call your own endpoint and define how the key is passed.",
    customExampleTitle: "Example",
    customExampleBody:
      "Base URL: https://api.example.com\nPath: /v1/health\nMethod: GET\nAuth type: Header (X-API-Key)\nSuccess codes: 200, 204",
    exportPlainHint: "Full export saves keys in plain text.",
    noProcesses: "No active checks yet.",
    failedReadFile: "Failed to read file",
    failedStart: "Failed to start check",
    customBaseRequired: "Custom base URL is required",
    copyFullList: "Copy full list",
    validKeys: "Valid keys",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    statusRunning: "Running",
    formatLabel: "Format",
    totalLabel: "Total",
    latencyLabel: "Latency",
    avgLabel: "Avg",
    medianLabel: "Median",
    topReasonsLabel: "Top reasons",
    recommendationsLabel: "Recommendations",
    successLabel: "Success",
    invalidLabel: "Invalid",
    quotaLabel: "Quota",
    rateLimitedLabel: "Rate limited",
    networkLabel: "Network",
    unknownLabel: "Unknown",
    exportAcknowledge: "I understand the risk and have permission to export full keys",
    openAiOrgLabel: "OpenAI organization (optional)",
    hideFullKeys: "Hide full keys"
  },
  es: {
    appTitle: "API Key Health Checker",
    serviceLabel: "Servicio",
    networkOnline: "En línea",
    networkOffline: "Sin conexión",
    theme: "Tema",
    language: "Idioma",
    keysInputTitle: "Entrada de claves",
    keysInputHint: "Pega una clave por línea. Las líneas vacías se eliminan automáticamente.",
    importFile: "Importar archivo",
    encoding: "Codificación",
    dedupe: "Eliminar duplicados",
    serviceSettings: "Configuración del servicio",
    checkMethod: "Método de verificación",
    methodAuthOnlyOption: "Auth-only — solicitud ligera",
    methodQuotaOption: "Quota — verificación de cuota/uso",
    methodSampleOption: "Sample — solicitud mínima real",
    methodAuthOnlyHint: "Auth-only: solicitud ligera para validar acceso.",
    methodQuotaHint: "Quota: verificación de cuota/uso (OpenAI; puede no funcionar en algunas cuentas).",
    methodSampleHint: "Sample: solicitud mínima real, puede consumir cuota.",
    randomDelay: "Retraso aleatorio",
    randomDelayHint: "Mín/Máx en ms",
    jitter: "Jitter",
    concurrency: "Concurrencia",
    timeout: "Tiempo de espera (ms)",
    retries: "Reintentos",
    maxKeys: "Máx. claves por ejecución",
    maxRps: "Máx. solicitudes/seg (por proceso)",
    customSettings: "Servicio personalizado",
    startCheck: "Iniciar verificación",
    disclaimerTitle: "Antes de empezar",
    disclaimerBody:
      "Usa esta herramienta solo con claves que posees o tienes permiso explícito para probar. Las claves se almacenan en memoria de forma predeterminada.",
    disclaimerAccept: "Entiendo",
    processesTitle: "Verificaciones activas",
    processLimit: "Límite de procesos",
    clearProcesses: "Limpiar lista",
    clearProcessesTitle: "Limpiar lista",
    clearProcessesPrompt: "Hay verificaciones activas. ¿Detenerlas antes de limpiar la lista?",
    clearProcessesStop: "Detener y limpiar",
    clearProcessesKeep: "Limpiar sin detener",
    logs: "Registros",
    stats: "Estadísticas",
    summary: "Resumen",
    pause: "Pausa",
    resume: "Reanudar",
    stop: "Detener",
    exportMasked: "Exportar (enmascarado)",
    exportFull: "Exportar completo",
    confirmExport: "Exportar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    searchKey: "Buscar por clave",
    filterAll: "Todas",
    filterSuccess: "Éxito",
    filterFailed: "Fallidas",
    filterWarning: "Advertencias",
    keysCount: "Claves",
    formatWarning: "Algunas claves no coinciden con el formato esperado (solo advertencia)",
    limitWarning: "Límite alcanzado, se omitirán claves adicionales",
    customBaseUrl: "URL base",
    customPath: "Ruta",
    customMethod: "Método",
    customAuthType: "Tipo de autenticación",
    customHeader: "Nombre del encabezado",
    customQuery: "Parámetro de consulta",
    customSuccess: "Códigos de éxito",
    customDescription:
      "Usa el adaptador Custom para llamar tu propio endpoint y definir cómo se envía la clave.",
    customExampleTitle: "Ejemplo",
    customExampleBody:
      "URL base: https://api.example.com\nRuta: /v1/health\nMétodo: GET\nTipo de autenticación: Header (X-API-Key)\nCódigos de éxito: 200, 204",
    exportPlainHint: "La exportación completa guarda las claves en texto plano.",
    noProcesses: "Aún no hay verificaciones activas.",
    failedReadFile: "No se pudo leer el archivo",
    failedStart: "No se pudo iniciar la verificación",
    customBaseRequired: "Se requiere la URL base personalizada",
    copyFullList: "Copiar lista completa",
    validKeys: "Claves válidas",
    statusCompleted: "Completado",
    statusCancelled: "Cancelado",
    statusRunning: "En curso",
    formatLabel: "Formato",
    totalLabel: "Total",
    latencyLabel: "Latencia",
    avgLabel: "Promedio",
    medianLabel: "Mediana",
    topReasonsLabel: "Principales motivos",
    recommendationsLabel: "Recomendaciones",
    successLabel: "Éxito",
    invalidLabel: "Inválidas",
    quotaLabel: "Cuota",
    rateLimitedLabel: "Límite de tasa",
    networkLabel: "Red",
    unknownLabel: "Desconocido",
    exportAcknowledge: "Entiendo el riesgo y confirmo que tengo permiso para exportar las claves completas",
    openAiOrgLabel: "Organización OpenAI (opcional)",
    hideFullKeys: "Ocultar claves completas"
  },
  ru: {
    appTitle: "API Key Health Checker",
    serviceLabel: "Сервис",
    networkOnline: "Онлайн",
    networkOffline: "Оффлайн",
    theme: "Тема",
    language: "Язык",
    keysInputTitle: "Ввод ключей",
    keysInputHint: "Вставьте ключи построчно. Пустые строки удаляются автоматически.",
    importFile: "Импорт файла",
    encoding: "Кодировка",
    dedupe: "Удалить дубликаты",
    serviceSettings: "Настройки сервиса",
    checkMethod: "Метод проверки",
    methodAuthOnlyOption: "Auth-only — лёгкий запрос",
    methodQuotaOption: "Quota — проверка квоты/биллинга",
    methodSampleOption: "Sample — минимальный реальный запрос",
    methodAuthOnlyHint: "Auth-only: лёгкий запрос для проверки доступа.",
    methodQuotaHint: "Quota: проверка квоты/биллинга (OpenAI; может не работать для некоторых ключей).",
    methodSampleHint: "Sample: минимальный реальный запрос, может тратить квоту.",
    randomDelay: "Случайная задержка",
    randomDelayHint: "Мин/Макс в мс",
    jitter: "Джиттер",
    concurrency: "Параллельность",
    timeout: "Таймаут (мс)",
    retries: "Повторы",
    maxKeys: "Макс. ключей за запуск",
    maxRps: "Макс. запросов/сек (на процесс)",
    customSettings: "Пользовательский сервис",
    startCheck: "Запустить проверку",
    disclaimerTitle: "Перед началом",
    disclaimerBody:
      "Используйте инструмент только с ключами, которыми вы владеете или имеете право пользоваться. Ключи хранятся только в памяти по умолчанию.",
    disclaimerAccept: "Понимаю",
    processesTitle: "Запущенные проверки",
    processLimit: "Лимит процессов",
    clearProcesses: "Очистить список",
    clearProcessesTitle: "Очистить список",
    clearProcessesPrompt: "Есть активные проверки. Остановить их перед очисткой списка?",
    clearProcessesStop: "Остановить и очистить",
    clearProcessesKeep: "Очистить без остановки",
    logs: "Логи",
    stats: "Статистика",
    summary: "Сводка",
    pause: "Пауза",
    resume: "Продолжить",
    stop: "Стоп",
    exportMasked: "Экспортировать (маскировано)",
    exportFull: "Экспортировать полностью",
    confirmExport: "Экспортировать",
    cancel: "Отмена",
    confirm: "Подтвердить",
    searchKey: "Поиск по ключу",
    filterAll: "Все",
    filterSuccess: "Успешные",
    filterFailed: "С ошибками",
    filterWarning: "Предупреждения",
    keysCount: "Ключей",
    formatWarning: "Часть ключей не соответствует формату (только предупреждение)",
    limitWarning: "Достигнут лимит, лишние ключи пропущены",
    customBaseUrl: "Базовый URL",
    customPath: "Путь",
    customMethod: "Метод",
    customAuthType: "Тип авторизации",
    customHeader: "Имя заголовка",
    customQuery: "Параметр запроса",
    customSuccess: "Коды успеха",
    customDescription:
      "Используйте Custom адаптер, чтобы обращаться к своему эндпоинту и задать способ передачи ключа.",
    customExampleTitle: "Пример",
    customExampleBody:
      "Base URL: https://api.example.com\nПуть: /v1/health\nМетод: GET\nТип авторизации: Header (X-API-Key)\nКоды успеха: 200, 204",
    exportPlainHint: "Полный экспорт сохраняет ключи в открытом виде.",
    noProcesses: "Пока нет активных проверок.",
    failedReadFile: "Не удалось прочитать файл",
    failedStart: "Не удалось запустить проверку",
    customBaseRequired: "Нужно указать базовый URL",
    copyFullList: "Скопировать полный список",
    validKeys: "Валидные ключи",
    statusCompleted: "Завершено",
    statusCancelled: "Отменено",
    statusRunning: "В процессе",
    formatLabel: "Формат",
    totalLabel: "Всего",
    latencyLabel: "Задержка",
    avgLabel: "Средняя",
    medianLabel: "Медиана",
    topReasonsLabel: "Топ причин",
    recommendationsLabel: "Рекомендации",
    successLabel: "Успешные",
    invalidLabel: "Неверные",
    quotaLabel: "Квота",
    rateLimitedLabel: "Лимит",
    networkLabel: "Сеть",
    unknownLabel: "Неизвестно",
    exportAcknowledge: "Понимаю риск и подтверждаю право экспорта полных ключей",
    openAiOrgLabel: "OpenAI организация (опционально)",
    hideFullKeys: "Скрывать полные ключи"
  }
};

export function t(locale: Locale, key: CopyKey) {
  return copy[locale][key];
}
