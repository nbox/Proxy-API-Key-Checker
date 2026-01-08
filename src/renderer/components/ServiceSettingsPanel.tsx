import type { Dispatch, SetStateAction } from "react";
import type { CheckMethod, CustomServiceConfig, ProcessSettings, ServiceId } from "../../shared/types";
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
  onStart
}: ServiceSettingsPanelProps) {
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

  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="text-lg font-semibold text-ink-800">{t(locale, "serviceSettings")}</h2>
      <div className="mt-4 grid gap-4">
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
          </label>
          <label className="text-xs font-semibold text-ink-500">
            {t(locale, "timeout")}
            <input
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
              type="number"
              min={1000}
              value={settings.timeoutMs}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  timeoutMs: sanitizeNumber(event.target.value, prev.timeoutMs, 1000)
                }))
              }
            />
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
          </label>
        </div>
        <label className="text-xs font-semibold text-ink-500">
          {t(locale, "maxKeys")}
          <input
            className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
            type="number"
            min={1}
            value={maxKeysPerRun}
            onChange={(event) =>
              setMaxKeysPerRun(sanitizeNumber(event.target.value, maxKeysPerRun, 1))
            }
          />
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

      <div className="mt-6">
        <button
          className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold shadow-glow transition ${
            startDisabled ? "bg-ink-300 text-ink-500" : "bg-ink-900 text-white"
          }`}
          disabled={startDisabled}
          onClick={onStart}
        >
          {t(locale, "startCheck")}
        </button>
      </div>
    </div>
  );
}
