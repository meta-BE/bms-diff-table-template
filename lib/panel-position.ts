export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
}

export interface PanelPosition {
  top: number;
  left: number;
  maxHeight: number;
  placement: "below" | "above";
}

/**
 * ▾ ボタンを基準に、position: fixed のパネル位置を決める。
 * パネルはトップレイヤー（Popover）に出すため、横スクロールの枠ではなく画面の端を基準に収める。
 */
export function computePanelPosition(
  anchor: AnchorRect,
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 8
): PanelPosition {
  const spaceBelow = viewport.height - anchor.bottom - margin;
  const spaceAbove = anchor.top - margin;
  const placement = panel.height <= spaceBelow || spaceBelow >= spaceAbove ? "below" : "above";
  const maxHeight = placement === "below" ? spaceBelow : spaceAbove;
  const top = placement === "below" ? anchor.bottom : Math.max(margin, anchor.top - Math.min(panel.height, maxHeight));

  const maxLeft = viewport.width - margin - panel.width;
  const left = Math.max(margin, Math.min(anchor.left, maxLeft));

  return { top, left, maxHeight, placement };
}
