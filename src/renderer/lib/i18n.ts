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
  | "jitterHint"
  | "concurrency"
  | "concurrencyHint"
  | "timeout"
  | "timeoutHint"
  | "timeoutTooltip"
  | "retries"
  | "retriesHint"
  | "maxKeys"
  | "maxRps"
  | "maxKeysHint"
  | "maxRpsHint"
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
  | "followLogs"
  | "stats"
  | "summary"
  | "pause"
  | "resume"
  | "stop"
  | "removeProcess"
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
  | "copyTypeList"
  | "validKeys"
  | "statusCompleted"
  | "statusCancelled"
  | "statusRunning"
  | "clearProxyList"
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
  | "methodSampleHint"
  | "proxyInputTitle"
  | "proxyInputHint"
  | "proxyCount"
  | "proxyFormatWarning"
  | "proxyLimitWarning"
  | "proxyAggregatorsTitle"
  | "proxyAggregatorsHint"
  | "proxyAggregatorsFailed"
  | "proxyAggregatorsLoading"
  | "proxyAggregatorsAddHttp"
  | "proxyAggregatorsAddHttps"
  | "proxyAggregatorsAddSocks4"
  | "proxyAggregatorsAddSocks5"
  | "proxyAggregatorsClear"
  | "proxyAggregatorsCancel"
  | "proxyListEmpty"
  | "proxyTypesLabel"
  | "proxySpeedTooltip"
  | "proxySpeedHint"
  | "proxyTypeLabel"
  | "proxySpeedLabel"
  | "proxyCheckModeLabel"
  | "proxyModeValidity"
  | "proxyModeUrl"
  | "proxyTargetUrlLabel"
  | "proxyHtmlCheckLabel"
  | "proxyHtmlSearchLabel"
  | "proxyHtmlMaxKbLabel"
  | "proxyHtmlMaxKbHint"
  | "proxyHtmlAddText"
  | "proxyHtmlSearchOrHint"
  | "proxyHeadlessLabel"
  | "proxyHeadlessHint"
  | "proxyPresetLight"
  | "proxyPresetMedium"
  | "proxyPresetHard"
  | "proxyPresetExtreme"
  | "proxyMoveToList"
  | "proxyMoveToListHint"
  | "proxyScreenshotLabel"
  | "proxyScreenshotHint"
  | "proxyScreenshotChooseFolder"
  | "proxyScreenshotChoosingFolder"
  | "proxyScreenshotFolderEmpty"
  | "proxyScreenshotMaxFiles"
  | "proxyScreenshotAutoDelete"
  | "proxyScreenshotIncludeFailed"
  | "searchProxy"
  | "validProxies"
  | "maxProxies";

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
    jitterHint: "Adds small randomness to delays.",
    concurrency: "Concurrency",
    concurrencyHint: "Parallel checks per process.",
    timeout: "Timeout (ms)",
    timeoutHint: "Hard limit for connect + response. When reached, the request is aborted.",
    timeoutTooltip: "Hard cutoff; keep it above proxy speed.",
    retries: "Retries",
    retriesHint: "Extra attempts on failure.",
    maxKeys: "Max keys per run",
    maxRps: "Max requests/sec (per-process)",
    maxKeysHint: "Limit items per run.",
    maxRpsHint: "Requests per second per process.",
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
    followLogs: "Follow",
    stats: "Stats",
    summary: "Summary",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    removeProcess: "Remove",
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
    copyTypeList: "Copy list",
    validKeys: "Valid keys",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    statusRunning: "Running",
    clearProxyList: "Clear",
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
    hideFullKeys: "Hide full keys",
    proxyInputTitle: "Proxy list",
    proxyInputHint: "Paste one proxy per line. Format: USER:PASS@IP:PORT or IP:PORT.",
    proxyCount: "Proxies",
    proxyFormatWarning: "Some proxies do not match expected format (warning only)",
    proxyLimitWarning: "Limit reached, extra proxies will be skipped",
    proxyAggregatorsTitle: "Aggregator URLs",
    proxyAggregatorsHint:
      "One URL per line. Lines starting with # are ignored. Loaded on start and merged with manual list.",
    proxyAggregatorsFailed: "Failed to load aggregators",
    proxyAggregatorsLoading: "Loading aggregators...",
    proxyAggregatorsAddHttp: "Add HTTP",
    proxyAggregatorsAddHttps: "Add HTTPS",
    proxyAggregatorsAddSocks4: "Add SOCKS4",
    proxyAggregatorsAddSocks5: "Add SOCKS5",
    proxyAggregatorsClear: "Clear",
    proxyAggregatorsCancel: "Cancel",
    proxyListEmpty: "Proxy list is empty",
    proxyTypesLabel: "Proxy types",
    proxySpeedTooltip: "Soft latency limit; if exceeded, result becomes too_slow.",
    proxySpeedHint:
      "Soft threshold for total check time. Marks too_slow even if the response arrives before timeout.",
    proxyTypeLabel: "Type",
    proxySpeedLabel: "Proxy speed (ms)",
    proxyCheckModeLabel: "Check mode",
    proxyModeValidity: "Validity",
    proxyModeUrl: "URL access",
    proxyTargetUrlLabel: "Target URL",
    proxyHtmlCheckLabel: "Search text in HTML",
    proxyHtmlSearchLabel: "Text to find in HTML",
    proxyHtmlMaxKbLabel: "HTML scan limit (KB)",
    proxyHtmlMaxKbHint: "Only for non-headless checks. Stops reading after N KB.",
    proxyHtmlAddText: "Add text",
    proxyHtmlSearchOrHint: "Match if any text is found (OR). Stops after the first hit.",
    proxyHeadlessLabel: "Headless browser",
    proxyHeadlessHint: "Full page load with JS; slower and heavier.",
    proxyPresetLight: "Light",
    proxyPresetMedium: "Medium (recommended)",
    proxyPresetHard: "Hard",
    proxyPresetExtreme: "Extreme",
    proxyMoveToList: "Move to Proxy list",
    proxyMoveToListHint: "For re-checking in another mode.",
    proxyScreenshotLabel: "Screenshot",
    proxyScreenshotHint: "Save a compressed page snapshot.",
    proxyScreenshotChooseFolder: "Choose folder",
    proxyScreenshotChoosingFolder: "Selecting folder...",
    proxyScreenshotFolderEmpty: "No folder selected",
    proxyScreenshotMaxFiles: "Max files in folder",
    proxyScreenshotAutoDelete: "Auto-delete oldest",
    proxyScreenshotIncludeFailed: "Include failed",
    searchProxy: "Search by proxy",
    validProxies: "Valid proxies",
    maxProxies: "Max proxies per run"
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
    jitterHint: "Añade variación a los retrasos.",
    concurrency: "Concurrencia",
    concurrencyHint: "Verificaciones en paralelo por proceso.",
    timeout: "Tiempo de espera (ms)",
    timeoutHint: "Límite duro de conexión y respuesta. Al alcanzarse, se aborta.",
    timeoutTooltip: "Corte duro; mantenlo por encima de la velocidad del proxy.",
    retries: "Reintentos",
    retriesHint: "Intentos extra si falla.",
    maxKeys: "Máx. claves por ejecución",
    maxRps: "Máx. solicitudes/seg (por proceso)",
    maxKeysHint: "Limita elementos por ejecución.",
    maxRpsHint: "Solicitudes por segundo por proceso.",
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
    followLogs: "Seguir",
    stats: "Estadísticas",
    summary: "Resumen",
    pause: "Pausa",
    resume: "Reanudar",
    stop: "Detener",
    removeProcess: "Eliminar",
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
    copyTypeList: "Copiar lista",
    validKeys: "Claves válidas",
    statusCompleted: "Completado",
    statusCancelled: "Cancelado",
    statusRunning: "En curso",
    clearProxyList: "Limpiar",
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
    hideFullKeys: "Ocultar claves completas",
    proxyInputTitle: "Lista de proxies",
    proxyInputHint: "Pega un proxy por línea. Formato: USER:PASS@IP:PORT o IP:PORT.",
    proxyCount: "Proxies",
    proxyFormatWarning: "Algunos proxies no coinciden con el formato esperado (solo advertencia)",
    proxyLimitWarning: "Límite alcanzado, se omitirán proxies adicionales",
    proxyAggregatorsTitle: "URLs de agregadores",
    proxyAggregatorsHint:
      "Una URL por línea. Las líneas con # se ignoran. Se cargan al iniciar y se fusionan con la lista manual.",
    proxyAggregatorsFailed: "No se pudieron cargar los agregadores",
    proxyAggregatorsLoading: "Cargando agregadores...",
    proxyAggregatorsAddHttp: "Agregar HTTP",
    proxyAggregatorsAddHttps: "Agregar HTTPS",
    proxyAggregatorsAddSocks4: "Agregar SOCKS4",
    proxyAggregatorsAddSocks5: "Agregar SOCKS5",
    proxyAggregatorsClear: "Limpiar",
    proxyAggregatorsCancel: "Cancelar",
    proxyListEmpty: "La lista de proxies está vacía",
    proxyTypesLabel: "Tipos de proxy",
    proxySpeedTooltip: "Límite suave de latencia; si se supera, resultado too_slow.",
    proxySpeedHint:
      "Umbral suave del tiempo total. Marca too_slow incluso si llega antes del timeout.",
    proxyTypeLabel: "Tipo",
    proxySpeedLabel: "Velocidad del proxy (ms)",
    proxyCheckModeLabel: "Modo de verificación",
    proxyModeValidity: "Validez",
    proxyModeUrl: "Acceso a URL",
    proxyTargetUrlLabel: "URL objetivo",
    proxyHtmlCheckLabel: "Buscar texto en HTML",
    proxyHtmlSearchLabel: "Texto a buscar en HTML",
    proxyHtmlMaxKbLabel: "Límite de HTML (KB)",
    proxyHtmlMaxKbHint: "Solo para no headless. Detiene la lectura tras N KB.",
    proxyHtmlAddText: "Agregar texto",
    proxyHtmlSearchOrHint: "Es válido si se encuentra cualquiera (OR). Se detiene en la primera coincidencia.",
    proxyHeadlessLabel: "Navegador headless",
    proxyHeadlessHint: "Carga completa con JS; más lento y pesado.",
    proxyPresetLight: "Ligera",
    proxyPresetMedium: "Media (recomendada)",
    proxyPresetHard: "Dura",
    proxyPresetExtreme: "Extrema",
    proxyMoveToList: "Mover a la lista de proxies",
    proxyMoveToListHint: "Para volver a verificar en otro modo.",
    proxyScreenshotLabel: "Captura",
    proxyScreenshotHint: "Guarda una captura comprimida.",
    proxyScreenshotChooseFolder: "Elegir carpeta",
    proxyScreenshotChoosingFolder: "Seleccionando carpeta...",
    proxyScreenshotFolderEmpty: "Ninguna carpeta seleccionada",
    proxyScreenshotMaxFiles: "Máx. archivos en carpeta",
    proxyScreenshotAutoDelete: "Eliminar las más antiguas",
    proxyScreenshotIncludeFailed: "Incluir fallidas",
    searchProxy: "Buscar por proxy",
    validProxies: "Proxies válidos",
    maxProxies: "Máx. proxies por ejecución"
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
    jitterHint: "Добавляет разброс к задержкам.",
    concurrency: "Параллельность",
    concurrencyHint: "Параллельные проверки на процесс.",
    timeout: "Таймаут (мс)",
    timeoutHint: "Жёсткий лимит на подключение и ответ. По достижении запрос прерывается.",
    timeoutTooltip: "Жёсткая отсечка; держите выше скорости прокси.",
    retries: "Повторы",
    retriesHint: "Доп. попытки при ошибке.",
    maxKeys: "Макс. ключей за запуск",
    maxRps: "Макс. запросов/сек (на процесс)",
    maxKeysHint: "Лимит количества за запуск.",
    maxRpsHint: "Запросов в секунду на процесс.",
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
    followLogs: "Следить",
    stats: "Статистика",
    summary: "Сводка",
    pause: "Пауза",
    resume: "Продолжить",
    stop: "Стоп",
    removeProcess: "Удалить",
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
    copyTypeList: "Скопировать список",
    validKeys: "Валидные ключи",
    statusCompleted: "Завершено",
    statusCancelled: "Отменено",
    statusRunning: "В процессе",
    clearProxyList: "Очистить",
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
    hideFullKeys: "Скрывать полные ключи",
    proxyInputTitle: "Список прокси",
    proxyInputHint: "Вставьте прокси построчно. Формат: USER:PASS@IP:PORT или IP:PORT.",
    proxyCount: "Прокси",
    proxyFormatWarning: "Часть прокси не соответствует формату (только предупреждение)",
    proxyLimitWarning: "Достигнут лимит, лишние прокси пропущены",
    proxyAggregatorsTitle: "URL агрегаторов",
    proxyAggregatorsHint:
      "Один URL на строку. Строки с # игнорируются. Загружаются при старте и объединяются с ручным списком.",
    proxyAggregatorsFailed: "Не удалось загрузить агрегаторы",
    proxyAggregatorsLoading: "Загрузка агрегаторов...",
    proxyAggregatorsAddHttp: "Добавить HTTP",
    proxyAggregatorsAddHttps: "Добавить HTTPS",
    proxyAggregatorsAddSocks4: "Добавить SOCKS4",
    proxyAggregatorsAddSocks5: "Добавить SOCKS5",
    proxyAggregatorsClear: "Очистить",
    proxyAggregatorsCancel: "Отменить",
    proxyListEmpty: "Список прокси пуст",
    proxyTypesLabel: "Типы прокси",
    proxySpeedTooltip: "Мягкий лимит задержки; при превышении результат too_slow.",
    proxySpeedHint:
      "Мягкий порог общего времени проверки. При превышении too_slow даже при успешном ответе.",
    proxyTypeLabel: "Тип",
    proxySpeedLabel: "Скорость прокси (мс)",
    proxyCheckModeLabel: "Тип проверки",
    proxyModeValidity: "Валидность",
    proxyModeUrl: "Доступ к URL",
    proxyTargetUrlLabel: "Целевой URL",
    proxyHtmlCheckLabel: "Поиск текста в HTML",
    proxyHtmlSearchLabel: "Текст для поиска в HTML",
    proxyHtmlMaxKbLabel: "Лимит HTML (КБ)",
    proxyHtmlMaxKbHint: "Только без headless. Останавливаем чтение после N КБ.",
    proxyHtmlAddText: "Добавить текст",
    proxyHtmlSearchOrHint: "Совпадение по ИЛИ: если найден любой текст, проверка успешна.",
    proxyHeadlessLabel: "Headless браузер",
    proxyHeadlessHint: "Полная загрузка страницы с JS; медленнее и тяжелее.",
    proxyPresetLight: "Лёгкая",
    proxyPresetMedium: "Средняя (рекоменд.)",
    proxyPresetHard: "Жёсткая",
    proxyPresetExtreme: "Экстремальная",
    proxyMoveToList: "Переместить в Proxy list",
    proxyMoveToListHint: "Для повторной проверки в другом режиме.",
    proxyScreenshotLabel: "Скриншот",
    proxyScreenshotHint: "Сохранять сжатый снимок страницы.",
    proxyScreenshotChooseFolder: "Выбрать папку",
    proxyScreenshotChoosingFolder: "Выбор папки...",
    proxyScreenshotFolderEmpty: "Папка не выбрана",
    proxyScreenshotMaxFiles: "Макс. файлов в папке",
    proxyScreenshotAutoDelete: "Удалять самые старые",
    proxyScreenshotIncludeFailed: "Сохранять невалидные",
    searchProxy: "Поиск по прокси",
    validProxies: "Валидные прокси",
    maxProxies: "Макс. прокси за запуск"
  }
};

export function t(locale: Locale, key: CopyKey) {
  return copy[locale][key];
}
