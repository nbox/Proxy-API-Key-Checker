import { t, type Locale } from "../lib/i18n";

interface KeysInputPanelProps {
  locale: Locale;
  appVersion: string;
  keyText: string;
  onKeyTextChange: (value: string) => void;
  dedupeEnabled: boolean;
  onDedupeChange: (enabled: boolean) => void;
  parsedKeysCount: number;
  invalidFormatCount: number;
  keysOverLimit: boolean;
  encoding: string;
  onEncodingChange: (encoding: string) => void;
  onImport: () => void;
  importInfo: string | null;
  importError: string | null;
}

export function KeysInputPanel({
  locale,
  appVersion,
  keyText,
  onKeyTextChange,
  dedupeEnabled,
  onDedupeChange,
  parsedKeysCount,
  invalidFormatCount,
  keysOverLimit,
  encoding,
  onEncodingChange,
  onImport,
  importInfo,
  importError
}: KeysInputPanelProps) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-800">{t(locale, "keysInputTitle")}</h2>
          <p className="text-sm text-ink-400">{t(locale, "keysInputHint")}</p>
        </div>
        <div className="text-xs text-ink-400">v{appVersion}</div>
      </div>
      <textarea
        className="mt-4 h-48 w-full rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-ink-700 shadow-inner focus:outline-none"
        placeholder="sk-..."
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
          {t(locale, "keysCount")}: {parsedKeysCount}
        </span>
        {invalidFormatCount > 0 ? (
          <span className="text-xs text-amber-600">{t(locale, "formatWarning")}</span>
        ) : null}
        {keysOverLimit ? (
          <span className="text-xs text-rose-600">{t(locale, "limitWarning")}</span>
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
    </div>
  );
}
