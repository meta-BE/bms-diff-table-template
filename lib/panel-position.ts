export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
}

export interface PanelPosition {
  top: number;
  left: number;
  maxHeight: number;
  /** 値の長いカラムでもパネルが画面からはみ出さないよう、幅にも上限を設ける */
  maxWidth: number;
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

  const maxWidth = viewport.width - margin * 2;
  const maxLeft = viewport.width - margin - Math.min(panel.width, maxWidth);
  const left = Math.max(margin, Math.min(anchor.left, maxLeft));

  return { top, left, maxHeight, maxWidth, placement };
}
