import type { Dispatch, SetStateAction } from "react";
import type { ExportFormat } from "../../shared/types";
import { t, type Locale } from "../lib/i18n";
import { sanitizeNumber } from "../lib/number";
import type { ProcessUI } from "../lib/processTypes";
import { ProcessCard } from "./ProcessCard";

interface ProcessesSectionProps {
  locale: Locale;
  processes: ProcessUI[];
  processLimit: number;
  setProcessLimit: Dispatch<SetStateAction<number>>;
  hideFullKeys: boolean;
  setHideFullKeys: Dispatch<SetStateAction<boolean>>;
  onClearProcesses: () => void;
  onToggleExpanded: (processId: string) => void;
  onUpdateProcess: (processId: string, patch: Partial<ProcessUI>) => void;
  onPause: (processId: string) => void;
  onResume: (processId: string) => void;
  onStop: (processId: string) => void;
  onRemove: (processId: string) => void;
  onCopyFull: (process: ProcessUI) => void;
  onExportMasked: (process: ProcessUI, format: ExportFormat) => void;
  onExportFullRequest: (processId: string) => void;
}

export function ProcessesSection({
  locale,
  processes,
  processLimit,
  setProcessLimit,
  hideFullKeys,
  setHideFullKeys,
  onClearProcesses,
  onToggleExpanded,
  onUpdateProcess,
  onPause,
  onResume,
  onStop,
  onRemove,
  onCopyFull,
  onExportMasked,
  onExportFullRequest
}: ProcessesSectionProps) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          {t(locale, "processesTitle")}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-500">
            <span>{t(locale, "processLimit")}</span>
            <input
              className="w-20 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs"
              type="number"
              min={1}
              value={processLimit}
              onChange={(event) =>
                setProcessLimit(sanitizeNumber(event.target.value, processLimit, 1))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-500">
            <input
              type="checkbox"
              checked={hideFullKeys}
              onChange={(event) => setHideFullKeys(event.target.checked)}
            />
            {t(locale, "hideFullKeys")}
          </label>
          <button
            className="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs font-semibold text-ink-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={processes.length === 0}
            onClick={onClearProcesses}
          >
            {t(locale, "clearProcesses")}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {processes.length === 0 ? (
          <div className="glass-card rounded-3xl p-6 text-sm text-ink-400">
            {t(locale, "noProcesses")}
          </div>
        ) : null}
        {processes.map((process) => (
          <ProcessCard
            key={process.id}
            locale={locale}
            process={process}
            hideFullKeys={hideFullKeys}
            onToggleExpanded={() => onToggleExpanded(process.id)}
            onUpdate={(patch) => onUpdateProcess(process.id, patch)}
            onPause={() => onPause(process.id)}
            onResume={() => onResume(process.id)}
            onStop={() => onStop(process.id)}
            onRemove={() => onRemove(process.id)}
            onCopyFull={() => onCopyFull(process)}
            onExportMasked={(format) => onExportMasked(process, format)}
            onExportFullRequest={() => onExportFullRequest(process.id)}
          />
        ))}
      </div>
    </section>
  );
}
