import { useMemo, useState } from "react";
import type { LogEvent } from "../../shared/types";
import { STATUS_LABELS, STATUS_TONES } from "../lib/status";

interface VirtualLogListProps {
  items: LogEvent[];
  height: number;
  rowHeight?: number;
  hideFullKeys?: boolean;
}

export function VirtualLogList({
  items,
  height,
  rowHeight = 36,
  hideFullKeys = true,
}: VirtualLogListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 8);
  const visibleCount = Math.ceil(height / rowHeight) + 16;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  return (
    <div
      className="scrollbar w-full overflow-auto rounded-2xl border border-white/40 bg-white/70 text-sm shadow-soft"
      style={{ height }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item, index) => {
          const top = (startIndex + index) * rowHeight;
          return (
            <div
              key={`${item.processId}-${item.keyIndex}-${item.result.checkedAt}`}
              className="flex min-w-max items-center gap-3 px-3"
              style={{
                position: "absolute",
                top,
                left: 0,
                height: rowHeight,
              }}
            >
              <span className="text-xs text-ink-300">
                {new Date(item.result.checkedAt).toLocaleTimeString()}
              </span>
              <span className="font-mono text-xs text-ink-600">
                {hideFullKeys ? item.keyMasked : item.keyFull ?? item.keyMasked}
              </span>
              <span className="text-xs text-ink-400">
                {item.method.replace(/_/g, " ")}
              </span>
              <span
                className={`text-xs font-semibold ${
                  STATUS_TONES[item.result.status]
                }`}
              >
                {STATUS_LABELS[item.result.status]}
              </span>
              <span className="text-xs text-ink-400">
                {item.result.latencyMs} ms
              </span>
              {item.result.errorMessage ? (
                <span className="truncate text-xs text-ink-400">
                  {item.result.errorMessage}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
