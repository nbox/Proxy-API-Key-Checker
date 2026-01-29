import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEvent } from "../../shared/types";
import { STATUS_LABELS, STATUS_TONES } from "../lib/status";

interface VirtualLogListProps {
  items: LogEvent[];
  height: number;
  rowHeight?: number;
  hideFullKeys?: boolean;
  follow?: boolean;
}

export function VirtualLogList({
  items,
  height,
  rowHeight = 36,
  hideFullKeys = true,
  follow = false
}: VirtualLogListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef(0);
  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 8);
  const visibleCount = Math.ceil(height / rowHeight) + 16;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const lastItemKey = items.length
    ? `${items[items.length - 1].processId}-${items[items.length - 1].keyIndex}-${items[items.length - 1].result.checkedAt}`
    : "";

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    if (follow) {
      node.scrollTop = node.scrollHeight;
      scrollTopRef.current = node.scrollTop;
      setScrollTop(node.scrollTop);
      return;
    }
    const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
    const nextScrollTop = Math.min(scrollTopRef.current, maxScrollTop);
    if (node.scrollTop !== nextScrollTop) {
      node.scrollTop = nextScrollTop;
      scrollTopRef.current = nextScrollTop;
      setScrollTop(nextScrollTop);
    }
  }, [follow, totalHeight, lastItemKey]);

  return (
    <div
      ref={containerRef}
      className="scrollbar w-full overflow-auto rounded-2xl border border-white/40 bg-white/70 text-sm shadow-soft"
      style={{ height }}
      onScroll={(event) => {
        const nextScrollTop = event.currentTarget.scrollTop;
        scrollTopRef.current = nextScrollTop;
        setScrollTop(nextScrollTop);
      }}
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
              {item.result.proxyType ? (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
                  {item.result.proxyType}
                </span>
              ) : null}
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
