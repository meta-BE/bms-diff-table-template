"use client";

import { useRef, useEffect } from "react";

interface EllipsisCellProps {
  text: string;
  children: React.ReactNode;
}

export function EllipsisCell({ text, children }: EllipsisCellProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;

    let prev = false;
    const check = () => {
      const overflows = inner.scrollWidth > inner.clientWidth;
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
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={outerRef}>
      <div ref={innerRef} className="overflow-hidden text-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
