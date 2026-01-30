import { t, type Locale } from "../lib/i18n";
import { parseAggregatorUrls } from "../lib/proxy";
import httpAggregators from "../lib/proxyAggregators/http.txt?raw";
import httpsAggregators from "../lib/proxyAggregators/https.txt?raw";
import socks4Aggregators from "../lib/proxyAggregators/socks4.txt?raw";
import socks5Aggregators from "../lib/proxyAggregators/socks5.txt?raw";

interface KeysInputPanelProps {
  locale: Locale;
  keyText: string;
  onKeyTextChange: (value: string) => void;
  isProxy: boolean;
  dedupeEnabled: boolean;
  onDedupeChange: (enabled: boolean) => void;
  parsedKeysCount: number;
  invalidFormatCount: number;
  keysOverLimit: boolean;
  encoding: string;
  onEncodingChange: (encoding: string) => void;
  onImport: () => void;
  onClear?: () => void;
  importInfo: string | null;
  importError: string | null;
  proxyAggregatorsText?: string;
  onProxyAggregatorsChange?: (value: string) => void;
  proxyAggregatorErrors?: string[];
  proxyAggregatorsLoading?: boolean;
}

export function KeysInputPanel({
  locale,
  keyText,
  onKeyTextChange,
  isProxy,
  dedupeEnabled,
  onDedupeChange,
  parsedKeysCount,
  invalidFormatCount,
  keysOverLimit,
  encoding,
  onEncodingChange,
  onImport,
  onClear,
  importInfo,
  importError,
  proxyAggregatorsText,
  onProxyAggregatorsChange,
  proxyAggregatorErrors,
  proxyAggregatorsLoading
}: KeysInputPanelProps) {
  const inputTitle = isProxy ? t(locale, "proxyInputTitle") : t(locale, "keysInputTitle");
  const inputHint = isProxy ? t(locale, "proxyInputHint") : t(locale, "keysInputHint");
  const countLabel = isProxy ? t(locale, "proxyCount") : t(locale, "keysCount");
  const formatWarning = isProxy ? t(locale, "proxyFormatWarning") : t(locale, "formatWarning");
  const limitWarning = isProxy ? t(locale, "proxyLimitWarning") : t(locale, "limitWarning");
  const placeholder = isProxy ? "USER:PASS@IP:PORT or IP:PORT" : "sk-...";
  const aggregatorsValue = proxyAggregatorsText ?? "";

  const appendAggregators = (content: string) => {
    if (!onProxyAggregatorsChange) {
      return;
    }
    const existingUrls = new Set(parseAggregatorUrls(aggregatorsValue));
    const newUrls = parseAggregatorUrls(content).filter((url) => !existingUrls.has(url));
    if (newUrls.length === 0) {
      return;
    }
    const base = aggregatorsValue.trimEnd();
    const separator = base.length ? "\n" : "";
    onProxyAggregatorsChange(`${base}${separator}${newUrls.join("\n")}`);
  };

  const clearAggregators = () => {
    if (!onProxyAggregatorsChange) {
      return;
    }
    onProxyAggregatorsChange("");
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <h2 className="text-lg font-semibold text-ink-800">{inputTitle}</h2>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-400">{inputHint}</p>
            {isProxy ? (
              <button
                className="ml-auto rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs font-semibold text-ink-600 disabled:opacity-60"
                onClick={() => (onClear ? onClear() : onKeyTextChange(""))}
                disabled={keyText.trim().length === 0}
              >
                {t(locale, "clearProxyList")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <textarea
        className="mt-4 h-48 w-full rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-ink-700 shadow-inner focus:outline-none"
        placeholder={placeholder}
        value={keyText}
        onChange={(event) => onKeyTextChange(event.target.value)}
      />
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-500">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dedupeEnabled}
            onChange={(event) => onDedupeChange(event.target.checked)}
          />
          {t(locale, "dedupe")}
        </label>
        <span className="text-xs text-ink-400">
          {countLabel}: {parsedKeysCount}
        </span>
        {invalidFormatCount > 0 ? (
          <span className="text-xs text-amber-600">{formatWarning}</span>
        ) : null}
        {keysOverLimit ? (
          <span className="text-xs text-rose-600">{limitWarning}</span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2">
          <span className="text-xs font-semibold text-ink-500">{t(locale, "encoding")}</span>
          <select
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs"
            value={encoding}
            onChange={(event) => onEncodingChange(event.target.value)}
          >
            <option value="utf-8">UTF-8</option>
            <option value="windows-1251">Windows-1251</option>
            <option value="iso-8859-1">ISO-8859-1</option>
          </select>
        </div>
        <button
          className="rounded-full border border-ink-200 bg-white/80 px-4 py-2 text-sm"
          onClick={onImport}
        >
          {t(locale, "importFile")}
        </button>
        {importInfo ? <span className="text-xs text-ink-400">{importInfo}</span> : null}
        {importError ? <span className="text-xs text-rose-600">{importError}</span> : null}
      </div>
      {isProxy ? (
        <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-ink-500">
              {t(locale, "proxyAggregatorsTitle")}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[10px] font-semibold text-ink-600"
                type="button"
                onClick={() => appendAggregators(httpAggregators)}
              >
                {t(locale, "proxyAggregatorsAddHttp")}
              </button>
              <button
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[10px] font-semibold text-ink-600"
                type="button"
                onClick={() => appendAggregators(httpsAggregators)}
              >
                {t(locale, "proxyAggregatorsAddHttps")}
              </button>
              <button
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[10px] font-semibold text-ink-600"
                type="button"
                onClick={() => appendAggregators(socks4Aggregators)}
              >
                {t(locale, "proxyAggregatorsAddSocks4")}
              </button>
              <button
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[10px] font-semibold text-ink-600"
                type="button"
                onClick={() => appendAggregators(socks5Aggregators)}
              >
                {t(locale, "proxyAggregatorsAddSocks5")}
              </button>
              <button
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[10px] font-semibold text-ink-600"
                type="button"
                onClick={clearAggregators}
              >
                {t(locale, "proxyAggregatorsClear")}
              </button>
            </div>
          </div>
          <textarea
            className="mt-2 h-24 w-full rounded-2xl border border-white/60 bg-white/70 p-3 text-xs text-ink-600"
            placeholder="https://example.com/proxies.txt"
            value={aggregatorsValue}
            onChange={(event) => onProxyAggregatorsChange?.(event.target.value)}
          />
          <p className="mt-2 text-xs text-ink-400">{t(locale, "proxyAggregatorsHint")}</p>
          {proxyAggregatorsLoading ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t(locale, "proxyAggregatorsLoading")}
            </div>
          ) : null}
          {proxyAggregatorErrors && proxyAggregatorErrors.length > 0 ? (
            <div className="mt-2 space-y-1 text-xs text-rose-600">
              {proxyAggregatorErrors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
