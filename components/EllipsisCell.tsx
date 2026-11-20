"use client";

import { useRef, useEffect } from "react";

interface EllipsisCellProps {
  text: string;
  children: React.ReactNode;
}

// セルごとに scrollWidth を読んでクラスを書き込むと、書き込みのたびに次の読み取りで
// グリッド全体の強制レイアウトが起き、行数の2乗に比例して重くなる（2,000行で数十秒）。
// そこで ResizeObserver を1つにまとめ、通知を受けたら全セルを読み取ってから、まとめて書き込む。
const appliers = new Map<Element, (overflows: boolean) => void>();
let sharedObserver: ResizeObserver | null = null;

function getSharedObserver(): ResizeObserver {
  sharedObserver ??= new ResizeObserver((entries) => {
    const results = entries
      // 幅0は絞り込みで行が hidden になった状態。ここで状態を変えると、再表示のときに付け直しのレイアウトが余計に走る
      .filter(({ target }) => target.clientWidth > 0)
      .map(({ target }) => [target, target.scrollWidth > target.clientWidth] as const);
    for (const [target, overflows] of results) appliers.get(target)?.(overflows);
  });
  return sharedObserver;
}

export function EllipsisCell({ text, children }: EllipsisCellProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;

    let prev = outer.hasAttribute("data-tip");
    appliers.set(inner, (overflows) => {
      if (overflows === prev) return;
      prev = overflows;
      if (overflows) {
        outer.classList.add("tooltip", "text-left");
        outer.style.display = "block";
        outer.style.position = "relative";
        outer.setAttribute("data-tip", text);
      } else {
        outer.classList.remove("tooltip", "text-left");
        outer.style.display = "";
        outer.style.position = "";
        outer.removeAttribute("data-tip");
      }
    });
    // 初回の判定は observe 直後の通知で行う（ここで同期的に読むと強制レイアウトになる）
    const observer = getSharedObserver();
    observer.observe(inner);
    return () => {
      observer.unobserve(inner);
      appliers.delete(inner);
    };
  }, [text]);

  return (
    <div ref={outerRef}>
      <div ref={innerRef} className="overflow-hidden text-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
