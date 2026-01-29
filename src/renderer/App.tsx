import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CheckStatus,
  CustomServiceConfig,
  ExportFormat,
  ProcessSettings,
  ProcessStatus,
  ReportResultItem,
  ServiceId
} from "../shared/types";
import { AppHeader } from "./components/AppHeader";
import { KeysInputPanel } from "./components/KeysInputPanel";
import { Modal } from "./components/Modal";
import { ProcessesSection } from "./components/ProcessesSection";
import { ServiceSelector } from "./components/ServiceSelector";
import { ServiceSettingsPanel } from "./components/ServiceSettingsPanel";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { t, type Locale } from "./lib/i18n";
import { parseKeysByExtension, parseKeysFromText } from "./lib/keys";
import {
  expandProxyKeys,
  mergeProxyLists,
  normalizeProxyLine,
  parseAggregatorUrls,
  parseProxyText
} from "./lib/proxy";
import type { ExportDialogState, ProcessStats, ProcessUI } from "./lib/processTypes";
import { buildReportPayload } from "./lib/report";
import { getServiceDefinition } from "./lib/services";

const MAX_LOG_ITEMS = 2000;

const DEFAULT_PROXY_CONCURRENCY = Math.min(
  64,
  Math.max(
    16,
    ((typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 4) || 4) * 4
  )
);

const DEFAULT_PROXY_SETTINGS = {
  types: ["http", "https", "socks4", "socks5"],
  speedLimitMs: 5000,
  checkMode: "validity",
  targetUrl: "https://example.com/",
  htmlCheck: false,
  htmlCheckText: "Example Domain"
} satisfies NonNullable<ProcessSettings["proxy"]>;

const DEFAULT_PROXY_AGGREGATORS: string[] = [];

const DEFAULT_SETTINGS: ProcessSettings = {
  method: "auth_only",
  randomDelay: {
    minMs: 200,
    maxMs: 1200,
    jitter: true
  },
  concurrency: 3,
  timeoutMs: 15000,
  retries: 2,
  perProcessMaxRps: 3,
  openAiOrgId: ""
};

const DEFAULT_PROXY_PROCESS_SETTINGS: ProcessSettings = {
  method: "auth_only",
  randomDelay: {
    minMs: 0,
    maxMs: 0,
    jitter: false
  },
  concurrency: DEFAULT_PROXY_CONCURRENCY,
  timeoutMs: 12000,
  retries: 0,
  perProcessMaxRps: 200,
  openAiOrgId: "",
  proxy: DEFAULT_PROXY_SETTINGS
};

const DEFAULT_CUSTOM_CONFIG: CustomServiceConfig = {
  baseUrl: "",
  path: "/",
  method: "GET",
  authType: "header",
  headerName: "X-API-Key",
  queryParam: "key",
  successStatusCodes: [200]
};

function createStats(): ProcessStats {
  return {
    success: 0,
    invalid: 0,
    quota: 0,
    rateLimited: 0,
    network: 0,
    unknown: 0,
    latencies: []
  };
}

function updateStats(stats: ProcessStats, status: CheckStatus, latencyMs: number) {
  stats.latencies.push(latencyMs);
  if (status === "OK") {
    stats.success += 1;
  } else if (status === "INVALID") {
    stats.invalid += 1;
  } else if (status === "QUOTA_EXCEEDED") {
    stats.quota += 1;
  } else if (status === "RATE_LIMITED") {
    stats.rateLimited += 1;
  } else if (status === "NETWORK_ERROR") {
    stats.network += 1;
  } else {
    stats.unknown += 1;
  }
}

function extensionFromPath(filePath: string) {
  const index = filePath.lastIndexOf(".");
  if (index === -1) {
    return ".txt";
  }
  return filePath.slice(index);
}

function parseSuccessCodesInput(input: string) {
  return input
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number(token))
    .filter((code) => Number.isInteger(code) && code >= 100 && code <= 599);
}

function isActiveProcess(status: ProcessStatus) {
  return status === "Running" || status === "Paused";
}

function applyProcessLimit(processes: ProcessUI[], limit: number) {
  if (limit <= 0 || processes.length <= limit) {
    return processes;
  }

  const activeCount = processes.filter((process) => isActiveProcess(process.status)).length;
  const finishedSlots = Math.max(0, limit - activeCount);
  if (finishedSlots === 0) {
    return processes.filter((process) => isActiveProcess(process.status));
  }

  const next: ProcessUI[] = [];
  let finishedKept = 0;
  for (const process of processes) {
    if (isActiveProcess(process.status)) {
      next.push(process);
    } else if (finishedKept < finishedSlots) {
      next.push(process);
      finishedKept += 1;
    }
  }
  return next;
}

export default function App() {
  const online = useNetworkStatus();
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("akhc_locale");
    if (saved === "en" || saved === "ru" || saved === "es") {
      return saved;
    }
    return "en";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("akhc_theme") as "light" | "dark" | null;
    return saved ?? "dark";
  });
  const [hideFullKeys, setHideFullKeys] = useState(() => {
    const saved = localStorage.getItem("akhc_hide_keys");
    if (saved === null) {
      return true;
    }
    return saved === "true";
  });
  const [appVersion, setAppVersion] = useState("0.0.0");
  const [selectedService, setSelectedService] = useState<ServiceId>("openai");
  const [apiSettings, setApiSettings] = useState<ProcessSettings>(DEFAULT_SETTINGS);
  const [proxyProcessSettings, setProxyProcessSettings] = useState<ProcessSettings>(
    DEFAULT_PROXY_PROCESS_SETTINGS
  );
  const [customConfig, setCustomConfig] = useState<CustomServiceConfig>(DEFAULT_CUSTOM_CONFIG);
  const [successCodesInput, setSuccessCodesInput] = useState("200");
  const [keyTexts, setKeyTexts] = useState<Record<ServiceId, string>>({
    openai: "",
    youtube: "",
    gemini: "",
    custom: "",
    proxy: ""
  });
  const [dedupeEnabled, setDedupeEnabled] = useState(true);
  const [encoding, setEncoding] = useState("utf-8");
  const [importInfoByService, setImportInfoByService] = useState<
    Record<ServiceId, string | null>
  >({
    openai: null,
    youtube: null,
    gemini: null,
    custom: null,
    proxy: null
  });
  const [importErrorByService, setImportErrorByService] = useState<
    Record<ServiceId, string | null>
  >({
    openai: null,
    youtube: null,
    gemini: null,
    custom: null,
    proxy: null
  });
  const [proxyAggregatorsText, setProxyAggregatorsText] = useState(() =>
    DEFAULT_PROXY_AGGREGATORS.join("\n")
  );
  const [proxyAggregatorErrors, setProxyAggregatorErrors] = useState<string[]>([]);
  const [proxyAggregatorsLoading, setProxyAggregatorsLoading] = useState(false);
  const [maxKeysPerRun, setMaxKeysPerRun] = useState(200);
  const [maxProxiesPerRun, setMaxProxiesPerRun] = useState(50000);
  const [processes, setProcesses] = useState<ProcessUI[]>([]);
  const [processLimit, setProcessLimit] = useState(50);
  const processLimitRef = useRef(processLimit);
  const proxyAggregatorsLoadingRef = useRef(false);
  const proxyAggregatorsRequestIdRef = useRef<string | null>(null);
  const [exportDialog, setExportDialog] = useState<ExportDialogState>({
    open: false,
    format: "csv",
    acknowledged: true
  });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem("akhc_disclaimer") === "accepted";
  });

  const serviceDefinition = useMemo(() => getServiceDefinition(selectedService), [selectedService]);
  const isProxyService = selectedService === "proxy";
  const activeSettings = isProxyService ? proxyProcessSettings : apiSettings;
  const setActiveSettings = isProxyService ? setProxyProcessSettings : setApiSettings;
  const maxItemsPerRun = isProxyService ? maxProxiesPerRun : maxKeysPerRun;
  const setMaxItemsPerRun = isProxyService ? setMaxProxiesPerRun : setMaxKeysPerRun;
  const keyText = keyTexts[selectedService] ?? "";
  const importInfo = importInfoByService[selectedService] ?? null;
  const importError = importErrorByService[selectedService] ?? null;
  const updateKeyText = (serviceId: ServiceId, value: string) => {
    setKeyTexts((prev) => ({ ...prev, [serviceId]: value }));
  };
  const updateImportInfo = (serviceId: ServiceId, value: string | null) => {
    setImportInfoByService((prev) => ({ ...prev, [serviceId]: value }));
  };
  const updateImportError = (serviceId: ServiceId, value: string | null) => {
    setImportErrorByService((prev) => ({ ...prev, [serviceId]: value }));
  };
  const setActiveKeyText = (value: string) => updateKeyText(selectedService, value);
  const setActiveImportError = (value: string | null) =>
    updateImportError(selectedService, value);
  const proxyAggregatorUrls = useMemo(
    () => (isProxyService ? parseAggregatorUrls(proxyAggregatorsText) : []),
    [isProxyService, proxyAggregatorsText]
  );
  const rawProxyEntries = useMemo(
    () => (isProxyService ? parseKeysFromText(keyText, false) : []),
    [isProxyService, keyText]
  );
  const normalizedProxyEntries = useMemo(() => {
    if (!isProxyService) {
      return [];
    }
    return rawProxyEntries
      .map(normalizeProxyLine)
      .filter((entry): entry is string => Boolean(entry));
  }, [isProxyService, rawProxyEntries]);
  const parsedKeys = useMemo(() => {
    if (isProxyService) {
      return mergeProxyLists(normalizedProxyEntries, []);
    }
    return parseKeysFromText(keyText, dedupeEnabled);
  }, [isProxyService, keyText, dedupeEnabled, normalizedProxyEntries]);
  const keysOverLimit = parsedKeys.length > maxItemsPerRun;
  const limitedKeys = isProxyService
    ? parsedKeys
    : keysOverLimit
      ? parsedKeys.slice(0, maxItemsPerRun)
      : parsedKeys;

  const invalidFormatCount = useMemo(() => {
    if (!serviceDefinition.keyPattern) {
      return 0;
    }
    if (isProxyService) {
      return rawProxyEntries.filter((key) => {
        const trimmed = key.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return false;
        }
        return !normalizeProxyLine(key);
      }).length;
    }
    return parsedKeys.filter((key) => !serviceDefinition.keyPattern?.test(key)).length;
  }, [parsedKeys, rawProxyEntries, serviceDefinition, isProxyService]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("akhc_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("akhc_hide_keys", String(hideFullKeys));
  }, [hideFullKeys]);

  useEffect(() => {
    localStorage.setItem("akhc_locale", locale);
  }, [locale]);

  useEffect(() => {
    processLimitRef.current = processLimit;
  }, [processLimit]);

  useEffect(() => {
    setProcesses((prev) => applyProcessLimit(prev, processLimit));
  }, [processLimit]);

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion).catch(() => setAppVersion("0.0.0"));
  }, []);

  useEffect(() => {
    const allowedMethods = serviceDefinition.checkMethods;
    if (!allowedMethods.includes(activeSettings.method)) {
      setActiveSettings((prev) => ({ ...prev, method: allowedMethods[0] }));
    }
  }, [serviceDefinition, activeSettings.method, setActiveSettings]);

  useEffect(() => {
    const offProgress = window.api.onProcessProgress((event) => {
      setProcesses((prev) =>
        prev.map((process) =>
          process.id === event.processId
            ? {
                ...process,
                processed: event.processed,
                total: event.total,
                status: event.status
              }
            : process
        )
      );
    });

    const offLog = window.api.onProcessLogEvent((event) => {
      setProcesses((prev) =>
        prev.map((process) => {
          if (process.id !== event.processId) {
            return process;
          }

          const keyFull = event.keyFull ?? process.keys[event.keyIndex] ?? "";
          const resultItem: ReportResultItem = {
            keyMasked: event.keyMasked,
            keyFull,
            status: event.result.status,
            httpStatus: event.result.httpStatus,
            latencyMs: event.result.latencyMs,
            errorCode: event.result.errorCode,
            errorMessage: event.result.errorMessage,
            checkedAt: event.result.checkedAt,
            proxyType: event.result.proxyType,
            checkMode: event.result.checkMode,
            targetUrl: event.result.targetUrl
          };

          const logs = [...process.logs, event].slice(-MAX_LOG_ITEMS);
          const results = [...process.results, resultItem];
          const stats = { ...process.stats, latencies: [...process.stats.latencies] };
          updateStats(stats, event.result.status, event.result.latencyMs);

          return {
            ...process,
            logs,
            results,
            stats
          };
        })
      );
    });

    const offCompleted = window.api.onProcessCompleted((event) => {
      setProcesses((prev) => {
        const next = prev.map((process) =>
          process.id === event.processId
            ? { ...process, finishedAt: event.finishedAt, status: event.status }
            : process
        );
        return applyProcessLimit(next, processLimitRef.current);
      });
    });

    return () => {
      offProgress();
      offLog();
      offCompleted();
    };
  }, []);

  async function handleImport() {
    const serviceId = selectedService;
    updateImportError(serviceId, null);
    try {
      const result = await window.api.openKeyFile({ encoding });
      if (result.error) {
        updateImportInfo(serviceId, null);
        updateImportError(serviceId, result.error || t(locale, "failedReadFile"));
        return;
      }
      if (result.canceled || !result.content || !result.filePath) {
        return;
      }
      const extension = extensionFromPath(result.filePath);
      const keys = parseKeysByExtension(result.content, extension, dedupeEnabled);
      const normalizedKeys = serviceId === "proxy"
        ? mergeProxyLists(
            keys.map(normalizeProxyLine).filter((entry): entry is string => Boolean(entry)),
            []
          )
        : keys;
      updateKeyText(serviceId, normalizedKeys.join("\n"));
      const countLabel = serviceId === "proxy" ? t(locale, "proxyCount") : t(locale, "keysCount");
      updateImportInfo(
        serviceId,
        `${normalizedKeys.length} ${countLabel.toLowerCase()} - ${result.filePath}`
      );
    } catch (error) {
      updateImportInfo(serviceId, null);
      updateImportError(serviceId, t(locale, "failedReadFile"));
    }
  }

  async function handleStart() {
    if (isProxyService && proxyAggregatorsLoadingRef.current) {
      return;
    }
    if (!limitedKeys.length && (!isProxyService || proxyAggregatorUrls.length === 0)) {
      return;
    }
    if (selectedService === "custom" && !customConfig.baseUrl.trim()) {
      setActiveImportError(t(locale, "customBaseRequired"));
      return;
    }

    const baseSettings = activeSettings;
    const proxySettings = baseSettings.proxy ?? DEFAULT_PROXY_SETTINGS;
    const preparedProxySettings = {
      ...DEFAULT_PROXY_SETTINGS,
      ...proxySettings,
      targetUrl: proxySettings.targetUrl?.trim() || DEFAULT_PROXY_SETTINGS.targetUrl,
      htmlCheck: proxySettings.checkMode === "url" && Boolean(proxySettings.htmlCheck),
      htmlCheckText:
        proxySettings.htmlCheckText?.trim() || DEFAULT_PROXY_SETTINGS.htmlCheckText
    };

    let keysForProcess = limitedKeys;
    let settingsForProcess = { ...baseSettings, proxy: undefined };
    if (isProxyService) {
      setProxyAggregatorErrors([]);
      let aggregatorProxies: string[] = [];
      if (proxyAggregatorUrls.length > 0) {
        proxyAggregatorsLoadingRef.current = true;
        const requestId = `agg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        proxyAggregatorsRequestIdRef.current = requestId;
        setProxyAggregatorsLoading(true);
        try {
          const response = await window.api.fetchProxyAggregators({
            urls: proxyAggregatorUrls,
            requestId
          });
          if (!response.cancelled) {
            const errors = response.results
              .filter((item) => item.error)
              .map((item) => `${item.url}: ${item.error}`);
            if (errors.length > 0) {
              setProxyAggregatorErrors(errors);
            }
            aggregatorProxies = response.results.flatMap((item) =>
              item.content ? parseProxyText(item.content) : []
            );
          }
        } catch {
          setProxyAggregatorErrors([t(locale, "proxyAggregatorsFailed")]);
        } finally {
          proxyAggregatorsLoadingRef.current = false;
          setProxyAggregatorsLoading(false);
          proxyAggregatorsRequestIdRef.current = null;
        }
      }

      const uniqueAggregatorProxies = mergeProxyLists(aggregatorProxies, []);
      const mergedProxies = mergeProxyLists(parsedKeys, uniqueAggregatorProxies);
      const limitedProxies = mergedProxies.slice(0, maxItemsPerRun);
      keysForProcess = expandProxyKeys(limitedProxies, preparedProxySettings.types);
      settingsForProcess = { ...baseSettings, proxy: preparedProxySettings };
      if (!keysForProcess.length) {
        setActiveImportError(t(locale, "proxyListEmpty"));
        return;
      }
    }

    const processIndex = processes.filter((proc) => proc.serviceId === selectedService).length + 1;
    const name = `${serviceDefinition.name} Check #${processIndex}`;
    const payload = {
      name,
      serviceId: selectedService,
      keys: keysForProcess,
      settings: settingsForProcess,
      customConfig: {
        ...customConfig,
        successStatusCodes: parseSuccessCodesInput(successCodesInput)
      }
    };

    window.api
      .startCheck(payload)
      .then((response) => {
        const newProcess: ProcessUI = {
          id: response.processId,
          name,
          serviceId: selectedService,
          startedAt: response.startedAt,
          status: "Running",
          processed: 0,
          total: keysForProcess.length,
          method: settingsForProcess.method,
          settings: settingsForProcess,
          keys: keysForProcess,
          logs: [],
          results: [],
          stats: createStats(),
          expanded: true,
          activeTab: "logs",
          logFilter: "all",
          search: "",
          followLogs: true
        };
        setProcesses((prev) => applyProcessLimit([newProcess, ...prev], processLimit));
      })
      .catch(() => {
        setActiveImportError(t(locale, "failedStart"));
      });
  }

  async function exportReport(process: ProcessUI, format: ExportFormat, includeFull: boolean) {
    const payload = buildReportPayload({
      appVersion,
      serviceId: process.serviceId,
      checkMethod: process.method,
      settings: process.settings,
      startedAt: process.startedAt,
      finishedAt: process.finishedAt ?? new Date().toISOString(),
      results: process.results.map((item) =>
        includeFull
          ? item
          : {
              ...item,
              keyFull: undefined
            }
      )
    });

    const suffix = includeFull ? "-full" : "";
    const fileName = `${process.serviceId}-${process.id}${suffix}.${format}`;
    await window.api.exportReport({
      processId: process.id,
      format,
      report: payload,
      defaultPath: fileName,
      includeFull
    });
  }

  async function exportFull(process: ProcessUI) {
    await exportReport(process, exportDialog.format, true);
    setExportDialog({ open: false, format: "csv", acknowledged: true });
  }

  function copyFull(process: ProcessUI) {
    const full = process.results
      .filter((item) => item.status === "OK")
      .map((item) => item.keyFull ?? "")
      .join("\n");
    navigator.clipboard.writeText(full).catch(() => undefined);
  }

  function toggleProcessExpanded(processId: string) {
    setProcesses((prev) =>
      prev.map((process) =>
        process.id === processId ? { ...process, expanded: !process.expanded } : process
      )
    );
  }

  function updateProcess(processId: string, patch: Partial<ProcessUI>) {
    setProcesses((prev) =>
      prev.map((process) => (process.id === processId ? { ...process, ...patch } : process))
    );
  }

  function removeProcess(processId: string) {
    setProcesses((prev) => {
      const process = prev.find((item) => item.id === processId);
      if (!process) {
        return prev;
      }
      if (isActiveProcess(process.status)) {
        window.api.stopProcess(processId);
      }
      return prev.filter((item) => item.id !== processId);
    });
  }

  function handleClearProcesses() {
    if (processes.length === 0) {
      return;
    }
    const hasActive = processes.some((process) => isActiveProcess(process.status));
    if (!hasActive) {
      setProcesses([]);
      return;
    }
    setClearDialogOpen(true);
  }

  function stopAndClearProcesses() {
    for (const process of processes) {
      if (isActiveProcess(process.status)) {
        window.api.stopProcess(process.id);
      }
    }
    setProcesses([]);
    setClearDialogOpen(false);
  }

  function clearFinishedProcesses() {
    setProcesses((prev) => prev.filter((process) => isActiveProcess(process.status)));
    setClearDialogOpen(false);
  }

  const startDisabled =
    (selectedService === "custom" && !customConfig.baseUrl.trim()) ||
    (isProxyService
      ? (proxyProcessSettings.proxy?.types.length ?? 0) === 0 ||
        (!parsedKeys.length && proxyAggregatorUrls.length === 0) ||
        proxyAggregatorsLoading
      : !limitedKeys.length);

  return (
    <div className="app-shell min-h-screen px-6 pb-16 pt-10">
      <Modal
        open={!disclaimerAccepted}
        title={t(locale, "disclaimerTitle")}
        actions={
          <button
            className="rounded-full bg-ink-900 px-6 py-2 text-sm font-semibold text-white shadow-glow"
            onClick={() => {
              localStorage.setItem("akhc_disclaimer", "accepted");
              setDisclaimerAccepted(true);
            }}
          >
            {t(locale, "disclaimerAccept")}
          </button>
        }
      >
        {t(locale, "disclaimerBody")}
      </Modal>

      <Modal
        open={exportDialog.open}
        title={t(locale, "exportFull")}
        actions={
          <>
            <button
              className="rounded-full border border-ink-200 px-4 py-2 text-sm"
              onClick={() => setExportDialog({ open: false, format: "csv", acknowledged: true })}
            >
              {t(locale, "cancel")}
            </button>
            <button
              className="rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-white"
              disabled={!exportDialog.acknowledged}
              onClick={() => {
                const process = processes.find((item) => item.id === exportDialog.processId);
                if (process) {
                  exportFull(process);
                }
              }}
            >
              {t(locale, "confirmExport")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p>{t(locale, "exportPlainHint")}</p>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-ink-500">{t(locale, "formatLabel")}</label>
            <select
              className="rounded-full border border-ink-200 bg-white/80 px-4 py-2"
              value={exportDialog.format}
              onChange={(event) =>
                setExportDialog((prev) => ({
                  ...prev,
                  format: event.target.value as ExportFormat
                }))
              }
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={clearDialogOpen}
        title={t(locale, "clearProcessesTitle")}
        actions={
          <>
            <button
              className="rounded-full border border-ink-200 px-4 py-2 text-sm"
              onClick={() => setClearDialogOpen(false)}
            >
              {t(locale, "cancel")}
            </button>
            <button
              className="rounded-full border border-ink-200 px-4 py-2 text-sm"
              onClick={clearFinishedProcesses}
            >
              {t(locale, "clearProcessesKeep")}
            </button>
            <button
              className="rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-white"
              onClick={stopAndClearProcesses}
            >
              {t(locale, "clearProcessesStop")}
            </button>
          </>
        }
      >
        {t(locale, "clearProcessesPrompt")}
      </Modal>

      <AppHeader
        locale={locale}
        theme={theme}
        online={online}
        onLocaleChange={setLocale}
        onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
      />

      <ServiceSelector
        locale={locale}
        selectedService={selectedService}
        onSelect={setSelectedService}
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <KeysInputPanel
          locale={locale}
          appVersion={appVersion}
          keyText={keyText}
          onKeyTextChange={setActiveKeyText}
          isProxy={isProxyService}
          dedupeEnabled={dedupeEnabled}
          onDedupeChange={setDedupeEnabled}
          parsedKeysCount={parsedKeys.length}
          invalidFormatCount={invalidFormatCount}
          keysOverLimit={keysOverLimit}
          encoding={encoding}
          onEncodingChange={setEncoding}
          onImport={handleImport}
          importInfo={importInfo}
          importError={importError}
          proxyAggregatorsText={proxyAggregatorsText}
          onProxyAggregatorsChange={setProxyAggregatorsText}
          proxyAggregatorErrors={proxyAggregatorErrors}
          proxyAggregatorsLoading={proxyAggregatorsLoading}
        />
        <ServiceSettingsPanel
          locale={locale}
          serviceDefinition={serviceDefinition}
          selectedService={selectedService}
          settings={activeSettings}
          setSettings={setActiveSettings}
          customConfig={customConfig}
          setCustomConfig={setCustomConfig}
          successCodesInput={successCodesInput}
          setSuccessCodesInput={setSuccessCodesInput}
          maxKeysPerRun={maxItemsPerRun}
          setMaxKeysPerRun={setMaxItemsPerRun}
          startDisabled={startDisabled}
          onStart={handleStart}
          proxyAggregatorsLoading={isProxyService && proxyAggregatorsLoading}
          onCancelProxyAggregators={() => {
            const requestId = proxyAggregatorsRequestIdRef.current;
            if (requestId) {
              window.api.cancelProxyAggregators({ requestId });
            }
          }}
        />
      </section>
      <ProcessesSection
        locale={locale}
        processes={processes}
        processLimit={processLimit}
        setProcessLimit={setProcessLimit}
        hideFullKeys={hideFullKeys}
        setHideFullKeys={setHideFullKeys}
        onClearProcesses={handleClearProcesses}
        onToggleExpanded={toggleProcessExpanded}
        onUpdateProcess={updateProcess}
        onPause={(processId) => window.api.pauseProcess(processId)}
        onResume={(processId) => window.api.resumeProcess(processId)}
        onStop={(processId) => window.api.stopProcess(processId)}
        onRemove={removeProcess}
        onCopyFull={copyFull}
        onExportMasked={(process, format) => exportReport(process, format, false)}
          onExportFullRequest={(processId) =>
            setExportDialog({
              open: true,
              format: "csv",
              acknowledged: true,
              processId
            })
          }
        />
    </div>
  );
}
