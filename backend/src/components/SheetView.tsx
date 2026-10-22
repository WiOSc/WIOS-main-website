"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cell = { r: number; c: number };

// 0 -> A, 25 -> Z, 26 -> AA
function colLetter(i: number): string {
  let s = "";
  for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) {
    s = String.fromCharCode(65 + (n % 26)) + s;
  }
  return s;
}

// Read-only spreadsheet grid: selection, range select, keyboard nav, Ctrl+C as TSV
export default function SheetView({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [focus, setFocus] = useState<Cell | null>(null);
  const dragging = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const nRows = rows.length;
  const nCols = columns.length;

  const sel = useMemo(() => {
    if (!anchor || !focus) return null;
    return {
      r0: Math.min(anchor.r, focus.r),
      r1: Math.max(anchor.r, focus.r),
      c0: Math.min(anchor.c, focus.c),
      c1: Math.max(anchor.c, focus.c),
    };
  }, [anchor, focus]);

  const inSel = (r: number, c: number) =>
    !!sel && r >= sel.r0 && r <= sel.r1 && c >= sel.c0 && c <= sel.c1;

  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // r = -1 is the header row, c = -1 is the row-number gutter
  function down(e: React.MouseEvent, r: number, c: number) {
    ref.current?.focus();
    dragging.current = true;
    const rr = r < 0 ? 0 : r;
    const cc = c < 0 ? 0 : c;
    if (c < 0) {
      // row header selects the whole row
      setAnchor({ r: rr, c: 0 });
      setFocus({ r: rr, c: nCols - 1 });
    } else if (r < 0) {
      // column header selects the whole column
      setAnchor({ r: 0, c: cc });
      setFocus({ r: nRows - 1, c: cc });
    } else if (e.shiftKey && anchor) {
      setFocus({ r: rr, c: cc });
    } else {
      setAnchor({ r: rr, c: cc });
      setFocus({ r: rr, c: cc });
    }
  }

  function enter(r: number, c: number) {
    if (dragging.current && r >= 0 && c >= 0) setFocus({ r, c });
  }

  const toTsv = useCallback(() => {
    if (!sel) return "";
    const clean = (v: string) => v.replace(/[\t\r\n]+/g, " ");
    const out: string[] = [];
    for (let r = sel.r0; r <= sel.r1; r++) {
      const line: string[] = [];
      for (let c = sel.c0; c <= sel.c1; c++) line.push(clean(rows[r]?.[c] ?? ""));
      out.push(line.join("\t"));
    }
    return out.join("\n");
  }, [sel, rows]);

  function onCopy(e: React.ClipboardEvent) {
    if (!sel) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", toTsv());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (nRows && nCols) {
        setAnchor({ r: 0, c: 0 });
        setFocus({ r: nRows - 1, c: nCols - 1 });
      }
      return;
    }
    const d: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = d[e.key];
    if (!delta || !focus) return;
    e.preventDefault();
    const next = {
      r: Math.min(nRows - 1, Math.max(0, focus.r + delta[0])),
      c: Math.min(nCols - 1, Math.max(0, focus.c + delta[1])),
    };
    setFocus(next);
    if (!e.shiftKey) setAnchor(next);
    ref.current
      ?.querySelector(`[data-cell="${next.r}-${next.c}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  const gutter =
    "sticky left-0 z-10 w-12 min-w-12 select-none border-r border-b border-[#d4d4d4] bg-[#f3f3f3] px-2 text-center text-xs text-black/60";

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onCopy={onCopy}
        className="max-h-[70vh] overflow-auto rounded-md border border-[#d4d4d4] bg-white outline-none focus:ring-2 focus:ring-[#8D7FB5]/50"
      >
        <table className="border-separate border-spacing-0 text-sm" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
          <thead>
            {/* column letters */}
            <tr>
              <th className={`${gutter} top-0 z-20`} />
              {columns.map((_, c) => (
                <th
                  key={c}
                  onMouseDown={(e) => down(e, -1, c)}
                  className={`sticky top-0 z-10 h-6 cursor-pointer select-none border-r border-b border-[#d4d4d4] px-2 text-xs font-normal ${
                    sel && c >= sel.c0 && c <= sel.c1
                      ? "bg-[#d3e3fd] text-black"
                      : "bg-[#f3f3f3] text-black/60"
                  }`}
                >
                  {colLetter(c)}
                </th>
              ))}
            </tr>
            {/* column labels */}
            <tr>
              <th className={`${gutter} top-6 z-20`}>1</th>
              {columns.map((label, c) => (
                <th
                  key={c}
                  onMouseDown={(e) => down(e, -1, c)}
                  className="sticky top-6 z-10 min-w-36 max-w-80 cursor-pointer select-none whitespace-nowrap border-r border-b border-[#d4d4d4] bg-[#e8e4f3] px-2 py-1 text-left font-bold"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td
                  onMouseDown={(e) => down(e, r, -1)}
                  className={`${gutter} cursor-pointer ${
                    sel && r >= sel.r0 && r <= sel.r1 ? "!bg-[#d3e3fd] !text-black" : ""
                  }`}
                >
                  {r + 2}
                </td>
                {columns.map((_, c) => {
                  const active = inSel(r, c);
                  const isFocus = focus?.r === r && focus?.c === c;
                  return (
                    <td
                      key={c}
                      data-cell={`${r}-${c}`}
                      onMouseDown={(e) => down(e, r, c)}
                      onMouseEnter={() => enter(r, c)}
                      className={`max-w-80 cursor-cell select-none truncate whitespace-nowrap border-r border-b border-[#e2e2e2] px-2 py-1 ${
                        active ? "bg-[#e8f0fe]" : "bg-white"
                      } ${isFocus ? "outline outline-2 -outline-offset-2 outline-[#1a73e8]" : ""}`}
                      title={row[c]}
                    >
                      {row[c]}
                    </td>
                  );
                })}
              </tr>
            ))}
            {nRows === 0 && (
              <tr>
                <td className={gutter}>2</td>
                <td colSpan={nCols} className="px-3 py-6 text-black/40">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="font-poppins text-xs text-black/40">
        Read-only · click or drag to select · Shift+click / arrows to extend · Ctrl+C to copy · Ctrl+A to select all
      </p>
    </div>
  );
}
