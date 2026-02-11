import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  CheckMethod,
  CustomServiceConfig,
  ProcessSettings,
  ProxyType,
  ServiceId
} from "../../shared/types";
import { t, type Locale } from "../lib/i18n";
import type { ServiceDefinition } from "../lib/services";
import { sanitizeNumber } from "../lib/number";

interface ServiceSettingsPanelProps {
  locale: Locale;
  serviceDefinition: ServiceDefinition;
  selectedService: ServiceId;
  settings: ProcessSettings;
  setSettings: Dispatch<SetStateAction<ProcessSettings>>;
  customConfig: CustomServiceConfig;
  setCustomConfig: Dispatch<SetStateAction<CustomServiceConfig>>;
  successCodesInput: string;
  setSuccessCodesInput: Dispatch<SetStateAction<string>>;
  maxKeysPerRun: number;
  setMaxKeysPerRun: Dispatch<SetStateAction<number>>;
  startDisabled: boolean;
  onStart: () => void;
  proxyAggregatorsLoading?: boolean;
  onCancelProxyAggregators?: () => void;
}

export function ServiceSettingsPanel({
  locale,
  serviceDefinition,
  selectedService,
  settings,
  setSettings,
  customConfig,
  setCustomConfig,
  successCodesInput,
  setSuccessCodesInput,
  maxKeysPerRun,
  setMaxKeysPerRun,
  startDisabled,
  onStart,
  proxyAggregatorsLoading,
  onCancelProxyAggregators
}: ServiceSettingsPanelProps) {
  const [selectingScreenshotFolder, setSelectingScreenshotFolder] = useState(false);
  const isProxyService = selectedService === "proxy";
  const methodHint =
    settings.method === "quota"
      ? t(locale, "methodQuotaHint")
      : settings.method === "sample"
        ? t(locale, "methodSampleHint")
        : t(locale, "methodAuthOnlyHint");
  const methodOptionLabel = (method: CheckMethod) => {
    if (method === "quota") {
      return t(locale, "methodQuotaOption");
    }
    if (method === "sample") {
      return t(locale, "methodSampleOption");
    }
    return t(locale, "methodAuthOnlyOption");
  };
  const timeoutMin = isProxyService ? 100 : 1000;

  const proxySettings = settings.proxy ?? {
    types: ["http", "https", "socks4", "socks5"],
    speedLimitMs: 2500,
    checkMode: "validity",
    targetUrl: "https://example.com/",
    htmlCheck: false,
    htmlCheckText: "Example Domain",
    htmlCheckTexts: [],
    htmlCheckMaxKb: 64,
    headlessBrowser: false,
    screenshotEnabled: false,
    screenshotFolder: "",
    screenshotMaxFiles: 200,
    screenshotAutoDelete: true,
    screenshotIncludeFailed: false
  };

  function toggleProxyType(type: ProxyType) {
    setSettings((prev) => {
      const current = prev.proxy ?? proxySettings;
      const hasType = current.types.includes(type);
      const nextTypes = hasType
        ? current.types.filter((entry) => entry !== type)
        : [...current.types, type];
      return {
        ...prev,
        proxy: {
          ...current,
          types: nextTypes
        }
      };
    });
  }

  function applyProxyPreset(preset: "light" | "medium" | "hard" | "extreme") {
    setSettings((prev) => {
      const current = prev.proxy ?? proxySettings;
      if (preset === "light") {
        return {
          ...prev,
          concurrency: 80,
          perProcessMaxRps: 100,
          proxy: {
            ...current,
            checkMode: "validity",
            htmlCheck: false,
            headlessBrowser: false,
            htmlCheckTexts: []
          }
        };
      }
      if (preset === "medium") {
        return {
          ...prev,
          concurrency: 48,
          perProcessMaxRps: 90,
          proxy: {
            ...current,
            checkMode: "url",
            targetUrl: "https://example.com/",
            htmlCheck: true,
            htmlCheckText: "Example Domain",
            headlessBrowser: false,
            htmlCheckTexts: []
          }
        };
      }
      if (preset === "hard") {
        return {
          ...prev,
          concurrency: 40,
          perProcessMaxRps: 70,
          proxy: {
            ...current,
            checkMode: "url",
            targetUrl: "https://www.google.com/",
            htmlCheck: true,
            htmlCheckText: "<title>Google</title>",
            headlessBrowser: false,
            htmlCheckTexts: []
          }
        };
      }
      return {
        ...prev,
        concurrency: 8,
        perProcessMaxRps: 8,
        timeoutMs: 10000,
        proxy: {
          ...current,
          checkMode: "url",
          targetUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          htmlCheck: true,
          htmlCheckText: "<title>Rick Astley",
          headlessBrowser: true,
          speedLimitMs: 10000,
          htmlCheckTexts: []
        }
      };
    });
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-800">{t(locale, "serviceSettings")}</h2>
        {isProxyService ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 font-semibold text-ink-600"
              type="button"
              onClick={() => applyProxyPreset("light")}
            >
              {t(locale, "proxyPresetLight")}
            </button>
            <button
              className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 font-semibold text-ink-600"
              type="button"
              onClick={() => applyProxyPreset("medium")}
            >
              {t(locale, "proxyPresetMedium")}
            </button>
            <button
              className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 font-semibold text-ink-600"
              type="button"
              onClick={() => applyProxyPreset("hard")}
            >
              {t(locale, "proxyPresetHard")}
            </button>
            <button
              className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 font-semibold text-ink-600"
              type="button"
              onClick={() => applyProxyPreset("extreme")}
            >
              {t(locale, "proxyPresetExtreme")}
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4">
        {!isProxyService ? (
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "checkMethod")}
            <select
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm"
              value={settings.method}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, method: event.target.value as CheckMethod }))
              }
            >
              {serviceDefinition.checkMethods.map((method) => (
                <option key={method} value={method}>
                  {methodOptionLabel(method)}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-normal text-ink-400">{methodHint}</span>
          </label>
        ) : null}
        {isProxyService ? (
          <div className="rounded-2xl border border-white/60 bg-white/60 p-4">
            <div className="text-xs font-semibold text-ink-500">
              {t(locale, "proxyTypesLabel")}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
              {(["http", "https", "socks4", "socks5"] as ProxyType[]).map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={proxySettings.types.includes(type)}
                    onChange={() => toggleProxyType(type)}
                  />
                  {type.toUpperCase()}
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-ink-500">
                <span className="inline-flex items-center gap-1">
                  {t(locale, "proxySpeedLabel")}
                  <span
                    className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] font-semibold text-ink-400"
                    aria-label={t(locale, "proxySpeedTooltip")}
                  >
                    ?
                    <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-ink-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                      {t(locale, "proxySpeedTooltip")}
                    </span>
                  </span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  value={proxySettings.speedLimitMs}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      proxy: {
                        ...proxySettings,
                        speedLimitMs: sanitizeNumber(
                          event.target.value,
                          proxySettings.speedLimitMs,
                          0
                        )
                      }
                    }))
                  }
                />
                <span className="mt-1 block text-xs font-normal text-ink-400">
                  {t(locale, "proxySpeedHint")}
                </span>
              </label>
              <label className="text-xs font-semibold text-ink-500">
                {t(locale, "proxyCheckModeLabel")}
                <select
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                  value={proxySettings.checkMode}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      proxy: {
                        ...proxySettings,
                        checkMode: event.target.value as typeof proxySettings.checkMode
                      }
                    }))
                  }
                >
                  <option value="validity">{t(locale, "proxyModeValidity")}</option>
                  <option value="url">{t(locale, "proxyModeUrl")}</option>
                </select>
              </label>
            </div>
            {proxySettings.checkMode === "url" ? (
              <>
                <label className="mt-3 block text-xs font-semibold text-ink-500">
                  {t(locale, "proxyTargetUrlLabel")}
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                    value={proxySettings.targetUrl}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        proxy: {
                          ...proxySettings,
                          targetUrl: event.target.value
                        }
                      }))
                    }
                  />
                </label>
                <label className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                  <input
                    type="checkbox"
                    checked={Boolean(proxySettings.htmlCheck)}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        proxy: {
                          ...proxySettings,
                          htmlCheck: event.target.checked,
                          headlessBrowser: event.target.checked
                            ? proxySettings.headlessBrowser
                            : false,
                          screenshotEnabled: event.target.checked
                            ? proxySettings.screenshotEnabled
                            : false
                        }
                      }))
                    }
                  />
                  <span className="font-semibold text-ink-500">
                    {t(locale, "proxyHtmlCheckLabel")}
                  </span>
                </label>
                {proxySettings.htmlCheck ? (
                  <>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-ink-500">
                        <span className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2">
                            <span>{t(locale, "proxyHtmlSearchLabel")}</span>
                            {proxySettings.headlessBrowser ? (
                              <span
                                className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] font-semibold text-ink-400"
                                aria-label={t(locale, "proxyHtmlSearchOrHint")}
                              >
                                ?
                                <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-52 rounded-lg bg-ink-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                                  {t(locale, "proxyHtmlSearchOrHint")}
                                </span>
                              </span>
                            ) : null}
                          </span>
                          {proxySettings.headlessBrowser ? (
                            <button
                              className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] text-ink-500"
                              type="button"
                              title={t(locale, "proxyHtmlAddText")}
                              aria-label={t(locale, "proxyHtmlAddText")}
                              onClick={() =>
                                setSettings((prev) => {
                                  const current = prev.proxy ?? proxySettings;
                                  const extras = current.htmlCheckTexts ?? [];
                                  if (extras.length >= 10) {
                                    return prev;
                                  }
                                  return {
                                    ...prev,
                                    proxy: {
                                      ...current,
                                      htmlCheckTexts: [...extras, ""]
                                    }
                                  };
                                })
                              }
                            >
                              +
                            </button>
                          ) : null}
                        </span>
                        <input
                          className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                          value={proxySettings.htmlCheckText ?? ""}
                          onChange={(event) =>
                            setSettings((prev) => ({
                              ...prev,
                              proxy: {
                                ...proxySettings,
                                htmlCheckText: event.target.value
                              }
                            }))
                          }
                        />
                      </label>
                      {!proxySettings.headlessBrowser ? (
                        <label className="text-xs font-semibold text-ink-500">
                          {t(locale, "proxyHtmlMaxKbLabel")}
                          <input
                            className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                            type="number"
                            min={1}
                            value={proxySettings.htmlCheckMaxKb ?? 64}
                            onChange={(event) =>
                              setSettings((prev) => ({
                                ...prev,
                                proxy: {
                                  ...proxySettings,
                                  htmlCheckMaxKb: sanitizeNumber(
                                    event.target.value,
                                    proxySettings.htmlCheckMaxKb ?? 64,
                                    1
                                  )
                                }
                              }))
                            }
                          />
                          <span className="mt-1 block text-xs font-normal text-ink-400">
                            {t(locale, "proxyHtmlMaxKbHint")}
                          </span>
                        </label>
                      ) : null}
                    </div>
                    {proxySettings.headlessBrowser && (proxySettings.htmlCheckTexts ?? []).length > 0 ? (
                      <div className="mt-3 grid gap-3">
                        {(proxySettings.htmlCheckTexts ?? []).map((value, index) => (
                          <label key={`html-check-${index}`} className="text-xs font-semibold text-ink-500">
                            <span className="flex items-center gap-2">
                              <span>{t(locale, "proxyHtmlSearchLabel")}</span>
                              <span className="text-[10px] font-normal text-ink-400">
                                #{index + 2}
                              </span>
                            </span>
                            <input
                              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                              value={value}
                              onChange={(event) =>
                                setSettings((prev) => {
                                  const current = prev.proxy ?? proxySettings;
                                  const next = [...(current.htmlCheckTexts ?? [])];
                                  next[index] = event.target.value;
                                  return {
                                    ...prev,
                                    proxy: {
                                      ...current,
                                      htmlCheckTexts: next
                                    }
                                  };
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-500">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(proxySettings.headlessBrowser)}
                          onChange={(event) =>
                            setSettings((prev) => ({
                              ...prev,
                              proxy: {
                                ...proxySettings,
                                headlessBrowser: event.target.checked,
                                screenshotEnabled: event.target.checked
                                  ? proxySettings.screenshotEnabled
                                  : false
                              }
                            }))
                          }
                        />
                        <span className="font-semibold text-ink-500">
                          {t(locale, "proxyHeadlessLabel")}
                        </span>
                        <span className="text-xs font-normal text-ink-400">
                          {t(locale, "proxyHeadlessHint")}
                        </span>
                      </label>
                      {proxySettings.headlessBrowser ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(proxySettings.screenshotEnabled)}
                            onChange={(event) =>
                              setSettings((prev) => ({
                                ...prev,
                                proxy: {
                                  ...proxySettings,
                                  screenshotEnabled: event.target.checked
                                }
                              }))
                            }
                          />
                          <span className="font-semibold text-ink-500">
                            {t(locale, "proxyScreenshotLabel")}
                          </span>
                          <span className="text-xs font-normal text-ink-400">
                            {t(locale, "proxyScreenshotHint")}
                          </span>
                        </label>
                      ) : null}
                    </div>
                    {proxySettings.headlessBrowser && proxySettings.screenshotEnabled ? (
                      <div className="mt-3 grid gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                          <button
                            className={`rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] text-ink-500 ${
                              selectingScreenshotFolder ? "cursor-wait opacity-60" : ""
                            }`}
                            type="button"
                            disabled={selectingScreenshotFolder}
                            onClick={() => {
                              if (selectingScreenshotFolder) {
                                return;
                              }
                              setSelectingScreenshotFolder(true);
                              void (async () => {
                                try {
                                  await new Promise((resolve) => setTimeout(resolve, 0));
                                  const result = await window.api.selectDirectory({
                                    title: t(locale, "proxyScreenshotChooseFolder")
                                  });
                                  if (!result.canceled && result.path) {
                                    setSettings((prev) => ({
                                      ...prev,
                                      proxy: {
                                        ...proxySettings,
                                        screenshotFolder: result.path
                                      }
                                    }));
                                  }
                                } finally {
                                  setSelectingScreenshotFolder(false);
                                }
                              })();
                            }}
                          >
                            {selectingScreenshotFolder
                              ? t(locale, "proxyScreenshotChoosingFolder")
                              : t(locale, "proxyScreenshotChooseFolder")}
                          </button>
                          <span className="text-xs text-ink-400">
                            {proxySettings.screenshotFolder
                              ? proxySettings.screenshotFolder
                              : t(locale, "proxyScreenshotFolderEmpty")}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-ink-500">
                            {t(locale, "proxyScreenshotMaxFiles")}
                            <input
                              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
                              type="number"
                              min={1}
                              value={proxySettings.screenshotMaxFiles ?? 200}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  proxy: {
                                    ...proxySettings,
                                    screenshotMaxFiles: sanitizeNumber(
                                      event.target.value,
                                      proxySettings.screenshotMaxFiles ?? 200,
                                      1
                                    )
                                  }
                                }))
                              }
                            />
                          </label>
                          <label className="flex items-center gap-2 text-xs text-ink-500">
                            <input
                              type="checkbox"
                              checked={Boolean(proxySettings.screenshotAutoDelete)}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  proxy: {
                                    ...proxySettings,
                                    screenshotAutoDelete: event.target.checked
                                  }
                                }))
                              }
                            />
                            {t(locale, "proxyScreenshotAutoDelete")}
                          </label>
                          <label className="flex items-center gap-2 text-xs text-ink-500">
                            <input
                              type="checkbox"
                              checked={Boolean(proxySettings.screenshotIncludeFailed)}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  proxy: {
                                    ...proxySettings,
                                    screenshotIncludeFailed: event.target.checked
                                  }
                                }))
                              }
                            />
                            {t(locale, "proxyScreenshotIncludeFailed")}
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
        {selectedService === "openai" ? (
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "openAiOrgLabel")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm"
              value={settings.openAiOrgId ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, openAiOrgId: event.target.value }))
              }
            />
          </label>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "randomDelay")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={settings.randomDelay.minMs}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  randomDelay: {
                    ...prev.randomDelay,
                    minMs: sanitizeNumber(event.target.value, prev.randomDelay.minMs)
                  }
                }))
              }
            />
          </label>
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "randomDelayHint")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={settings.randomDelay.maxMs}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  randomDelay: {
                    ...prev.randomDelay,
                    maxMs: sanitizeNumber(event.target.value, prev.randomDelay.maxMs)
                  }
                }))
              }
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          <input
            type="checkbox"
            checked={settings.randomDelay.jitter}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                randomDelay: { ...prev.randomDelay, jitter: event.target.checked }
              }))
            }
          />
          {t(locale, "jitter")}
          <span className="text-xs font-normal text-ink-400">
            {t(locale, "jitterHint")}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "concurrency")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={1}
              value={settings.concurrency}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  concurrency: sanitizeNumber(event.target.value, prev.concurrency, 1)
                }))
              }
            />
            <span className="mt-1 block text-xs font-normal text-ink-400">
              {t(locale, "concurrencyHint")}
            </span>
          </label>
          <label className="text-xs font-semibold text-ink-500">
            <span className="inline-flex items-center gap-1">
              {t(locale, "timeout")}
              <span
                className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] font-semibold text-ink-400"
                aria-label={t(locale, "timeoutTooltip")}
              >
                ?
                <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-ink-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {t(locale, "timeoutTooltip")}
                </span>
              </span>
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={timeoutMin}
              value={settings.timeoutMs}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  timeoutMs: sanitizeNumber(event.target.value, prev.timeoutMs, timeoutMin)
                }))
              }
            />
            <span className="mt-1 block text-xs font-normal text-ink-400">
              {t(locale, "timeoutHint")}
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "retries")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={settings.retries}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  retries: sanitizeNumber(event.target.value, prev.retries, 0)
                }))
              }
            />
            <span className="mt-1 block text-xs font-normal text-ink-400">
              {t(locale, "retriesHint")}
            </span>
          </label>
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "maxRps")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={1}
            value={settings.perProcessMaxRps}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                perProcessMaxRps: sanitizeNumber(
                  event.target.value,
                  prev.perProcessMaxRps,
                  1
                )
              }))
            }
          />
            <span className="mt-1 block text-xs font-normal text-ink-400">
              {t(locale, "maxRpsHint")}
            </span>
          </label>
        </div>
        <label className="text-xs font-semibold text-ink-500">
          {isProxyService ? t(locale, "maxProxies") : t(locale, "maxKeys")}
          <input
            className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
            type="number"
            min={1}
            value={maxKeysPerRun}
            onChange={(event) =>
              setMaxKeysPerRun(sanitizeNumber(event.target.value, maxKeysPerRun, 1))
            }
          />
          <span className="mt-1 block text-xs font-normal text-ink-400">
            {t(locale, "maxKeysHint")}
          </span>
        </label>
      </div>

      {selectedService === "custom" ? (
        <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4">
          <h3 className="text-sm font-semibold text-ink-700">{t(locale, "customSettings")}</h3>
          <p className="mt-2 text-xs text-ink-500">{t(locale, "customDescription")}</p>
          <div className="mt-3">
            <div className="text-xs font-semibold text-ink-500">
              {t(locale, "customExampleTitle")}
            </div>
            <div className="mt-2 whitespace-pre-line rounded-2xl border border-white/60 bg-white/70 p-3 text-xs text-ink-500">
              {t(locale, "customExampleBody")}
            </div>
          </div>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-semibold text-ink-500">
              {t(locale, "customBaseUrl")}
              <input
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                value={customConfig.baseUrl}
                onChange={(event) =>
                  setCustomConfig((prev) => ({ ...prev, baseUrl: event.target.value }))
                }
              />
            </label>
            <label className="text-xs font-semibold text-ink-500">
              {t(locale, "customPath")}
              <input
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                value={customConfig.path}
                onChange={(event) =>
                  setCustomConfig((prev) => ({ ...prev, path: event.target.value }))
                }
              />
            </label>
            <label className="text-xs font-semibold text-ink-500">
              {t(locale, "customMethod")}
              <select
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                value={customConfig.method}
                onChange={(event) =>
                  setCustomConfig((prev) => ({
                    ...prev,
                    method: event.target.value as CustomServiceConfig["method"]
                  }))
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-500">
              {t(locale, "customAuthType")}
              <select
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                value={customConfig.authType}
                onChange={(event) =>
                  setCustomConfig((prev) => ({
                    ...prev,
                    authType: event.target.value as CustomServiceConfig["authType"]
                  }))
                }
              >
                <option value="bearer">Bearer</option>
                <option value="header">Header</option>
                <option value="query">Query</option>
              </select>
            </label>
            {customConfig.authType === "header" ? (
              <label className="text-xs font-semibold text-ink-500">
                {t(locale, "customHeader")}
                <input
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                  value={customConfig.headerName ?? ""}
                  onChange={(event) =>
                    setCustomConfig((prev) => ({ ...prev, headerName: event.target.value }))
                  }
                />
              </label>
            ) : null}
            {customConfig.authType === "query" ? (
              <label className="text-xs font-semibold text-ink-500">
                {t(locale, "customQuery")}
                <input
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                  value={customConfig.queryParam ?? ""}
                  onChange={(event) =>
                    setCustomConfig((prev) => ({ ...prev, queryParam: event.target.value }))
                  }
                />
              </label>
            ) : null}
            <label className="text-xs font-semibold text-ink-500">
              {t(locale, "customSuccess")}
              <input
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm"
                value={successCodesInput}
                onChange={(event) => setSuccessCodesInput(event.target.value)}
                placeholder="200, 204"
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="mt-6 group relative">
        <button
          className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold shadow-glow transition ${
            startDisabled ? "bg-ink-300 text-ink-500" : "bg-ink-900 text-white"
          }`}
          disabled={startDisabled}
          onClick={onStart}
        >
          {t(locale, "startCheck")}
        </button>
        {proxyAggregatorsLoading && onCancelProxyAggregators ? (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-ink-200 bg-white/90 px-3 py-1 text-[10px] font-semibold text-ink-600 opacity-0 transition group-hover:opacity-100"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCancelProxyAggregators();
            }}
          >
            {t(locale, "proxyAggregatorsCancel")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
