"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FilterOption } from "@/lib/filter";
import { computePanelPosition, type PanelPosition } from "@/lib/panel-position";

export interface FilterDropdownProps {
  header: string;
  options: readonly FilterOption[];
  selected: ReadonlySet<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

export function FilterDropdown({ header, options, selected, onToggle, onClear }: FilterDropdownProps) {
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const active = selected.size > 0;

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;
    setPosition(
      computePanelPosition(
        button.getBoundingClientRect(),
        // maxHeight で縮んだ高さではなく、中身本来の高さ（scrollHeight）に枠線の分を足した高さで決める
        { width: panel.offsetWidth, height: panel.scrollHeight + panel.offsetHeight - panel.clientHeight },
        // window.innerWidth / innerHeight はスクロールバーの幅を含み、右端や下端に寄せたパネルがスクロールバーの下に入る
        { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
      )
    );
  }, []);

  // 開閉は popovertarget と light dismiss（外側クリック・Esc）でブラウザが行うので、toggle イベントで状態を追う
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const handleToggle = (event: Event) => {
      const isOpen = (event as Event & { newState?: string }).newState === "open";
      setOpen(isOpen);
      if (!isOpen) setPosition(null);
    };
    panel.addEventListener("toggle", handleToggle);
    return () => panel.removeEventListener("toggle", handleToggle);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const handleScroll = (event: Event) => {
      // パネル自身の中のスクロールでは位置は変わらない
      if (panelRef.current?.contains(event.target as Node)) return;
      updatePosition();
    };
    // 横スクロールの枠の中のスクロールにも追従するため capture で拾う
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        // Popover API 非対応のブラウザではボタンごと出さない（表はそのまま使える）
        className={[
          "btn btn-ghost btn-xs px-1 ml-1 align-middle hidden supports-[selector(:popover-open)]:inline-flex",
          active ? "text-primary" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        // popovertarget で結び付けると、ブラウザがこのボタンを開閉用として扱い、
        // 開いている間に押しても light dismiss で閉じた直後に開き直すことがない
        popoverTarget={panelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={active ? `${header} でフィルタ（${selected.size}件選択中）` : `${header} でフィルタ`}
      >
        ▾
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-label={`${header} の絞り込み`}
        // 見出し側の whitespace-nowrap を引き継ぐと長いラベルが折り返せないので、ここで元に戻す
        className="p-2 rounded-box bg-base-100 text-base-content text-left font-normal whitespace-normal shadow-lg border border-base-300 overflow-y-auto"
        style={{
          // Popover の UA スタイル（inset: 0; margin: auto）を打ち消して、計算した位置に置く
          position: "fixed",
          inset: "auto",
          margin: 0,
          top: position?.top,
          left: position?.left,
          maxHeight: position?.maxHeight,
          maxWidth: position?.maxWidth,
          // 開いた直後、位置が決まるまでの1フレームだけ、ずれた位置に表示されるのを防ぐ
          // （閉じている間は Popover の UA スタイルで display: none になるので指定しない）
          visibility: open && !position ? "hidden" : undefined,
        }}
      >
        <ul className="flex flex-col gap-1 min-w-32">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex items-start gap-2 cursor-pointer px-1 py-0.5">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selected.has(option.value)}
                  onChange={() => onToggle(option.value)}
                />
                <span className="min-w-0 break-words">
                  <span>{option.label}</span> <span className="opacity-60 whitespace-nowrap">({option.count})</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-end">
          <button type="button" className="btn btn-xs" onClick={onClear} disabled={!active}>
            解除
          </button>
        </div>
      </div>
    </>
  );
}
