import type { CheckStatus, ExportFormat, ProcessStatus, ProxyType } from "../../shared/types";
import { t, type Locale } from "../lib/i18n";
import { statusBucketsFromCounts } from "../lib/report";
import { STATUS_LABELS, STATUS_RECOMMENDATIONS, STATUS_TONES, isSuccess, isWarning } from "../lib/status";
import type { ProcessUI } from "../lib/processTypes";
import { VirtualLogList } from "./VirtualLogList";

interface ProcessCardProps {
  locale: Locale;
  process: ProcessUI;
  hideFullKeys: boolean;
  onToggleExpanded: () => void;
  onUpdate: (patch: Partial<ProcessUI>) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRemove: () => void;
  onCopyFull: () => void;
  onMoveValidProxies: (proxies: string[]) => void;
  onExportMasked: (format: ExportFormat) => void;
  onExportFullRequest: () => void;
}

function averageLatency(total: number, count: number) {
  if (!count) {
    return 0;
  }
  return Math.round(total / count);
}

function medianLatency(latencies: number[]) {
  if (!latencies.length) {
    return 0;
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

function statusBadge(status: ProcessStatus) {
  if (status === "Running") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "Paused") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "Finished") {
    return "bg-ink-900 text-white";
  }
  if (status === "Cancelled") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-rose-100 text-rose-700";
}

function filteredLogs(process: ProcessUI, hideFullKeys: boolean) {
  const searchValue = process.search.toLowerCase();
  return process.logs.filter((log) => {
    const searchTarget = hideFullKeys ? log.keyMasked : log.keyFull || log.keyMasked;
    const matchesSearch = process.search
      ? searchTarget.toLowerCase().includes(searchValue)
      : true;

    if (!matchesSearch) {
      return false;
    }

    if (process.logFilter === "all") {
      return true;
    }
    if (process.logFilter === "success") {
      return isSuccess(log.result.status);
    }
    if (process.logFilter === "warning") {
      return isWarning(log.result.status);
    }
    return !isSuccess(log.result.status) && !isWarning(log.result.status);
  });
}

export function ProcessCard({
  locale,
  process,
  hideFullKeys,
  onToggleExpanded,
  onUpdate,
  onPause,
  onResume,
  onStop,
  onRemove,
  onCopyFull,
  onMoveValidProxies,
  onExportMasked,
  onExportFullRequest
}: ProcessCardProps) {
  const progress = process.total
    ? Math.min(100, Math.round((process.processed / process.total) * 100))
    : 0;
  const processedCount = process.processed;
  const successCount = process.stats.success;
  const invalidCount = process.stats.invalid;
  const successPortion = processedCount
    ? Math.min(100, (successCount / processedCount) * 100)
    : 0;
  const failurePortion = processedCount ? Math.max(0, 100 - successPortion) : 0;
  const average = averageLatency(process.stats.latencyTotal, process.stats.latencyCount);
  const median = medianLatency(process.stats.latencies);
  const reasons = statusBucketsFromCounts(process.stats.reasonCounts);
  const isProxyService = process.serviceId === "proxy";
  const validLabel = isProxyService ? t(locale, "validProxies") : t(locale, "validKeys");
  const successHeaderLabel = t(locale, "successLabel");
  const searchPlaceholder = isProxyService ? t(locale, "searchProxy") : t(locale, "searchKey");
  const proxyTypeBuckets: Record<ProxyType, string[]> = {
    http: [],
    https: [],
    socks4: [],
    socks5: []
  };
  const proxyTypeCopyBuckets: Record<ProxyType, string[]> = {
    http: [],
    https: [],
    socks4: [],
    socks5: []
  };
  const validProxyList: string[] = [];
  if (isProxyService) {
    const seen = new Set<string>();
    for (const item of process.results) {
      if (item.status === "OK") {
        const value = (item.keyFull ?? item.keyMasked)?.trim();
        if (value && !seen.has(value)) {
          seen.add(value);
          validProxyList.push(value);
        }
      }
      if (item.status !== "OK" || !item.proxyType) {
        continue;
      }
      const displayKey = hideFullKeys ? item.keyMasked : item.keyFull ?? item.keyMasked;
      const fullKey = item.keyFull ?? displayKey;
      proxyTypeBuckets[item.proxyType].push(displayKey);
      proxyTypeCopyBuckets[item.proxyType].push(fullKey);
    }
  }

  const copyProxyType = (type: ProxyType) => {
    const payload = proxyTypeCopyBuckets[type].filter(Boolean).join("\n");
    if (!payload) {
      return;
    }
    navigator.clipboard.writeText(payload).catch(() => undefined);
  };

  const moveValidProxies = () => {
    if (!isProxyService || validProxyList.length === 0) {
      return;
    }
    onMoveValidProxies(validProxyList);
  };

  return (
    <div className="glass-card rounded-3xl p-5">
      <div
        className="flex flex-wrap items-center justify-between gap-4"
        onClick={onToggleExpanded}
      >
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <input
            className="w-56 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-sm"
            value={process.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            onClick={(event) => event.stopPropagation()}
          />
          <span className="text-xs text-ink-400">
            {new Date(process.startedAt).toLocaleTimeString()}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(process.status)}`}>
            {process.status}
          </span>
          {process.status === "Finished" ? (
            <span className="text-xs text-ink-500">
              {validLabel}: {successCount} · {t(locale, "invalidLabel")}: {invalidCount}
            </span>
          ) : null}
          {process.status !== "Finished" ? (
            <span className="text-xs text-emerald-600">
              {successHeaderLabel}: {successCount}
            </span>
          ) : null}
          <span className="text-xs text-ink-400">
            {process.processed}/{process.total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {process.status === "Running" ? (
            <button
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onPause();
              }}
            >
              {t(locale, "pause")}
            </button>
          ) : null}
          {process.status === "Paused" ? (
            <button
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onResume();
              }}
            >
              {t(locale, "resume")}
            </button>
          ) : null}
          {process.status !== "Finished" && process.status !== "Cancelled" ? (
            <button
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-rose-600"
              onClick={(event) => {
                event.stopPropagation();
                onStop();
              }}
            >
              {t(locale, "stop")}
            </button>
          ) : null}
          <button
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-500"
            title={t(locale, "removeProcess")}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            ✕
          </button>
        </div>
        <div className="w-full">
          <div className="flex items-center gap-3">
            <div className="progress-track h-3 flex-1 overflow-hidden rounded-full">
              <div className="flex h-3" style={{ width: `${progress}%` }}>
                <div
                  className="h-3 bg-emerald-500"
                  style={{ width: `${successPortion}%` }}
                />
                <div
                  className="h-3 bg-rose-500"
                  style={{ width: `${failurePortion}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-ink-400">{progress}%</span>
          </div>
        </div>
      </div>

      {process.expanded ? (
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            {["logs", "stats", "summary"].map((tab) => (
              <button
                key={tab}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  process.activeTab === tab
                    ? "bg-ink-900 text-white"
                    : "bg-white/70 text-ink-500"
                }`}
                onClick={() => onUpdate({ activeTab: tab as ProcessUI["activeTab"] })}
              >
                {tab === "logs"
                  ? t(locale, "logs")
                  : tab === "stats"
                    ? t(locale, "stats")
                    : t(locale, "summary")}
              </button>
            ))}
          </div>

          {process.activeTab === "logs" ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: "all", label: t(locale, "filterAll") },
                  { id: "success", label: t(locale, "filterSuccess") },
                  { id: "failed", label: t(locale, "filterFailed") },
                  { id: "warning", label: t(locale, "filterWarning") }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    className={`rounded-full px-3 py-1 text-xs ${
                      process.logFilter === filter.id
                        ? "bg-ink-900 text-white"
                        : "bg-white/70 text-ink-500"
                    }`}
                    onClick={() =>
                      onUpdate({ logFilter: filter.id as ProcessUI["logFilter"] })
                    }
                  >
                    {filter.label}
                  </button>
                ))}
                <label className="flex items-center gap-2 text-xs text-ink-500">
                  <input
                    type="checkbox"
                    checked={process.followLogs}
                    onChange={(event) => onUpdate({ followLogs: event.target.checked })}
                  />
                  {t(locale, "followLogs")}
                </label>
                <input
                  className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs"
                  placeholder={searchPlaceholder}
                  value={process.search}
                  onChange={(event) => onUpdate({ search: event.target.value })}
                />
              </div>
              <VirtualLogList
                items={filteredLogs(process, hideFullKeys)}
                height={260}
                hideFullKeys={hideFullKeys}
                follow={process.followLogs}
              />
            </div>
          ) : null}

          {process.activeTab === "stats" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="text-xs text-ink-400">{t(locale, "totalLabel")}</div>
                <div className="text-2xl font-semibold text-ink-800">{process.total}</div>
                <div className="mt-2 text-xs text-emerald-600">
                  {t(locale, "successLabel")}: {successCount}
                </div>
                <div className="text-xs text-rose-600">
                  {t(locale, "invalidLabel")}: {process.stats.invalid}
                </div>
                <div className="text-xs text-amber-600">
                  {t(locale, "quotaLabel")}: {process.stats.quota}
                </div>
                <div className="text-xs text-amber-600">
                  {t(locale, "rateLimitedLabel")}: {process.stats.rateLimited}
                </div>
                <div className="text-xs text-sky-600">
                  {t(locale, "networkLabel")}: {process.stats.network}
                </div>
                <div className="text-xs text-ink-400">
                  {t(locale, "unknownLabel")}: {process.stats.unknown}
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="text-xs text-ink-400">{t(locale, "latencyLabel")}</div>
                <div className="mt-2 flex gap-6">
                  <div>
                    <div className="text-xs text-ink-400">{t(locale, "avgLabel")}</div>
                    <div className="text-xl font-semibold text-ink-800">{average} ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">{t(locale, "medianLabel")}</div>
                    <div className="text-xl font-semibold text-ink-800">{median} ms</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-ink-400">
                  {t(locale, "topReasonsLabel")}
                </div>
                {reasons.length === 0 ? (
                  <div className="text-xs text-ink-400">-</div>
                ) : (
                  reasons.map(([reason, count]) => (
                    <div key={reason} className="text-xs text-ink-500">
                      {reason}: {count}
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 md:col-span-2">
                <div className="text-xs text-ink-400">
                  {t(locale, "recommendationsLabel")}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {Object.entries(STATUS_RECOMMENDATIONS).map(([status, note]) => (
                    <div key={status} className="rounded-full bg-white px-3 py-1 text-xs text-ink-500">
                      <span className={STATUS_TONES[status as CheckStatus]}>
                        {STATUS_LABELS[status as CheckStatus]}
                      </span>
                      <span className="ml-2">{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {process.activeTab === "summary" ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="text-xs text-ink-400">{t(locale, "summary")}</div>
                <div className="mt-2 text-sm text-ink-500">
                  {process.status === "Finished"
                    ? t(locale, "statusCompleted")
                    : process.status === "Cancelled"
                      ? t(locale, "statusCancelled")
                      : t(locale, "statusRunning")}
                </div>
                <div className="mt-2 text-xs text-ink-400">
                  {t(locale, "totalLabel")}: {process.total} | {t(locale, "successLabel")}:{" "}
                  {process.stats.success} | {t(locale, "invalidLabel")}: {process.stats.invalid}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs"
                    onClick={onCopyFull}
                  >
                    {t(locale, "copyFullList")}
                  </button>
                  <button
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs"
                    onClick={() => onExportMasked("csv")}
                  >
                    {t(locale, "exportMasked")} (CSV)
                  </button>
                  <button
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs"
                    onClick={() => onExportMasked("json")}
                  >
                    {t(locale, "exportMasked")} (JSON)
                  </button>
                  <button
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs text-rose-600"
                    onClick={onExportFullRequest}
                  >
                    {t(locale, "exportFull")}
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-ink-400">{validLabel}</div>
                  {isProxyService ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] text-ink-500"
                        onClick={moveValidProxies}
                        disabled={validProxyList.length === 0}
                      >
                        {t(locale, "proxyMoveToList")}
                      </button>
                      <span
                        className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] font-semibold text-ink-400"
                        aria-label={t(locale, "proxyMoveToListHint")}
                      >
                        ?
                        <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-ink-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                          {t(locale, "proxyMoveToListHint")}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
                {isProxyService ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {(["http", "https", "socks4", "socks5"] as ProxyType[]).map((type) => (
                      <div
                        key={type}
                        className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-ink-500">
                            {type.toUpperCase()}
                          </div>
                          <button
                            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] text-ink-500"
                            onClick={() => copyProxyType(type)}
                            disabled={proxyTypeCopyBuckets[type].length === 0}
                          >
                            {t(locale, "copyTypeList")}
                          </button>
                        </div>
                        <div className="mt-2 max-h-44 overflow-y-auto pr-1 text-xs text-ink-500">
                          {proxyTypeBuckets[type].length === 0 ? (
                            <div className="text-xs text-ink-400">-</div>
                          ) : (
                            proxyTypeBuckets[type].map((item, index) => (
                              <div key={`${type}-${index}`} className="font-mono">
                                {item}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 grid gap-2 text-xs text-ink-500">
                    {process.results
                      .filter((item) => item.status === "OK")
                      .slice(0, 8)
                      .map((item) => {
                        const displayKey = hideFullKeys
                          ? item.keyMasked
                          : item.keyFull ?? item.keyMasked;
                        return (
                          <div key={`${item.keyMasked}-${item.checkedAt}`} className="font-mono">
                            {displayKey}
                          </div>
                        );
                      })}
                    {process.results.filter((item) => item.status === "OK").length > 8 ? (
                      <div className="text-xs text-ink-400">+ more</div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
